import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Package,
  User,
  Car,
  ArrowLeft,
  ArrowRight,
  Phone,
  MapPin,
  Calendar,
  Clock,
  CreditCard,
  Banknote,
  Truck,
  UserCheck,
  RefreshCw,
  XCircle,
  CheckCircle,
  MessageSquare,
  Camera,
  AlertTriangle,
  ImageIcon,
} from 'lucide-react';

import type { OrderType, OrderStatus, PaymentStatus, DamageSeverity } from '../types';
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  getStatusLabel,
  getOrderTypeLabel,
  getPaymentStatusLabel,
} from '../utils';
import {
  mockDrivers,
  mockClients,
  mockNotes,
  mockUsers,
} from '../data';
import { useDataStore } from '../contexts/DataStoreContext';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

import { Badge, type BadgeVariant } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { StatusTimeline, type TimelineEntry, type TimelineColor } from '../components/ui/StatusTimeline';
import { AssignDriverSheet } from '../components/manager/AssignDriverSheet';
import { DamageReportSheet } from '../components/orders/DamageReport';
import { AWBLabel } from '../components/orders/AWBLabel';
import { PhotoCapture } from '../components/shared/PhotoCapture';
import { PhotoGallery } from '../components/shared/PhotoGallery';
import PageHeader from '../components/layout/PageHeader';

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

const statusTimelineColor: Record<OrderStatus, TimelineColor> = {
  nou: 'info',
  confirmat: 'accent',
  ridicat: 'warning',
  in_tranzit: 'warning',
  livrat: 'success',
  finalizat: 'success',
  anulat: 'neutral',
  problema: 'danger',
  retur: 'accent',
};

const paymentBadgeVariant: Record<PaymentStatus, BadgeVariant> = {
  neplatit: 'danger',
  platit: 'success',
  partial: 'warning',
};

const paymentMethodLabel: Record<string, string> = {
  numerar_ridicare: 'Numerar la ridicare',
  numerar_livrare: 'Numerar la livrare',
  transfer: 'Transfer bancar',
  card: 'Card',
};

const nextStatusMap: Partial<Record<OrderStatus, OrderStatus>> = {
  nou: 'confirmat',
  confirmat: 'ridicat',
  ridicat: 'in_tranzit',
  in_tranzit: 'livrat',
  livrat: 'finalizat',
};

// ── Section component ────────────────────────────────────────────

function Section({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon?: typeof Package;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-5">
      <div className="flex items-center gap-2 mb-2.5">
        {Icon && <Icon className="size-4 text-text-tertiary" />}
        <h3 className="text-[13px] font-semibold text-text-secondary uppercase tracking-wider">
          {title}
        </h3>
      </div>
      <div className="bg-bg-secondary rounded-[6px] border border-border p-4">
        {children}
      </div>
    </div>
  );
}

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between py-1.5 gap-4">
      <span className="text-xs text-text-tertiary shrink-0">{label}</span>
      <span
        className={[
          'text-[13px] text-text-primary text-right',
          mono && 'font-mono',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {value}
      </span>
    </div>
  );
}

// ── Severity helpers ─────────────────────────────────────────────

const severityLabel: Record<DamageSeverity, string> = {
  minor: 'Minor',
  major: 'Major',
  total: 'Total',
};

const severityBadgeVariant: Record<DamageSeverity, BadgeVariant> = {
  minor: 'warning',
  major: 'danger',
  total: 'danger',
};

// ── OrderDetail ──────────────────────────────────────────────────

interface OrderDetailProps {
  orderId?: string;
  embedded?: boolean;
}

