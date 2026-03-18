import { useState, useMemo, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { isToday, isThisWeek, parseISO, formatDistanceToNow } from 'date-fns';
import { ro } from 'date-fns/locale';
import { createColumnHelper } from '@tanstack/react-table';
import {
  Plus, Package, User, Car, MoreHorizontal, AlertTriangle,
  AlertCircle, Info, Truck, MapPin, ChevronDown, Maximize2,
} from 'lucide-react';
import { Button, Badge, KPICard, DataTable, StatusTimeline } from '../components/ui';
import { usePullToRefresh } from '../hooks/usePullToRefresh';
import { useToast } from '../contexts/ToastContext';
import type { BadgeVariant } from '../components/ui';
import type React from 'react';
import type { TimelineColor } from '../components/ui/StatusTimeline';
import {
  mockAlerts, mockStatusHistory, mockDrivers,
} from '../data';
import { useDataStore } from '../contexts/DataStoreContext';
import {
  formatCurrency, formatDate, getStatusLabel,
  getStatusBgColor, getOrderTypeLabel, getPaymentStatusLabel,
  getPaymentStatusColor,
} from '../utils';
import type { Order, OrderType, OrderStatus, Currency } from '../types';
import { ROUTE_PATHS, ROUTE_COLORS, CITY_COORDS } from '../components/shared/RouteMap';
import type { MapMarker, MapRoute } from '../components/shared/RouteMap';

const RouteMap = lazy(() => import('../components/shared/RouteMap'));

// ── Filter types ────────────────────────────────────────────
type FilterChip = 'toate' | 'colet' | 'pasager' | 'masina' | 'neplatite';

const filterChips: { key: FilterChip; label: string }[] = [
  { key: 'toate', label: 'Toate' },
  { key: 'colet', label: 'Colete' },
  { key: 'pasager', label: 'Pasageri' },
  { key: 'masina', label: 'Mașini' },
  { key: 'neplatite', label: 'Neplătite' },
];

// ── Column helper ───────────────────────────────────────────
const col = createColumnHelper<Order>();

// ── Severity helpers ────────────────────────────────────────
const severityIcon: Record<string, typeof AlertTriangle> = {
  critic: AlertCircle,
  atentie: AlertTriangle,
  info: Info,
};

// ── Status → timeline color ─────────────────────────────────
const statusTimelineColor: Record<string, TimelineColor> = {
  nou: 'info',
  confirmat: 'accent',
  ridicat: 'warning',
  in_tranzit: 'warning',
  livrat: 'success',
  finalizat: 'success',
  anulat: 'neutral',
  problema: 'danger',
  retur: 'danger',
};

// ── Type → badge variant ────────────────────────────────────
const typeBadgeVariant: Record<OrderType, BadgeVariant> = {
  colet: 'info',
  pasager: 'purple',
  masina: 'warning',
};
const typeIcons: Record<OrderType, typeof Package> = {
  colet: Package,
  pasager: User,
  masina: Car,
};

// ═════════════════════════════════════════════════════════════
// Dashboard Page
// ═════════════════════════════════════════════════════════════
export default function Dashboard() {
  const navigate = useNavigate();
  const store = useDataStore();
  const { toast } = useToast();
  const { isRefreshing, pullDistance } = usePullToRefresh({
    onRefresh: () => toast('Date actualizate', 'success'),
  });
  const [activeFilter, setActiveFilter] = useState<FilterChip>('toate');
  const [alertsOpen, setAlertsOpen] = useState(true);

  // ── Route lookup ──
  const routeMap = useMemo(
    () => new Map(store.state.routes.map((r) => [r.id, r])),
    [store.state.routes],
  );

  // ── KPI calculations ──
  const kpis = useMemo(() => {
    const ordersToday = store.state.orders.filter((o) =>
      isToday(parseISO(o.dataCreare)),
    );

    // Revenue this week, grouped by currency
    const thisWeekOrders = store.state.orders.filter((o) =>
      isThisWeek(parseISO(o.dataCreare), { weekStartsOn: 1 }),
    );
    const revByCurrency = thisWeekOrders.reduce<Partial<Record<Currency, number>>>(
      (acc, o) => {
        if (o.status !== 'anulat') {
          acc[o.moneda] = (acc[o.moneda] || 0) + o.pret;
        }
        return acc;
      },
      {},
    );
    const revenueStr = Object.entries(revByCurrency)
      .map(([cur, amt]) => formatCurrency(amt!, cur as Currency))
      .join(' + ');

    const inTransit = store.state.orders.filter((o) => o.status === 'in_tranzit').length;

    // Seats: active passenger orders vs available capacity
    const activeStatuses = new Set<OrderStatus>([
      'nou', 'confirmat', 'ridicat', 'in_tranzit',
    ]);
    const activeOrders = store.state.orders.filter((o) => activeStatuses.has(o.status));
    const seatsOccupied = activeOrders
      .filter((o) => o.type === 'pasager')
      .reduce((sum, o) => sum + (o.nrLocuri || 0), 0);
    // ~19 seats per active route as baseline
    const totalSeats = store.state.routes.filter((r) => r.activa).length * 19;

    const unpaid = store.state.orders.filter(
      (o) => o.statusPlata === 'neplatit' && o.status !== 'anulat',
    ).length;
    const problems = store.state.orders.filter((o) => o.status === 'problema').length;

    return {
      ordersToday: ordersToday.length,
      revenueStr,
      inTransit,
      seatsOccupied,
      totalSeats,
      unpaid,
      problems,
    };
  }, [store.state.orders]);

  // ── Filtered & sorted orders for table ──
  const filteredOrders = useMemo(() => {
    const sorted = [...store.state.orders].sort(
      (a, b) => new Date(b.dataCreare).getTime() - new Date(a.dataCreare).getTime(),
    );
    if (activeFilter === 'toate') return sorted.slice(0, 15);
    if (activeFilter === 'neplatite')
      return sorted
        .filter((o) => o.statusPlata === 'neplatit' && o.status !== 'anulat')
        .slice(0, 15);
    return sorted.filter((o) => o.type === activeFilter).slice(0, 15);
  }, [activeFilter, store.state.orders]);

  // ── Activity timeline (last 8 status changes) ──
  const activityTimeline = useMemo(() => {
    const sorted = [...mockStatusHistory]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 8);
    const orderMap = new Map(store.state.orders.map((o) => [o.id, o]));
    return sorted.map((sh) => {
      const order = orderMap.get(sh.orderId);
      return {
        status: `${order?.awb || sh.orderId} \→ ${getStatusLabel(sh.status as OrderStatus)}`,
        timestamp: formatDistanceToNow(parseISO(sh.timestamp), {
          addSuffix: true,
          locale: ro,
        }),
        user: sh.userName,
        note: sh.nota,
        color: (statusTimelineColor[sh.status] || 'neutral') as TimelineColor,
      };
    });
  }, [store.state.orders]);

  // ── Next departures with capacity ──
  const nextDepartures = useMemo(() => {
    const activeRoutes = store.state.routes.filter((r) => r.activa);
    const liveStatuses = new Set<OrderStatus>(['nou', 'confirmat', 'ridicat', 'in_tranzit']);
    return activeRoutes.map((route) => {
      const routeOrders = store.state.orders.filter(
        (o) => o.routeId === route.id && liveStatuses.has(o.status),
      );
      const passengers = routeOrders
        .filter((o) => o.type === 'pasager')
        .reduce((sum, o) => sum + (o.nrLocuri || 0), 0);
      const parcels = routeOrders.filter((o) => o.type === 'colet').length;
      const cars = routeOrders.filter((o) => o.type === 'masina').length;
      const driver = routeOrders[0]?.soferId
        ? mockDrivers.find((d) => d.id === routeOrders[0].soferId)?.name
        : undefined;
      return { route, passengers, parcels, cars, driver };
    });
  }, [store.state.orders]);

  // ── Active alerts, sorted by severity ──
  const activeAlerts = useMemo(
    () =>
      mockAlerts
        .filter((a) => !a.rezolvat)
        .sort((a, b) => {
          const sev: Record<string, number> = { critic: 0, atentie: 1, info: 2 };
          return (sev[a.severitate] ?? 2) - (sev[b.severitate] ?? 2);
        }),
    [],
  );

  // ── Map data: active routes + simulated vehicle positions ──
  const { mapRoutes, mapMarkers } = useMemo(() => {
    const activeRoutes = store.state.routes.filter((r) => r.activa);
    const liveStatuses = new Set<OrderStatus>(['nou', 'confirmat', 'ridicat', 'in_tranzit']);

    const routes: MapRoute[] = [];
    const markers: MapMarker[] = [];

    activeRoutes.forEach((route) => {
      const path = ROUTE_PATHS[route.id];
      if (!path) return;
      const color = ROUTE_COLORS[route.id] || '#6366F1';
      routes.push({ id: route.id, name: route.name, path, color });

      // Find in-transit orders on this route to simulate vehicle position
      const inTransitOrders = store.state.orders.filter(
        (o) => o.routeId === route.id && liveStatuses.has(o.status),
      );
      if (inTransitOrders.length > 0) {
        // Simulate vehicle somewhere along the route (30-70% progress)
        const progress = 0.3 + (route.id.charCodeAt(route.id.length - 1) % 5) * 0.1;
        const segIndex = Math.floor(progress * (path.length - 1));
        const segFrac = (progress * (path.length - 1)) - segIndex;
        const p1 = path[Math.min(segIndex, path.length - 1)];
        const p2 = path[Math.min(segIndex + 1, path.length - 1)];
        const lat = p1[0] + (p2[0] - p1[0]) * segFrac;
        const lng = p1[1] + (p2[1] - p1[1]) * segFrac;

        const driver = inTransitOrders[0].soferId
          ? mockDrivers.find((d) => d.id === inTransitOrders[0].soferId)?.name
          : undefined;

        markers.push({
          id: `vehicle-${route.id}`,
          position: [lat, lng],
          label: driver || route.name,
          sublabel: `${inTransitOrders.length} comenzi active`,
          type: 'inTransit',
        });
      }
    });

    // Add origin/destination city markers
    const addedCities = new Set<string>();
    activeRoutes.forEach((route) => {
      [route.origin, route.destination].forEach((place) => {
        if (addedCities.has(place)) return;
        // Try to find coords for origin/destination
        const coords = Object.entries(CITY_COORDS).find(([city]) =>
          place.toLowerCase().includes(city.toLowerCase()) || city.toLowerCase().includes(place.toLowerCase())
        );
        if (coords) {
          addedCities.add(place);
          markers.push({
            id: `city-${place}`,
            position: coords[1],
            label: place,
            type: 'city',
          });
        }
      });
    });

    return { mapRoutes: routes, mapMarkers: markers };
  }, [store.state.routes, store.state.orders]);

  // ── Table columns ──
  const columns = useMemo(
    () => [
      col.accessor('awb', {
        header: 'AWB',
        size: 140,
        cell: (info) => (
          <span className="font-mono text-[13px] text-accent">{info.getValue()}</span>
        ),
      }),
      col.accessor('type', {
        header: 'Tip',
        size: 90,
        cell: (info) => {
          const t = info.getValue();
          const Icon = typeIcons[t];
          return (
            <Badge variant={typeBadgeVariant[t]}>
              <Icon className="size-3 mr-1" />
              {getOrderTypeLabel(t)}
            </Badge>
          );
        },
      }),
      col.accessor('routeId', {
        header: 'Rută',
        size: 160,
        cell: (info) => {
          const route = routeMap.get(info.getValue());
          return <span className="text-text-primary">{route?.name || '—'}</span>;
        },
      }),
      col.display({
        id: 'person',
        header: 'Expeditor / Pasager',
        size: 160,
        cell: ({ row }) => {
          const o = row.original;
          if (o.type === 'pasager') return <span>{o.numePasager}</span>;
          if (o.type === 'masina') return <span>{o.proprietar}</span>;
          return <span>{o.expeditor}</span>;
        },
      }),
      col.accessor('dataCreare', {
        header: 'Data',
        size: 100,
        cell: (info) => (
          <span className="text-text-secondary">{formatDate(info.getValue())}</span>
        ),
      }),
      col.display({
        id: 'weight',
        header: 'Kg / Locuri',
        size: 90,
        cell: ({ row }) => {
          const o = row.original;
          if (o.type === 'pasager')
            return <span className="font-mono">{o.nrLocuri} loc.</span>;
          if (o.type === 'masina')
            return <span className="text-text-tertiary">{o.nrInmatriculare || '—'}</span>;
          return <span className="font-mono">{o.greutate} kg</span>;
        },
      }),
      col.accessor('pret', {
        header: 'Preț',
        size: 90,
        cell: (info) => (
          <span className="font-mono font-medium">
            {formatCurrency(info.getValue(), info.row.original.moneda)}
          </span>
        ),
      }),
      col.accessor('statusPlata', {
        header: 'Plată',
        size: 80,
        cell: (info) => (
          <span className={getPaymentStatusColor(info.getValue())}>
            {getPaymentStatusLabel(info.getValue())}
          </span>
        ),
      }),
      col.accessor('status', {
        header: 'Status',
        size: 100,
        cell: (info) => {
          const s = info.getValue();
          return (
            <span
              className={[
                'inline-flex items-center rounded-[4px] px-2 py-0.5 text-xs font-medium leading-none',
                getStatusBgColor(s),
              ].join(' ')}
            >
              {getStatusLabel(s)}
            </span>
          );
        },
      }),
      col.display({
        id: 'actions',
        header: '',
        size: 40,
        cell: ({ row }) => (
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/comenzi/${row.original.id}`);
            }}
            className="flex items-center justify-center size-7 rounded-[4px] text-text-tertiary hover:bg-bg-tertiary hover:text-text-primary transition-colors"
          >
            <MoreHorizontal className="size-4" />
          </button>
        ),
      }),
    ],
    [navigate, routeMap],
  );

  // ═══════════════════════════════════════════════════════════
  // Render
  // ═══════════════════════════════════════════════════════════
  return (
    <div>
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
      {/* Gradient banner header */}
      <div className="relative -mx-4 -mt-4 sm:-mx-6 sm:-mt-6 px-4 sm:px-6 pt-6 pb-5 mb-6 rounded-b-[12px] bg-gradient-to-br from-accent via-blue-600 to-blue-800 overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/5" />
        <div className="absolute bottom-0 left-1/3 w-32 h-32 rounded-full bg-white/5" />
        <div className="relative z-10 flex items-start justify-between">
          <div>
            <h1 className="text-display text-white">Dashboard</h1>
            <p className="text-[13px] text-white/70 mt-1">TransEurop — Panou de control</p>
          </div>
          <Button
            icon={<Plus />}
            onClick={() => navigate('/comenzi/nou')}
            className="bg-white/15 hover:bg-white/25 text-white border-white/20"
          >
            Comandă nouă
          </Button>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {[
          { label: 'Comenzi azi', value: kpis.ordersToday, onClick: () => navigate('/comenzi'), extraClass: '' },
          { label: 'Venituri săptămâna', value: kpis.revenueStr || '0', onClick: () => navigate('/incasari'), extraClass: '' },
          { label: 'Colete în tranzit', value: kpis.inTransit, onClick: () => navigate('/tracking'), extraClass: '' },
          { label: 'Locuri ocupate', value: `${kpis.seatsOccupied}/${kpis.totalSeats}`, onClick: () => navigate('/programari'), extraClass: '' },
          { label: 'Neplătite', value: kpis.unpaid, onClick: () => navigate('/incasari'), extraClass: kpis.unpaid > 0 ? 'border-danger/30' : '' },
          { label: 'Probleme active', value: kpis.problems, onClick: () => navigate('/comenzi'), extraClass: kpis.problems > 0 ? 'border-danger/30' : '' },
        ].map((kpi, index) => (
          <div key={kpi.label} className="animate-enter" style={{ '--stagger': index } as React.CSSProperties}>
            <KPICard
              label={kpi.label}
              value={kpi.value}
              onClick={kpi.onClick}
              className={kpi.extraClass}
            />
          </div>
        ))}
      </div>

      {/* Live Map — active routes & vehicles */}
      <div className="rounded-[6px] border border-border bg-bg-primary mb-6 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <MapPin className="size-4 text-accent" />
            <h2 className="text-[13px] font-semibold text-text-primary">Hartă rute active</h2>
            <Badge variant="accent">{mapRoutes.length}</Badge>
          </div>
          <button
            onClick={() => navigate('/harta')}
            className="flex items-center gap-1.5 text-[12px] text-text-secondary hover:text-accent transition-colors"
          >
            <Maximize2 className="size-3.5" />
            <span className="hidden sm:inline">Extinde</span>
          </button>
        </div>
        <Suspense fallback={
          <div className="flex items-center justify-center h-[250px] sm:h-[300px] text-text-tertiary text-[13px]">
            Se încarcă harta...
          </div>
        }>
          <div className="h-[250px] sm:h-[300px]">
            <RouteMap
              routes={mapRoutes}
              markers={mapMarkers}
              height="100%"
              className="rounded-none border-0"
            />
          </div>
        </Suspense>
      </div>

      {/* Alerts — collapsible */}
      {activeAlerts.length > 0 && (
        <div className="rounded-[6px] border border-border bg-bg-primary mb-6 overflow-hidden">
          <button
            onClick={() => setAlertsOpen((v) => !v)}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-bg-secondary transition-colors"
          >
            <div className="flex items-center justify-center size-7 rounded-full bg-danger-bg shrink-0">
              <AlertTriangle className="size-3.5 text-danger" />
            </div>
            <span className="text-[13px] font-semibold text-text-primary">Alerte</span>
            <Badge variant="danger" className="ml-1">{activeAlerts.length}</Badge>
            <ChevronDown
              className={[
                'size-4 text-text-tertiary ml-auto transition-transform duration-200',
                alertsOpen ? 'rotate-180' : '',
              ].join(' ')}
            />
          </button>

          <div
            className="transition-[max-height,opacity] duration-300 ease-in-out overflow-hidden"
            style={{
              maxHeight: alertsOpen ? `${activeAlerts.length * 80 + 16}px` : '0px',
              opacity: alertsOpen ? 1 : 0,
            }}
          >
            <div className="px-3 pb-3 space-y-2">
              {activeAlerts.map((alert) => {
                const Icon = severityIcon[alert.severitate] || Info;
                const severityBg: Record<string, string> = {
                  critic: 'bg-danger-bg',
                  atentie: 'bg-warning-bg',
                  info: 'bg-info-bg',
                };
                return (
                  <div
                    key={alert.id}
                    onClick={() => navigate(`/comenzi/${alert.orderId}`)}
                    className="flex items-start gap-3 px-3 py-2.5 rounded-[6px] bg-bg-secondary border border-border cursor-pointer hover:border-accent/40 transition-colors"
                  >
                    <div className={[
                      'flex items-center justify-center size-6 rounded-full shrink-0 mt-0.5',
                      severityBg[alert.severitate] || 'bg-bg-tertiary',
                    ].join(' ')}>
                      <Icon
                        className={[
                          'size-3.5',
                          alert.severitate === 'critic'
                            ? 'text-danger'
                            : alert.severitate === 'atentie'
                              ? 'text-warning'
                              : 'text-info',
                        ].join(' ')}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] text-text-primary leading-snug">
                        {alert.mesaj}
                      </p>
                      <p className="text-[11px] text-text-tertiary mt-1">
                        {formatDistanceToNow(parseISO(alert.timestamp), {
                          addSuffix: true,
                          locale: ro,
                        })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Two-column: Activity + Departures */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Activity Timeline */}
        <div className="rounded-[6px] border border-border bg-bg-primary">
          <div className="px-4 py-3 border-b border-border">
            <h2 className="text-[13px] font-semibold text-text-primary">
              Activitate recentă
            </h2>
          </div>
          <div className="px-4 py-3 max-h-[300px] overflow-y-auto">
            <StatusTimeline entries={activityTimeline} />
          </div>
        </div>

        {/* Next Departures */}
        <div className="rounded-[6px] border border-border bg-bg-primary">
          <div className="px-4 py-3 border-b border-border">
            <h2 className="text-[13px] font-semibold text-text-primary">
              Următoarele plecări
            </h2>
          </div>
          <div className="divide-y divide-border max-h-[300px] overflow-y-auto">
            {nextDepartures.map(({ route, passengers, parcels, cars, driver }) => (
              <div key={route.id} className="px-4 py-3">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <MapPin className="size-3.5 text-accent" />
                    <span className="text-[13px] font-medium text-text-primary">
                      {route.name}
                    </span>
                  </div>
                  <span className="text-xs text-text-tertiary">{route.zilePlecare}</span>
                </div>
                <div className="flex items-center gap-4 text-xs text-text-secondary">
                  <span className="flex items-center gap-1">
                    <User className="size-3" /> {passengers} pasag.
                  </span>
                  <span className="flex items-center gap-1">
                    <Package className="size-3" /> {parcels} colete
                  </span>
                  <span className="flex items-center gap-1">
                    <Car className="size-3" /> {cars} mașini
                  </span>
                  {driver && (
                    <span className="flex items-center gap-1 ml-auto text-text-tertiary">
                      <Truck className="size-3" /> {driver}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Orders table (full width) */}
      <div>
        <div className="flex items-center gap-1.5 mb-3">
          {filterChips.map((chip) => (
            <button
              key={chip.key}
              onClick={() => setActiveFilter(chip.key)}
              className={[
                'px-3 py-2 min-h-[44px] flex items-center rounded-[6px] text-[13px] font-medium transition-colors sm:min-h-0 sm:py-1.5',
                activeFilter === chip.key
                  ? 'bg-accent text-white'
                  : 'bg-bg-secondary text-text-secondary hover:bg-bg-tertiary hover:text-text-primary',
              ].join(' ')}
            >
              {chip.label}
            </button>
          ))}
        </div>

        <DataTable
          columns={columns}
          data={filteredOrders}
          onRowClick={(row) => navigate(`/comenzi/${row.id}`)}
          pageSize={15}
          cardRenderer={(order: Order) => {
            const TypeIcon = typeIcons[order.type];
            const route = routeMap.get(order.routeId);
            return (
              <div className="p-3 rounded-[6px] border border-border bg-bg-primary hover:border-accent/30 transition-colors">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-[13px] font-medium text-accent">
                    {order.awb}
                  </span>
                  <Badge variant={typeBadgeVariant[order.type]}>
                    <TypeIcon className="size-3 mr-1" />
                    {getOrderTypeLabel(order.type)}
                  </Badge>
                </div>
                <div className="text-[13px] text-text-secondary mb-2">
                  {route?.name || '—'}
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[13px] font-medium text-text-primary">
                    {formatCurrency(order.pret, order.moneda)}
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
              </div>
            );
          }}
        />
      </div>
    </div>
  );
}
