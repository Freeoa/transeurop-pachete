import React, { useState, useMemo } from 'react';
import {
  Plus,
  Phone,
  Truck,
  Route,
  ChevronRight,
  Package,
  User,
  Car,
  Pencil,
  Trash2,
} from 'lucide-react';

import type { DriverStatus, Order, OrderType } from '../types';
import { formatCurrency, formatDate, getStatusLabel, getOrderTypeLabel } from '../utils';
import { useDataStore } from '../contexts/DataStoreContext';
import { useToast } from '../contexts/ToastContext';

import PageHeader from '../components/layout/PageHeader';
import { Badge, type BadgeVariant } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { KPICard } from '../components/ui/KPICard';
import { BottomSheet } from '../components/ui/BottomSheet';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';

// ── Helpers ──────────────────────────────────────────────────────

const driverStatusConfig: Record<DriverStatus, { label: string; variant: BadgeVariant }> = {
  disponibil: { label: 'Disponibil', variant: 'success' },
  pe_ruta: { label: 'Pe rută', variant: 'warning' },
  liber: { label: 'Liber', variant: 'info' },
};

function getRouteName(routeId: string, routes: import('../types').Route[]): string {
  const r = routes.find((rt) => rt.id === routeId);
  return r ? `${r.origin} \→ ${r.destination}` : '—';
}

const typeIcons: Record<OrderType, typeof Package> = {
  colet: Package,
  pasager: User,
  masina: Car,
};

// ── Component ────────────────────────────────────────────────────

