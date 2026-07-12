"""
Seed script for TransitOps.

Run with:  python scripts/seed.py   (from the backend/ directory, venv active)

This script is idempotent-ish for convenience during a hackathon: it
wipes and re-inserts data every run (see TRUNCATE section) rather than
trying to upsert, since demo data does not need to be preserved between
resets. DO NOT point this at a production database.
"""

import sys
from datetime import date, datetime, timedelta
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from passlib.context import CryptContext
from sqlalchemy import text

from app.database.session import SessionLocal, engine
from app.models import (
    Base,
    Role,
    User,
    Vehicle,
    Driver,
    Trip,
    MaintenanceLog,
    FuelLog,
    Expense,
    Setting,
    VehicleStatusHistory,
    DriverStatusHistory,
    TripStatusHistory,
)
from app.models.enums import (
    RoleName,
    VehicleType,
    VehicleStatus,
    DriverStatus,
    TripStatus,
    MaintenanceStatus,
    ExpenseCategory,
)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(raw: str) -> str:
    return pwd_context.hash(raw)


def wipe_all(db) -> None:
    """Truncate every table and reset identity sequences for a clean reseed."""
    tables = [
        "ai_insights",
        "trip_status_history",
        "driver_status_history",
        "vehicle_status_history",
        "expenses",
        "fuel_logs",
        "maintenance_logs",
        "trips",
        "drivers",
        "vehicles",
        "settings",
        "users",
        "roles",
    ]
    db.execute(text(f"TRUNCATE TABLE {', '.join(tables)} RESTART IDENTITY CASCADE"))
    db.commit()


