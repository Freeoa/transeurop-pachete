import { useState, useMemo } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import {
  Plus,
  Truck,
  User,
  Pencil,
  Trash2,
} from 'lucide-react';

import type { Vehicle } from '../types';
import { useDataStore } from '../contexts/DataStoreContext';
import { useToast } from '../contexts/ToastContext';
import { formatCurrency } from '../utils';

import PageHeader from '../components/layout/PageHeader';
import { DataTable } from '../components/ui/DataTable';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Drawer } from '../components/ui/Drawer';
import { BottomSheet } from '../components/ui/BottomSheet';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';

// ── Component ────────────────────────────────────────────────────

export default function Fleet() {
  const store = useDataStore();
  const { toast } = useToast();
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);

  // Edit vehicle form state
  const [editMatricula, setEditMatricula] = useState('');
  const [editMarca, setEditMarca] = useState('');
  const [editModel, setEditModel] = useState('');
  const [editTip, setEditTip] = useState('Microbuz');
  const [editCapLocuri, setEditCapLocuri] = useState('');
  const [editCapKg, setEditCapKg] = useState('');
  const [editAreRemorca, setEditAreRemorca] = useState(false);
  const [editArePlatforma, setEditArePlatforma] = useState(false);

  // Add vehicle form state
  const [newMatricula, setNewMatricula] = useState('');
  const [newMarca, setNewMarca] = useState('');
  const [newModel, setNewModel] = useState('');
  const [newTip, setNewTip] = useState('Microbuz');
  const [newCapLocuri, setNewCapLocuri] = useState('');
  const [newCapKg, setNewCapKg] = useState('');
  const [newAreRemorca, setNewAreRemorca] = useState(false);
  const [newArePlatforma, setNewArePlatforma] = useState(false);

  function getAssignedDriver(vehicleId: string) {
    return store.state.drivers.find((d) => d.vehiculId === vehicleId) ?? null;
  }

  function getVehicleOrders(vehicleId: string) {
    const driver = getAssignedDriver(vehicleId);
    if (!driver) return [];
    return store.state.orders.filter((o) => o.soferId === driver.id);
  }

  function getRouteName(routeId: string): string {
    const r = store.state.routes.find((rt) => rt.id === routeId);
    return r ? `${r.origin} \→ ${r.destination}` : '—';
  }

  const driver = selectedVehicle ? getAssignedDriver(selectedVehicle.id) : null;
  const vehicleOrders = selectedVehicle ? getVehicleOrders(selectedVehicle.id) : [];

  const columns: ColumnDef<Vehicle, any>[] = useMemo(
    () => [
      {
        accessorKey: 'matricula',
        header: 'Matriculă',
        size: 130,
        cell: ({ getValue }) => (
          <span className="font-mono font-medium text-text-primary">{getValue()}</span>
        ),
      },
      {
        accessorKey: 'marca',
        header: 'Marca',
        size: 140,
      },
      {
        accessorKey: 'model',
        header: 'Model',
        size: 160,
      },
      {
        accessorKey: 'tip',
        header: 'Tip',
        size: 110,
        cell: ({ getValue }) => <Badge variant="neutral">{getValue()}</Badge>,
      },
      {
        accessorKey: 'capacitateLocuri',
        header: 'Locuri',
        size: 80,
        cell: ({ getValue }) => (
          <span className="font-mono">{getValue()}</span>
        ),
      },
      {
        accessorKey: 'capacitateKg',
        header: 'Capacitate',
        size: 110,
        cell: ({ getValue }) => (
          <span className="font-mono">{Number(getValue()).toLocaleString()} kg</span>
        ),
      },
      {
        id: 'areRemorca',
        accessorKey: 'areRemorca',
        header: 'Remorcă',
        size: 90,
        cell: ({ getValue }) =>
          getValue() ? (
            <Badge variant="success">Da</Badge>
          ) : (
            <span className="text-text-tertiary text-[12px]">Nu</span>
          ),
      },
      {
        id: 'arePlatforma',
        accessorKey: 'arePlatforma',
        header: 'Platformă',
        size: 100,
        cell: ({ getValue }) =>
          getValue() ? (
            <Badge variant="success">Da</Badge>
          ) : (
            <span className="text-text-tertiary text-[12px]">Nu</span>
          ),
      },
      {
        id: 'sofer',
        header: 'Șofer asignat',
        size: 160,
        cell: ({ row }) => {
          const d = getAssignedDriver(row.original.id);
          return d ? (
            <div className="flex items-center gap-1.5">
              <User className="size-3.5 text-text-tertiary" />
              <span className="text-text-primary">{d.name}</span>
            </div>
          ) : (
            <span className="text-text-tertiary italic text-[12px]">Neasignat</span>
          );
        },
      },
      {
        id: 'actiuni',
        header: '',
        size: 80,
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <button
              className="flex items-center justify-center size-7 rounded-[4px] text-text-tertiary hover:text-text-primary hover:bg-bg-tertiary transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                const v = row.original;
                setEditingVehicle(v);
                setEditMatricula(v.matricula);
                setEditMarca(v.marca);
                setEditModel(v.model);
                setEditTip(v.tip);
                setEditCapLocuri(String(v.capacitateLocuri));
                setEditCapKg(String(v.capacitateKg));
                setEditAreRemorca(v.areRemorca);
                setEditArePlatforma(v.arePlatforma);
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
                if (window.confirm('Sigur vrei să ștergi vehiculul ' + row.original.matricula + '?')) {
                  store.deleteVehicle(row.original.id);
                  toast('Vehicul șters', 'success');
                }
              }}
              title="Șterge"
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
        ),
      },
    ],
    [store.state.drivers]
  );

  const handleAddVehicle = () => {
    if (!newMatricula.trim() || !newMarca.trim() || !newModel.trim()) return;
    const vehicle: Vehicle = {
      id: 'veh-' + Date.now(),
      matricula: newMatricula.trim(),
      marca: newMarca.trim(),
      model: newModel.trim(),
      tip: newTip,
      capacitateLocuri: parseInt(newCapLocuri) || 0,
      capacitateKg: parseInt(newCapKg) || 0,
      areRemorca: newAreRemorca,
      arePlatforma: newArePlatforma,
    };
    store.addVehicle(vehicle);
    toast('Vehicul adăugat', 'success');
    setAddOpen(false);
    setNewMatricula('');
    setNewMarca('');
    setNewModel('');
    setNewTip('Microbuz');
    setNewCapLocuri('');
    setNewCapKg('');
    setNewAreRemorca(false);
    setNewArePlatforma(false);
  };

  return (
    <>
      <PageHeader
        title="Flotă"
        subtitle={`${store.state.vehicles.length} vehicule înregistrate`}
        actions={
          <Button size="sm" icon={<Plus />} onClick={() => setAddOpen(true)}>
            Adaugă Vehicul
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={store.state.vehicles}
        onRowClick={(vehicle) => setSelectedVehicle(vehicle)}
        searchable
        searchPlaceholder="Caută după matriculă, marcă, model..."
        pageSize={20}
        cardRenderer={(v: Vehicle) => {
          const d = getAssignedDriver(v.id);
          return (
            <div className="p-3 rounded-[6px] border border-border bg-bg-primary hover:border-accent/30 transition-colors">
              <div className="flex items-center justify-between">
                <span className="font-mono font-medium text-text-primary">{v.matricula}</span>
                <Badge variant="neutral">{v.tip}</Badge>
              </div>
              <div className="text-[13px] text-text-secondary mt-1">
                {v.marca} {v.model}
              </div>
              <div className="text-[12px] text-text-secondary mt-1">
                {v.capacitateLocuri} locuri &bull; {v.capacitateKg.toLocaleString()} kg
              </div>
              <div className="flex items-center justify-between mt-2">
                <div className="text-[12px]">
                  {d ? (
                    <div className="flex items-center gap-1.5">
                      <User className="size-3.5 text-text-tertiary" />
                      <span className="text-text-primary">{d.name}</span>
                    </div>
                  ) : (
                    <span className="text-text-tertiary italic">Neasignat</span>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  {v.areRemorca && <Badge variant="neutral">{`Remorcă`}</Badge>}
                  {v.arePlatforma && <Badge variant="neutral">{`Platformă`}</Badge>}
                </div>
              </div>
            </div>
          );
        }}
      />

      {/* Vehicle detail drawer */}
      <Drawer
        isOpen={!!selectedVehicle}
        onClose={() => setSelectedVehicle(null)}
        title={selectedVehicle ? `${selectedVehicle.marca} ${selectedVehicle.model}` : ''}
      >
        {selectedVehicle && (
          <div className="flex flex-col gap-5">
            {/* Vehicle info */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 mb-1">
                <Truck className="size-5 text-accent" />
                <span className="text-[16px] font-mono font-semibold text-text-primary">
                  {selectedVehicle.matricula}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-[13px]">
                <div>
                  <span className="text-text-tertiary text-[11px] uppercase tracking-wider block mb-0.5">
                    Tip
                  </span>
                  <span className="text-text-primary font-medium">{selectedVehicle.tip}</span>
                </div>
                <div>
                  <span className="text-text-tertiary text-[11px] uppercase tracking-wider block mb-0.5">
                    Marcă / Model
                  </span>
                  <span className="text-text-primary font-medium">
                    {selectedVehicle.marca} {selectedVehicle.model}
                  </span>
                </div>
                <div>
                  <span className="text-text-tertiary text-[11px] uppercase tracking-wider block mb-0.5">
                    Locuri
                  </span>
                  <span className="font-mono text-text-primary">{selectedVehicle.capacitateLocuri}</span>
                </div>
                <div>
                  <span className="text-text-tertiary text-[11px] uppercase tracking-wider block mb-0.5">
                    Capacitate
                  </span>
                  <span className="font-mono text-text-primary">
                    {selectedVehicle.capacitateKg.toLocaleString()} kg
                  </span>
                </div>
                <div>
                  <span className="text-text-tertiary text-[11px] uppercase tracking-wider block mb-0.5">
                    Remorcă
                  </span>
                  {selectedVehicle.areRemorca ? (
                    <Badge variant="success">Da</Badge>
                  ) : (
                    <span className="text-text-secondary">Nu</span>
                  )}
                </div>
                <div>
                  <span className="text-text-tertiary text-[11px] uppercase tracking-wider block mb-0.5">
                    Platformă
                  </span>
                  {selectedVehicle.arePlatforma ? (
                    <Badge variant="success">Da</Badge>
                  ) : (
                    <span className="text-text-secondary">Nu</span>
                  )}
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-border" />

            {/* Assigned driver */}
            <div>
              <h3 className="text-[12px] font-semibold uppercase tracking-wider text-text-secondary mb-2">
                Șofer asignat
              </h3>
              {driver ? (
                <div className="flex items-center gap-3 p-3 bg-bg-secondary rounded-[6px] border border-border">
                  <div className="flex items-center justify-center size-9 rounded-full bg-accent/10">
                    <User className="size-4 text-accent" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[13px] font-medium text-text-primary">{driver.name}</div>
                    <a
                      href={`tel:${driver.telefon.replace(/\s/g, '')}`}
                      className="text-[12px] text-accent hover:underline"
                    >
                      {driver.telefon}
                    </a>
                  </div>
                  <Badge
                    variant={
                      driver.status === 'disponibil'
                        ? 'success'
                        : driver.status === 'pe_ruta'
                          ? 'warning'
                          : 'info'
                    }
                    className="ml-auto"
                  >
                    {driver.status === 'disponibil'
                      ? 'Disponibil'
                      : driver.status === 'pe_ruta'
                        ? 'Pe rută'
                        : 'Liber'}
                  </Badge>
                </div>
              ) : (
                <div className="p-3 bg-bg-secondary rounded-[6px] border border-border text-[13px] text-text-tertiary italic">
                  Niciun șofer asignat acestui vehicul
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="border-t border-border" />

            {/* Orders on this vehicle */}
            <div>
              <h3 className="text-[12px] font-semibold uppercase tracking-wider text-text-secondary mb-2">
                Comenzi curente ({vehicleOrders.length})
              </h3>
              {vehicleOrders.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {vehicleOrders.map((order) => (
                    <div
                      key={order.id}
                      className="flex items-center justify-between gap-2 p-2.5 bg-bg-secondary rounded-[6px] border border-border"
                    >
                      <div className="min-w-0">
                        <span className="text-[12px] font-mono font-medium text-text-primary block">
                          {order.awb}
                        </span>
                        <span className="text-[11px] text-text-secondary block truncate mt-0.5">
                          {getRouteName(order.routeId)}
                        </span>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-[12px] font-mono text-text-primary block">
                          {formatCurrency(order.pret, order.moneda)}
                        </span>
                        <Badge
                          variant={
                            order.status === 'livrat' || order.status === 'finalizat'
                              ? 'success'
                              : order.status === 'problema'
                                ? 'danger'
                                : 'warning'
                          }
                          className="mt-0.5"
                        >
                          {order.status.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3 bg-bg-secondary rounded-[6px] border border-border text-[13px] text-text-tertiary italic">
                  Nicio comandă pe acest vehicul
                </div>
              )}
            </div>
          </div>
        )}
      </Drawer>

      {/* Add vehicle bottom sheet */}
      <BottomSheet
        isOpen={addOpen}
        onClose={() => setAddOpen(false)}
        title="Adaugă vehicul"
      >
        <div className="space-y-4">
          <Input
            label="Matriculă"
            placeholder="Ex: B-123-ABC"
            value={newMatricula}
            onChange={(e) => setNewMatricula(e.target.value)}
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Marcă"
              placeholder="Ex: Mercedes"
              value={newMarca}
              onChange={(e) => setNewMarca(e.target.value)}
              required
            />
            <Input
              label="Model"
              placeholder="Ex: Sprinter"
              value={newModel}
              onChange={(e) => setNewModel(e.target.value)}
              required
            />
          </div>
          <Select
            label="Tip"
            value={newTip}
            onChange={(e) => setNewTip(e.target.value)}
            options={[
              { value: 'Microbuz', label: 'Microbuz' },
              { value: 'Camion', label: 'Camion' },
              { value: 'Autoutilitară', label: 'Autoutilitară' },
            ]}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Capacitate locuri"
              type="number"
              min="0"
              placeholder="0"
              value={newCapLocuri}
              onChange={(e) => setNewCapLocuri(e.target.value)}
            />
            <Input
              label="Capacitate (kg)"
              type="number"
              min="0"
              placeholder="0"
              value={newCapKg}
              onChange={(e) => setNewCapKg(e.target.value)}
            />
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setNewAreRemorca(!newAreRemorca)}
              className={[
                'flex-1 py-2.5 rounded-[6px] border text-[13px] font-medium transition-colors',
                newAreRemorca
                  ? 'border-accent bg-accent/10 text-accent'
                  : 'border-border bg-bg-secondary text-text-secondary hover:border-accent/30',
              ].join(' ')}
            >
              Remorcă {newAreRemorca ? '✓' : ''}
            </button>
            <button
              type="button"
              onClick={() => setNewArePlatforma(!newArePlatforma)}
              className={[
                'flex-1 py-2.5 rounded-[6px] border text-[13px] font-medium transition-colors',
                newArePlatforma
                  ? 'border-accent bg-accent/10 text-accent'
                  : 'border-border bg-bg-secondary text-text-secondary hover:border-accent/30',
              ].join(' ')}
            >
              Platformă {newArePlatforma ? '✓' : ''}
            </button>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button variant="ghost" size="sm" onClick={() => setAddOpen(false)}>
              Anulează
            </Button>
            <Button size="sm" onClick={handleAddVehicle}>
              Adaugă vehicul
            </Button>
          </div>
        </div>
      </BottomSheet>

      {/* Edit vehicle bottom sheet */}
      <BottomSheet
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        title="Editează vehicul"
      >
        <div className="space-y-4">
          <Input
            label="Matriculă"
            placeholder="Ex: B-123-ABC"
            value={editMatricula}
            onChange={(e) => setEditMatricula(e.target.value)}
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Marcă"
              placeholder="Ex: Mercedes"
              value={editMarca}
              onChange={(e) => setEditMarca(e.target.value)}
              required
            />
            <Input
              label="Model"
              placeholder="Ex: Sprinter"
              value={editModel}
              onChange={(e) => setEditModel(e.target.value)}
              required
            />
          </div>
          <Select
            label="Tip"
            value={editTip}
            onChange={(e) => setEditTip(e.target.value)}
            options={[
              { value: 'Microbuz', label: 'Microbuz' },
              { value: 'Camion', label: 'Camion' },
              { value: 'Autoutilitară', label: 'Autoutilitară' },
            ]}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Capacitate locuri"
              type="number"
              min="0"
              placeholder="0"
              value={editCapLocuri}
              onChange={(e) => setEditCapLocuri(e.target.value)}
            />
            <Input
              label="Capacitate (kg)"
              type="number"
              min="0"
              placeholder="0"
              value={editCapKg}
              onChange={(e) => setEditCapKg(e.target.value)}
            />
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setEditAreRemorca(!editAreRemorca)}
              className={[
                'flex-1 py-2.5 rounded-[6px] border text-[13px] font-medium transition-colors',
                editAreRemorca
                  ? 'border-accent bg-accent/10 text-accent'
                  : 'border-border bg-bg-secondary text-text-secondary hover:border-accent/30',
              ].join(' ')}
            >
              Remorcă {editAreRemorca ? '✓' : ''}
            </button>
            <button
              type="button"
              onClick={() => setEditArePlatforma(!editArePlatforma)}
              className={[
                'flex-1 py-2.5 rounded-[6px] border text-[13px] font-medium transition-colors',
                editArePlatforma
                  ? 'border-accent bg-accent/10 text-accent'
                  : 'border-border bg-bg-secondary text-text-secondary hover:border-accent/30',
              ].join(' ')}
            >
              Platformă {editArePlatforma ? '✓' : ''}
            </button>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button variant="ghost" size="sm" onClick={() => setEditOpen(false)}>
              Anulează
            </Button>
            <Button
              size="sm"
              onClick={() => {
                if (!editingVehicle || !editMatricula.trim()) return;
                store.updateVehicle(editingVehicle.id, {
                  matricula: editMatricula.trim(),
                  marca: editMarca.trim(),
                  model: editModel.trim(),
                  tip: editTip,
                  capacitateLocuri: parseInt(editCapLocuri) || 0,
                  capacitateKg: parseInt(editCapKg) || 0,
                  areRemorca: editAreRemorca,
                  arePlatforma: editArePlatforma,
                });
                toast('Vehicul actualizat', 'success');
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
