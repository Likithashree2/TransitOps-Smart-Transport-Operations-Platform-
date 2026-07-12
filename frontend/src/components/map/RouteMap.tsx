import L from "leaflet";
import { MapContainer, Polyline, TileLayer, Tooltip, Marker } from "react-leaflet";
import { cityCoordinates } from "../../lib/demo-data";
import type { Trip } from "../../types/domain";

const markerIcon = L.divIcon({ className: "route-marker", iconSize: [18, 18] });

function matchCity(text: string) {
  return cityCoordinates.find((city) => text.toLowerCase().includes(city.name.toLowerCase()));
}

export function RouteMap({ trips }: { trips: Trip[] }) {
  const activeRoutes = trips
    .filter((trip) => trip.status === "Dispatched")
    .map((trip) => ({ trip, from: matchCity(trip.source), to: matchCity(trip.destination) }))
    .filter((route): route is { trip: Trip; from: NonNullable<ReturnType<typeof matchCity>>; to: NonNullable<ReturnType<typeof matchCity>> } => Boolean(route.from && route.to));

  return (
    <div className="h-[320px] overflow-hidden rounded-md border border-ops-border">
      <MapContainer center={[22.65, 72.25]} zoom={7} scrollWheelZoom={false} className="z-0">
        <TileLayer attribution="OpenStreetMap" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {activeRoutes.map(({ trip, from, to }) => (
          <Polyline key={trip.id} positions={[[from.lat, from.lng], [to.lat, to.lng]]} color="#F59E0B" weight={3}>
            <Tooltip>{`${trip.tripCode}: ${trip.source} -> ${trip.destination}`}</Tooltip>
          </Polyline>
        ))}
        {cityCoordinates.map((city) => (
          <Marker key={city.name} position={[city.lat, city.lng]} icon={markerIcon}>
            <Tooltip>{city.name}</Tooltip>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
