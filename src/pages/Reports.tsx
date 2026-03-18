// ============================================================
// TransEurop - Reports / Rapoarte Page
// ============================================================

import { useState, useMemo } from 'react';
import { Download, Calendar, Filter } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import {
  LineChart,
  BarChart,
  PieChart,
  Line,
  Bar,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import PageHeader from '../components/layout/PageHeader';
import { Button, Select } from '../components/ui';
import { formatCurrency } from '../utils';
import { mockOrders, mockExpenses } from '../data';
import { useDataStore } from '../contexts/DataStoreContext';
import type { OrderType } from '../types';

const PIE_COLORS = ['#3b82f6', '#f59e0b', '#8b5cf6', '#10b981', '#ef4444', '#06b6d4'];

const typeLabels: Record<OrderType, string> = {
  colet: 'Colet',
  pasager: 'Pasager',
  masina: 'Mașină',
};

// routeOptions computed inside the component

const typeOptions = [
  { value: '', label: 'Toate tipurile' },
  { value: 'colet', label: 'Colet' },
  { value: 'pasager', label: 'Pasager' },
  { value: 'masina', label: 'Mașină' },
];

function getWeekLabel(weeksAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - weeksAgo * 7);
  const weekStart = new Date(d);
  weekStart.setDate(d.getDate() - d.getDay() + 1);
  const day = weekStart.getDate().toString().padStart(2, '0');
  const month = (weekStart.getMonth() + 1).toString().padStart(2, '0');
  return `${day}/${month}`;
}

function getWeekStart(date: string, weeksAgo: number): boolean {
  const d = new Date(date);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
  const week = Math.floor(diffDays / 7);
  return week === weeksAgo;
}