export default function OrderDetail({ orderId: propOrderId, embedded = false }: OrderDetailProps) {
  const params = useParams<{ id: string }>();
  const navigate = useNavigate();
  const store = useDataStore();
  const { isManager } = useAuth();
  const { toast } = useToast();
  const resolvedId = propOrderId || params.id;
  const [assignOpen, setAssignOpen] = useState(false);
  const [damageOpen, setDamageOpen] = useState(false);

  const order = useMemo(
    () => store.state.orders.find((o) => o.id === resolvedId) ?? null,
    [store.state.orders, resolvedId]
  );

  const route = useMemo(
    () => (order ? store.state.routes.find((r) => r.id === order.routeId) ?? null : null),
    [order, store.state.routes]
  );

  const driver = useMemo(
    () => (order?.soferId ? mockDrivers.find((d) => d.id === order.soferId) ?? null : null),
    [order]
  );

  const client = useMemo(
    () => (order?.clientId ? mockClients.find((c) => c.id === order.clientId) ?? null : null),
    [order]
  );

  const statusHistory = useMemo(
    () =>
      order
        ? store.state.statusHistory
            .filter((h) => h.orderId === order.id)
            .sort(
              (a, b) =>
                new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
            )
        : [],
    [store.state.statusHistory, order]
  );

  const notes = useMemo(
    () =>
      order
        ? mockNotes
            .filter((n) => n.orderId === order.id)
            .sort(
              (a, b) =>
                new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
            )
        : [],
    [order]
  );

  const timelineEntries: TimelineEntry[] = useMemo(
    () =>
      statusHistory.map((h) => ({
        status: getStatusLabel(h.status),
        timestamp: formatDateTime(h.timestamp),
        user: h.userName,
        note: h.nota,
        color: statusTimelineColor[h.status],
      })),
    [statusHistory]
  );

  const pickupProof = useMemo(
    () => (order ? store.state.pickupProofs.find((p) => p.orderId === order.id) ?? null : null),
    [store.state.pickupProofs, order]
  );

  const deliveryProof = useMemo(
    () => (order ? store.state.deliveryProofs.find((p) => p.orderId === order.id) ?? null : null),
    [store.state.deliveryProofs, order]
  );

  const damageReport = useMemo(
    () => (order ? store.state.damageReports.find((r) => r.orderId === order.id) ?? null : null),
    [store.state.damageReports, order]
  );

  const nextStatus = order ? nextStatusMap[order.status] : undefined;

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-text-tertiary">
        <Package className="size-10 mb-3 opacity-30" />
        <p className="text-[13px]">Comanda nu a fost găsită</p>
        {!embedded && (
          <Button variant="ghost" className="mt-4" onClick={() => navigate('/comenzi')}>
            Înapoi la comenzi
          </Button>
        )}
      </div>
    );
  }

  const TypeIcon = typeIcons[order.type];

  // ── Sender / Receiver info ─────────────────────────────────────
  const senderBlock = (() => {
    if (order.type === 'colet') {
      return {
        senderLabel: 'Expeditor',
        senderName: order.expeditor ?? '—',
        senderPhone: order.telefonExpeditor ?? '—',
        receiverLabel: 'Destinatar',
        receiverName: order.destinatar ?? '—',
        receiverPhone: order.telefonDestinatar ?? '—',
      };
    }
    if (order.type === 'pasager') {
      return {
        senderLabel: 'Pasager',
        senderName: order.numePasager ?? '—',
        senderPhone: order.telefonPasager ?? '—',
        receiverLabel: null,
        receiverName: null,
        receiverPhone: null,
      };
    }
    // masina
    return {
      senderLabel: 'Proprietar',
      senderName: order.proprietar ?? '—',
      senderPhone: order.telefonProprietar ?? '—',
      receiverLabel: null,
      receiverName: null,
      receiverPhone: null,
    };
  })();

  // ── Render ─────────────────────────────────────────────────────

  const content = (
    <div>
      {/* Header: AWB + badges */}
      <div className="flex items-center gap-3 flex-wrap mb-5">
        <span className="font-mono text-[20px] font-semibold text-text-primary leading-none">
          {order.awb}
        </span>
        <Badge variant={statusBadgeVariant[order.status]}>
          {getStatusLabel(order.status)}
        </Badge>
        <Badge variant={typeBadgeVariant[order.type]}>
          <TypeIcon className="size-3 mr-1" />
          {getOrderTypeLabel(order.type)}
        </Badge>
      </div>

      {/* Route visual block */}
      {route && (
        <div className="bg-bg-secondary rounded-[6px] border border-border p-4 mb-5">
          <div className="flex items-center gap-4">
            {/* Origin */}
            <div className="flex-1 text-center">
              <p className="text-[11px] text-text-tertiary uppercase tracking-wider mb-1">
                Origine
              </p>
              <p className="text-[15px] font-semibold text-text-primary">
                {route.origin}
              </p>
              {order.dataRidicare && (
                <p className="text-xs text-text-secondary mt-1">
                  <Calendar className="size-3 inline mr-1" />
                  {formatDate(order.dataRidicare)}
                </p>
              )}
            </div>
            {/* Arrow + duration */}
            <div className="flex flex-col items-center gap-1 shrink-0 px-2">
              <div className="flex items-center gap-1 text-text-tertiary">
                <div className="w-8 h-px bg-border" />
                <ArrowRight className="size-4" />
              </div>
              <span className="text-[11px] text-text-tertiary flex items-center gap-1">
                <Clock className="size-3" />
                {route.durata}
              </span>
            </div>
            {/* Destination */}
            <div className="flex-1 text-center">
              <p className="text-[11px] text-text-tertiary uppercase tracking-wider mb-1">
                Destinație
              </p>
              <p className="text-[15px] font-semibold text-text-primary">
                {route.destination}
              </p>
              {order.dataEstimata && (
                <p className="text-xs text-text-secondary mt-1">
                  <Calendar className="size-3 inline mr-1" />
                  {formatDate(order.dataEstimata)}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center justify-center gap-4 mt-3 pt-3 border-t border-border">
            <span className="text-xs text-text-tertiary">
              Plecare: {route.zilePlecare}
            </span>
            <span className="text-xs text-text-tertiary">
              Sosire: {route.zileSosire}
            </span>
          </div>
        </div>
      )}

      {/* Sender / Receiver info */}
      <Section title={senderBlock.senderLabel} icon={User}>
        <InfoRow label="Nume" value={senderBlock.senderName} />
        <InfoRow label="Telefon" value={senderBlock.senderPhone} />
        {senderBlock.senderPhone !== '—' && (
          <a
            href={`tel:${senderBlock.senderPhone}`}
            className="inline-flex items-center gap-1.5 text-xs text-accent hover:underline mt-1"
          >
            <Phone className="size-3" />
            Sună
          </a>
        )}
      </Section>

      {senderBlock.receiverLabel && (
        <Section title={senderBlock.receiverLabel} icon={User}>
          <InfoRow label="Nume" value={senderBlock.receiverName ?? '—'} />
          <InfoRow label="Telefon" value={senderBlock.receiverPhone ?? '—'} />
          {senderBlock.receiverPhone && senderBlock.receiverPhone !== '—' && (
            <a
              href={`tel:${senderBlock.receiverPhone}`}
              className="inline-flex items-center gap-1.5 text-xs text-accent hover:underline mt-1"
            >
              <Phone className="size-3" />
              Sună
            </a>
          )}
        </Section>
      )}

      {/* Addresses */}
      <Section title="Adrese" icon={MapPin}>
        <InfoRow label="Ridicare" value={order.adresaRidicare} />
        <InfoRow label="Livrare" value={order.adresaLivrare} />
      </Section>

      {/* Type-specific details */}
      {order.type === 'colet' && (
        <Section title="Detalii colet" icon={Package}>
          <InfoRow label="Greutate" value={order.greutate ? `${order.greutate} kg` : '—'} />
          <InfoRow label="Conținut" value={order.continut ?? '—'} />
        </Section>
      )}

      {order.type === 'pasager' && (
        <Section title="Detalii pasager" icon={User}>
          <InfoRow label="Locuri" value={order.nrLocuri ? `${order.nrLocuri}` : '—'} />
          <InfoRow label="Bagaj" value={order.bagajKg ? `${order.bagajKg} kg` : '—'} />
        </Section>
      )}

      {order.type === 'masina' && (
        <Section title="Detalii mașină" icon={Car}>
          <InfoRow label="Model" value={order.modelAuto ?? '—'} />
          <InfoRow
            label="Nr. înmatriculare"
            value={order.nrInmatriculare ?? '—'}
            mono
          />
        </Section>
      )}

      {/* Financial block */}
      <Section title="Financiar" icon={CreditCard}>
        <InfoRow label="Preț" value={formatCurrency(order.pret, order.moneda)} mono />
        <InfoRow
          label="Metodă plată"
          value={paymentMethodLabel[order.metodaPlata] ?? order.metodaPlata}
        />
        <div className="flex items-start justify-between py-1.5 gap-4">
          <span className="text-xs text-text-tertiary shrink-0">Status plată</span>
          <Badge variant={paymentBadgeVariant[order.statusPlata]}>
            {getPaymentStatusLabel(order.statusPlata)}
          </Badge>
        </div>
      </Section>

      {/* Driver */}
      <Section title="Șofer asignat" icon={Truck}>
        {driver ? (
          <div>
            <InfoRow label="Nume" value={driver.name} />
            <InfoRow label="Telefon" value={driver.telefon} />
            <InfoRow label="Status" value={driver.status === 'pe_ruta' ? 'Pe rută' : driver.status === 'disponibil' ? 'Disponibil' : 'Liber'} />
            <a
              href={`tel:${driver.telefon}`}
              className="inline-flex items-center gap-1.5 text-xs text-accent hover:underline mt-1"
            >
              <Phone className="size-3" />
              Sună șofer
            </a>
          </div>
        ) : (
          <p className="text-[13px] text-text-tertiary">Niciun șofer asignat</p>
        )}
      </Section>

      {/* Client info (if linked) */}
      {client && (
        <Section title="Client" icon={UserCheck}>
          <InfoRow label="Nume" value={client.name} />
          <InfoRow label="Telefon" value={client.telefon} />
          {client.email && <InfoRow label="Email" value={client.email} />}
          <InfoRow label="Tip" value={client.tip === 'fidel' ? 'Fidel' : 'Ocazional'} />
        </Section>
      )}

      {/* Status timeline */}
      {timelineEntries.length > 0 && (
        <Section title="Istoric status" icon={RefreshCw}>
          <StatusTimeline entries={timelineEntries} />
        </Section>
      )}

      {/* Order Photos */}
      {((order.photos && order.photos.length > 0) || isManager) && (
        <Section title="Fotografii comandă" icon={ImageIcon}>
          {order.photos && order.photos.length > 0 ? (
            <PhotoGallery photos={order.photos} size="md" />
          ) : (
            <p className="text-[13px] text-text-tertiary mb-3">Nicio fotografie</p>
          )}
          {isManager && (
            <div className="mt-3">
              <PhotoCapture
                label="Adaugă fotografie"
                onCapture={(base64) => {
                  store.addOrderPhotos(order.id, [base64]);
                  toast('Fotografie adăugată', 'success');
                }}
              />
            </div>
          )}
        </Section>
      )}

      {/* Pickup Proof */}
      {pickupProof && (
        <Section title="Dovadă ridicare" icon={Camera}>
          {pickupProof.photos.length > 0 && (
            <PhotoGallery photos={pickupProof.photos} size="md" />
          )}
          <div className="mt-2 space-y-1">
            <p className="text-xs text-text-tertiary">
              {formatDateTime(pickupProof.timestamp)}
            </p>
            {pickupProof.note && (
              <p className="text-[13px] text-text-secondary">{pickupProof.note}</p>
            )}
          </div>
        </Section>
      )}

      {/* Delivery Proof */}
      {deliveryProof && (
        <Section title="Dovadă livrare" icon={Truck}>
          {deliveryProof.photos.length > 0 && (
            <PhotoGallery photos={deliveryProof.photos} size="md" />
          )}
          {deliveryProof.signature && (
            <div className="mt-3">
              <p className="text-xs text-text-tertiary mb-1">Semnătură</p>
              <img
                src={deliveryProof.signature}
                alt="Semnătură"
                className="h-20 rounded-[6px] border border-border bg-white"
              />
            </div>
          )}
          <div className="mt-2 space-y-1">
            <p className="text-xs text-text-tertiary">
              {formatDateTime(deliveryProof.timestamp)}
            </p>
            {deliveryProof.note && (
              <p className="text-[13px] text-text-secondary">{deliveryProof.note}</p>
            )}
          </div>
        </Section>
      )}

      {/* Damage Report */}
      {damageReport && (
        <Section title="Raport daune" icon={AlertTriangle}>
          {damageReport.photos.length > 0 && (
            <PhotoGallery photos={damageReport.photos} size="md" />
          )}
          <div className="mt-2 space-y-2">
            <p className="text-[13px] text-text-secondary">{damageReport.descriere}</p>
            <div className="flex items-center gap-2">
              <Badge variant={severityBadgeVariant[damageReport.severitate]}>
                {severityLabel[damageReport.severitate]}
              </Badge>
              <span className="text-xs text-text-tertiary">
                {formatDateTime(damageReport.timestamp)}
              </span>
            </div>
          </div>
        </Section>
      )}

      {/* Notes */}
      <Section title="Note / Comentarii" icon={MessageSquare}>
        {notes.length > 0 ? (
          <div className="space-y-3">
            {notes.map((note) => {
              const noteUser = mockUsers.find((u) => u.id === note.userId);
              return (
                <div key={note.id} className="pb-3 border-b border-border last:border-b-0 last:pb-0">
                  <div className="flex items-baseline justify-between gap-2 mb-1">
                    <span className="text-[13px] font-medium text-text-primary">
                      {noteUser?.name ?? note.userName}
                    </span>
                    <span className="text-xs text-text-tertiary shrink-0">
                      {formatDateTime(note.timestamp)}
                    </span>
                  </div>
                  <p className="text-[13px] text-text-secondary leading-relaxed">
                    {note.text}
                  </p>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-[13px] text-text-tertiary">Nicio notă</p>
        )}
      </Section>

      {/* Dates summary */}
      <Section title="Date" icon={Calendar}>
        <InfoRow label="Creat" value={formatDateTime(order.dataCreare)} />
        {order.dataRidicare && (
          <InfoRow label="Ridicat" value={formatDateTime(order.dataRidicare)} />
        )}
        {order.dataLivrare && (
          <InfoRow label="Livrat" value={formatDateTime(order.dataLivrare)} />
        )}
        {order.dataEstimata && (
          <InfoRow label="Estimat" value={formatDate(order.dataEstimata)} />
        )}
      </Section>

      {order.observatii && (
        <Section title="Observații" icon={MessageSquare}>
          <p className="text-[13px] text-text-secondary leading-relaxed">
            {order.observatii}
          </p>
        </Section>
      )}

      {/* Action buttons */}
      <div className="flex flex-wrap items-center gap-2 mt-6 pt-4 border-t border-border">
        {nextStatus && (
          <Button
            icon={<CheckCircle />}
            onClick={() => {
              store.updateOrderStatus(order.id, nextStatus!);
              toast('Status actualizat: ' + getStatusLabel(nextStatus!), 'success');
            }}
          >
            {getStatusLabel(nextStatus)}
          </Button>
        )}
        <Button
          variant="secondary"
          icon={<UserCheck />}
          onClick={() => setAssignOpen(true)}
        >
          Reasignează șofer
        </Button>
        {order.statusPlata !== 'platit' && (
          <Button
            variant="secondary"
            icon={<Banknote />}
            onClick={() => {
              store.updatePaymentStatus(order.id, 'platit');
              toast('Plata a fost marcată', 'success');
            }}
          >
            Marchează plătit
          </Button>
        )}
        {isManager && order.status !== 'anulat' && order.status !== 'finalizat' && (
          <Button
            variant="danger"
            size="sm"
            icon={<AlertTriangle />}
            onClick={() => setDamageOpen(true)}
          >
            Raportează daune
          </Button>
        )}
        {order.status !== 'anulat' && order.status !== 'finalizat' && (
          <Button
            variant="danger"
            icon={<XCircle />}
            onClick={() => {
              if (window.confirm('Sigur vrei să anulezi?')) {
                store.updateOrderStatus(order.id, 'anulat');
                toast('Comanda anulată', 'success');
              }
            }}
          >
            Anulează
          </Button>
        )}
        <AWBLabel order={order} />
      </div>

      {/* Assign driver sheet */}
      <AssignDriverSheet
        isOpen={assignOpen}
        onClose={() => setAssignOpen(false)}
        orderId={order.id}
        onAssign={(driverId) => {
          store.assignDriver(order.id, driverId);
          setAssignOpen(false);
        }}
      />

      {/* Damage report sheet */}
      <DamageReportSheet
        isOpen={damageOpen}
        onClose={() => setDamageOpen(false)}
        onConfirm={(data) => {
          store.addDamageReport({
            id: `dmg-${Date.now()}`,
            orderId: order.id,
            photos: data.photos,
            descriere: data.descriere,
            severitate: data.severitate,
            timestamp: new Date().toISOString(),
            raportatDe: 'usr-1',
          });
          setDamageOpen(false);
          toast('Raport daune adăugat', 'success');
        }}
      />
    </div>
  );

  // When used as standalone page (route /comenzi/:id)
  if (!embedded) {
    return (
      <div>
        <PageHeader
          title={order.awb}
          subtitle={`${getOrderTypeLabel(order.type)} - ${route ? `${route.origin} → ${route.destination}` : ''}`}
          actions={
            <Button
              variant="secondary"
              icon={<ArrowLeft />}
              onClick={() => navigate('/comenzi')}
            >
              Înapoi
            </Button>
          }
        />
        {content}
      </div>
    );
  }

  return content;
}
