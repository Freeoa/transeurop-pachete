import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { type ColumnDef } from '@tanstack/react-table';
import {
  Plus,
  Package,
  User,
  Car,
  MoreHorizontal,
  Eye,
  Pencil,
  RefreshCw,
  XCircle,
  ChevronDown,
  Camera,
} from 'lucide-react';

import type { Order, OrderType, OrderStatus, PaymentStatus } from '../types';
import {
  formatCurrency,
  formatDate,
  getStatusLabel,
  getOrderTypeLabel,
  getPaymentStatusLabel,
} from '../utils';
import { mockDrivers } from '../data';
import { useDataStore } from '../contexts/DataStoreContext';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';

import PageHeader from '../components/layout/PageHeader';
import { usePullToRefresh } from '../hooks/usePullToRefresh';
import { useIsMobile } from '../hooks/useIsMobile';
import { DataTable } from '../components/ui/DataTable';
import { Badge, type BadgeVariant } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Drawer } from '../components/ui/Drawer';
import { BottomSheet } from '../components/ui/BottomSheet';
import OrderDetail from './OrderDetail';

// ── Helpers ──────────────────────────────────────────────────────

const typeIcons: Record<OrderType, typeof Package> = {
  colet: Package,
  pasager: User,
  masina: Car,
};

const typeBadgeVariant: Record<OrderType, BadgeVariant> = {
  colet: 'info',
  pasager: 'purple',
  masina: 'warning',
};

const statusBadgeVariant: Record<OrderStatus, BadgeVariant> = {
  nou: 'info',
  confirmat: 'info',
  ridicat: 'warning',
  in_tranzit: 'warning',
  livrat: 'success',
  finalizat: 'success',
  anulat: 'neutral',
  problema: 'danger',
  retur: 'purple',
};

const paymentBadgeVariant: Record<PaymentStatus, BadgeVariant> = {
  neplatit: 'danger',
  platit: 'success',
  partial: 'warning',
};

function getRouteName(routeId: string, routes: import('../types').Route[]): string {
  const r = routes.find((rt) => rt.id === routeId);
  return r ? `${r.origin} → ${r.destination}` : '—';
}

function getDriverName(soferId?: string): string {
  if (!soferId) return '—';
  const d = mockDrivers.find((dr) => dr.id === soferId);
  return d ? d.name : '—';
}

function getSenderName(order: Order): string {
  if (order.type === 'colet') return order.expeditor ?? '—';
  if (order.type === 'pasager') return order.numePasager ?? '—';
  if (order.type === 'masina') return order.proprietar ?? '—';
  return '—';
}

function getWeightSeats(order: Order): string {
  if (order.type === 'colet') return order.greutate ? `${order.greutate} kg` : '—';
  if (order.type === 'pasager') return order.nrLocuri ? `${order.nrLocuri} loc.` : '—';
  if (order.type === 'masina') return order.modelAuto ?? '—';
  return '—';
}

// ── Filter chips ─────────────────────────────────────────────────

const typeFilters: { value: OrderType | 'toate'; label: string }[] = [
  { value: 'toate', label: 'Toate' },
  { value: 'colet', label: 'Colete' },
  { value: 'pasager', label: 'Pasageri' },
  { value: 'masina', label: 'Mașini' },
];

const statusOptions: { value: OrderStatus | ''; label: string }[] = [
  { value: '', label: 'Toate statusurile' },
  { value: 'nou', label: 'Nou' },
  { value: 'confirmat', label: 'Confirmat' },
  { value: 'ridicat', label: 'Ridicat' },
  { value: 'in_tranzit', label: 'În Tranzit' },
  { value: 'livrat', label: 'Livrat' },
  { value: 'finalizat', label: 'Finalizat' },
  { value: 'anulat', label: 'Anulat' },
  { value: 'problema', label: 'Problemă' },
  { value: 'retur', label: 'Retur' },
];

const paymentOptions: { value: PaymentStatus | ''; label: string }[] = [
  { value: '', label: 'Toate plățile' },
  { value: 'neplatit', label: 'Neplătit' },
  { value: 'platit', label: 'Plătit' },
  { value: 'partial', label: 'Parțial' },
];

