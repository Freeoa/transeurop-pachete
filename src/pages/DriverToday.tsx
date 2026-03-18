import { useMemo, useState } from 'react';
import { MapPin, Phone, Navigation, RefreshCw, Package, User, Car, AlertTriangle, Map as MapIcon } from 'lucide-react';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { useToast } from '../contexts/ToastContext';
import { useDataStore } from '../contexts/DataStoreContext';
import { formatDate, getStatusLabel, getOrderTypeLabel } from '../utils';
import { ProofOfDelivery } from '../components/driver/ProofOfDelivery';
import { ProofOfPickup } from '../components/driver/ProofOfPickup';
import { DamageReportSheet } from '../components/orders/DamageReport';
import { usePullToRefresh } from '../hooks/usePullToRefresh';
import RouteMap, { geocodeAddress, ROUTE_PATHS, ROUTE_COLORS, type MapMarker, type MapRoute } from '../components/shared/RouteMap';
import type { OrderStatus } from '../types';

const DRIVER_ID = 'drv-1';

const statusDotColor: Record<string, string> = {
  confirmat: 'bg-blue-500',
  ridicat: 'bg-amber-500',
  in_tranzit: 'bg-orange-500',
  livrat: 'bg-emerald-500',
};

const orderTypeIcon: Record<string, React.ReactNode> = {
  colet: <Package className="size-3.5" />,
  pasager: <User className="size-3.5" />,
  masina: <Car className="size-3.5" />,
};

const activeStatuses: OrderStatus[] = ['confirmat', 'ridicat', 'in_tranzit'];

const nextStatusMap: Partial<Record<OrderStatus, OrderStatus>> = {
  confirmat: 'ridicat',
  ridicat: 'in_tranzit',
  in_tranzit: 'livrat',
};

