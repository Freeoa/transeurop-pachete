import { useState, useMemo } from 'react';
import { Map as MapIcon, Filter, Calendar, Route as RouteIcon, Package, User, Car, Truck } from 'lucide-react';
import RouteMap, {
  ROUTE_PATHS, ROUTE_COLORS, geocodeAddress,
  type MapMarker, type MapRoute,
} from '../components/shared/RouteMap';
import { useDataStore } from '../contexts/DataStoreContext';
import { mockDrivers } from '../data';
import { getStatusLabel, getOrderTypeLabel, formatDate } from '../utils';
import type { OrderStatus } from '../types';

// ── Filter types ─────────────────────────────────────────────
type ViewMode = 'toate' | 'azi' | 'saptamana';

const LIVE_STATUSES: OrderStatus[] = ['nou', 'confirmat', 'ridicat', 'in_tranzit'];

const statusDot: Record<string, string> = {
  nou: 'bg-blue-400',
  confirmat: 'bg-indigo-500',
  ridicat: 'bg-amber-500',
  in_tranzit: 'bg-orange-500',
  livrat: 'bg-emerald-500',
};

const typeIcons: Record<string, React.ReactNode> = {
  colet: <Package className="size-3.5" />,
  pasager: <User className="size-3.5" />,
  masina: <Car className="size-3.5" />,
};