// ── Action menu ──────────────────────────────────────────────────

function ActionMenu({
  order,
  onDetail,
  onEdit,
  onChangeStatus,
  onCancel,
}: {
  order: Order;
  onDetail: (o: Order) => void;
  onEdit: (o: Order) => void;
  onChangeStatus: (o: Order) => void;
  onCancel: (o: Order) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen(!open);
        }}
        className="flex items-center justify-center size-7 rounded-[4px] text-text-tertiary hover:text-text-primary hover:bg-bg-tertiary transition-colors"
      >
        <MoreHorizontal className="size-4" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-8 z-20 w-44 max-w-[calc(100vw-2rem)] bg-bg-primary border border-border rounded-[6px] shadow-lg py-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setOpen(false);
                onDetail(order);
              }}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-[13px] text-text-primary hover:bg-bg-secondary transition-colors"
            >
              <Eye className="size-3.5 text-text-tertiary" />
              Detalii
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setOpen(false);
                onEdit(order);
              }}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-[13px] text-text-primary hover:bg-bg-secondary transition-colors"
            >
              <Pencil className="size-3.5 text-text-tertiary" />
              Editează
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setOpen(false);
                onChangeStatus(order);
              }}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-[13px] text-text-primary hover:bg-bg-secondary transition-colors"
            >
              <RefreshCw className="size-3.5 text-text-tertiary" />
              Schimbă status
            </button>
            <div className="h-px bg-border mx-2 my-1" />
            <button
              onClick={(e) => {
                e.stopPropagation();
                setOpen(false);
                onCancel(order);
              }}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-[13px] text-danger hover:bg-bg-secondary transition-colors"
            >
              <XCircle className="size-3.5" />
              Anulează
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ── Orders page ──────────────────────────────────────────────────

const allStatuses: OrderStatus[] = ['nou', 'confirmat', 'ridicat', 'in_tranzit', 'livrat', 'finalizat', 'anulat', 'problema', 'retur'];

