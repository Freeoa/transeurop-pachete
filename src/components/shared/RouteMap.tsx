import { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// ── City coordinates (lat, lng) ──────────────────────────────
const CITY_COORDS: Record<string, [number, number]> = {
  // Romania
  'București': [44.4268, 26.1025],
  'Cluj-Napoca': [46.7712, 23.6236],
  'Cluj': [46.7712, 23.6236],
  'Constanța': [44.1598, 28.6348],
  'Timișoara': [45.7489, 21.2087],
  'Iași': [47.1585, 27.6014],
  'Oradea': [47.0465, 21.9189],
  'Brașov': [45.6427, 25.5887],
  'Sibiu': [45.7983, 24.1256],
  'Suceava': [47.6514, 26.2554],
  'Alba Iulia': [46.0677, 23.5700],
  'Arad': [46.1866, 21.3123],
  // Hungary (transit)
  'Budapest': [47.4979, 19.0402],
  'Szeged': [46.2530, 20.1414],
  // Austria
  'Viena': [48.2082, 16.3738],
  'Wien': [48.2082, 16.3738],
  // Germany
  'München': [48.1351, 11.5820],
  'Berlin': [52.5200, 13.4050],
  'Stuttgart': [48.7758, 9.1829],
  'Nürnberg': [49.4521, 11.0767],
  // Italy
  'Roma': [41.9028, 12.4964],
  'Milano': [45.4642, 9.1900],
  'Bologna': [44.4949, 11.3426],
  'Firenze': [43.7696, 11.2558],
  // France
  'Paris': [48.8566, 2.3522],
  'Strasbourg': [48.5734, 7.7521],
  // UK
  'London': [51.5074, -0.1278],
  'Manchester': [53.4808, -2.2426],
  'Birmingham': [52.4862, -1.8904],
  'Bristol': [51.4545, -2.5879],
  'Calais': [50.9513, 1.8587],
  'Dover': [51.1279, 1.3134],
};

// ── Route waypoints (simplified real-ish paths) ──────────────
const ROUTE_PATHS: Record<string, [number, number][]> = {
  'route-ro-uk': [
    CITY_COORDS['București'], CITY_COORDS['Sibiu'], CITY_COORDS['Oradea'],
    CITY_COORDS['Budapest'], CITY_COORDS['Viena'], CITY_COORDS['Nürnberg'],
    CITY_COORDS['Calais'], CITY_COORDS['London'],
  ],
  'route-uk-ro': [
    CITY_COORDS['London'], CITY_COORDS['Calais'], CITY_COORDS['Nürnberg'],
    CITY_COORDS['Viena'], CITY_COORDS['Budapest'], CITY_COORDS['Oradea'],
    CITY_COORDS['Sibiu'], CITY_COORDS['București'],
  ],
  'route-ro-de': [
    CITY_COORDS['București'], CITY_COORDS['Sibiu'], CITY_COORDS['Oradea'],
    CITY_COORDS['Budapest'], CITY_COORDS['Viena'], CITY_COORDS['München'],
  ],
  'route-de-ro': [
    CITY_COORDS['München'], CITY_COORDS['Viena'], CITY_COORDS['Budapest'],
    CITY_COORDS['Oradea'], CITY_COORDS['Sibiu'], CITY_COORDS['București'],
  ],
  'route-ro-it': [
    CITY_COORDS['București'], CITY_COORDS['Sibiu'], CITY_COORDS['Oradea'],
    CITY_COORDS['Budapest'], CITY_COORDS['Bologna'], CITY_COORDS['Roma'],
  ],
  'route-it-ro': [
    CITY_COORDS['Roma'], CITY_COORDS['Bologna'], CITY_COORDS['Budapest'],
    CITY_COORDS['Oradea'], CITY_COORDS['Sibiu'], CITY_COORDS['București'],
  ],
};

// ── Route colors ─────────────────────────────────────────────
const ROUTE_COLORS: Record<string, string> = {
  'route-ro-uk': '#3B82F6',
  'route-uk-ro': '#60A5FA',
  'route-ro-de': '#F59E0B',
  'route-de-ro': '#FBBF24',
  'route-ro-it': '#10B981',
  'route-it-ro': '#34D399',
};

// ── Custom marker icons ──────────────────────────────────────
function createIcon(color: string, size = 24) {
  return L.divIcon({
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
    html: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="${color}" stroke="#fff" stroke-width="2" xmlns="http://www.w3.org/2000/svg"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3" fill="#fff"/></svg>`,
  });
}

const icons = {
  pickup: createIcon('#3B82F6'),       // blue
  delivery: createIcon('#10B981'),     // green
  inTransit: createIcon('#F59E0B'),    // amber
  problem: createIcon('#EF4444'),      // red
  city: createIcon('#6366F1', 20),     // indigo, smaller
};

// ── Fit bounds helper ────────────────────────────────────────
function FitBounds({ bounds }: { bounds: L.LatLngBoundsExpression | null }) {
  const map = useMap();
  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 12 });
    }
  }, [bounds, map]);
  return null;
}

