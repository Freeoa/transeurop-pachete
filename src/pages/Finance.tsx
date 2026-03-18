// ============================================================
// TransEurop - Finance / Incasari Page
// ============================================================

import { useState, useMemo } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import { Plus, Calendar, Filter } from 'lucide-react';
import PageHeader from '../components/layout/PageHeader';
import { Button, KPICard, Badge, DataTable, Select } from '../components/ui';
import { BottomSheet } from '../components/ui/BottomSheet';
import { Input } from '../components/ui/Input';
import { SuccessAnimation } from '../components/shared/SuccessAnimation';
import { formatCurrency, formatDate } from '../utils';
import { mockClients } from '../data';
import { useDataStore } from '../contexts/DataStoreContext';
import { useToast } from '../contexts/ToastContext';
import type { Payment, Currency, PaymentMethod } from '../types';

const methodLabels: Record<PaymentMethod, string> = {
  numerar_ridicare: 'Numerar la ridicare',
  numerar_livrare: 'Numerar la livrare',
  transfer: 'Transfer bancar',
  card: 'Card',
};

const methodBadgeVariant: Record<PaymentMethod, 'success' | 'warning' | 'info' | 'purple'> = {
  numerar_ridicare: 'success',
  numerar_livrare: 'success',
  transfer: 'info',
  card: 'purple',
};

const currencyOptions = [
  { value: '', label: 'Toate monedele' },
  { value: 'EUR', label: 'EUR' },
  { value: 'GBP', label: 'GBP' },
  { value: 'RON', label: 'RON' },
];

const methodOptions = [
  { value: '', label: 'Toate metodele' },
  { value: 'numerar_ridicare', label: 'Numerar la ridicare' },
  { value: 'numerar_livrare', label: 'Numerar la livrare' },
  { value: 'transfer', label: 'Transfer bancar' },
  { value: 'card', label: 'Card' },
];