export default function Orders() {
  const navigate = useNavigate();
  const store = useDataStore();
  const { toast } = useToast();
  const { isManager, isClient, isDriver, clientId, driverId } = useAuth();
  const { isMobile } = useIsMobile();
  const { isRefreshing, pullDistance } = usePullToRefresh({
    onRefresh: () => toast('Date actualizate', 'success'),
  });
  const [typeFilter, setTypeFilter] = useState<OrderType | 'toate'>('toate');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | ''>('');
  const [paymentFilter, setPaymentFilter] = useState<PaymentStatus | ''>('');
  const [routeFilter, setRouteFilter] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [statusSheetOrder, setStatusSheetOrder] = useState<Order | null>(null);

  // ── Photo indicator helper ──────────────────────────────────────
  const hasPhotos = (orderId: string) => {
    const order = store.state.orders.find((o) => o.id === orderId);
    if (order?.photos?.length) return true;
    if (store.state.deliveryProofs.some((p) => p.orderId === orderId)) return true;
    if (store.state.pickupProofs.some((p) => p.orderId === orderId)) return true;
    if (store.state.damageReports.some((r) => r.orderId === orderId)) return true;
    return false;
  };

  // ── Role-based base orders ──────────────────────────────────────
  const roleOrders = useMemo(() => {
    if (isClient && clientId) return store.state.orders.filter((o) => o.clientId === clientId);
    if (isDriver && driverId) return store.state.orders.filter((o) => o.soferId === driverId);
    return store.state.orders;
  }, [store.state.orders, isClient, isDriver, clientId, driverId]);

  // ── Filtered data ──────────────────────────────────────────────
  const filteredOrders = useMemo(() => {
    let list = [...roleOrders];
    if (typeFilter !== 'toate') list = list.filter((o) => o.type === typeFilter);
    if (statusFilter) list = list.filter((o) => o.status === statusFilter);
    if (paymentFilter) list = list.filter((o) => o.statusPlata === paymentFilter);
    if (routeFilter) list = list.filter((o) => o.routeId === routeFilter);
    return list;
  }, [roleOrders, typeFilter, statusFilter, paymentFilter, routeFilter]);

  // ── Route options for filter dropdown ──────────────────────────
  const routeOptions = useMemo(
    () => [
      { value: '', label: 'Toate rutele' },
      ...store.state.routes
        .filter((r) => r.activa)
        .map((r) => ({ value: r.id, label: `${r.origin} → ${r.destination}` })),
    ],
    [store.state.routes]
  );

  // ── Stats ──────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const total = roleOrders.length;
    const colete = roleOrders.filter((o) => o.type === 'colet').length;
    const pasageri = roleOrders.filter((o) => o.type === 'pasager').length;
    const masini = roleOrders.filter((o) => o.type === 'masina').length;
    const unpaid = roleOrders.filter((o) => o.statusPlata === 'neplatit').length;
    return { total, colete, pasageri, masini, unpaid };
  }, [roleOrders]);

  // ── Columns ────────────────────────────────────────────────────
  const columns = useMemo<ColumnDef<Order, any>[]>(
    () => [
      {
        accessorKey: 'awb',
        header: 'AWB',
        size: 150,
        cell: ({ row }) => (
          <span className="font-mono text-[13px] font-medium text-text-primary">
            {row.original.awb}
            {hasPhotos(row.original.id) && (
              <Camera className="size-3 text-text-tertiary inline ml-1" />
            )}
          </span>
        ),
      },
      {
        accessorKey: 'type',
        header: 'Tip',
        size: 100,
        cell: ({ row }) => {
          const t = row.original.type;
          const Icon = typeIcons[t];
          return (
            <Badge variant={typeBadgeVariant[t]}>
              <Icon className="size-3 mr-1" />
              {getOrderTypeLabel(t)}
            </Badge>
          );
        },
      },
      {
        id: 'route',
        header: 'Rută',
        size: 180,
        accessorFn: (row) => getRouteName(row.routeId, store.state.routes),
        cell: ({ row }) => (
          <span className="text-[13px] text-text-primary">
            {getRouteName(row.original.routeId, store.state.routes)}
          </span>
        ),
      },
      {
        id: 'sender',
        header: 'Expeditor / Nume',
        size: 160,
        accessorFn: (row) => getSenderName(row),
        cell: ({ row }) => (
          <span className="text-[13px] text-text-primary truncate max-w-[160px] block">
            {getSenderName(row.original)}
          </span>
        ),
      },
      {
        accessorKey: 'dataCreare',
        header: 'Data',
        size: 110,
        cell: ({ row }) => (
          <span className="text-[13px] text-text-secondary">
            {formatDate(row.original.dataCreare)}
          </span>
        ),
      },
      {
        id: 'weightSeats',
        header: 'Kg / Locuri',
        size: 90,
        accessorFn: (row) => getWeightSeats(row),
        cell: ({ row }) => (
          <span className="text-[13px] text-text-secondary">
            {getWeightSeats(row.original)}
          </span>
        ),
      },
      {
        accessorKey: 'pret',
        header: 'Preț',
        size: 100,
        cell: ({ row }) => (
          <span className="font-mono text-[13px] font-medium text-text-primary">
            {formatCurrency(row.original.pret, row.original.moneda)}
          </span>
        ),
      },
      {
        accessorKey: 'statusPlata',
        header: 'Plată',
        size: 90,
        cell: ({ row }) => {
          const sp = row.original.statusPlata;
          return (
            <Badge variant={paymentBadgeVariant[sp]}>
              {getPaymentStatusLabel(sp)}
            </Badge>
          );
        },
      },
      {
        accessorKey: 'status',
        header: 'Status',
        size: 110,
        cell: ({ row }) => {
          const s = row.original.status;
          return (
            <Badge variant={statusBadgeVariant[s]}>
              {getStatusLabel(s)}
            </Badge>
          );
        },
      },
      {
        id: 'driver',
        header: 'Șofer',
        size: 130,
        accessorFn: (row) => getDriverName(row.soferId),
        cell: ({ row }) => (
          <span className="text-[13px] text-text-secondary">
            {getDriverName(row.original.soferId)}
          </span>
        ),
      },
      ...(isManager ? [{
        id: 'actions',
        header: '',
        size: 48,
        enableSorting: false,
        cell: ({ row }: any) => (
          <ActionMenu
            order={row.original}
            onDetail={(o: Order) => setSelectedOrder(o)}
            onEdit={(o: Order) => navigate('/comenzi/' + o.id)}
            onChangeStatus={(o: Order) => setStatusSheetOrder(o)}
            onCancel={(o: Order) => {
              if (window.confirm('Sigur vrei să anulezi comanda ' + o.awb + '?')) {
                store.updateOrderStatus(o.id, 'anulat');
                toast('Comanda a fost anulată', 'success');
              }
            }}
          />
        ),
      } as ColumnDef<Order, any>] : []),
    ],
    [isManager]
  );

  // ── Render ─────────────────────────────────────────────────────
  return (
    <div>
      {isMobile && pullDistance > 0 && (
        <div
          className="flex justify-center py-2 text-text-secondary transition-opacity"
          style={{ opacity: Math.min(pullDistance / 80, 1) }}
        >
          <svg className={`size-5 ${isRefreshing ? 'animate-spin' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
        </div>
      )}
      <PageHeader
        title="Comenzi"
        subtitle={isClient ? `${stats.total} comenzile tale` : `${stats.total} comenzi totale`}
        actions={
          isManager ? (
            <Button
              icon={<Plus />}
              onClick={() => navigate('/comenzi/nou')}
            >
              Comandă nouă
            </Button>
          ) : undefined
        }
      />

      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-4">
        <div className="flex items-center gap-3 px-4 py-2.5 bg-bg-secondary rounded-[6px] border border-border">
          <span className="text-[11px] font-medium text-text-secondary tracking-[0.01em]">Total</span>
          <span className="text-heading font-mono text-text-primary leading-none">
            {stats.total}
          </span>
        </div>
        <div className="flex items-center gap-3 px-4 py-2.5 bg-bg-secondary rounded-[6px] border border-border">
          <Package className="size-3.5 text-info" />
          <span className="text-[11px] font-medium text-text-secondary tracking-[0.01em]">Colete</span>
          <span className="text-heading font-mono text-text-primary leading-none">
            {stats.colete}
          </span>
        </div>
        <div className="flex items-center gap-3 px-4 py-2.5 bg-bg-secondary rounded-[6px] border border-border">
          <User className="size-3.5 text-purple" />
          <span className="text-[11px] font-medium text-text-secondary tracking-[0.01em]">Pasageri</span>
          <span className="text-heading font-mono text-text-primary leading-none">
            {stats.pasageri}
          </span>
        </div>
        <div className="flex items-center gap-3 px-4 py-2.5 bg-bg-secondary rounded-[6px] border border-border">
          <Car className="size-3.5 text-warning" />
          <span className="text-[11px] font-medium text-text-secondary tracking-[0.01em]">Mașini</span>
          <span className="text-heading font-mono text-text-primary leading-none">
            {stats.masini}
          </span>
        </div>
        <div className="flex items-center gap-3 px-4 py-2.5 bg-bg-secondary rounded-[6px] border border-border">
          <span className="text-[11px] font-medium text-text-secondary tracking-[0.01em]">Neplătite</span>
          <span className="text-heading font-mono text-danger leading-none">
            {stats.unpaid}
          </span>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        {/* Type chips */}
        <div className="flex items-center gap-1 bg-bg-secondary rounded-[6px] p-0.5 border border-border">
          {typeFilters.map((tf) => (
            <button
              key={tf.value}
              onClick={() => setTypeFilter(tf.value)}
              className={[
                'px-3 py-1.5 text-xs font-medium rounded-[4px] transition-colors',
                typeFilter === tf.value
                  ? 'bg-accent text-white shadow-sm'
                  : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary',
              ].join(' ')}
            >
              {tf.label}
            </button>
          ))}
        </div>

        {/* Status dropdown */}
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as OrderStatus | '')}
            className="h-8 pl-3 pr-8 rounded-[6px] border border-border bg-bg-primary text-[13px] text-text-primary appearance-none cursor-pointer focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-colors"
          >
            {statusOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 size-3.5 text-text-tertiary pointer-events-none" />
        </div>

        {/* Route dropdown */}
        <div className="relative">
          <select
            value={routeFilter}
            onChange={(e) => setRouteFilter(e.target.value)}
            className="h-8 pl-3 pr-8 rounded-[6px] border border-border bg-bg-primary text-[13px] text-text-primary appearance-none cursor-pointer focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-colors"
          >
            {routeOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 size-3.5 text-text-tertiary pointer-events-none" />
        </div>

        {/* Payment dropdown */}
        <div className="relative">
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value as PaymentStatus | '')}
            className="h-8 pl-3 pr-8 rounded-[6px] border border-border bg-bg-primary text-[13px] text-text-primary appearance-none cursor-pointer focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-colors"
          >
            {paymentOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 size-3.5 text-text-tertiary pointer-events-none" />
        </div>
      </div>

      {/* Data table */}
      <DataTable
        columns={columns}
        data={filteredOrders}
        onRowClick={(order) => setSelectedOrder(order)}
        searchable
        searchPlaceholder="Caută AWB, expeditor, destinatar..."
        pageSize={20}
        cardRenderer={(order: Order) => {
          const TypeIcon = typeIcons[order.type];
          return (
            <div className="p-3 rounded-[6px] border border-border bg-bg-primary hover:border-accent/30 transition-colors">
              <div className="flex items-center justify-between mb-1">
                <span className="font-mono text-[13px] font-medium text-accent flex items-center gap-1">
                  {order.awb}
                  {hasPhotos(order.id) && <Camera className="size-3 text-text-tertiary" />}
                </span>
                <Badge variant={typeBadgeVariant[order.type]}>
                  <TypeIcon className="size-3 mr-1" />
                  {getOrderTypeLabel(order.type)}
                </Badge>
              </div>
              <div className="text-[13px] text-text-secondary mb-1">
                {getRouteName(order.routeId, store.state.routes)}
              </div>
              <div className="flex items-center justify-between text-[13px] mb-2">
                <span className="text-text-primary truncate max-w-[60%]">
                  {getSenderName(order)}
                </span>
                <span className="text-text-secondary">
                  {formatDate(order.dataCreare)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-[13px] font-semibold text-text-primary">
                  {formatCurrency(order.pret, order.moneda)}
                </span>
                <div className="flex items-center gap-1.5">
                  <Badge variant={statusBadgeVariant[order.status]}>
                    {getStatusLabel(order.status)}
                  </Badge>
                  <Badge variant={paymentBadgeVariant[order.statusPlata]}>
                    {getPaymentStatusLabel(order.statusPlata)}
                  </Badge>
                </div>
              </div>
            </div>
          );
        }}
      />

      {/* Drawer with order detail */}
      <Drawer
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        title={selectedOrder ? selectedOrder.awb : ''}
      >
        {selectedOrder && (
          <OrderDetail orderId={selectedOrder.id} embedded />
        )}
      </Drawer>

      {/* Status change bottom sheet */}
      <BottomSheet
        isOpen={!!statusSheetOrder}
        onClose={() => setStatusSheetOrder(null)}
        title={statusSheetOrder ? `Schimbă status: ${statusSheetOrder.awb}` : ''}
      >
        {statusSheetOrder && (
          <div className="flex flex-col gap-2">
            {allStatuses
              .filter((s) => s !== statusSheetOrder.status)
              .map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    store.updateOrderStatus(statusSheetOrder.id, s);
                    toast('Status actualizat: ' + getStatusLabel(s), 'success');
                    setStatusSheetOrder(null);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-[8px] border border-border bg-bg-primary text-left hover:border-accent/30 hover:bg-bg-secondary transition-colors"
                >
                  <Badge variant={statusBadgeVariant[s]}>
                    {getStatusLabel(s)}
                  </Badge>
                </button>
              ))}
          </div>
        )}
      </BottomSheet>
    </div>
  );
}