export default function DriverToday() {
  const { toast } = useToast();
  const store = useDataStore();
  const { isRefreshing, pullDistance } = usePullToRefresh({
    onRefresh: () => toast('Date actualizate', 'success'),
  });

  const [proofOrderId, setProofOrderId] = useState<string | null>(null);
  const [pickupOrderId, setPickupOrderId] = useState<string | null>(null);
  const [damageOrderId, setDamageOrderId] = useState<string | null>(null);
  const [showMap, setShowMap] = useState(true);

  const driver = useMemo(() => store.state.drivers.find((d) => d.id === DRIVER_ID), [store.state.drivers]);

  const myOrders = useMemo(
    () =>
      store.state.orders.filter(
        (o) => o.soferId === DRIVER_ID && activeStatuses.includes(o.status)
      ),
    [store.state.orders]
  );

  const deRidicat = myOrders.filter((o) => o.status === 'confirmat').length;
  const inTranzit = myOrders.filter(
    (o) => o.status === 'ridicat' || o.status === 'in_tranzit'
  ).length;
  const livrateAzi = store.state.orders.filter(
    (o) => o.soferId === DRIVER_ID && o.status === 'livrat'
  ).length;

  const todayFormatted = formatDate(new Date().toISOString());

  // ── Map data ──────────────────────────────────────────────
  const mapMarkers = useMemo<MapMarker[]>(() => {
    const result: MapMarker[] = [];
    myOrders.forEach((order) => {
      const address = order.status === 'confirmat' ? order.adresaRidicare : order.adresaLivrare;
      const coords = geocodeAddress(address);
      if (!coords) return;
      const markerType = order.status === 'in_tranzit' || order.status === 'ridicat'
        ? 'inTransit'
        : order.status === 'confirmat'
          ? 'pickup'
          : 'delivery';
      result.push({
        id: order.id,
        position: coords,
        label: `${order.awb} · ${getOrderTypeLabel(order.type)}`,
        sublabel: `${address} · ${getStatusLabel(order.status)}`,
        type: markerType,
      });
    });
    return result;
  }, [myOrders]);

  const mapRoutes = useMemo<MapRoute[]>(() => {
    const routeIds = new Set(myOrders.map((o) => o.routeId));
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
  }, [myOrders, store.state.routes]);

  function getAddress(order: (typeof myOrders)[0]) {
    if (order.status === 'confirmat') return order.adresaRidicare;
    return order.adresaLivrare;
  }

  function getContact(order: (typeof myOrders)[0]) {
    if (order.status === 'confirmat') {
      return {
        name: order.expeditor || order.numePasager || order.proprietar || '—',
        phone:
          order.telefonExpeditor ||
          order.telefonPasager ||
          order.telefonProprietar ||
          '',
      };
    }
    return {
      name: order.destinatar || order.numePasager || order.proprietar || '—',
      phone:
        order.telefonDestinatar ||
        order.telefonPasager ||
        order.telefonProprietar ||
        '',
    };
  }

  function handleNavigate(address: string) {
    window.open(
      'https://www.google.com/maps/dir/?api=1&destination=' +
        encodeURIComponent(address)
    );
  }

  function handleUpdate(orderId: string) {
    const order = store.state.orders.find((o) => o.id === orderId);
    if (!order) return;
    const currentStatus = order.status;

    if (currentStatus === 'confirmat') {
      // Next would be 'ridicat' → open pickup proof
      setPickupOrderId(orderId);
      return;
    }

    if (currentStatus === 'in_tranzit') {
      // Next would be 'livrat' → open delivery proof
      setProofOrderId(orderId);
      return;
    }

    // For 'ridicat' → 'in_tranzit': direct update
    const next = nextStatusMap[currentStatus];
    if (next) {
      store.updateOrderStatus(orderId, next);
      toast('Status actualizat: ' + getStatusLabel(next), 'success');
    }
  }

  function handleDeliveryProofConfirm(data: { photos: string[]; signature?: string; note?: string }) {
    if (!proofOrderId) return;
    store.addDeliveryProof({
      id: 'dp-' + Date.now(),
      orderId: proofOrderId,
      ...data,
      timestamp: new Date().toISOString(),
    });
    toast('Livrare confirmată', 'success');
    setProofOrderId(null);
  }

  function handlePickupProofConfirm(data: { photos: string[]; note?: string }) {
    if (!pickupOrderId) return;
    store.addPickupProof({
      id: 'pp-' + Date.now(),
      orderId: pickupOrderId,
      ...data,
      timestamp: new Date().toISOString(),
    });
    toast('Ridicare confirmată', 'success');
    setPickupOrderId(null);
  }

  function handleDamageConfirm(data: { photos: string[]; descriere: string; severitate: 'minor' | 'major' | 'total' }) {
    if (!damageOrderId) return;
    store.addDamageReport({
      id: 'dmg-' + Date.now(),
      orderId: damageOrderId,
      ...data,
      timestamp: new Date().toISOString(),
      raportatDe: 'usr-1',
    });
    toast('Raport daune înregistrat', 'success');
    setDamageOrderId(null);
  }

  return (
    <div className="space-y-5 pb-8">
      {pullDistance > 0 && (
        <div
          className="flex justify-center py-2 text-text-secondary transition-opacity"
          style={{ opacity: Math.min(pullDistance / 80, 1) }}
        >
          <svg className={`size-5 ${isRefreshing ? 'animate-spin' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
        </div>
      )}
      {/* Header */}
      <div>
        <h1 className="text-heading text-text-primary">
          Bună ziua, {driver?.name ?? 'Șofer'}
        </h1>
        <p className="text-[13px] text-text-secondary mt-0.5">{todayFormatted}</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="border border-border rounded-[6px] bg-bg-primary p-3 text-center">
          <p className="text-display font-mono text-info">{deRidicat}</p>
          <p className="text-[11px] font-medium text-text-secondary mt-1 tracking-[0.01em]">De ridicat</p>
        </div>
        <div className="border border-border rounded-[6px] bg-bg-primary p-3 text-center">
          <p className="text-display font-mono text-warning">{inTranzit}</p>
          <p className="text-[11px] font-medium text-text-secondary mt-1 tracking-[0.01em]">În tranzit</p>
        </div>
        <div className="border border-border rounded-[6px] bg-bg-primary p-3 text-center">
          <p className="text-display font-mono text-success">{livrateAzi}</p>
          <p className="text-[11px] font-medium text-text-secondary mt-1 tracking-[0.01em]">Livrate azi</p>
        </div>
      </div>

      {/* Map toggle + map */}
      <div>
        <button
          onClick={() => setShowMap((v) => !v)}
          className="flex items-center gap-2 text-[13px] font-medium text-accent hover:text-accent/80 transition-colors mb-3"
        >
          <MapIcon className="size-4" />
          {showMap ? 'Ascunde harta' : 'Arată harta'}
        </button>
        {showMap && mapMarkers.length > 0 && (
          <RouteMap
            markers={mapMarkers}
            routes={mapRoutes}
            height="300px"
            className="mb-4"
          />
        )}
        {showMap && mapMarkers.length === 0 && (
          <div className="text-center py-6 text-text-tertiary text-[13px] border border-border rounded-[6px] bg-bg-primary mb-4">
            Nicio locație de afișat pe hartă
          </div>
        )}
      </div>

      {/* Task list */}
      <div className="space-y-3">
        {myOrders.length === 0 && (
          <p className="text-center py-10 text-text-secondary">
            Nicio sarcină activă
          </p>
        )}
        {myOrders.map((order) => {
          const address = getAddress(order);
          const contact = getContact(order);
          return (
            <div
              key={order.id}
              className="border border-border rounded-[6px] bg-bg-primary p-4 space-y-3"
            >
              {/* Top row */}
              <div className="flex items-center gap-2.5">
                <span
                  className={`size-2.5 rounded-full shrink-0 ${statusDotColor[order.status] ?? 'bg-gray-400'}`}
                />
                <span className="font-mono text-[13px] font-medium text-text-primary">
                  {order.awb}
                </span>
                <Badge variant="info">
                  {orderTypeIcon[order.type]}{' '}
                  <span className="ml-1">{getOrderTypeLabel(order.type)}</span>
                </Badge>
                <Badge variant="neutral" className="ml-auto">
                  {getStatusLabel(order.status)}
                </Badge>
              </div>

              {/* Address */}
              <div className="flex items-start gap-2 text-[13px]">
                <MapPin className="size-4 text-text-tertiary shrink-0 mt-0.5" />
                <span className="text-text-primary">{address}</span>
              </div>

              {/* Contact */}
              <div className="flex items-center gap-2 text-[13px]">
                <User className="size-4 text-text-tertiary shrink-0" />
                <span className="text-text-secondary">{contact.name}</span>
                {contact.phone && (
                  <a
                    href={`tel:${contact.phone}`}
                    className="ml-auto flex items-center gap-1 text-accent hover:underline"
                  >
                    <Phone className="size-3.5" />
                    <span className="text-xs">{contact.phone}</span>
                  </a>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap gap-2 pt-1">
                <Button
                  variant="secondary"
                  size="sm"
                  icon={<Navigation />}
                  onClick={() => handleNavigate(address)}
                >
                  Navighează
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  icon={<RefreshCw />}
                  onClick={() => handleUpdate(order.id)}
                >
                  Actualizează
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  icon={<AlertTriangle />}
                  onClick={() => setDamageOrderId(order.id)}
                >
                  Problemă
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Sheets */}
      <ProofOfDelivery
        isOpen={!!proofOrderId}
        onClose={() => setProofOrderId(null)}
        orderId={proofOrderId ?? ''}
        onConfirm={handleDeliveryProofConfirm}
      />
      <ProofOfPickup
        isOpen={!!pickupOrderId}
        onClose={() => setPickupOrderId(null)}
        onConfirm={handlePickupProofConfirm}
      />
      <DamageReportSheet
        isOpen={!!damageOrderId}
        onClose={() => setDamageOrderId(null)}
        onConfirm={handleDamageConfirm}
      />
    </div>
  );
}
