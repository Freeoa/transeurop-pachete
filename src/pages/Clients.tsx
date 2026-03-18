import { useState, useMemo } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import {
  Plus,
  Phone,
  Mail,
  MapPin,
  Package,
  User,
  Car,
  Calendar,
  Pencil,
  Trash2,
} from 'lucide-react';

import type { Client, ClientType, Order, OrderType } from '../types';
import {
  formatCurrency,
  formatDate,
  getStatusLabel,
  getOrderTypeLabel,
} from '../utils';
import { useDataStore } from '../contexts/DataStoreContext';
import { useToast } from '../contexts/ToastContext';

import PageHeader from '../components/layout/PageHeader';
import { DataTable } from '../components/ui/DataTable';
import { Badge, type BadgeVariant } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Drawer } from '../components/ui/Drawer';
import { BottomSheet } from '../components/ui/BottomSheet';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';

// ── Helpers ──────────────────────────────────────────────────────

const clientTypeBadge: Record<ClientType, { label: string; variant: BadgeVariant }> = {
  fidel: { label: 'Fidel', variant: 'success' },
  ocazional: { label: 'Ocazional', variant: 'info' },
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

export default function Clients() {
  const store = useDataStore();
  const { toast } = useToast();
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [addClientOpen, setAddClientOpen] = useState(false);
  const [editClientOpen, setEditClientOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  // Edit client form state
  const [editName, setEditName] = useState('');
  const [editTelefon, setEditTelefon] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editTip, setEditTip] = useState<ClientType>('ocazional');
  const [editNote, setEditNote] = useState('');

  // Add client form state
  const [newName, setNewName] = useState('');
  const [newTelefon, setNewTelefon] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newTip, setNewTip] = useState<ClientType>('ocazional');

  function getClientOrders(clientId: string): Order[] {
    return store.state.orders.filter((o) => o.clientId === clientId);
  }

  function getLastOrderDate(clientId: string): string | null {
    const orders = getClientOrders(clientId);
    if (orders.length === 0) return null;
    const sorted = [...orders].sort(
      (a, b) => new Date(b.dataCreare).getTime() - new Date(a.dataCreare).getTime()
    );
    return sorted[0].dataCreare;
  }

  const clientOrders = useMemo(() => {
    if (!selectedClient) return [];
    return getClientOrders(selectedClient.id).sort(
      (a, b) => new Date(b.dataCreare).getTime() - new Date(a.dataCreare).getTime()
    );
  }, [selectedClient, store.state.orders]);

  const columns: ColumnDef<Client, any>[] = useMemo(
    () => [
      {
        accessorKey: 'name',
        header: 'Nume',
        size: 200,
        cell: ({ getValue }) => (
          <span className="font-medium text-text-primary">{getValue()}</span>
        ),
      },
      {
        accessorKey: 'telefon',
        header: 'Telefon',
        size: 160,
        cell: ({ getValue }) => (
          <a
            href={`tel:${String(getValue()).replace(/\s/g, '')}`}
            className="font-mono text-[12px] text-accent hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            {getValue()}
          </a>
        ),
      },
      {
        accessorKey: 'tip',
        header: 'Tip',
        size: 100,
        cell: ({ getValue }) => {
          const tip = getValue() as ClientType;
          const cfg = clientTypeBadge[tip];
          return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
        },
      },
      {
        id: 'nrComenzi',
        header: 'Nr. Comenzi',
        size: 100,
        cell: ({ row }) => (
          <span className="font-mono">{getClientOrders(row.original.id).length}</span>
        ),
        sortingFn: (rowA, rowB) =>
          getClientOrders(rowA.original.id).length - getClientOrders(rowB.original.id).length,
      },
      {
        id: 'ultimaComanda',
        header: 'Ultima Comandă',
        size: 130,
        cell: ({ row }) => {
          const date = getLastOrderDate(row.original.id);
          return date ? (
            <span className="text-[12px] text-text-secondary">{formatDate(date)}</span>
          ) : (
            <span className="text-[12px] text-text-tertiary">—</span>
          );
        },
        sortingFn: (rowA, rowB) => {
          const a = getLastOrderDate(rowA.original.id);
          const b = getLastOrderDate(rowB.original.id);
          if (!a && !b) return 0;
          if (!a) return -1;
          if (!b) return 1;
          return new Date(a).getTime() - new Date(b).getTime();
        },
      },
      {
        id: 'adrese',
        header: 'Adrese',
        size: 120,
        cell: ({ row }) => (
          <span className="text-[12px] text-text-secondary">
            {row.original.adrese.length} {row.original.adrese.length === 1 ? 'adresă' : 'adrese'}
          </span>
        ),
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
                const c = row.original;
                setEditingClient(c);
                setEditName(c.name);
                setEditTelefon(c.telefon);
                setEditEmail(c.email ?? '');
                setEditTip(c.tip);
                setEditNote(c.note ?? '');
                setEditClientOpen(true);
              }}
              title="Editează"
            >
              <Pencil className="size-3.5" />
            </button>
            <button
              className="flex items-center justify-center size-7 rounded-[4px] text-text-tertiary hover:text-danger hover:bg-danger-bg transition-colors"
              onClick={(e) => { e.stopPropagation(); if (window.confirm('Sigur vrei să ștergi clientul ' + row.original.name + '?')) { store.deleteClient(row.original.id); toast('Client șters', 'success'); } }}
              title="Șterge"
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
        ),
      },
    ],
    [store.state.orders, store.state.clients]
  );

  const handleAddClient = () => {
    if (!newName.trim() || !newTelefon.trim()) return;
    const newClient: Client = {
      id: 'cl-' + Date.now(),
      name: newName.trim(),
      telefon: newTelefon.trim(),
      email: newEmail.trim() || undefined,
      adrese: [],
      tip: newTip,
      dataInregistrare: new Date().toISOString(),
    };
    store.addClient(newClient);
    toast('Client adăugat', 'success');
    setAddClientOpen(false);
    setNewName('');
    setNewTelefon('');
    setNewEmail('');
    setNewTip('ocazional');
  };

  return (
    <>
      <PageHeader
        title="Clienți"
        subtitle={`${store.state.clients.length} clienți înregistrați`}
        actions={
          <Button size="sm" icon={<Plus />} onClick={() => setAddClientOpen(true)}>
            Client Nou
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={store.state.clients}
        onRowClick={(client) => setSelectedClient(client)}
        searchable
        searchPlaceholder="Caută după nume, telefon..."
        pageSize={20}
        cardRenderer={(c: Client) => {
          const badge = clientTypeBadge[c.tip];
          const orderCount = getClientOrders(c.id).length;
          const lastDate = getLastOrderDate(c.id);
          return (
            <div className="p-3 rounded-[6px] border border-border bg-bg-primary hover:border-accent/30 transition-colors">
              <div className="flex items-center justify-between">
                <span className="font-medium text-text-primary">{c.name}</span>
                <Badge variant={badge.variant}>{badge.label}</Badge>
              </div>
              <div className="flex items-center gap-1.5 mt-1.5">
                <Phone className="size-3.5 text-text-tertiary shrink-0" />
                <a
                  href={`tel:${c.telefon.replace(/\s/g, '')}`}
                  className="text-[13px] text-accent hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  {c.telefon}
                </a>
              </div>
              <div className="flex items-center justify-between mt-2 text-[12px] text-text-secondary">
                <span>
                  <span className="font-mono">{orderCount}</span> comenzi
                </span>
                {lastDate ? (
                  <span>{formatDate(lastDate)}</span>
                ) : (
                  <span className="text-text-tertiary">{'—'}</span>
                )}
              </div>
            </div>
          );
        }}
      />

      {/* Client detail drawer */}
      <Drawer
        isOpen={!!selectedClient}
        onClose={() => setSelectedClient(null)}
        title={selectedClient?.name ?? ''}
      >
        {selectedClient && (
          <div className="flex flex-col gap-5">
            {/* Client info */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h3 className="text-[16px] font-semibold text-text-primary">
                  {selectedClient.name}
                </h3>
                <Badge variant={clientTypeBadge[selectedClient.tip].variant}>
                  {clientTypeBadge[selectedClient.tip].label}
                </Badge>
              </div>

              <div className="flex flex-col gap-2 text-[13px]">
                {/* Phone */}
                <div className="flex items-center gap-2">
                  <Phone className="size-3.5 text-text-tertiary shrink-0" />
                  <a
                    href={`tel:${selectedClient.telefon.replace(/\s/g, '')}`}
                    className="text-accent hover:underline"
                  >
                    {selectedClient.telefon}
                  </a>
                  {selectedClient.telefon2 && (
                    <>
                      <span className="text-text-tertiary">/</span>
                      <a
                        href={`tel:${selectedClient.telefon2.replace(/\s/g, '')}`}
                        className="text-accent hover:underline"
                      >
                        {selectedClient.telefon2}
                      </a>
                    </>
                  )}
                </div>
                {/* Email */}
                {selectedClient.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="size-3.5 text-text-tertiary shrink-0" />
                    <a
                      href={`mailto:${selectedClient.email}`}
                      className="text-accent hover:underline"
                    >
                      {selectedClient.email}
                    </a>
                  </div>
                )}
                {/* Registration date */}
                <div className="flex items-center gap-2">
                  <Calendar className="size-3.5 text-text-tertiary shrink-0" />
                  <span className="text-text-secondary">
                    Înregistrat: {formatDate(selectedClient.dataInregistrare)}
                  </span>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-border" />

            {/* Addresses */}
            <div>
              <h3 className="text-[12px] font-semibold uppercase tracking-wider text-text-secondary mb-2">
                Adrese ({selectedClient.adrese.length})
              </h3>
              <div className="flex flex-col gap-1.5">
                {selectedClient.adrese.map((addr, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2 p-2.5 bg-bg-secondary rounded-[6px] border border-border text-[13px] text-text-primary"
                  >
                    <MapPin className="size-3.5 text-text-tertiary shrink-0 mt-0.5" />
                    {addr}
                  </div>
                ))}
              </div>
            </div>

            {/* Notes */}
            {selectedClient.note && (
              <>
                <div className="border-t border-border" />
                <div>
                  <h3 className="text-[12px] font-semibold uppercase tracking-wider text-text-secondary mb-2">
                    Note
                  </h3>
                  <p className="text-[13px] text-text-secondary bg-bg-secondary rounded-[6px] border border-border p-3">
                    {selectedClient.note}
                  </p>
                </div>
              </>
            )}

            {/* Divider */}
            <div className="border-t border-border" />

            {/* Order history */}
            <div>
              <h3 className="text-[12px] font-semibold uppercase tracking-wider text-text-secondary mb-2">
                Istoric comenzi ({clientOrders.length})
              </h3>
              {clientOrders.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {clientOrders.map((order) => {
                    const TypeIcon = typeIcons[order.type];
                    return (
                      <div
                        key={order.id}
                        className="flex items-center gap-3 p-2.5 bg-bg-secondary rounded-[6px] border border-border"
                      >
                        <div className="flex items-center justify-center size-8 rounded-[4px] bg-bg-tertiary shrink-0">
                          <TypeIcon className="size-4 text-text-secondary" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[12px] font-mono font-medium text-text-primary">
                              {order.awb}
                            </span>
                            <Badge variant="neutral">{getOrderTypeLabel(order.type)}</Badge>
                          </div>
                          <div className="text-[11px] text-text-secondary mt-0.5 truncate">
                            {getRouteName(order.routeId, store.state.routes)} \• {formatDate(order.dataCreare)}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-[12px] font-mono font-medium text-text-primary">
                            {formatCurrency(order.pret, order.moneda)}
                          </div>
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
                            className="mt-0.5"
                          >
                            {getStatusLabel(order.status)}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-3 bg-bg-secondary rounded-[6px] border border-border text-[13px] text-text-tertiary italic">
                  Clientul nu are comenzi înregistrate.
                </div>
              )}
            </div>
          </div>
        )}
      </Drawer>

      {/* Add client bottom sheet */}
      <BottomSheet
        isOpen={addClientOpen}
        onClose={() => setAddClientOpen(false)}
        title="Client nou"
      >
        <div className="space-y-4">
          <Input
            label="Nume"
            placeholder="Numele clientului"
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
          <Input
            label="Email"
            placeholder="email@exemplu.com"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
          />
          <Select
            label="Tip client"
            value={newTip}
            onChange={(e) => setNewTip(e.target.value as ClientType)}
            options={[
              { value: 'ocazional', label: 'Ocazional' },
              { value: 'fidel', label: 'Fidel' },
            ]}
          />
          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button variant="ghost" size="sm" onClick={() => setAddClientOpen(false)}>
              Anulează
            </Button>
            <Button size="sm" onClick={handleAddClient}>
              Adaugă client
            </Button>
          </div>
        </div>
      </BottomSheet>

      {/* Edit client bottom sheet */}
      <BottomSheet
        isOpen={editClientOpen}
        onClose={() => setEditClientOpen(false)}
        title="Editează client"
      >
        <div className="space-y-4">
          <Input
            label="Nume"
            placeholder="Numele clientului"
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
          <Input
            label="Email"
            placeholder="email@exemplu.com"
            value={editEmail}
            onChange={(e) => setEditEmail(e.target.value)}
          />
          <Select
            label="Tip client"
            value={editTip}
            onChange={(e) => setEditTip(e.target.value as ClientType)}
            options={[
              { value: 'ocazional', label: 'Ocazional' },
              { value: 'fidel', label: 'Fidel' },
            ]}
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-medium text-text-primary leading-none">Note</label>
            <textarea
              value={editNote}
              onChange={(e) => setEditNote(e.target.value)}
              placeholder="Note despre client..."
              rows={3}
              className="w-full rounded-[6px] border border-border bg-bg-primary text-text-primary text-[13px] px-3 py-2 placeholder:text-text-tertiary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 resize-none"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button variant="ghost" size="sm" onClick={() => setEditClientOpen(false)}>
              Anulează
            </Button>
            <Button
              size="sm"
              onClick={() => {
                if (!editingClient || !editName.trim()) return;
                store.updateClient(editingClient.id, {
                  name: editName.trim(),
                  telefon: editTelefon.trim(),
                  email: editEmail.trim() || undefined,
                  tip: editTip,
                  note: editNote.trim() || undefined,
                });
                toast('Client actualizat', 'success');
                setEditClientOpen(false);
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