export default function Drivers() {
  const store = useDataStore();
  const { toast } = useToast();
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<import('../types').Driver | null>(null);

  // Edit driver form state
  const [editName, setEditName] = useState('');
  const [editTelefon, setEditTelefon] = useState('');
  const [editVehiculId, setEditVehiculId] = useState('');
  const [editStatus, setEditStatus] = useState<DriverStatus>('disponibil');

  // Add driver form state
  const [newName, setNewName] = useState('');
  const [newTelefon, setNewTelefon] = useState('');
  const [newVehiculId, setNewVehiculId] = useState('');
  const [newStatus, setNewStatus] = useState<DriverStatus>('disponibil');

  function getVehicleLabel(vehiculId?: string): string | null {
    if (!vehiculId) return null;
    const v = store.state.vehicles.find((veh) => veh.id === vehiculId);
    return v ? `${v.marca} ${v.model} (${v.matricula})` : null;
  }

  function getDriverOrders(driverId: string): Order[] {
    return store.state.orders.filter((o) => o.soferId === driverId);
  }

  const stats = useMemo(() => {
    const total = store.state.drivers.length;
    const peRuta = store.state.drivers.filter((d) => d.status === 'pe_ruta').length;
    const disponibil = store.state.drivers.filter((d) => d.status === 'disponibil').length;
    return { total, peRuta, disponibil };
  }, [store.state.drivers]);

  const selectedOrders = useMemo(() => {
    if (!selectedDriverId) return [];
    return getDriverOrders(selectedDriverId);
  }, [selectedDriverId, store.state.orders]);

  const selectedDriver = selectedDriverId
    ? store.state.drivers.find((d) => d.id === selectedDriverId) ?? null
    : null;

  const vehicleOptions = useMemo(
    () =>
      store.state.vehicles.map((v) => ({
        value: v.id,
        label: `${v.marca} ${v.model} (${v.matricula})`,
      })),
    [store.state.vehicles]
  );

  const handleAddDriver = () => {
    if (!newName.trim() || !newTelefon.trim()) return;
    store.addDriver({
      id: 'drv-' + Date.now(),
      name: newName.trim(),
      telefon: newTelefon.trim(),
      vehiculId: newVehiculId || undefined,
      status: newStatus as DriverStatus,
    });
    toast('Șofer adăugat', 'success');
    setAddOpen(false);
    setNewName('');
    setNewTelefon('');
    setNewVehiculId('');
    setNewStatus('disponibil');
  };

  return (
    <>
      <PageHeader
        title="Șoferi"
        actions={
          <Button size="sm" icon={<Plus />} onClick={() => setAddOpen(true)}>
            Adaugă Șofer
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <KPICard label="Total șoferi" value={stats.total} />
        <KPICard label="Pe rută" value={stats.peRuta} />
        <KPICard label="Disponibili" value={stats.disponibil} />
      </div>

      {/* Driver grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
        {store.state.drivers.map((driver, index) => {
          const vehicleLabel = getVehicleLabel(driver.vehiculId);
          const cfg = driverStatusConfig[driver.status];
          const isSelected = selectedDriverId === driver.id;

          return (
            <button
              key={driver.id}
              type="button"
              onClick={() =>
                setSelectedDriverId(isSelected ? null : driver.id)
              }
              className={[
                'flex flex-col gap-2.5 p-4 rounded-[6px] border text-left transition-all duration-200 animate-enter',
                'hover:border-accent/40 hover:shadow-lg hover:-translate-y-0.5',
                isSelected
                  ? 'border-accent bg-accent/[0.03] ring-1 ring-accent/20'
                  : 'border-border bg-bg-primary',
              ].join(' ')}
              style={{ '--stagger': index } as React.CSSProperties}
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-[14px] font-semibold text-text-primary truncate">
                    {driver.name}
                  </div>
                  <a
                    href={`tel:${driver.telefon.replace(/\s/g, '')}`}
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1 text-[12px] text-accent hover:underline mt-0.5"
                  >
                    <Phone className="size-3" />
                    {driver.telefon}
                  </a>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Badge variant={cfg.variant}>{cfg.label}</Badge>
                  <button
                    className="flex items-center justify-center size-7 rounded-[4px] text-text-tertiary hover:text-text-primary hover:bg-bg-tertiary transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingDriver(driver);
                      setEditName(driver.name);
                      setEditTelefon(driver.telefon);
                      setEditVehiculId(driver.vehiculId ?? '');
                      setEditStatus(driver.status);
                      setEditOpen(true);
                    }}
                    title="Editează"
                  >
                    <Pencil className="size-3.5" />
                  </button>
                  <button
                    className="flex items-center justify-center size-7 rounded-[4px] text-text-tertiary hover:text-danger hover:bg-danger-bg transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm('Sigur vrei să ștergi acest șofer?')) {
                        store.deleteDriver(driver.id);
                        toast('Șofer șters', 'success');
                      }
                    }}
                    title="Șterge"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>

              {/* Vehicle */}
              {vehicleLabel ? (
                <div className="flex items-center gap-1.5 text-[12px] text-text-secondary">
                  <Truck className="size-3.5 shrink-0 text-text-tertiary" />
                  <span className="truncate">{vehicleLabel}</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-[12px] text-text-tertiary italic">
                  <Truck className="size-3.5 shrink-0" />
                  Fără vehicul asignat
                </div>
              )}

              {/* Order count */}
              <div className="flex items-center gap-1.5 text-[12px] text-text-secondary">
                <Route className="size-3.5 shrink-0 text-text-tertiary" />
                {getDriverOrders(driver.id).length} comenzi asignate
              </div>

              {isSelected && (
                <div className="flex items-center gap-1 text-[11px] text-accent font-medium mt-0.5">
                  <ChevronRight className="size-3" />
                  Vezi comenzile mai jos
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected driver's orders */}
      {selectedDriver && (
        <div className="border border-border rounded-[6px] bg-bg-primary overflow-hidden">
          <div className="px-4 py-3 bg-bg-secondary border-b border-border">
            <h2 className="text-[14px] font-semibold text-text-primary">
              Comenzile lui {selectedDriver.name}
            </h2>
            <p className="text-[12px] text-text-secondary mt-0.5">
              {selectedOrders.length === 0
                ? 'Nicio comandă asignată'
                : `${selectedOrders.length} ${selectedOrders.length === 1 ? 'comandă' : 'comenzi'}`}
            </p>
          </div>

          {selectedOrders.length > 0 ? (
            <div className="divide-y divide-border">
              {selectedOrders.map((order) => {
                const TypeIcon = typeIcons[order.type as OrderType];
                return (
                  <div
                    key={order.id}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-bg-tertiary transition-colors"
                  >
                    <div className="flex items-center justify-center size-8 rounded-[4px] bg-bg-tertiary shrink-0">
                      <TypeIcon className="size-4 text-text-secondary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-mono font-medium text-text-primary">
                          {order.awb}
                        </span>
                        <Badge variant="neutral">{getOrderTypeLabel(order.type)}</Badge>
                        <Badge
                          variant={
                            order.status === 'livrat' || order.status === 'finalizat'
                              ? 'success'
                              : order.status === 'problema'
                                ? 'danger'
                                : order.status === 'anulat'
                                  ? 'neutral'
                                  : 'warning'
                          }
                        >
                          {getStatusLabel(order.status)}
                        </Badge>
                      </div>
                      <div className="text-[12px] text-text-secondary mt-0.5 truncate">
                        {getRouteName(order.routeId, store.state.routes)}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-[13px] font-mono font-medium text-text-primary">
                        {formatCurrency(order.pret, order.moneda)}
                      </div>
                      <div className="text-[11px] text-text-tertiary mt-0.5">
                        {formatDate(order.dataCreare)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="px-4 py-8 text-center text-[13px] text-text-tertiary">
              Șoferul nu are comenzi asignate în acest moment.
            </div>
          )}
        </div>
      )}

      {/* Add driver bottom sheet */}
      <BottomSheet
        isOpen={addOpen}
        onClose={() => setAddOpen(false)}
        title="Adaugă șofer"
      >
        <div className="space-y-4">
          <Input
            label="Nume"
            placeholder="Numele șoferului"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            required
          />
          <Input
            label="Telefon"
            placeholder="+40 7xx xxx xxx"
            value={newTelefon}
            onChange={(e) => setNewTelefon(e.target.value)}
            required
          />
          <Select
            label="Vehicul"
            value={newVehiculId}
            onChange={(e) => setNewVehiculId(e.target.value)}
            placeholder="Selectează vehicul..."
            options={vehicleOptions}
          />
          <Select
            label="Status"
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value as DriverStatus)}
            options={[
              { value: 'disponibil', label: 'Disponibil' },
              { value: 'pe_ruta', label: 'Pe rută' },
              { value: 'liber', label: 'Liber' },
            ]}
          />
          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button variant="ghost" size="sm" onClick={() => setAddOpen(false)}>
              Anulează
            </Button>
            <Button size="sm" onClick={handleAddDriver}>
              Adaugă șofer
            </Button>
          </div>
        </div>
      </BottomSheet>

      {/* Edit driver bottom sheet */}
      <BottomSheet
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        title="Editează șofer"
      >
        <div className="space-y-4">
          <Input
            label="Nume"
            placeholder="Numele șoferului"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            required
          />
          <Input
            label="Telefon"
            placeholder="+40 7xx xxx xxx"
            value={editTelefon}
            onChange={(e) => setEditTelefon(e.target.value)}
            required
          />
          <Select
            label="Vehicul"
            value={editVehiculId}
            onChange={(e) => setEditVehiculId(e.target.value)}
            placeholder="Selectează vehicul..."
            options={vehicleOptions}
          />
          <Select
            label="Status"
            value={editStatus}
            onChange={(e) => setEditStatus(e.target.value as DriverStatus)}
            options={[
              { value: 'disponibil', label: 'Disponibil' },
              { value: 'pe_ruta', label: 'Pe rută' },
              { value: 'liber', label: 'Liber' },
            ]}
          />
          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button variant="ghost" size="sm" onClick={() => setEditOpen(false)}>
              Anulează
            </Button>
            <Button
              size="sm"
              onClick={() => {
                if (!editingDriver || !editName.trim()) return;
                store.updateDriver(editingDriver.id, {
                  name: editName.trim(),
                  telefon: editTelefon.trim(),
                  vehiculId: editVehiculId || undefined,
                  status: editStatus,
                });
                toast('Șofer actualizat', 'success');
                setEditOpen(false);
              }}
            >
              Salvează
            </Button>
          </div>
        </div>
      </BottomSheet>
    </>
  );
}
