// ============================================================
// TransEurop - Expenses / Cheltuieli Page (Professional)
// ============================================================

import React, { useState, useMemo } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import {
  Plus,
  Fuel,
  Receipt,
  Wrench,
  CircleDot,
  ShieldCheck,
  ClipboardCheck,
  Droplets,
  ParkingSquare,
  Hotel,
  Wallet,
  AlertTriangle,
  Cog,
  FileText,
  Smartphone,
  MoreHorizontal,
  TrendingUp,
  Truck,
  BarChart3,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import PageHeader from '../components/layout/PageHeader';
import { Button, KPICard, Badge, DataTable } from '../components/ui';
import type { BadgeVariant } from '../components/ui/Badge';
import { AddExpenseModal } from '../components/expenses/AddExpenseModal';
import {
  formatCurrency,
  formatDate,
  getExpenseCategoryLabel,
  getExpenseStatusLabel,
  getExpenseStatusVariant,
} from '../utils';
import { mockDrivers, mockVehicles } from '../data';
import { useDataStore } from '../contexts/DataStoreContext';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import type { Expense, ExpenseCategory } from '../types';

// ── Config ───────────────────────────────────────────────────

const categoryIcons: Record<ExpenseCategory, typeof Fuel> = {
  combustibil: Fuel,
  taxe_drum: Receipt,
  intretinere: Wrench,
  anvelope: CircleDot,
  asigurari: ShieldCheck,
  itp_revizie: ClipboardCheck,
  spalatorie: Droplets,
  parcare: ParkingSquare,
  cazare: Hotel,
  diurna: Wallet,
  amenzi: AlertTriangle,
  piese: Cog,
  taxe_licente: FileText,
  telefonie: Smartphone,
  altele: MoreHorizontal,
};

const categoryBadgeVariant: Record<ExpenseCategory, BadgeVariant> = {
  combustibil: 'danger',
  taxe_drum: 'warning',
  intretinere: 'info',
  anvelope: 'purple',
  asigurari: 'success',
  itp_revizie: 'info',
  spalatorie: 'neutral',
  parcare: 'neutral',
  cazare: 'purple',
  diurna: 'warning',
  amenzi: 'danger',
  piese: 'info',
  taxe_licente: 'warning',
  telefonie: 'neutral',
  altele: 'neutral',
};

type TabKey = 'toate' | 'combustibil' | 'vehicule' | 'operationale';

const tabs: { key: TabKey; label: string; icon: typeof Fuel }[] = [
  { key: 'toate', label: 'Toate', icon: BarChart3 },
  { key: 'combustibil', label: 'Combustibil', icon: Fuel },
  { key: 'vehicule', label: 'Vehicule', icon: Truck },
  { key: 'operationale', label: 'Operaționale', icon: Receipt },
];

const vehicleCategories: ExpenseCategory[] = ['intretinere', 'anvelope', 'piese', 'itp_revizie', 'spalatorie'];
const operationalCategories: ExpenseCategory[] = ['taxe_drum', 'cazare', 'diurna', 'parcare', 'amenzi', 'asigurari', 'taxe_licente', 'telefonie', 'altele'];

// ── Helpers ──────────────────────────────────────────────────

function getDriverName(soferId?: string): string {
  if (!soferId) return '—';
  const driver = mockDrivers.find((d) => d.id === soferId);
  return driver?.name ?? '—';
}

function getVehicleLabel(vehiculId?: string): string {
  if (!vehiculId) return '—';
  const v = mockVehicles.find((veh) => veh.id === vehiculId);
  return v ? `${v.marca} ${v.model} (${v.matricula})` : '—';
}

// ── Component ────────────────────────────────────────────────

export default function Expenses() {
  const store = useDataStore();
  const { toast } = useToast();
  const { isManager, user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabKey>('toate');
  const [categoryFilter, setCategoryFilter] = useState<ExpenseCategory | 'toate'>('toate');
  const [addModalOpen, setAddModalOpen] = useState(false);

  // ── Filtered data ────────────────────────────────────────
  const tabExpenses = useMemo(() => {
    switch (activeTab) {
      case 'combustibil':
        return store.state.expenses.filter((e) => e.categorie === 'combustibil');
      case 'vehicule':
        return store.state.expenses.filter((e) => vehicleCategories.includes(e.categorie));
      case 'operationale':
        return store.state.expenses.filter((e) => operationalCategories.includes(e.categorie));
      default:
        return store.state.expenses;
    }
  }, [activeTab, store.state.expenses]);

  const filteredExpenses = useMemo(() => {
    if (categoryFilter === 'toate') return tabExpenses;
    return tabExpenses.filter((e) => e.categorie === categoryFilter);
  }, [tabExpenses, categoryFilter]);

  // ── Category chips for current tab ───────────────────────
  const availableCategories = useMemo(() => {
    const cats = new Set(tabExpenses.map((e) => e.categorie));
    return Array.from(cats).sort();
  }, [tabExpenses]);

  // ── KPIs ─────────────────────────────────────────────────
  const totalAll = useMemo(() => store.state.expenses.reduce((s, e) => s + e.suma, 0), [store.state.expenses]);
  const totalFiltered = useMemo(() => filteredExpenses.reduce((s, e) => s + e.suma, 0), [filteredExpenses]);
  const pendingCount = useMemo(() => store.state.expenses.filter((e) => e.status === 'in_asteptare').length, [store.state.expenses]);

  // Category breakdown for the "toate" tab
  const categoryTotals = useMemo(() => {
    const map: Record<string, number> = {};
    for (const e of store.state.expenses) {
      map[e.categorie] = (map[e.categorie] || 0) + e.suma;
    }
    return Object.entries(map)
      .map(([cat, total]) => ({ cat: cat as ExpenseCategory, total }))
      .sort((a, b) => b.total - a.total);
  }, [store.state.expenses]);

  // Fuel-specific stats
  const fuelStats = useMemo(() => {
    const fuelExps = store.state.expenses.filter((e) => e.categorie === 'combustibil');
    const totalFuel = fuelExps.reduce((s, e) => s + e.suma, 0);
    const totalLitri = fuelExps.reduce((s, e) => s + (e.litri || 0), 0);
    const avgPretLitru = fuelExps.filter((e) => e.pretLitru).length
      ? fuelExps.reduce((s, e) => s + (e.pretLitru || 0), 0) / fuelExps.filter((e) => e.pretLitru).length
      : 0;
    return { totalFuel, totalLitri, avgPretLitru, count: fuelExps.length };
  }, [store.state.expenses]);

  // Vehicle cost breakdown
  const vehicleCosts = useMemo(() => {
    const map: Record<string, { label: string; total: number; count: number }> = {};
    for (const e of store.state.expenses) {
      if (!e.vehiculId) continue;
      if (!map[e.vehiculId]) {
        map[e.vehiculId] = { label: getVehicleLabel(e.vehiculId), total: 0, count: 0 };
      }
      map[e.vehiculId].total += e.suma;
      map[e.vehiculId].count++;
    }
    return Object.entries(map)
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.total - a.total);
  }, [store.state.expenses]);

  // ── Table columns ────────────────────────────────────────
  const baseColumns: ColumnDef<Expense, any>[] = useMemo(
    () => [
      {
        accessorKey: 'data',
        header: 'Data',
        size: 110,
        cell: ({ getValue }) => (
          <span className="text-text-secondary text-[12px]">{formatDate(getValue() as string)}</span>
        ),
      },
      {
        accessorKey: 'categorie',
        header: 'Categorie',
        size: 150,
        cell: ({ getValue }) => {
          const cat = getValue() as ExpenseCategory;
          const Icon = categoryIcons[cat];
          return (
            <span className="flex items-center gap-1.5">
              <Icon className="size-3.5 text-text-tertiary shrink-0" />
              <Badge variant={categoryBadgeVariant[cat]}>{getExpenseCategoryLabel(cat)}</Badge>
            </span>
          );
        },
      },
      {
        accessorKey: 'descriere',
        header: 'Descriere',
        cell: ({ getValue }) => (
          <span className="text-text-primary text-[13px] truncate max-w-[280px] block">
            {getValue() as string}
          </span>
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
        accessorKey: 'status',
        header: 'Status',
        size: 110,
        cell: ({ getValue }) => {
          const st = getValue() as Expense['status'];
          return <Badge variant={getExpenseStatusVariant(st)}>{getExpenseStatusLabel(st)}</Badge>;
        },
      },
      {
        id: 'sofer',
        header: 'Șofer',
        size: 130,
        accessorFn: (row) => getDriverName(row.soferId),
        cell: ({ getValue }) => (
          <span className="text-text-secondary text-[12px]">{getValue() as string}</span>
        ),
      },
      ...(isManager ? [{
        id: 'actiuni',
        header: '',
        size: 80,
        enableSorting: false,
        cell: ({ row }: any) => {
          const expense = row.original as Expense;
          if (expense.status !== 'in_asteptare') return null;
          return (
            <div className="flex items-center gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  store.updateExpenseStatus(expense.id, 'aprobat', user.id);
                  toast('Cheltuială aprobată', 'success');
                }}
                className="p-1.5 rounded-[4px] hover:bg-bg-secondary transition-colors text-green-600"
              >
                <CheckCircle2 className="size-4" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  store.updateExpenseStatus(expense.id, 'respins', user.id);
                  toast('Cheltuială respinsă', 'info');
                }}
                className="p-1.5 rounded-[4px] hover:bg-bg-secondary transition-colors text-red-600"
              >
                <XCircle className="size-4" />
              </button>
            </div>
          );
        },
      } as ColumnDef<Expense, any>] : []),
    ],
    [isManager, store, user, toast]
  );

  // Add fuel-specific columns
  const fuelColumns: ColumnDef<Expense, any>[] = useMemo(
    () => [
      {
        accessorKey: 'data',
        header: 'Data',
        size: 100,
        cell: ({ getValue }) => (
          <span className="text-text-secondary text-[12px]">{formatDate(getValue() as string)}</span>
        ),
      },
      {
        accessorKey: 'descriere',
        header: 'Descriere',
        cell: ({ getValue }) => (
          <span className="text-text-primary text-[13px] truncate max-w-[220px] block">
            {getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: 'litri',
        header: 'Litri',
        size: 80,
        cell: ({ getValue }) => {
          const v = getValue() as number | undefined;
          return <span className="font-mono text-[13px] text-text-primary">{v ? `${v} L` : '—'}</span>;
        },
      },
      {
        accessorKey: 'pretLitru',
        header: '€/L',
        size: 70,
        cell: ({ getValue }) => {
          const v = getValue() as number | undefined;
          return <span className="font-mono text-[12px] text-text-secondary">{v ? `${v.toFixed(2)}` : '—'}</span>;
        },
      },
      {
        accessorKey: 'suma',
        header: 'Total',
        size: 100,
        cell: ({ row }) => (
          <span className="font-mono font-medium text-text-primary">
            {formatCurrency(row.original.suma, row.original.moneda)}
          </span>
        ),
      },
      {
        accessorKey: 'kmOdometru',
        header: 'Km',
        size: 90,
        cell: ({ getValue }) => {
          const v = getValue() as number | undefined;
          return (
            <span className="font-mono text-[12px] text-text-secondary">
              {v ? v.toLocaleString('ro-RO') : '—'}
            </span>
          );
        },
      },
      {
        id: 'vehicul',
        header: 'Vehicul',
        size: 160,
        accessorFn: (row) => getVehicleLabel(row.vehiculId),
        cell: ({ getValue }) => (
          <span className="text-text-secondary text-[12px] truncate max-w-[150px] block">{getValue() as string}</span>
        ),
      },
      {
        id: 'sofer',
        header: 'Șofer',
        size: 120,
        accessorFn: (row) => getDriverName(row.soferId),
        cell: ({ getValue }) => (
          <span className="text-text-secondary text-[12px]">{getValue() as string}</span>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        size: 100,
        cell: ({ getValue }) => {
          const st = getValue() as Expense['status'];
          return <Badge variant={getExpenseStatusVariant(st)}>{getExpenseStatusLabel(st)}</Badge>;
        },
      },
      ...(isManager ? [{
        id: 'actiuni',
        header: '',
        size: 80,
        enableSorting: false,
        cell: ({ row }: any) => {
          const expense = row.original as Expense;
          if (expense.status !== 'in_asteptare') return null;
          return (
            <div className="flex items-center gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  store.updateExpenseStatus(expense.id, 'aprobat', user.id);
                  toast('Cheltuială aprobată', 'success');
                }}
                className="p-1.5 rounded-[4px] hover:bg-bg-secondary transition-colors text-green-600"
              >
                <CheckCircle2 className="size-4" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  store.updateExpenseStatus(expense.id, 'respins', user.id);
                  toast('Cheltuială respinsă', 'info');
                }}
                className="p-1.5 rounded-[4px] hover:bg-bg-secondary transition-colors text-red-600"
              >
                <XCircle className="size-4" />
              </button>
            </div>
          );
        },
      } as ColumnDef<Expense, any>] : []),
    ],
    [isManager, store, user, toast]
  );

  // Vehicle-tab columns include vehicle info
  const vehicleColumns: ColumnDef<Expense, any>[] = useMemo(
    () => [
      {
        accessorKey: 'data',
        header: 'Data',
        size: 100,
        cell: ({ getValue }) => (
          <span className="text-text-secondary text-[12px]">{formatDate(getValue() as string)}</span>
        ),
      },
      {
        accessorKey: 'categorie',
        header: 'Tip',
        size: 140,
        cell: ({ getValue }) => {
          const cat = getValue() as ExpenseCategory;
          const Icon = categoryIcons[cat];
          return (
            <span className="flex items-center gap-1.5">
              <Icon className="size-3.5 text-text-tertiary shrink-0" />
              <Badge variant={categoryBadgeVariant[cat]}>{getExpenseCategoryLabel(cat)}</Badge>
            </span>
          );
        },
      },
      {
        accessorKey: 'descriere',
        header: 'Descriere',
        cell: ({ getValue }) => (
          <span className="text-text-primary text-[13px] truncate max-w-[240px] block">
            {getValue() as string}
          </span>
        ),
      },
      {
        id: 'vehicul',
        header: 'Vehicul',
        size: 170,
        accessorFn: (row) => getVehicleLabel(row.vehiculId),
        cell: ({ getValue }) => (
          <span className="text-text-secondary text-[12px] truncate max-w-[160px] block">{getValue() as string}</span>
        ),
      },
      {
        accessorKey: 'kmOdometru',
        header: 'Km',
        size: 90,
        cell: ({ getValue }) => {
          const v = getValue() as number | undefined;
          return (
            <span className="font-mono text-[12px] text-text-secondary">
              {v ? v.toLocaleString('ro-RO') : '—'}
            </span>
          );
        },
      },
      {
        accessorKey: 'suma',
        header: 'Sumă',
        size: 100,
        cell: ({ row }) => (
          <span className="font-mono font-medium text-text-primary">
            {formatCurrency(row.original.suma, row.original.moneda)}
          </span>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        size: 100,
        cell: ({ getValue }) => {
          const st = getValue() as Expense['status'];
          return <Badge variant={getExpenseStatusVariant(st)}>{getExpenseStatusLabel(st)}</Badge>;
        },
      },
      ...(isManager ? [{
        id: 'actiuni',
        header: '',
        size: 80,
        enableSorting: false,
        cell: ({ row }: any) => {
          const expense = row.original as Expense;
          if (expense.status !== 'in_asteptare') return null;
          return (
            <div className="flex items-center gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  store.updateExpenseStatus(expense.id, 'aprobat', user.id);
                  toast('Cheltuială aprobată', 'success');
                }}
                className="p-1.5 rounded-[4px] hover:bg-bg-secondary transition-colors text-green-600"
              >
                <CheckCircle2 className="size-4" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  store.updateExpenseStatus(expense.id, 'respins', user.id);
                  toast('Cheltuială respinsă', 'info');
                }}
                className="p-1.5 rounded-[4px] hover:bg-bg-secondary transition-colors text-red-600"
              >
                <XCircle className="size-4" />
              </button>
            </div>
          );
        },
      } as ColumnDef<Expense, any>] : []),
    ],
    [isManager, store, user, toast]
  );

  const activeColumns = activeTab === 'combustibil' ? fuelColumns : activeTab === 'vehicule' ? vehicleColumns : baseColumns;

  return (
    <>
      <PageHeader
        title="Cheltuieli"
        subtitle="Gestionează toate cheltuielile operaționale"
        actions={
          <Button icon={<Plus />} size="sm" onClick={() => setAddModalOpen(true)}>
            Adaugă Cheltuială
          </Button>
        }
      />

      {/* ── Tab navigation ──────────────────────────────────── */}
      <div className="flex gap-1 mb-5 border-b border-border -mx-1 px-1 overflow-x-auto">
        {tabs.map((tab) => {
          const active = activeTab === tab.key;
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key); setCategoryFilter('toate'); }}
              className={[
                'flex items-center gap-1.5 px-3 py-2.5 text-[13px] font-medium border-b-2 transition-colors whitespace-nowrap',
                active
                  ? 'border-accent text-accent'
                  : 'border-transparent text-text-secondary hover:text-text-primary hover:border-border',
              ].join(' ')}
            >
              <Icon className="size-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── KPI Cards ───────────────────────────────────────── */}
      {activeTab === 'toate' && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
          {[
            { label: 'Total cheltuieli', value: formatCurrency(totalAll, 'EUR') },
            { label: 'Cheltuieli afișate', value: formatCurrency(totalFiltered, 'EUR') },
            { label: 'În așteptare', value: pendingCount },
            { label: 'Top categorie', value: categoryTotals[0] ? getExpenseCategoryLabel(categoryTotals[0].cat) : '—' },
          ].map((kpi, i) => (
            <div key={kpi.label} className="animate-enter" style={{ '--stagger': i } as React.CSSProperties}>
              <KPICard label={kpi.label} value={kpi.value} />
            </div>
          ))}
        </div>
      )}

      {activeTab === 'combustibil' && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
          {[
            { label: 'Total combustibil', value: formatCurrency(fuelStats.totalFuel, 'EUR') },
            { label: 'Total litri', value: `${fuelStats.totalLitri.toLocaleString('ro-RO')} L` },
            { label: 'Preț mediu/litru', value: `€${fuelStats.avgPretLitru.toFixed(2)}` },
            { label: 'Alimentări', value: fuelStats.count },
          ].map((kpi, i) => (
            <div key={kpi.label} className="animate-enter" style={{ '--stagger': i } as React.CSSProperties}>
              <KPICard label={kpi.label} value={kpi.value} />
            </div>
          ))}
        </div>
      )}

      {activeTab === 'vehicule' && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
          {[
            { label: 'Total întreținere', value: formatCurrency(tabExpenses.reduce((s, e) => s + e.suma, 0), 'EUR') },
            { label: 'Vehicule cu cheltuieli', value: vehicleCosts.length },
            { label: 'Cel mai costisitor', value: vehicleCosts[0]?.label ?? '—' },
            { label: 'Cost maxim vehicul', value: vehicleCosts[0] ? formatCurrency(vehicleCosts[0].total, 'EUR') : '—' },
          ].map((kpi, i) => (
            <div key={kpi.label} className="animate-enter" style={{ '--stagger': i } as React.CSSProperties}>
              <KPICard label={kpi.label} value={kpi.value} />
            </div>
          ))}
        </div>
      )}

      {activeTab === 'operationale' && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
          {[
            { label: 'Total operaționale', value: formatCurrency(tabExpenses.reduce((s, e) => s + e.suma, 0), 'EUR') },
            { label: 'Taxe drum', value: formatCurrency(tabExpenses.filter((e) => e.categorie === 'taxe_drum').reduce((s, e) => s + e.suma, 0), 'EUR') },
            { label: 'Cazare + Diurnă', value: formatCurrency(tabExpenses.filter((e) => ['cazare', 'diurna'].includes(e.categorie)).reduce((s, e) => s + e.suma, 0), 'EUR') },
            { label: 'Amenzi', value: formatCurrency(tabExpenses.filter((e) => e.categorie === 'amenzi').reduce((s, e) => s + e.suma, 0), 'EUR') },
          ].map((kpi, i) => (
            <div key={kpi.label} className="animate-enter" style={{ '--stagger': i } as React.CSSProperties}>
              <KPICard label={kpi.label} value={kpi.value} />
            </div>
          ))}
        </div>
      )}

      {/* ── Category breakdown (toate tab) ──────────────────── */}
      {activeTab === 'toate' && (
        <div className="bg-bg-secondary border border-border rounded-[6px] p-4 mb-5">
          <h3 className="text-[13px] font-medium text-text-primary mb-3 flex items-center gap-1.5">
            <TrendingUp className="size-4 text-accent" />
            Distribuție pe categorii
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
            {categoryTotals.map(({ cat, total }) => {
              const Icon = categoryIcons[cat];
              const pct = totalAll > 0 ? ((total / totalAll) * 100).toFixed(1) : '0';
              return (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(categoryFilter === cat ? 'toate' : cat)}
                  className={[
                    'flex items-center gap-2 p-2.5 rounded-[6px] border transition-all text-left',
                    categoryFilter === cat
                      ? 'border-accent bg-accent/5 ring-1 ring-accent/20'
                      : 'border-border hover:border-accent/30 bg-bg-primary',
                  ].join(' ')}
                >
                  <div className="flex items-center justify-center size-8 rounded-[4px] bg-bg-tertiary shrink-0">
                    <Icon className="size-4 text-text-secondary" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[11px] text-text-tertiary truncate">{getExpenseCategoryLabel(cat)}</div>
                    <div className="text-[13px] font-mono font-medium text-text-primary">{formatCurrency(total, 'EUR')}</div>
                    <div className="text-[10px] text-text-tertiary">{pct}%</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Vehicle cost breakdown (vehicule tab) ───────────── */}
      {activeTab === 'vehicule' && vehicleCosts.length > 0 && (
        <div className="bg-bg-secondary border border-border rounded-[6px] p-4 mb-5">
          <h3 className="text-[13px] font-medium text-text-primary mb-3 flex items-center gap-1.5">
            <Truck className="size-4 text-accent" />
            Cost pe vehicul
          </h3>
          <div className="space-y-2">
            {vehicleCosts.map((vc) => {
              const maxCost = vehicleCosts[0].total;
              const pct = maxCost > 0 ? (vc.total / maxCost) * 100 : 0;
              return (
                <div key={vc.id} className="flex items-center gap-3">
                  <span className="text-[12px] text-text-secondary w-[180px] sm:w-[220px] truncate shrink-0">{vc.label}</span>
                  <div className="flex-1 h-5 bg-bg-tertiary rounded-[3px] overflow-hidden">
                    <div
                      className="h-full bg-accent/20 rounded-[3px] transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="font-mono text-[12px] font-medium text-text-primary w-[80px] text-right shrink-0">
                    {formatCurrency(vc.total, 'EUR')}
                  </span>
                  <span className="text-[11px] text-text-tertiary w-[30px] text-right shrink-0">{vc.count}x</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Subcategory chips (non-toate tabs) ──────────────── */}
      {activeTab !== 'toate' && availableCategories.length > 1 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          <button
            onClick={() => setCategoryFilter('toate')}
            className={[
              'h-7 px-3 rounded-[5px] text-[12px] font-medium transition-colors',
              categoryFilter === 'toate'
                ? 'bg-accent text-white'
                : 'bg-bg-secondary text-text-secondary border border-border hover:bg-bg-tertiary',
            ].join(' ')}
          >
            Toate ({tabExpenses.length})
          </button>
          {availableCategories.map((cat) => {
            const Icon = categoryIcons[cat];
            const count = tabExpenses.filter((e) => e.categorie === cat).length;
            return (
              <button
                key={cat}
                onClick={() => setCategoryFilter(categoryFilter === cat ? 'toate' : cat)}
                className={[
                  'flex items-center gap-1 h-7 px-2.5 rounded-[5px] text-[12px] font-medium transition-colors',
                  categoryFilter === cat
                    ? 'bg-accent text-white'
                    : 'bg-bg-secondary text-text-secondary border border-border hover:bg-bg-tertiary',
                ].join(' ')}
              >
                <Icon className="size-3" />
                {getExpenseCategoryLabel(cat)}
                <span className="opacity-70">({count})</span>
              </button>
            );
          })}
        </div>
      )}

      {/* ── Category chips (toate tab, below breakdown) ─────── */}
      {activeTab === 'toate' && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          <button
            onClick={() => setCategoryFilter('toate')}
            className={[
              'h-7 px-3 rounded-[5px] text-[12px] font-medium transition-colors',
              categoryFilter === 'toate'
                ? 'bg-accent text-white'
                : 'bg-bg-secondary text-text-secondary border border-border hover:bg-bg-tertiary',
            ].join(' ')}
          >
            Toate ({store.state.expenses.length})
          </button>
          {availableCategories.map((cat) => {
            const Icon = categoryIcons[cat];
            const count = tabExpenses.filter((e) => e.categorie === cat).length;
            return (
              <button
                key={cat}
                onClick={() => setCategoryFilter(categoryFilter === cat ? 'toate' : cat)}
                className={[
                  'flex items-center gap-1 h-7 px-2.5 rounded-[5px] text-[12px] font-medium transition-colors',
                  categoryFilter === cat
                    ? 'bg-accent text-white'
                    : 'bg-bg-secondary text-text-secondary border border-border hover:bg-bg-tertiary',
                ].join(' ')}
              >
                <Icon className="size-3" />
                {getExpenseCategoryLabel(cat)}
                <span className="opacity-70">({count})</span>
              </button>
            );
          })}
        </div>
      )}

      {/* ── Data Table ──────────────────────────────────────── */}
      <DataTable
        columns={activeColumns}
        data={filteredExpenses}
        searchable
        searchPlaceholder="Caută după descriere, șofer, vehicul..."
        pageSize={15}
        cardRenderer={(e: Expense) => {
          const Icon = categoryIcons[e.categorie];
          return (
            <div className="p-3 rounded-[6px] border border-border bg-bg-primary hover:border-accent/30 transition-colors">
              {/* Top row: category icon + badge + status */}
              <div className="flex items-center justify-between mb-2">
                <span className="flex items-center gap-1.5">
                  <Icon className="size-3.5 text-text-tertiary shrink-0" />
                  <Badge variant={categoryBadgeVariant[e.categorie]}>
                    {getExpenseCategoryLabel(e.categorie)}
                  </Badge>
                </span>
                <Badge variant={getExpenseStatusVariant(e.status)}>
                  {getExpenseStatusLabel(e.status)}
                </Badge>
              </div>

              {/* Description */}
              <div className="text-text-primary text-[13px] truncate mb-2">
                {e.descriere}
              </div>

              {/* Fuel details */}
              {e.categorie === 'combustibil' && (e.litri || e.pretLitru) && (
                <div className="text-[11px] text-text-tertiary mb-1.5">
                  {e.litri ? `${e.litri} L` : ''}
                  {e.litri && e.pretLitru ? ' · ' : ''}
                  {e.pretLitru ? `${e.pretLitru.toFixed(2)} €/L` : ''}
                </div>
              )}

              {/* Bottom row: amount + driver + date */}
              <div className="flex items-center justify-between">
                <span className="font-mono font-semibold text-text-primary">
                  {formatCurrency(e.suma, e.moneda)}
                </span>
                <span className="flex items-center gap-2 text-[12px] text-text-secondary">
                  <span>{getDriverName(e.soferId)}</span>
                  <span className="text-text-tertiary">{formatDate(e.data)}</span>
                </span>
              </div>

              {/* Approve / Reject buttons (manager only) */}
              {isManager && e.status === 'in_asteptare' && (
                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border">
                  <button
                    onClick={(ev) => {
                      ev.stopPropagation();
                      store.updateExpenseStatus(e.id, 'aprobat', user.id);
                      toast('Cheltuială aprobată', 'success');
                    }}
                    className="flex-1 flex items-center justify-center gap-1.5 h-8 rounded-[6px] bg-green-50 text-green-700 text-[12px] font-medium hover:bg-green-100 transition-colors"
                  >
                    <CheckCircle2 className="size-3.5" />
                    Aprobă
                  </button>
                  <button
                    onClick={(ev) => {
                      ev.stopPropagation();
                      store.updateExpenseStatus(e.id, 'respins', user.id);
                      toast('Cheltuială respinsă', 'info');
                    }}
                    className="flex-1 flex items-center justify-center gap-1.5 h-8 rounded-[6px] bg-red-50 text-red-700 text-[12px] font-medium hover:bg-red-100 transition-colors"
                  >
                    <XCircle className="size-3.5" />
                    Respinge
                  </button>
                </div>
              )}
            </div>
          );
        }}
      />

      {/* ── Add Modal ───────────────────────────────────────── */}
      <AddExpenseModal isOpen={addModalOpen} onClose={() => setAddModalOpen(false)} onSave={(expense) => { store.addExpense(expense); toast('Cheltuială adăugată', 'success'); }} />
    </>
  );
}
