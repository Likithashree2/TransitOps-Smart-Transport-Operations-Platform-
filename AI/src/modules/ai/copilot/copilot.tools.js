// Tool definitions (OpenAI function-calling format) + the actual DB-backed
// executors behind each tool. The model NEVER touches the DB directly —
// it can only call these three read-only / validation functions, and the
// results (including real IDs) are fed back to it. This is what stops
// the model from inventing vehicle/driver IDs.

const prisma = require('../../../config/db');

const toolSchemas = [
  {
    type: 'function',
    function: {
      name: 'search_available_vehicles',
      description:
        'Search vehicles with status=Available, optionally filtered by type, minimum cargo capacity, and region. Returns real vehicle_id values.',
      parameters: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            enum: ['Van', 'Truck', 'Mini', 'Trailer'],
            description: 'Vehicle type filter, if the request implies one (e.g. "van").',
          },
          min_capacity_kg: {
            type: 'number',
            description: 'Minimum max_load_capacity_kg required to carry the cargo.',
          },
          region: {
            type: 'string',
            description: 'Region/depot to prefer, e.g. "Ahmedabad".',
          },
        },
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'search_available_drivers',
      description:
        'Search drivers with status=Available and a non-expired license (license_expiry > today). Returns real driver_id values.',
      parameters: {
        type: 'object',
        properties: {
          region: {
            type: 'string',
            description: 'Region to prefer for the driver, if relevant.',
          },
        },
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'validate_trip',
      description:
        'Validate a candidate (vehicle_id, driver_id, cargo_weight_kg) combination against capacity and availability rules BEFORE proposing it. Must be called on the final candidate before returning an answer.',
      parameters: {
        type: 'object',
        properties: {
          vehicle_id: { type: 'integer' },
          driver_id: { type: 'integer' },
          cargo_weight_kg: { type: 'number' },
        },
        required: ['vehicle_id', 'driver_id', 'cargo_weight_kg'],
        additionalProperties: false,
      },
    },
  },
];

async function search_available_vehicles({ type, min_capacity_kg, region } = {}) {
  const where = { status: 'Available' };
  if (type) where.type = type;
  if (min_capacity_kg) where.max_load_capacity_kg = { gte: min_capacity_kg };
  if (region) where.region = { equals: region, mode: 'insensitive' };

  const vehicles = await prisma.vehicle.findMany({
    where,
    orderBy: { max_load_capacity_kg: 'asc' }, // smallest sufficient vehicle first = "nearest sensible match"
    take: 10,
  });

  return {
    count: vehicles.length,
    vehicles: vehicles.map((v) => ({
      vehicle_id: v.vehicle_id,
      name_model: v.name_model,
      type: v.type,
      max_load_capacity_kg: Number(v.max_load_capacity_kg),
      region: v.region,
    })),
  };
}

async function search_available_drivers({ region } = {}) {
  const where = {
    status: 'Available',
    license_expiry: { gt: new Date() },
  };
  // drivers table has no region column in the base schema; if the deployed
  // schema adds one, uncomment the filter below.
  // if (region) where.region = { equals: region, mode: 'insensitive' };

  const drivers = await prisma.driver.findMany({
    where,
    orderBy: { safety_score: 'desc' },
    take: 10,
  });

  return {
    count: drivers.length,
    drivers: drivers.map((d) => ({
      driver_id: d.driver_id,
      full_name: d.full_name,
      license_expiry: d.license_expiry,
      safety_score: Number(d.safety_score),
    })),
  };
}

async function validate_trip({ vehicle_id, driver_id, cargo_weight_kg }) {
  const [vehicle, driver] = await Promise.all([
    prisma.vehicle.findUnique({ where: { vehicle_id } }),
    prisma.driver.findUnique({ where: { driver_id } }),
  ]);

  const errors = [];
  if (!vehicle) errors.push(`vehicle_id ${vehicle_id} does not exist`);
  if (!driver) errors.push(`driver_id ${driver_id} does not exist`);

  if (vehicle && vehicle.status !== 'Available') {
    errors.push(`vehicle ${vehicle_id} is not Available (status=${vehicle.status})`);
  }
  if (driver && driver.status !== 'Available') {
    errors.push(`driver ${driver_id} is not Available (status=${driver.status})`);
  }
  if (driver && new Date(driver.license_expiry) <= new Date()) {
    errors.push(`driver ${driver_id} license is expired`);
  }
  if (vehicle && cargo_weight_kg > Number(vehicle.max_load_capacity_kg)) {
    errors.push(
      `cargo_weight_kg ${cargo_weight_kg} exceeds vehicle ${vehicle_id} capacity ${vehicle.max_load_capacity_kg}`
    );
  }

  return {
    valid: errors.length === 0,
    errors,
    vehicle: vehicle
      ? { vehicle_id: vehicle.vehicle_id, max_load_capacity_kg: Number(vehicle.max_load_capacity_kg), status: vehicle.status }
      : null,
    driver: driver ? { driver_id: driver.driver_id, status: driver.status } : null,
  };
}

const executors = {
  search_available_vehicles,
  search_available_drivers,
  validate_trip,
};

module.exports = { toolSchemas, executors };
