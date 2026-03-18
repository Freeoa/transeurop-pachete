// ============================================================
// TransEurop - Public Tracking Page (No auth, no sidebar)
// ============================================================

import { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Search, Phone, MessageCircle, Package, MapPin, Truck, CheckCircle2, AlertCircle, Camera, Pen } from 'lucide-react';
import { StatusTimeline } from '../components/ui';
import type { TimelineColor } from '../components/ui/StatusTimeline';
import { formatDate, formatDateTime, getStatusLabel, getStatusBgColor } from '../utils';
import { mockOrders, mockDrivers, mockStatusHistory } from '../data';
import { useDataStore } from '../contexts/DataStoreContext';
import { PhotoGallery } from '../components/shared/PhotoGallery';
import type { OrderStatus } from '../types';

const statusTimelineColor: Record<OrderStatus, TimelineColor> = {
  nou: 'info',
  confirmat: 'accent',
  ridicat: 'warning',
  in_tranzit: 'warning',
  livrat: 'success',
  finalizat: 'success',
  anulat: 'neutral',
  problema: 'danger',
  retur: 'info',
};

const statusIcon: Partial<Record<OrderStatus, typeof Package>> = {
  nou: Package,
  confirmat: Package,
  ridicat: Truck,
  in_tranzit: Truck,
  livrat: CheckCircle2,
  finalizat: CheckCircle2,
};