export default function RoutesMap() {
  const store = useDataStore();
  const [selectedRoute, setSelectedRoute] = useState<string>('toate');
  const [viewMode, setViewMode] = useState<ViewMode>('toate');

  const routeMap = useMemo(
    () => new Map(store.state.routes.map((r) => [r.id, r])),
    [store.state.routes],
  );

  // ── Filter orders ──────────────────────────────────────────
  const filteredOrders = useMemo(() => {
    let orders = store.state.orders.filter((o) =>
      LIVE_STATUSES.includes(o.status)
    );

    if (selectedRoute !== 'toate') {
      orders = orders.filter((o) => o.routeId === selectedRoute);
    }

    if (viewMode === 'azi') {
      const today = new Date().toISOString().slice(0, 10);
      orders = orders.filter((o) => o.dataCreare.startsWith(today));
    } else if (viewMode === 'saptamana') {
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      orders = orders.filter((o) => new Date(o.dataCreare) >= weekAgo);
    }

    return orders;
  }, [store.state.orders, selectedRoute, viewMode]);

  // ── Build map routes ───────────────────────────────────────
  const mapRoutes = useMemo<MapRoute[]>(() => {
    const routeIds = selectedRoute === 'toate'
      ? Object.keys(ROUTE_PATHS)
      : ROUTE_PATHS[selectedRoute] ? [selectedRoute] : [];

    return routeIds
      .filter((id) => ROUTE_PATHS[id])
      .map((id) => ({
        id,
        name: routeMap.get(id)?.name || id,
        path: ROUTE_PATHS[id],
        color: ROUTE_COLORS[id] || '#6366F1',
      }));
  }, [selectedRoute, routeMap]);

  // ── Build markers from orders ──────────────────────────────
  const markers = useMemo<MapMarker[]>(() => {
    const result: MapMarker[] = [];
    const seen = new Set<string>();

    filteredOrders.forEach((order) => {
      const pickupCoords = geocodeAddress(order.adresaRidicare);
      const deliveryCoords = geocodeAddress(order.adresaLivrare);
      const markerType = order.status === 'in_tranzit' ? 'inTransit'
        : order.status === 'problema' ? 'problem'
        : order.status === 'confirmat' || order.status === 'nou' ? 'pickup'
        : 'delivery';

      if (pickupCoords) {
        const key = `pickup-${pickupCoords.join(',')}`;
        if (!seen.has(key)) {
          seen.add(key);
          result.push({
            id: `pickup-${order.id}`,
            position: pickupCoords,
            label: `Ridicare: ${order.awb}`,
            sublabel: `${order.adresaRidicare} · ${getOrderTypeLabel(order.type)} · ${getStatusLabel(order.status)}`,
            type: 'pickup',
          });
        }
      }

      if (deliveryCoords) {
        const key = `delivery-${deliveryCoords.join(',')}`;
        if (!seen.has(key)) {
          seen.add(key);
          result.push({
            id: `delivery-${order.id}`,
            position: deliveryCoords,
            label: `Livrare: ${order.awb}`,
            sublabel: `${order.adresaLivrare} · ${getOrderTypeLabel(order.type)} · ${getStatusLabel(order.status)}`,
            type: 'delivery',
          });
        }
      }
    });

    return result;
  }, [filteredOrders]);

  // ── Stats per route ────────────────────────────────────────
  const routeStats = useMemo(() => {
    const stats: Record<string, { parcels: number; passengers: number; cars: number; driver?: string }> = {};
    filteredOrders.forEach((o) => {
      if (!stats[o.routeId]) stats[o.routeId] = { parcels: 0, passengers: 0, cars: 0 };
      const s = stats[o.routeId];
      if (o.type === 'colet') s.parcels++;
      else if (o.type === 'pasager') s.passengers += o.nrLocuri || 1;
      else if (o.type === 'masina') s.cars++;
      if (o.soferId && !s.driver) {
        s.driver = mockDrivers.find((d) => d.id === o.soferId)?.name;
      }
    });
    return stats;
  }, [filteredOrders]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-heading text-text-primary flex items-center gap-2">
            <MapIcon className="size-5 text-accent" />
            Hartă rute
          </h1>
          <p className="text-[13px] text-text-secondary mt-0.5">
            {filteredOrders.length} comenzi active · {mapRoutes.length} rute afișate
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* View mode */}
        <div className="flex items-center gap-1.5">
          <Calendar className="size-4 text-text-tertiary" />
          {([
            { key: 'toate', label: 'Toate' },
            { key: 'azi', label: 'Azi' },
            { key: 'saptamana', label: 'Săptămâna' },
          ] as const).map((v) => (
            <button
              key={v.key}
              onClick={() => setViewMode(v.key)}
              className={[
                'px-3 py-1.5 rounded-[6px] text-[13px] font-medium transition-colors',
                viewMode === v.key
                  ? 'bg-accent text-white'
                  : 'bg-bg-secondary text-text-secondary hover:bg-bg-tertiary hover:text-text-primary',
              ].join(' ')}
            >
              {v.label}
            </button>
          ))}
        </div>

        {/* Route filter */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <Filter className="size-4 text-text-tertiary" />
          <button
            onClick={() => setSelectedRoute('toate')}
            className={[
              'px-3 py-1.5 rounded-[6px] text-[13px] font-medium transition-colors',
              selectedRoute === 'toate'
                ? 'bg-accent text-white'
                : 'bg-bg-secondary text-text-secondary hover:bg-bg-tertiary',
            ].join(' ')}
          >
            Toate rutele
          </button>
          {store.state.routes.filter((r) => r.activa).map((route) => (
            <button
              key={route.id}
              onClick={() => setSelectedRoute(route.id)}
              className={[
                'px-3 py-1.5 rounded-[6px] text-[13px] font-medium transition-colors',
                selectedRoute === route.id
                  ? 'text-white'
                  : 'bg-bg-secondary text-text-secondary hover:bg-bg-tertiary',
              ].join(' ')}
              style={selectedRoute === route.id ? { background: ROUTE_COLORS[route.id] || '#6366F1' } : undefined}
            >
              {route.name}
            </button>
          ))}
        </div>
      </div>

      {/* Map */}
      <RouteMap
        markers={markers}
        routes={mapRoutes}
        height="calc(100vh - 320px)"
        className="min-h-[400px]"
      />

      {/* Route summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {mapRoutes.map((route) => {
          const stats = routeStats[route.id];
          if (!stats) return null;
          return (
            <div
              key={route.id}
              className="border border-border rounded-[6px] bg-bg-primary p-3 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setSelectedRoute(route.id)}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 rounded-full" style={{ background: route.color }} />
                <span className="text-[13px] font-semibold text-text-primary">{route.name}</span>
              </div>
              <div className="flex items-center gap-4 text-xs text-text-secondary">
                <span className="flex items-center gap-1">
                  <Package className="size-3" /> {stats.parcels} colete
                </span>
                <span className="flex items-center gap-1">
                  <User className="size-3" /> {stats.passengers} pasag.
                </span>
                <span className="flex items-center gap-1">
                  <Car className="size-3" /> {stats.cars} mașini
                </span>
              </div>
              {stats.driver && (
                <div className="flex items-center gap-1 mt-2 text-xs text-text-tertiary">
                  <Truck className="size-3" /> {stats.driver}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-text-secondary border border-border rounded-[6px] bg-bg-primary px-4 py-3">
        <span className="font-medium text-text-primary">Legendă:</span>
        <span className="flex items-center gap-1.5">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="#3B82F6" stroke="#fff" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/></svg>
          Ridicare
        </span>
        <span className="flex items-center gap-1.5">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="#10B981" stroke="#fff" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/></svg>
          Livrare
        </span>
        <span className="flex items-center gap-1.5">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="#F59E0B" stroke="#fff" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/></svg>
          În tranzit
        </span>
        <span className="flex items-center gap-1.5">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="#EF4444" stroke="#fff" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/></svg>
          Problemă
        </span>
      </div>
    </div>
  );
}