export default function Finance() {
  const store = useDataStore();
  const { toast } = useToast();
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [filterCurrency, setFilterCurrency] = useState('');
  const [filterMethod, setFilterMethod] = useState('');
  const [addPaymentOpen, setAddPaymentOpen] = useState(false);

  const [showSuccess, setShowSuccess] = useState(false);

  // Add payment form state
  const [payOrderId, setPayOrderId] = useState('');
  const [paySuma, setPaySuma] = useState('');
  const [payMoneda, setPayMoneda] = useState<Currency>('EUR');
  const [payMetoda, setPayMetoda] = useState<PaymentMethod>('numerar_ridicare');

  function getOrderAwb(orderId: string): string {
    const order = store.state.orders.find((o) => o.id === orderId);
    return order?.awb ?? '—';
  }

  function getClientName(orderId: string): string {
    const order = store.state.orders.find((o) => o.id === orderId);
    if (!order?.clientId) return '—';
    const client = mockClients.find((c) => c.id === order.clientId);
    return client?.name ?? '—';
  }

  const filteredPayments = useMemo(() => {
    return store.state.payments.filter((p) => {
      if (filterCurrency && p.moneda !== filterCurrency) return false;
      if (filterMethod && p.metoda !== filterMethod) return false;
      if (dateFrom && p.data < dateFrom) return false;
      if (dateTo && p.data > dateTo) return false;
      return true;
    });
  }, [store.state.payments, filterCurrency, filterMethod, dateFrom, dateTo]);

  // KPI calculations
  const totalEUR = useMemo(
    () => filteredPayments.filter((p) => p.moneda === 'EUR').reduce((s, p) => s + p.suma, 0),
    [filteredPayments]
  );
  const totalGBP = useMemo(
    () => filteredPayments.filter((p) => p.moneda === 'GBP').reduce((s, p) => s + p.suma, 0),
    [filteredPayments]
  );

  const unpaidCount = useMemo(
    () => store.state.orders.filter((o) => o.statusPlata === 'neplatit').length,
    [store.state.orders]
  );
  const partialCount = useMemo(
    () => store.state.orders.filter((o) => o.statusPlata === 'partial').length,
    [store.state.orders]
  );

  // Unpaid orders for the payment form
  const unpaidOrders = useMemo(
    () => store.state.orders.filter((o) => o.statusPlata !== 'platit'),
    [store.state.orders]
  );

  const columns: ColumnDef<Payment, any>[] = useMemo(
    () => [
      {
        accessorKey: 'data',
        header: 'Data',
        size: 120,
        cell: ({ getValue }) => (
          <span className="text-text-secondary">{formatDate(getValue() as string)}</span>
        ),
      },
      {
        id: 'awb',
        header: 'AWB',
        size: 150,
        accessorFn: (row) => getOrderAwb(row.orderId),
        cell: ({ getValue }) => (
          <span className="font-mono text-accent text-[12px]">{getValue() as string}</span>
        ),
      },
      {
        id: 'client',
        header: 'Client',
        accessorFn: (row) => getClientName(row.orderId),
        cell: ({ getValue }) => (
          <span className="text-text-primary">{getValue() as string}</span>
        ),
      },
      {
        accessorKey: 'suma',
        header: 'Sumă',
        size: 110,
        cell: ({ row }) => (
          <span className="font-mono font-medium text-text-primary">
            {formatCurrency(row.original.suma, row.original.moneda)}
          </span>
        ),
      },
      {
        accessorKey: 'moneda',
        header: 'Monedă',
        size: 80,
        cell: ({ getValue }) => (
          <Badge variant="neutral">{getValue() as Currency}</Badge>
        ),
      },
      {
        accessorKey: 'metoda',
        header: 'Metodă',
        size: 170,
        cell: ({ getValue }) => {
          const method = getValue() as PaymentMethod;
          return (
            <Badge variant={methodBadgeVariant[method]}>
              {methodLabels[method]}
            </Badge>
          );
        },
      },
      {
        accessorKey: 'incasatDe',
        header: 'Încasat de',
        size: 140,
        cell: ({ getValue }) => (
          <span className="text-text-secondary">{getValue() as string}</span>
        ),
      },
    ],
    [store.state.orders]
  );

  const handleAddPayment = () => {
    if (!payOrderId || !paySuma) return;
    const payment: Payment = {
      id: 'pay-' + Date.now(),
      orderId: payOrderId,
      suma: parseFloat(paySuma),
      moneda: payMoneda,
      metoda: payMetoda,
      data: new Date().toISOString(),
      incasatDe: 'Admin',
    };
    store.addPayment(payment);
    store.updatePaymentStatus(payOrderId, 'platit');
    toast('Plată înregistrată', 'success');
    setAddPaymentOpen(false);
    setShowSuccess(true);
    setPayOrderId('');
    setPaySuma('');
    setPayMoneda('EUR');
    setPayMetoda('numerar_ridicare');
  };

  return (
    <>
      <PageHeader
        title="Încasări"
        subtitle="Gestionează plățile și încasările"
        actions={
          <Button icon={<Plus />} size="sm" onClick={() => setAddPaymentOpen(true)}>
            Înregistrează Plată
          </Button>
        }
      />

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <KPICard label="Total încasat (EUR)" value={formatCurrency(totalEUR, 'EUR')} />
        <KPICard label="Total încasat (GBP)" value={formatCurrency(totalGBP, 'GBP')} />
        <KPICard label="Neplătite" value={unpaidCount} />
        <KPICard label="Parțial plătite" value={partialCount} />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3 mb-4">
        <div className="flex items-center gap-1.5 text-text-secondary">
          <Filter className="size-3.5" />
          <span className="text-xs font-medium uppercase tracking-wider">Filtre</span>
        </div>

        <div className="flex items-center gap-2">
          <Calendar className="size-3.5 text-text-tertiary" />
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="h-8 px-2.5 rounded-[6px] border border-border bg-bg-primary text-[13px] text-text-primary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-colors"
            placeholder="De la"
          />
          <span className="text-xs text-text-tertiary">—</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="h-8 px-2.5 rounded-[6px] border border-border bg-bg-primary text-[13px] text-text-primary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-colors"
            placeholder="Până la"
          />
        </div>

        <Select
          options={currencyOptions}
          value={filterCurrency}
          onChange={(e) => setFilterCurrency(e.target.value)}
          wrapperClassName="w-40"
        />
        <Select
          options={methodOptions}
          value={filterMethod}
          onChange={(e) => setFilterMethod(e.target.value)}
          wrapperClassName="w-48"
        />

        {(dateFrom || dateTo || filterCurrency || filterMethod) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setDateFrom('');
              setDateTo('');
              setFilterCurrency('');
              setFilterMethod('');
            }}
          >
            Resetează
          </Button>
        )}
      </div>

      {/* Payments Table */}
      <DataTable
        columns={columns}
        data={filteredPayments}
        searchable
        searchPlaceholder="Caută după AWB, client..."
        pageSize={15}
        cardRenderer={(p: Payment) => (
          <div className="p-3 rounded-[6px] border border-border bg-bg-primary hover:border-accent/30 transition-colors">
            {/* Top row: AWB + method badge */}
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-accent text-[12px]">
                {getOrderAwb(p.orderId)}
              </span>
              <Badge variant={methodBadgeVariant[p.metoda]}>
                {methodLabels[p.metoda]}
              </Badge>
            </div>

            {/* Client name */}
            <div className="text-text-primary text-[13px] mb-2">
              {getClientName(p.orderId)}
            </div>

            {/* Bottom row: amount + currency + date */}
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span className="font-mono font-semibold text-text-primary">
                  {formatCurrency(p.suma, p.moneda)}
                </span>
                <Badge variant="neutral">{p.moneda}</Badge>
              </span>
              <span className="text-[12px] text-text-secondary">
                {formatDate(p.data)}
              </span>
            </div>
          </div>
        )}
      />

      {/* Add payment bottom sheet */}
      <BottomSheet
        isOpen={addPaymentOpen}
        onClose={() => setAddPaymentOpen(false)}
        title="Înregistrează plată"
      >
        <div className="space-y-4">
          <Select
            label="Comandă"
            value={payOrderId}
            onChange={(e) => setPayOrderId(e.target.value)}
            placeholder="Selectează comanda..."
            options={unpaidOrders.map((o) => ({ value: o.id, label: o.awb }))}
          />
          <Input
            label="Sumă"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={paySuma}
            onChange={(e) => setPaySuma(e.target.value)}
            required
          />
          <Select
            label="Monedă"
            value={payMoneda}
            onChange={(e) => setPayMoneda(e.target.value as Currency)}
            options={[
              { value: 'EUR', label: 'EUR' },
              { value: 'GBP', label: 'GBP' },
              { value: 'RON', label: 'RON' },
            ]}
          />
          <Select
            label="Metodă de plată"
            value={payMetoda}
            onChange={(e) => setPayMetoda(e.target.value as PaymentMethod)}
            options={[
              { value: 'numerar_ridicare', label: 'Numerar la ridicare' },
              { value: 'numerar_livrare', label: 'Numerar la livrare' },
              { value: 'transfer', label: 'Transfer bancar' },
              { value: 'card', label: 'Card' },
            ]}
          />
          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button variant="ghost" size="sm" onClick={() => setAddPaymentOpen(false)}>
              Anulează
            </Button>
            <Button size="sm" onClick={handleAddPayment}>
              Înregistrează
            </Button>
          </div>
        </div>
      </BottomSheet>

      <SuccessAnimation
        visible={showSuccess}
        onComplete={() => setShowSuccess(false)}
      />
    </>
  );
}