def seed() -> None:
    # Ensure all tables exist (in addition to running Alembic migrations,
    # this is a safety net so the seed script never fails on a fresh DB
    # someone forgot to migrate).
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        wipe_all(db)

        # ---------------------------------------------------------------
        # Roles
        # ---------------------------------------------------------------
        role_objs = {r: Role(name=r) for r in RoleName}
        db.add_all(role_objs.values())
        db.flush()

        # ---------------------------------------------------------------
        # Users
        # ---------------------------------------------------------------
        demo_hash = hash_password("demo1234")
        users = [
            User(
                email="dispatcher@transitops.in",
                password_hash=demo_hash,
                full_name="Raveep K.",
                role_id=role_objs[RoleName.DISPATCHER].id,
            ),
            User(
                email="fleet@transitops.in",
                password_hash=demo_hash,
                full_name="Fleet Manager",
                role_id=role_objs[RoleName.FLEET_MANAGER].id,
            ),
            User(
                email="safety@transitops.in",
                password_hash=demo_hash,
                full_name="Safety Officer",
                role_id=role_objs[RoleName.SAFETY_OFFICER].id,
            ),
            User(
                email="finance@transitops.in",
                password_hash=demo_hash,
                full_name="Financial Analyst",
                role_id=role_objs[RoleName.FINANCIAL_ANALYST].id,
            ),
        ]
        db.add_all(users)
        db.flush()
        dispatcher_user = users[0]

        # ---------------------------------------------------------------
        # Settings (single row)
        # ---------------------------------------------------------------
        db.add(
            Setting(
                depot_name="Gandhinagar Depot, GJ",
                currency="INR",
                distance_unit="Kilometers",
            )
        )

        # ---------------------------------------------------------------
        # Vehicles (15 total: the 4 named in the spec + 11 more)
        # ---------------------------------------------------------------
        vehicles_data = [
            # ON_TRIP: VAN-05 is the vehicle on TR001, which is Dispatched
            # below -- vehicle/trip state must agree (see CHANGELOG).
            dict(registration_no="GJ01AB4532", name_model="VAN-05", vehicle_type=VehicleType.VAN,
                 max_load_capacity_kg=500, odometer_km=74000, acquisition_cost=850000,
                 status=VehicleStatus.ON_TRIP, region="Gandhinagar", purchase_date=date(2022, 3, 10)),
            # AVAILABLE: TRUCK-11's only trip (TR002) is Completed, not
            # currently Dispatched, so it must not be left On Trip.
            dict(registration_no="GJ01AB9981", name_model="TRUCK-11", vehicle_type=VehicleType.TRUCK,
                 max_load_capacity_kg=5000, odometer_km=183000, acquisition_cost=3200000,
                 status=VehicleStatus.AVAILABLE, region="Ahmedabad", purchase_date=date(2020, 6, 1)),
            dict(registration_no="GJ01AB1120", name_model="MINI-03", vehicle_type=VehicleType.MINI,
                 max_load_capacity_kg=1000, odometer_km=66000, acquisition_cost=650000,
                 status=VehicleStatus.IN_SHOP, region="Gandhinagar", purchase_date=date(2023, 1, 15)),
            dict(registration_no="GJ01AB0089", name_model="VAN-09", vehicle_type=VehicleType.VAN,
                 max_load_capacity_kg=750, odometer_km=241000, acquisition_cost=780000,
                 status=VehicleStatus.RETIRED, region="Surat", purchase_date=date(2017, 9, 20)),
        ]
        extra_specs = [
            ("TRUCK-02", VehicleType.TRUCK, 4500, 95000, 3000000, VehicleStatus.AVAILABLE, "Ahmedabad"),
            # AVAILABLE: TRUCK-07's only trip (TR003) is Completed.
            ("TRUCK-07", VehicleType.TRUCK, 6000, 152000, 3500000, VehicleStatus.AVAILABLE, "Vadodara"),
            ("VAN-01", VehicleType.VAN, 600, 32000, 900000, VehicleStatus.AVAILABLE, "Gandhinagar"),
            ("VAN-02", VehicleType.VAN, 600, 41000, 900000, VehicleStatus.AVAILABLE, "Rajkot"),
            ("MINI-01", VehicleType.MINI, 900, 12000, 620000, VehicleStatus.AVAILABLE, "Gandhinagar"),
            # AVAILABLE: MINI-06's only trip (TR006) is Cancelled, so it is
            # restored to Available rather than left On Trip.
            ("MINI-06", VehicleType.MINI, 1100, 88000, 640000, VehicleStatus.AVAILABLE, "Surat"),
            ("TRAILER-01", VehicleType.TRAILER, 12000, 210000, 5200000, VehicleStatus.AVAILABLE, "Ahmedabad"),
            # ON_TRIP: TRAILER-02 is dispatched on a currently Dispatched
            # trip added below (Rajkot -> Surat, driver Suresh).
            ("TRAILER-02", VehicleType.TRAILER, 15000, 45000, 5600000, VehicleStatus.ON_TRIP, "Vadodara"),
            ("TRUCK-15", VehicleType.TRUCK, 5000, 5000, 3300000, VehicleStatus.AVAILABLE, "Gandhinagar"),
            ("VAN-14", VehicleType.VAN, 500, 118000, 800000, VehicleStatus.IN_SHOP, "Rajkot"),
            ("MINI-09", VehicleType.MINI, 950, 61000, 630000, VehicleStatus.AVAILABLE, "Surat"),
        ]
        for i, (name, vtype, cap, odo, cost, status, region) in enumerate(extra_specs):
            reg = f"GJ01AC{2000 + i}"
            vehicles_data.append(
                dict(registration_no=reg, name_model=name, vehicle_type=vtype,
                     max_load_capacity_kg=cap, odometer_km=odo, acquisition_cost=cost,
                     status=status, region=region, purchase_date=date(2021, 1, 1) + timedelta(days=i * 40))
            )

        vehicles = [Vehicle(**v) for v in vehicles_data]
        db.add_all(vehicles)
        db.flush()
        veh_by_name = {v.name_model: v for v in vehicles}

        for v in vehicles:
            db.add(
                VehicleStatusHistory(
                    vehicle_id=v.id,
                    old_status=None,
                    new_status=v.status.value,
                    reason="Initial seed",
                    changed_by=None,
                )
            )

        # ---------------------------------------------------------------
        # Drivers (10 total: 4 named in spec + 6 more)
        # ---------------------------------------------------------------
        today = date.today()
        drivers_data = [
            # ON_TRIP: Alex is the driver on TR001, which is Dispatched
            # below -- driver/trip state must agree (see CHANGELOG).
            dict(full_name="Alex", license_no="DL-88215", license_category="LMV",
                 license_expiry=today + timedelta(days=400), contact_number="9820011122",
                 trip_completion_percentage=96, safety_score=96, status=DriverStatus.ON_TRIP),
            dict(full_name="John", license_no="DL-49120", license_category="HMV",
                 license_expiry=today - timedelta(days=30), contact_number="9820011123",
                 trip_completion_percentage=70, safety_score=81, status=DriverStatus.SUSPENDED),
            # AVAILABLE: Priya's only trip (TR002) is Completed, not
            # currently Dispatched, so she must not be left On Trip.
            dict(full_name="Priya", license_no="DL-77031", license_category="LMV",
                 license_expiry=today + timedelta(days=600), contact_number="9820011124",
                 trip_completion_percentage=99, safety_score=99, status=DriverStatus.AVAILABLE),
            # ON_TRIP: Suresh is the driver on a currently Dispatched trip
            # added below (Rajkot -> Surat, vehicle TRAILER-02).
            dict(full_name="Suresh", license_no="DL-90045", license_category="HMV",
                 license_expiry=today + timedelta(days=250), contact_number="9820011125",
                 trip_completion_percentage=88, safety_score=88, status=DriverStatus.ON_TRIP),
        ]
        extra_drivers = [
            ("Ramesh", "LMV", 300, "9820011126", 91, 90, DriverStatus.AVAILABLE),
            ("Kiran", "HMV", 500, "9820011127", 85, 87, DriverStatus.OFF_DUTY),
            ("Meena", "LMV", 200, "9820011128", 93, 94, DriverStatus.AVAILABLE),
            # AVAILABLE: Farhan's only trip (TR003) is Completed.
            ("Farhan", "HMV", 700, "9820011129", 78, 75, DriverStatus.AVAILABLE),
            ("Deepak", "LMV", 45, "9820011130", 60, 68, DriverStatus.AVAILABLE),
            ("Anita", "HMV", 900, "9820011131", 97, 98, DriverStatus.AVAILABLE),
        ]
        for i, (name, cat, exp_days, contact, comp, score, status) in enumerate(extra_drivers):
            drivers_data.append(
                dict(full_name=name, license_no=f"DL-9{1000 + i}", license_category=cat,
                     license_expiry=today + timedelta(days=exp_days), contact_number=contact,
                     trip_completion_percentage=comp, safety_score=score, status=status)
            )

        drivers = [Driver(**d) for d in drivers_data]
        db.add_all(drivers)
        db.flush()
        drv_by_name = {d.full_name: d for d in drivers}

        for d in drivers:
            db.add(
                DriverStatusHistory(
                    driver_id=d.id,
                    old_status=None,
                    new_status=d.status.value,
                    reason="Initial seed",
                    changed_by=None,
                )
            )

        # ---------------------------------------------------------------
        # Trips (spec-named ones + enough extras to reach ~25, spanning
        # several months so Monthly Revenue has multiple data points)
        # ---------------------------------------------------------------
        trips = []

        def add_trip(code, src, dst, vehicle, driver, cargo, distance, status,
                      months_ago=0, eta=None, revenue=None):
            """
            `vehicle` / `driver` may be None -- only Draft trips are allowed
            to leave either unassigned (mirrors ck_trip_dispatch_requires_assignment).
            final_odometer_km is intentionally NOT set here: it must be a
            cumulative vehicle odometer reading, not the trip's own
            distance, so it is backfilled in one pass per vehicle after
            all trips exist (see the cumulative-odometer block below).
            """
            base_time = datetime.utcnow() - timedelta(days=30 * months_ago, hours=2)
            vehicle_obj = veh_by_name[vehicle] if vehicle else None
            driver_obj = drv_by_name[driver] if driver else None
            if status != TripStatus.DRAFT:
                assert vehicle_obj is not None and driver_obj is not None, (
                    f"Trip {code}: status {status.value} requires both a vehicle and a driver"
                )
            trip = Trip(
                trip_code=code,
                source=src,
                destination=dst,
                vehicle_id=vehicle_obj.id if vehicle_obj else None,
                driver_id=driver_obj.id if driver_obj else None,
                cargo_weight_kg=cargo,
                planned_distance_km=distance,
                estimated_eta_minutes=eta,
                status=status,
                created_by=dispatcher_user.id,
            )
            if status in (TripStatus.DISPATCHED, TripStatus.COMPLETED, TripStatus.CANCELLED):
                trip.dispatched_at = base_time
            if status == TripStatus.COMPLETED:
                trip.completed_at = base_time + timedelta(hours=4)
                trip.fuel_consumed_l = round(distance / 6.0, 2)
                trip.revenue_amount = revenue if revenue is not None else round(distance * 45, 2)
            if status == TripStatus.CANCELLED:
                trip.cancelled_at = base_time + timedelta(hours=1)
            trips.append(trip)
            return trip

        add_trip("TR001", "Gandhinagar", "Ahmedabad", "VAN-05", "Alex", 320, 25,
                  TripStatus.DISPATCHED, months_ago=0, eta=45)
        add_trip("TR002", "Ahmedabad", "Vadodara", "TRUCK-11", "Priya", 4200, 110,
                  TripStatus.COMPLETED, months_ago=1)
        add_trip("TR003", "Surat", "Rajkot", "TRUCK-07", "Farhan", 3800, 260,
                  TripStatus.COMPLETED, months_ago=1)
        # "TR004 -- Awaiting driver": Draft trip with a vehicle assigned
        # but no driver yet, matching the Trip Dispatcher UI exactly.
        add_trip("TR004", "Gandhinagar", "Surat", "MINI-01", None, 400, 260,
                  TripStatus.DRAFT, months_ago=0)
        add_trip("TR005", "Vadodara", "Ahmedabad", "TRUCK-02", "Ramesh", 4000, 130,
                  TripStatus.COMPLETED, months_ago=2)
        add_trip("TR006", "Rajkot", "Gandhinagar", "MINI-06", "Anita", 850, 220,
                  TripStatus.CANCELLED, months_ago=0)

        extra_trip_specs = [
            ("Ahmedabad", "Gandhinagar", "VAN-01", "Ramesh", 300, 25, TripStatus.COMPLETED, 3),
            ("Gandhinagar", "Vadodara", "VAN-02", "Meena", 350, 115, TripStatus.COMPLETED, 3),
            ("Surat", "Vadodara", "TRAILER-01", "Anita", 9800, 150, TripStatus.COMPLETED, 2),
            ("Vadodara", "Surat", "TRAILER-02", "Deepak", 11000, 150, TripStatus.COMPLETED, 2),
            ("Ahmedabad", "Rajkot", "TRUCK-15", "Suresh", 4300, 220, TripStatus.COMPLETED, 2),
            ("Rajkot", "Ahmedabad", "MINI-09", "Deepak", 700, 220, TripStatus.COMPLETED, 1),
            ("Gandhinagar", "Ahmedabad", "VAN-01", "Meena", 280, 25, TripStatus.COMPLETED, 1),
            ("Ahmedabad", "Surat", "TRUCK-02", "Ramesh", 4100, 260, TripStatus.COMPLETED, 1),
            ("Surat", "Rajkot", "TRAILER-01", "Anita", 10500, 380, TripStatus.COMPLETED, 0),
            ("Vadodara", "Gandhinagar", "VAN-02", "Suresh", 500, 115, TripStatus.COMPLETED, 0),
            ("Gandhinagar", "Rajkot", "MINI-01", "Deepak", 600, 300, TripStatus.COMPLETED, 0),
            # "Unassigned trip": Draft trip with NO vehicle and NO driver
            # yet -- the other Draft UI state alongside TR004 above.
            ("Ahmedabad", "Vadodara", None, None, 4500, 110, TripStatus.DRAFT, 0),
            ("Rajkot", "Surat", "TRAILER-02", "Suresh", 9000, 380, TripStatus.DISPATCHED, 0),
            ("Gandhinagar", "Ahmedabad", "MINI-09", "Anita", 650, 25, TripStatus.CANCELLED, 1),
            ("Surat", "Gandhinagar", "VAN-01", "Meena", 320, 300, TripStatus.COMPLETED, 4),
            ("Vadodara", "Rajkot", "TRUCK-02", "Ramesh", 4200, 240, TripStatus.COMPLETED, 4),
            ("Ahmedabad", "Gandhinagar", "TRAILER-01", "Deepak", 9500, 25, TripStatus.COMPLETED, 3),
            ("Rajkot", "Vadodara", "MINI-01", "Suresh", 500, 240, TripStatus.COMPLETED, 3),
            ("Gandhinagar", "Surat", "VAN-02", "Anita", 400, 260, TripStatus.COMPLETED, 5),
        ]
        for i, (src, dst, veh, drv, cargo, dist, status, months_ago) in enumerate(extra_trip_specs, start=7):
            add_trip(f"TR{i:03d}", src, dst, veh, drv, cargo, dist, status, months_ago=months_ago)

        # ---------------------------------------------------------------
        # Backfill cumulative final_odometer_km for Completed trips.
        #
        # final_odometer_km must represent the vehicle's cumulative
        # odometer reading at the moment the trip completed, NOT the
        # trip's own planned_distance_km. For each vehicle, take its
        # Completed trips in chronological order and accumulate
        # planned_distance_km on top of a base reading derived by working
        # backwards from the vehicle's current odometer_km.
        # ---------------------------------------------------------------
        completed_by_vehicle: dict[int, list[Trip]] = {}
        for t in trips:
            if t.status == TripStatus.COMPLETED:
                completed_by_vehicle.setdefault(t.vehicle_id, []).append(t)

        for vehicle in vehicles:
            veh_trips = completed_by_vehicle.get(vehicle.id)
            if not veh_trips:
                continue
            veh_trips.sort(key=lambda t: t.dispatched_at)
            total_distance = sum(float(t.planned_distance_km) for t in veh_trips)
            running = float(vehicle.odometer_km) - total_distance
            for t in veh_trips:
                running += float(t.planned_distance_km)
                t.final_odometer_km = round(running, 2)

        db.add_all(trips)
        db.flush()
        trip_by_code = {t.trip_code: t for t in trips}

        for t in trips:
            db.add(
                TripStatusHistory(
                    trip_id=t.id,
                    old_status=None,
                    new_status=t.status.value,
                    reason="Initial seed",
                    changed_by=dispatcher_user.id,
                )
            )

        # ---------------------------------------------------------------
        # Maintenance logs (10)
        # ---------------------------------------------------------------
        maint_specs = [
            ("MINI-03", "Engine Overhaul", 25000, 5, MaintenanceStatus.ACTIVE, "Ongoing gearbox repair"),
            ("VAN-14", "Brake Replacement", 8000, 2, MaintenanceStatus.ACTIVE, "Front brake pads"),
            ("TRUCK-11", "Tire Replacement", 32000, 60, MaintenanceStatus.COMPLETED, None),
            ("VAN-05", "Oil Change", 3500, 45, MaintenanceStatus.COMPLETED, None),
            ("TRUCK-07", "Suspension Repair", 18000, 30, MaintenanceStatus.COMPLETED, None),
            ("VAN-09", "Final Inspection", 5000, 200, MaintenanceStatus.COMPLETED, "Vehicle retired after this"),
            ("MINI-06", "Clutch Replacement", 14000, 20, MaintenanceStatus.COMPLETED, None),
            ("TRAILER-01", "Axle Repair", 40000, 15, MaintenanceStatus.COMPLETED, None),
            ("TRUCK-02", "Battery Replacement", 6000, 10, MaintenanceStatus.COMPLETED, None),
            ("MINI-01", "AC Service", 4500, 7, MaintenanceStatus.COMPLETED, None),
        ]
        for veh_name, service, cost, days_ago, status, notes in maint_specs:
            db.add(
                MaintenanceLog(
                    vehicle_id=veh_by_name[veh_name].id,
                    service_type=service,
                    cost=cost,
                    service_date=today - timedelta(days=days_ago),
                    status=status,
                    notes=notes,
                )
            )

        # ---------------------------------------------------------------
        # Fuel logs (20, one intentionally anomalous)
        # ---------------------------------------------------------------
        fuel_specs = [
            ("VAN-05", "TR001", 20, 2100, 5, 74000),
            ("TRUCK-11", "TR002", 700, 68000, 35, 183000),
            ("TRUCK-07", "TR003", 620, 60000, 35, 152000),
            ("TRUCK-02", "TR005", 640, 62500, 65, 95000),
            ("VAN-01", None, 45, 4600, 90, 32000),
            ("VAN-02", None, 42, 4300, 88, 41000),
            ("TRAILER-01", None, 1500, 148000, 40, 210000),
            ("TRAILER-02", None, 1550, 152000, 40, 45000),
            ("TRUCK-15", None, 720, 70500, 12, 5000),
            ("MINI-09", None, 95, 9800, 20, 61000),
            ("MINI-01", None, 60, 6200, 6, 12000),
            ("MINI-06", None, 78, 8100, 18, 88000),
            ("VAN-14", None, 38, 4000, 3, 118000),
            ("VAN-09", None, 30, 3200, 210, 241000),
            ("TRUCK-11", None, 690, 67000, 50, 182200),
            ("TRUCK-07", None, 600, 58500, 22, 151200),
            # Intentionally anomalous: far too many liters for a Mini and
            # a cost-per-liter wildly out of line with every other row --
            # a future anomaly detector should flag this on liters_per_km
            # and cost_per_liter computed at query time.
            ("MINI-03", None, 480, 25000, 33, 65500),
            ("VAN-02", None, 40, 4100, 55, 40200),
            ("TRUCK-02", None, 610, 60000, 33, 94200),
            ("VAN-01", None, 44, 4500, 60, 31500),
        ]
        for veh_name, trip_code, liters, cost, days_ago, odo in fuel_specs:
            db.add(
                FuelLog(
                    vehicle_id=veh_by_name[veh_name].id,
                    trip_id=trip_by_code[trip_code].id if trip_code else None,
                    liters=liters,
                    cost=cost,
                    log_date=today - timedelta(days=days_ago),
                    odometer_km=odo,
                )
            )

        # ---------------------------------------------------------------
        # Expenses (10)
        # ---------------------------------------------------------------
        expense_specs = [
            ("TR001", "VAN-05", ExpenseCategory.TOLL, 150, "Ahmedabad expressway toll", 1),
            ("TR002", "TRUCK-11", ExpenseCategory.TOLL, 620, "NH48 toll plazas", 32),
            ("TR003", "TRUCK-07", ExpenseCategory.PARKING, 300, "Rajkot depot parking", 32),
            (None, "VAN-01", ExpenseCategory.PERMIT, 2500, "Interstate permit renewal", 20),
            (None, "TRUCK-02", ExpenseCategory.PERMIT, 5000, "Commercial permit renewal", 15),
            ("TR005", "TRUCK-02", ExpenseCategory.TOLL, 700, "NE1 corridor toll", 65),
            (None, "TRAILER-01", ExpenseCategory.MISC, 1200, "Cargo tarpaulin replacement", 18),
            (None, "MINI-06", ExpenseCategory.MISC, 400, "Cleaning and detailing", 22),
            ("TR006", "MINI-06", ExpenseCategory.OTHER, 250, "Cancelled trip handling fee", 1),
            (None, "TRAILER-02", ExpenseCategory.PARKING, 350, "Vadodara yard parking", 10),
        ]
        for trip_code, veh_name, category, amount, desc, days_ago in expense_specs:
            db.add(
                Expense(
                    trip_id=trip_by_code[trip_code].id if trip_code else None,
                    vehicle_id=veh_by_name[veh_name].id,
                    category=category,
                    amount=amount,
                    description=desc,
                    expense_date=today - timedelta(days=days_ago),
                )
            )

        db.commit()
        print("Seed complete:")
        print(f"  Roles:      {len(role_objs)}")
        print(f"  Users:      {len(users)}")
        print(f"  Vehicles:   {len(vehicles)}")
        print(f"  Drivers:    {len(drivers)}")
        print(f"  Trips:      {len(trips)}")
        print(f"  Maintenance:{len(maint_specs)}")
        print(f"  Fuel logs:  {len(fuel_specs)}")
        print(f"  Expenses:   {len(expense_specs)}")
        print("\nDemo login (any role email below) password: demo1234")
        for u in users:
            print(f"  {u.email}")

    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