export default function Reports() {
  const { toast } = useToast();
  const store = useDataStore();
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [filterRoute, setFilterRoute] = useState('');
  const [filterType, setFilterType] = useState('');

  const routeOptions = useMemo(
    () => [
      { value: '', label: 'Toate rutele' },
      ...store.state.routes.map((r) => ({ value: r.id, label: r.name })),
    ],
    [store.state.routes]
  );

  const filteredOrders = useMemo(() => {
    return mockOrders.filter((o) => {
      if (filterRoute && o.routeId !== filterRoute) return false;
      if (filterType && o.type !== filterType) return false;
      if (dateFrom && o.dataCreare < dateFrom) return false;
      if (dateTo && o.dataCreare > dateTo) return false;
      return true;
    });
  }, [filterRoute, filterType, dateFrom, dateTo]);

  const filteredExpenses = useMemo(() => {
    return mockExpenses.filter((e) => {
      if (filterRoute && e.routeId !== filterRoute) return false;
      if (dateFrom && e.data < dateFrom) return false;
      if (dateTo && e.data > dateTo) return false;
      return true;
    });
  }, [filterRoute, dateFrom, dateTo]);

  // Line chart: orders per week (last 8 weeks)
  const ordersPerWeek = useMemo(() => {
    const weeks = [];
    for (let w = 7; w >= 0; w--) {
      const count = filteredOrders.filter((o) => getWeekStart(o.dataCreare, w)).length;
      weeks.push({ name: getWeekLabel(w), comenzi: count });
    }
    return weeks;
  }, [filteredOrders]);

  // Bar chart: revenue by route
  const revenueByRoute = useMemo(() => {
    const map: Record<string, number> = {};
    for (const o of filteredOrders) {
      const route = store.state.routes.find((r) => r.id === o.routeId);
      const name = route?.name ?? 'Necunoscut';
      map[name] = (map[name] || 0) + o.pret;
    }
    return Object.entries(map)
      .map(([name, venituri]) => ({ name, venituri }))
      .sort((a, b) => b.venituri - a.venituri);
  }, [filteredOrders]);

  // Pie chart: orders by type
  const ordersByType = useMemo(() => {
    const map: Record<string, number> = {};
    for (const o of filteredOrders) {
      const label = typeLabels[o.type] ?? o.type;
      map[label] = (map[label] || 0) + 1;
    }
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [filteredOrders]);

  // Bar chart: revenue vs expenses per route
  const revenueVsExpenses = useMemo(() => {
    const revMap: Record<string, number> = {};
    const expMap: Record<string, number> = {};
    for (const o of filteredOrders) {
      const route = store.state.routes.find((r) => r.id === o.routeId);
      const name = route?.name ?? 'Necunoscut';
      revMap[name] = (revMap[name] || 0) + o.pret;
    }
    for (const e of filteredExpenses) {
      const route = store.state.routes.find((r) => r.id === e.routeId);
      const name = route?.name ?? 'Necunoscut';
      expMap[name] = (expMap[name] || 0) + e.suma;
    }
    const allRoutes = new Set([...Object.keys(revMap), ...Object.keys(expMap)]);
    return Array.from(allRoutes)
      .map((name) => ({
        name,
        venituri: revMap[name] || 0,
        cheltuieli: expMap[name] || 0,
      }))
      .sort((a, b) => b.venituri - a.venituri);
  }, [filteredOrders, filteredExpenses]);

  // Summary table: revenue by route with totals
  const summaryData = useMemo(() => {
    const map: Record<string, { orders: number; revenue: number; expenses: number }> = {};
    for (const o of filteredOrders) {
      const route = store.state.routes.find((r) => r.id === o.routeId);
      const name = route?.name ?? 'Necunoscut';
      if (!map[name]) map[name] = { orders: 0, revenue: 0, expenses: 0 };
      map[name].orders += 1;
      map[name].revenue += o.pret;
    }
    for (const e of filteredExpenses) {
      const route = store.state.routes.find((r) => r.id === e.routeId);
      const name = route?.name ?? 'Necunoscut';
      if (!map[name]) map[name] = { orders: 0, revenue: 0, expenses: 0 };
      map[name].expenses += e.suma;
    }
    return Object.entries(map)
      .map(([route, data]) => ({ route, ...data, profit: data.revenue - data.expenses }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [filteredOrders, filteredExpenses]);

  const totals = useMemo(() => {
    return summaryData.reduce(
      (acc, row) => ({
        orders: acc.orders + row.orders,
        revenue: acc.revenue + row.revenue,
        expenses: acc.expenses + row.expenses,
        profit: acc.profit + row.profit,
      }),
      { orders: 0, revenue: 0, expenses: 0, profit: 0 }
    );
  }, [summaryData]);

  const handleExport = () => {
    const header = 'Ruta,Comenzi,Venituri EUR,Cheltuieli EUR,Profit EUR\n';
    const rows = summaryData.map(r =>
      `"${r.route}",${r.orders},${r.revenue.toFixed(2)},${r.expenses.toFixed(2)},${r.profit.toFixed(2)}`
    ).join('\n');
    const bom = '\uFEFF';
    const csv = bom + header + rows;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `raport-transeurop-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast('Raport exportat cu succes', 'success');
  };

  return (
    <>
      <PageHeader
        title="Rapoarte"
        subtitle="Analiză și statistici"
        actions={
          <Button icon={<Download />} size="sm" onClick={handleExport}>
            Export Excel
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3 mb-6">
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
          />
          <span className="text-xs text-text-tertiary">—</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="h-8 px-2.5 rounded-[6px] border border-border bg-bg-primary text-[13px] text-text-primary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-colors"
          />
        </div>

        <Select
          options={routeOptions}
          value={filterRoute}
          onChange={(e) => setFilterRoute(e.target.value)}
          wrapperClassName="w-48"
        />
        <Select
          options={typeOptions}
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          wrapperClassName="w-40"
        />

        {(dateFrom || dateTo || filterRoute || filterType) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setDateFrom('');
              setDateTo('');
              setFilterRoute('');
              setFilterType('');
            }}
          >
            Resetează
          </Button>
        )}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {/* Line chart: orders per week */}
        <div className="bg-bg-secondary border border-border rounded-[6px] p-4">
          <h3 className="text-[13px] font-semibold text-text-primary mb-3">
            Comenzi pe săptămână (ultimele 8 săptămâni)
          </h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={ordersPerWeek}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border, #e5e7eb)" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: 'var(--color-text-secondary, #6b7280)' }}
              />
              <YAxis
                tick={{ fontSize: 11, fill: 'var(--color-text-secondary, #6b7280)' }}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--color-bg-primary, #fff)',
                  border: '1px solid var(--color-border, #e5e7eb)',
                  borderRadius: 6,
                  fontSize: 12,
                }}
              />
              <Line
                type="monotone"
                dataKey="comenzi"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ r: 4, fill: '#3b82f6' }}
                activeDot={{ r: 6 }}
                name="Comenzi"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Bar chart: revenue by route */}
        <div className="bg-bg-secondary border border-border rounded-[6px] p-4">
          <h3 className="text-[13px] font-semibold text-text-primary mb-3">
            Venituri pe rută
          </h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={revenueByRoute}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border, #e5e7eb)" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 10, fill: 'var(--color-text-secondary, #6b7280)' }}
                interval={0}
                angle={-20}
                textAnchor="end"
                height={50}
              />
              <YAxis tick={{ fontSize: 11, fill: 'var(--color-text-secondary, #6b7280)' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--color-bg-primary, #fff)',
                  border: '1px solid var(--color-border, #e5e7eb)',
                  borderRadius: 6,
                  fontSize: 12,
                }}
                formatter={(value: any) => [formatCurrency(Number(value), 'EUR'), 'Venituri']}
              />
              <Bar dataKey="venituri" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Venituri" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie chart: orders by type */}
        <div className="bg-bg-secondary border border-border rounded-[6px] p-4">
          <h3 className="text-[13px] font-semibold text-text-primary mb-3">
            Comenzi pe tip
          </h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={ordersByType}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={90}
                paddingAngle={3}
                dataKey="value"
                nameKey="name"
                label={({ name, percent }: any) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
              >
                {ordersByType.map((_, idx) => (
                  <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--color-bg-primary, #fff)',
                  border: '1px solid var(--color-border, #e5e7eb)',
                  borderRadius: 6,
                  fontSize: 12,
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: 12 }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Bar chart: revenue vs expenses per route */}
        <div className="bg-bg-secondary border border-border rounded-[6px] p-4">
          <h3 className="text-[13px] font-semibold text-text-primary mb-3">
            Venituri vs. Cheltuieli pe rută
          </h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={revenueVsExpenses}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border, #e5e7eb)" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 10, fill: 'var(--color-text-secondary, #6b7280)' }}
                interval={0}
                angle={-20}
                textAnchor="end"
                height={50}
              />
              <YAxis tick={{ fontSize: 11, fill: 'var(--color-text-secondary, #6b7280)' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--color-bg-primary, #fff)',
                  border: '1px solid var(--color-border, #e5e7eb)',
                  borderRadius: 6,
                  fontSize: 12,
                }}
                formatter={(value: any, name: any) => [
                  formatCurrency(Number(value), 'EUR'),
                  name === 'venituri' ? 'Venituri' : 'Cheltuieli',
                ]}
              />
              <Legend
                formatter={(value) => (value === 'venituri' ? 'Venituri' : 'Cheltuieli')}
                wrapperStyle={{ fontSize: 12 }}
              />
              <Bar dataKey="venituri" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="cheltuieli" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Summary Table */}
      <div className="bg-bg-secondary border border-border rounded-[6px] overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <h3 className="text-[13px] font-semibold text-text-primary">
            Sumar venituri pe rută
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-bg-tertiary">
                <th className="h-8 px-4 text-left text-[11px] font-semibold uppercase tracking-wider text-text-secondary border-b border-border">
                  Rută
                </th>
                <th className="h-8 px-4 text-right text-[11px] font-semibold uppercase tracking-wider text-text-secondary border-b border-border">
                  Comenzi
                </th>
                <th className="h-8 px-4 text-right text-[11px] font-semibold uppercase tracking-wider text-text-secondary border-b border-border">
                  Venituri
                </th>
                <th className="h-8 px-4 text-right text-[11px] font-semibold uppercase tracking-wider text-text-secondary border-b border-border">
                  Cheltuieli
                </th>
                <th className="h-8 px-4 text-right text-[11px] font-semibold uppercase tracking-wider text-text-secondary border-b border-border">
                  Profit
                </th>
              </tr>
            </thead>
            <tbody>
              {summaryData.map((row) => (
                <tr
                  key={row.route}
                  className="border-b border-border last:border-b-0 hover:bg-bg-tertiary transition-colors"
                >
                  <td className="h-[38px] px-4 text-[13px] text-text-primary font-medium">
                    {row.route}
                  </td>
                  <td className="h-[38px] px-4 text-[13px] text-text-secondary text-right font-mono">
                    {row.orders}
                  </td>
                  <td className="h-[38px] px-4 text-[13px] text-text-primary text-right font-mono">
                    {formatCurrency(row.revenue, 'EUR')}
                  </td>
                  <td className="h-[38px] px-4 text-[13px] text-danger text-right font-mono">
                    {formatCurrency(row.expenses, 'EUR')}
                  </td>
                  <td
                    className={[
                      'h-[38px] px-4 text-[13px] text-right font-mono font-medium',
                      row.profit >= 0 ? 'text-success' : 'text-danger',
                    ].join(' ')}
                  >
                    {formatCurrency(row.profit, 'EUR')}
                  </td>
                </tr>
              ))}
            </tbody>
            {summaryData.length > 0 && (
              <tfoot>
                <tr className="bg-bg-tertiary border-t-2 border-border">
                  <td className="h-[40px] px-4 text-[13px] text-text-primary font-semibold">
                    TOTAL
                  </td>
                  <td className="h-[40px] px-4 text-[13px] text-text-primary text-right font-mono font-semibold">
                    {totals.orders}
                  </td>
                  <td className="h-[40px] px-4 text-[13px] text-text-primary text-right font-mono font-semibold">
                    {formatCurrency(totals.revenue, 'EUR')}
                  </td>
                  <td className="h-[40px] px-4 text-[13px] text-danger text-right font-mono font-semibold">
                    {formatCurrency(totals.expenses, 'EUR')}
                  </td>
                  <td
                    className={[
                      'h-[40px] px-4 text-[13px] text-right font-mono font-semibold',
                      totals.profit >= 0 ? 'text-success' : 'text-danger',
                    ].join(' ')}
                  >
                    {formatCurrency(totals.profit, 'EUR')}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </>
  );
}