export default function PublicTracking({ embedded }: { embedded?: boolean }) {
  const store = useDataStore();
  const { awb: urlAwb } = useParams<{ awb?: string }>();
  const [searchInput, setSearchInput] = useState(urlAwb ?? '');
  const [searchedAwb, setSearchedAwb] = useState(urlAwb ?? '');

  const order = useMemo(
    () => mockOrders.find((o) => o.awb.toLowerCase() === searchedAwb.toLowerCase()),
    [searchedAwb]
  );

  const route = useMemo(
    () => (order ? store.state.routes.find((r) => r.id === order.routeId) : null),
    [order, store.state.routes]
  );

  const driver = useMemo(
    () => (order?.soferId ? mockDrivers.find((d) => d.id === order.soferId) : null),
    [order]
  );

  const statusHistory = useMemo(
    () =>
      order
        ? mockStatusHistory
            .filter((h) => h.orderId === order.id)
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        : [],
    [order]
  );

  const timelineEntries = useMemo(
    () =>
      statusHistory.map((h) => ({
        status: getStatusLabel(h.status),
        timestamp: formatDateTime(h.timestamp),
        user: h.userName,
        note: h.nota,
        color: statusTimelineColor[h.status] ?? ('neutral' as TimelineColor),
      })),
    [statusHistory]
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchedAwb(searchInput.trim());
  };

  const CurrentStatusIcon = order ? (statusIcon[order.status] ?? Package) : Package;

  return (
    <div className={embedded ? '' : 'h-screen overflow-y-auto bg-bg-primary'}>
      {/* Header / Branding (public only) */}
      {!embedded && (
        <header className="bg-gradient-to-b from-bg-secondary to-bg-primary border-b border-border">
          <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-center gap-3">
            <Truck className="size-6 text-accent" />
            <div className="text-center">
              <h1 className="text-heading text-text-primary">
                TransEurop
              </h1>
              <p className="text-[11px] text-text-tertiary uppercase tracking-widest">
                Urmărire colet
              </p>
            </div>
          </div>
        </header>
      )}

      <main className={embedded ? '' : 'max-w-2xl mx-auto px-4 py-8'}>
        {/* Search */}
        <form onSubmit={handleSearch} className="mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-text-tertiary pointer-events-none" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Introdu AWB (ex: AWB-2026-12345)"
              className="w-full h-11 sm:h-12 pl-12 pr-28 rounded-[8px] border border-border bg-bg-secondary text-[15px] text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-colors"
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 h-9 px-5 rounded-[6px] bg-accent text-white text-[13px] font-medium hover:bg-accent-hover transition-colors"
            >
              Caută
            </button>
          </div>
        </form>

        {/* Results */}
        {searchedAwb && !order && (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <div className="flex items-center justify-center size-14 rounded-full bg-danger-bg">
              <AlertCircle className="size-7 text-danger" />
            </div>
            <h2 className="text-[16px] font-semibold text-text-primary">
              Colet negăsit
            </h2>
            <p className="text-[13px] text-text-secondary max-w-xs">
              Nu am găsit niciun colet cu AWB-ul <span className="font-mono font-medium text-text-primary">{searchedAwb}</span>.
              Verifică codul și încearcă din nou.
            </p>
          </div>
        )}

        {order && (
          <div className="space-y-4">
            {/* Status Card */}
            <div className="bg-bg-secondary border border-border rounded-[8px] p-5">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <span className="text-[11px] text-text-tertiary uppercase tracking-wider">
                    AWB
                  </span>
                  <p className="font-mono text-[15px] font-semibold text-accent">
                    {order.awb}
                  </p>
                </div>
                <span
                  className={[
                    'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] text-[12px] font-semibold',
                    getStatusBgColor(order.status),
                  ].join(' ')}
                >
                  <CurrentStatusIcon className="size-3.5" />
                  {getStatusLabel(order.status)}
                </span>
              </div>

              {/* Route Info */}
              <div className="flex items-center gap-3 py-3 border-t border-border">
                <MapPin className="size-4 text-accent shrink-0" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 text-[13px]">
                    <span className="font-medium text-text-primary">
                      {route?.origin ?? order.adresaRidicare}
                    </span>
                    <span className="text-text-tertiary">→</span>
                    <span className="font-medium text-text-primary">
                      {route?.destination ?? order.adresaLivrare}
                    </span>
                  </div>
                  {route && (
                    <span className="text-[11px] text-text-tertiary">{route.name}</span>
                  )}
                </div>
              </div>

              {/* Estimated Delivery */}
              {order.dataEstimata && (
                <div className="flex items-center gap-3 py-3 border-t border-border">
                  <Package className="size-4 text-text-tertiary shrink-0" />
                  <div>
                    <span className="text-[11px] text-text-tertiary uppercase tracking-wider">
                      Livrare estimată
                    </span>
                    <p className="text-[14px] font-medium text-text-primary">
                      {formatDate(order.dataEstimata)}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Driver Info */}
            {driver && (
              <div className="bg-bg-secondary border border-border rounded-[8px] p-5">
                <span className="text-[11px] text-text-tertiary uppercase tracking-wider block mb-3">
                  Șofer
                </span>
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex items-center justify-center size-10 rounded-full bg-bg-tertiary border border-border shrink-0">
                    {driver.foto ? (
                      <img
                        src={driver.foto}
                        alt={driver.name}
                        className="size-10 rounded-full object-cover"
                      />
                    ) : (
                      <Truck className="size-4 text-text-tertiary" />
                    )}
                  </div>
                  <div>
                    <p className="text-[14px] font-medium text-text-primary">{driver.name}</p>
                    <a href={`tel:${driver.telefon}`} className="text-[12px] text-accent hover:underline font-mono">{driver.telefon}</a>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <a
                    href={`tel:${driver.telefon}`}
                    className="flex-1 flex items-center justify-center gap-2 h-10 rounded-[6px] bg-accent text-white text-[13px] font-medium hover:bg-accent-hover transition-colors"
                  >
                    <Phone className="size-4" />
                    Sună Șoferul
                  </a>
                  <a
                    href={`https://wa.me/${driver.telefon.replace(/\s+/g, '').replace('+', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 h-10 rounded-[6px] bg-[#25D366] text-white text-[13px] font-medium hover:bg-[#1fba59] transition-colors"
                  >
                    <MessageCircle className="size-4" />
                    Trimite pe WhatsApp
                  </a>
                </div>
              </div>
            )}

            {/* Status Timeline */}
            {timelineEntries.length > 0 && (
              <div className="bg-bg-secondary border border-border rounded-[8px] p-5">
                <span className="text-[11px] text-text-tertiary uppercase tracking-wider block mb-4">
                  Istoric status
                </span>
                <StatusTimeline entries={timelineEntries} />
              </div>
            )}

            {/* Delivery Proof */}
            {(order.status === 'livrat' || order.status === 'finalizat') && (() => {
              const proof = store.state.deliveryProofs.find(p => p.orderId === order.id);
              if (!proof) return null;
              return (
                <div className="bg-bg-secondary border border-border rounded-[6px] p-4 space-y-3">
                  <h3 className="text-[13px] font-semibold text-text-primary flex items-center gap-2">
                    <Camera className="size-4 text-accent" />
                    Dovadă livrare
                  </h3>
                  <PhotoGallery photos={proof.photos} size="sm" />
                  {proof.signature && (
                    <div>
                      <p className="text-[12px] text-text-secondary mb-1 flex items-center gap-1"><Pen className="size-3" /> Semnătură</p>
                      <img src={proof.signature} alt="Semnătură" className="h-16 border border-border rounded-[4px] bg-white" />
                    </div>
                  )}
                  {proof.note && <p className="text-[12px] text-text-secondary">{proof.note}</p>}
                  <p className="text-[11px] text-text-tertiary">Livrat: {formatDateTime(proof.timestamp)}</p>
                </div>
              );
            })()}

            {/* Addresses */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-bg-secondary border border-border rounded-[8px] p-4">
                <span className="text-[11px] text-text-tertiary uppercase tracking-wider block mb-2">
                  Adresă ridicare
                </span>
                <p className="text-[13px] text-text-primary leading-relaxed">
                  {order.adresaRidicare}
                </p>
                {order.expeditor && (
                  <p className="text-[12px] text-text-secondary mt-1">{order.expeditor}</p>
                )}
              </div>
              <div className="bg-bg-secondary border border-border rounded-[8px] p-4">
                <span className="text-[11px] text-text-tertiary uppercase tracking-wider block mb-2">
                  Adresă livrare
                </span>
                <p className="text-[13px] text-text-primary leading-relaxed">
                  {order.adresaLivrare}
                </p>
                {order.destinatar && (
                  <p className="text-[12px] text-text-secondary mt-1">{order.destinatar}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Empty state when no search yet */}
        {!searchedAwb && (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <div className="flex items-center justify-center size-14 rounded-full bg-bg-secondary border border-border">
              <Package className="size-7 text-text-tertiary" />
            </div>
            <h2 className="text-[16px] font-semibold text-text-primary">
              Urmărește coletul tău
            </h2>
            <p className="text-[13px] text-text-secondary max-w-xs">
              Introdu codul AWB primit la comanda pentru a vedea statusul și locația coletului.
            </p>
          </div>
        )}
      </main>

      {/* Footer (public only) */}
      {!embedded && (
        <footer className="border-t border-border mt-12">
          <div className="max-w-2xl mx-auto px-4 py-4 text-center">
            <p className="text-[11px] text-text-tertiary">
              TransEurop &middot; Transport internațional România – Marea Britanie
            </p>
          </div>
        </footer>
      )}
    </div>
  );
}
