import { useMemo } from 'react';
import { Package, Clock, MapPin, Truck, CheckCircle2 } from 'lucide-react';
import { useDataStore } from '../contexts/DataStoreContext';
import { useAuth } from '../contexts/AuthContext';
import { formatDate, getStatusLabel, getStatusBgColor, getOrderTypeLabel, formatCurrency } from '../utils';
import RouteMap, { geocodeAddress, ROUTE_PATHS, ROUTE_COLORS, type MapMarker, type MapRoute } from '../components/shared/RouteMap';
import type { OrderStatus, Order } from '../types';

const ACTIVE_STATUSES: OrderStatus[] = ['nou', 'confirmat', 'ridicat', 'in_tranzit'];

// Approximate transit progress percentage per status
const statusProgress: Partial<Record<OrderStatus, number>> = {
  nou: 5,
  confirmat: 15,
  ridicat: 30,
  in_tranzit: 65,
  livrat: 100,
  finalizat: 100,
};

export default function ClientDashboard() {
  const store = useDataStore();
  const { clientId } = useAuth();

  // Client's orders (active first, then recent delivered)
  const myOrders = useMemo(() => {
    const all = store.state.orders.filter((o) => o.clientId === clientId);
    const active = all
      .filter((o) => ACTIVE_STATUSES.includes(o.status))
      .sort((a, b) => new Date(b.dataCreare).getTime() - new Date(a.dataCreare).getTime());
    const delivered = all
      .filter((o) => o.status === 'livrat' || o.status === 'finalizat')
      .sort((a, b) => new Date(b.dataCreare).getTime() - new Date(a.dataCreare).getTime())
      .slice(0, 5);
    return { active, delivered, total: all.length };
  }, [store.state.orders, clientId]);

  // Route lookup
  const routeMap = useMemo(
    () => new Map(store.state.routes.map((r) => [r.id, r])),
    [store.state.routes],
  );

  // Map markers for active orders
  const mapMarkers = useMemo<MapMarker[]>(() => {
    const result: MapMarker[] = [];
    myOrders.active.forEach((order) => {
      const pickupCoords = geocodeAddress(order.adresaRidicare);
      const deliveryCoords = geocodeAddress(order.adresaLivrare);
      const markerType = order.status === 'in_tranzit' || order.status === 'ridicat'
        ? 'inTransit'
        : order.status === 'confirmat' || order.status === 'nou'
          ? 'pickup'
          : 'delivery';

      if (pickupCoords) {
        result.push({
          id: `pickup-${order.id}`,
          position: pickupCoords,
          label: `Ridicare: ${order.awb}`,
          sublabel: order.adresaRidicare,
          type: 'pickup',
        });
      }
      if (deliveryCoords) {
        result.push({
          id: `delivery-${order.id}`,
          position: deliveryCoords,
          label: `Livrare: ${order.awb}`,
          sublabel: order.adresaLivrare,
          type: markerType === 'inTransit' ? 'inTransit' : 'delivery',
        });
      }
    });
    return result;
  }, [myOrders.active]);

  // Map routes for active orders
  const mapRoutes = useMemo<MapRoute[]>(() => {
    const routeIds = new Set(myOrders.active.map((o) => o.routeId));
    return Array.from(routeIds)
      .filter((id) => ROUTE_PATHS[id])
      .map((id) => {
        const route = store.state.routes.find((r) => r.id === id);
        return {
          id,
          name: route?.name || id,
          path: ROUTE_PATHS[id],
          color: ROUTE_COLORS[id] || '#6366F1',
        };
      });
  }, [myOrders.active, store.state.routes]);

  function getEtaText(order: Order): string {
    if (order.dataEstimata) {
      return formatDate(order.dataEstimata);
    }
    // Fallback: estimate based on route duration
    const route = routeMap.get(order.routeId);
    if (route?.durata) {
      return `~${route.durata}`;
    }
    return 'Se calculează...';
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-heading text-text-primary flex items-center gap-2">
          <Package className="size-5 text-accent" />
          Comenzile mele
        </h1>
        <p className="text-[13px] text-text-secondary mt-0.5">
          {myOrders.active.length} active · {myOrders.total} total
        </p>
      </div>

      {/* Map showing active orders */}
      {mapMarkers.length > 0 && (
        <RouteMap
          markers={mapMarkers}
          routes={mapRoutes}
          height="350px"
          className="min-h-[250px]"
        />
      )}

      {/* Active orders with ETA */}
      {myOrders.active.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-[13px] font-semibold text-text-primary">Comenzi active</h2>
          {myOrders.active.map((order) => {
            const route = routeMap.get(order.routeId);
            const progress = statusProgress[order.status] ?? 0;
            return (
              <div
                key={order.id}
                className="border border-border rounded-[6px] bg-bg-primary p-4 space-y-3"
              >
                {/* Top row */}
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[13px] font-medium text-accent">
                    {order.awb}
                  </span>
                  <span
                    className={[
                      'inline-flex items-center rounded-[4px] px-2 py-0.5 text-xs font-medium leading-none',
                      getStatusBgColor(order.status),
                    ].join(' ')}
                  >
                    {getStatusLabel(order.status)}
                  </span>
                </div>

                {/* Route */}
                <div className="flex items-center gap-2 text-[13px] text-text-secondary">
                  <MapPin className="size-3.5 text-text-tertiary shrink-0" />
                  <span>{route?.name || '—'}</span>
                  <span className="text-text-tertiary">·</span>
                  <span>{getOrderTypeLabel(order.type)}</span>
                  <span className="ml-auto font-mono font-medium text-text-primary">
                    {formatCurrency(order.pret, order.moneda)}
                  </span>
                </div>

                {/* Progress bar */}
                <div>
                  <div className="flex items-center justify-between text-xs text-text-secondary mb-1.5">
                    <span>{order.adresaRidicare.split(',')[0]}</span>
                    <span>{order.adresaLivrare.split(',')[0]}</span>
                  </div>
                  <div className="h-2 rounded-full bg-bg-tertiary overflow-hidden">
                    <div
                      className="h-full rounded-full bg-accent transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                {/* ETA */}
                <div className="flex items-center gap-2 text-[13px]">
                  <Clock className="size-3.5 text-warning shrink-0" />
                  <span className="text-text-secondary">Livrare estimată:</span>
                  <span className="font-medium text-text-primary">{getEtaText(order)}</span>
                </div>

                {/* Addresses */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-text-secondary">
                  <div className="flex items-start gap-1.5">
                    <Truck className="size-3 text-info shrink-0 mt-0.5" />
                    <span>{order.adresaRidicare}</span>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <CheckCircle2 className="size-3 text-success shrink-0 mt-0.5" />
                    <span>{order.adresaLivrare}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {myOrders.active.length === 0 && (
        <div className="text-center py-12 border border-border rounded-[6px] bg-bg-primary">
          <Package className="size-8 text-text-tertiary mx-auto mb-3" />
          <p className="text-text-secondary text-[13px]">Nicio comandă activă momentan</p>
        </div>
      )}

      {/* Recent delivered */}
      {myOrders.delivered.length > 0 && (
        <div>
          <h2 className="text-[13px] font-semibold text-text-primary mb-3">Livrate recent</h2>
          <div className="space-y-2">
            {myOrders.delivered.map((order) => {
              const route = routeMap.get(order.routeId);
              return (
                <div
                  key={order.id}
                  className="flex items-center gap-3 border border-border rounded-[6px] bg-bg-primary px-4 py-3"
                >
                  <CheckCircle2 className="size-4 text-success shrink-0" />
                  <span className="font-mono text-[12px] text-accent">{order.awb}</span>
                  <span className="text-[12px] text-text-secondary">{route?.name || '—'}</span>
                  <span className="text-[12px] text-text-tertiary ml-auto">
                    {order.dataLivrare ? formatDate(order.dataLivrare) : formatDate(order.dataCreare)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