// ── Geocode address to coords (approximate) ──────────────────
export function geocodeAddress(address: string): [number, number] | null {
  if (!address) return null;
  const lower = address.toLowerCase();
  for (const [city, coords] of Object.entries(CITY_COORDS)) {
    if (lower.includes(city.toLowerCase())) return coords;
  }
  // Try partial matches
  if (lower.includes('london') || lower.includes('baker street')) return CITY_COORDS['London'];
  if (lower.includes('manchester') || lower.includes('oxford road')) return CITY_COORDS['Manchester'];
  if (lower.includes('birmingham') || lower.includes('high street')) return CITY_COORDS['Birmingham'];
  if (lower.includes('bristol') || lower.includes('king street')) return CITY_COORDS['Bristol'];
  if (lower.includes('münchen') || lower.includes('munich') || lower.includes('hauptstraße')) return CITY_COORDS['München'];
  if (lower.includes('berlin') || lower.includes('berliner')) return CITY_COORDS['Berlin'];
  if (lower.includes('stuttgart') || lower.includes('arnulf')) return CITY_COORDS['Stuttgart'];
  if (lower.includes('roma') || lower.includes('tiburtina') || lower.includes('via roma')) return CITY_COORDS['Roma'];
  if (lower.includes('milano') || lower.includes('via dante')) return CITY_COORDS['Milano'];
  if (lower.includes('paris')) return CITY_COORDS['Paris'];
  if (lower.includes('victoria coach') || lower.includes('coach station')) return CITY_COORDS['London'];
  if (lower.includes('hackerbrücke') || lower.includes('zob')) return CITY_COORDS['München'];
  // Romanian cities fallback
  if (lower.includes('victoriei') || lower.includes('lipscani') || lower.includes('baicului') || lower.includes('unirii')) return CITY_COORDS['București'];
  if (lower.includes('horea') || lower.includes('hoera')) return CITY_COORDS['Cluj-Napoca'];
  if (lower.includes('decebal') || lower.includes('mamaia')) return CITY_COORDS['Constanța'];
  if (lower.includes('primăverii') || lower.includes('primaverii')) return CITY_COORDS['Oradea'];
  if (lower.includes('decembrie') || lower.includes('alba')) return CITY_COORDS['Alba Iulia'];
  if (lower.includes('ștefan') || lower.includes('stefan')) return CITY_COORDS['Suceava'];
  return null;
}

// ── Types ────────────────────────────────────────────────────
export interface MapMarker {
  id: string;
  position: [number, number];
  label: string;
  sublabel?: string;
  type: 'pickup' | 'delivery' | 'inTransit' | 'problem' | 'city';
}

export interface MapRoute {
  id: string;
  name: string;
  path: [number, number][];
  color: string;
}

interface RouteMapProps {
  markers?: MapMarker[];
  routes?: MapRoute[];
  center?: [number, number];
  zoom?: number;
  height?: string;
  className?: string;
}

export { ROUTE_PATHS, ROUTE_COLORS, CITY_COORDS };

export default function RouteMap({
  markers = [],
  routes = [],
  center = [47.0, 15.0],
  zoom = 5,
  height = '500px',
  className = '',
}: RouteMapProps) {
  const allPoints = useMemo(() => {
    const pts: [number, number][] = [];
    markers.forEach((m) => pts.push(m.position));
    routes.forEach((r) => r.path.forEach((p) => pts.push(p)));
    return pts;
  }, [markers, routes]);

  const bounds = useMemo(() => {
    if (allPoints.length < 2) return null;
    return L.latLngBounds(allPoints.map((p) => L.latLng(p[0], p[1])));
  }, [allPoints]);

  return (
    <div className={`rounded-lg overflow-hidden border border-border relative z-0 ${className}`} style={{ height }}>
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {bounds && <FitBounds bounds={bounds} />}

        {routes.map((route) => (
          <Polyline
            key={route.id}
            positions={route.path}
            pathOptions={{
              color: route.color,
              weight: 4,
              opacity: 0.8,
              dashArray: route.id.includes('uk') ? undefined : undefined,
            }}
          >
            <Popup>
              <strong>{route.name}</strong>
            </Popup>
          </Polyline>
        ))}

        {markers.map((marker) => (
          <Marker
            key={marker.id}
            position={marker.position}
            icon={icons[marker.type]}
          >
            <Popup>
              <div className="text-sm">
                <strong>{marker.label}</strong>
                {marker.sublabel && <div className="text-xs text-gray-500 mt-1">{marker.sublabel}</div>}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
