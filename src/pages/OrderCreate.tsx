import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, User, Car, ChevronRight, Check } from 'lucide-react';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { PhotoCapture } from '../components/shared/PhotoCapture';
import { PhotoGallery } from '../components/shared/PhotoGallery';
import { SuccessAnimation } from '../components/shared/SuccessAnimation';
import { useToast } from '../contexts/ToastContext';
import { useDataStore } from '../contexts/DataStoreContext';
import { formatCurrency, generateAWB, getOrderTypeLabel } from '../utils';
import type { Order, OrderType, PaymentMethod } from '../types';


// ── Constants ────────────────────────────────────────────────
const TOTAL_STEPS = 5;

const typeOptions: { value: OrderType; label: string; desc: string; icon: typeof Package }[] = [
  { value: 'colet', label: 'Colet', desc: 'Pachete, colete, obiecte', icon: Package },
  { value: 'pasager', label: 'Pasager', desc: 'Transport persoane', icon: User },
  { value: 'masina', label: 'Mașină', desc: 'Transport auto pe platformă', icon: Car },
];

const paymentOptions: { value: PaymentMethod; label: string }[] = [
  { value: 'numerar_ridicare', label: 'Numerar la ridicare' },
  { value: 'numerar_livrare', label: 'Numerar la livrare' },
  { value: 'transfer', label: 'Transfer bancar' },
  { value: 'card', label: 'Card' },
];

// ── Step Dots ────────────────────────────────────────────────
function StepDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center justify-center gap-2 py-3">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={[
            'w-2.5 h-2.5 rounded-full transition-colors duration-200',
            i + 1 === current
              ? 'bg-accent'
              : i + 1 < current
                ? 'bg-accent/40'
                : 'bg-bg-tertiary',
          ].join(' ')}
        />
      ))}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════
// OrderCreate Page
// ═════════════════════════════════════════════════════════════
export default function OrderCreate() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const store = useDataStore();

  // ── Success animation ──
  const [showSuccess, setShowSuccess] = useState(false);

  // ── Wizard state ──
  const [step, setStep] = useState(1);
  const [selectedType, setSelectedType] = useState<OrderType | null>(null);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [priceOverride, setPriceOverride] = useState('');

  // ── Detail fields (all strings for controlled inputs) ──
  const [fields, setFields] = useState<Record<string, string>>({});

  // ── Dimensions & photos ──
  const [lungime, setLungime] = useState('');
  const [latime, setLatime] = useState('');
  const [inaltime, setInaltime] = useState('');
  const [orderPhotos, setOrderPhotos] = useState<string[]>([]);

  const setField = (key: string, value: string) =>
    setFields((prev) => ({ ...prev, [key]: value }));

  // ── Derived data ──
  const activeRoutes = useMemo(() => store.state.routes.filter((r) => r.activa), [store.state.routes]);
  const selectedRoute = useMemo(
    () => activeRoutes.find((r) => r.id === selectedRouteId) ?? null,
    [activeRoutes, selectedRouteId],
  );

  const priceUnitLabel = useMemo(() => {
    if (!selectedType || !selectedRoute) return '';
    if (selectedType === 'colet')
      return `${formatCurrency(selectedRoute.pretColetKg, selectedRoute.moneda)}/kg`;
    if (selectedType === 'pasager')
      return `${formatCurrency(selectedRoute.pretPasager, selectedRoute.moneda)}/loc`;
    return `${formatCurrency(selectedRoute.pretMasina, selectedRoute.moneda)}`;
  }, [selectedType, selectedRoute]);

  // ── Volumetric weight ──
  const volumetricKg = useMemo(() => {
    const l = parseFloat(lungime || '0');
    const w = parseFloat(latime || '0');
    const h = parseFloat(inaltime || '0');
    if (l > 0 && w > 0 && h > 0) return (l * w * h) / 5000;
    return 0;
  }, [lungime, latime, inaltime]);

  const actualWeight = parseFloat(fields.greutate || '0');
  const chargeableWeight = volumetricKg > 0 ? Math.max(actualWeight, volumetricKg) : actualWeight;

  const calculatedPrice = useMemo(() => {
    if (!selectedType || !selectedRoute) return 0;
    if (selectedType === 'colet') {
      return chargeableWeight * selectedRoute.pretColetKg;
    }
    if (selectedType === 'pasager') {
      const s = parseInt(fields.nrLocuri || '0', 10);
      return s * selectedRoute.pretPasager;
    }
    return selectedRoute.pretMasina;
  }, [selectedType, selectedRoute, chargeableWeight, fields.nrLocuri]);

  const finalPrice = priceOverride ? parseFloat(priceOverride) || 0 : calculatedPrice;
  const awb = useMemo(() => generateAWB(), []);

  // ── Navigation helpers ──
  const goBack = () => {
    if (step === 1) {
      navigate(-1);
    } else {
      setStep((s) => s - 1);
    }
  };

  const goNext = () => setStep((s) => Math.min(s + 1, TOTAL_STEPS));

  const handleCreate = () => {
    // Build type-specific fields from the wizard fields
    const typeSpecificFields: Record<string, any> = {};
    if (selectedType === 'colet') {
      typeSpecificFields.expeditor = fields.expeditor || '';
      typeSpecificFields.telefonExpeditor = fields.telefonExpeditor || '';
      typeSpecificFields.destinatar = fields.destinatar || '';
      typeSpecificFields.telefonDestinatar = fields.telefonDestinatar || '';
      typeSpecificFields.greutate = parseFloat(fields.greutate || '0') || undefined;
      typeSpecificFields.continut = fields.continut || undefined;
      typeSpecificFields.lungime = parseFloat(lungime || '0') || undefined;
      typeSpecificFields.latime = parseFloat(latime || '0') || undefined;
      typeSpecificFields.inaltime = parseFloat(inaltime || '0') || undefined;
    } else if (selectedType === 'pasager') {
      typeSpecificFields.numePasager = fields.numePasager || '';
      typeSpecificFields.telefonPasager = fields.telefonPasager || '';
      typeSpecificFields.nrLocuri = parseInt(fields.nrLocuri || '1', 10) || 1;
      typeSpecificFields.bagajKg = parseFloat(fields.bagajKg || '0') || undefined;
    } else {
      typeSpecificFields.proprietar = fields.proprietar || '';
      typeSpecificFields.telefonProprietar = fields.telefonProprietar || '';
      typeSpecificFields.modelAuto = fields.modelAuto || '';
      typeSpecificFields.nrInmatriculare = fields.nrInmatriculare || '';
    }

    const newOrder: Order = {
      id: 'ord-' + Date.now(),
      awb,
      type: selectedType!,
      status: 'nou',
      routeId: selectedRouteId!,
      pret: finalPrice,
      moneda: selectedRoute ? selectedRoute.moneda : 'EUR',
      metodaPlata: paymentMethod!,
      statusPlata: 'neplatit',
      dataCreare: new Date().toISOString(),
      adresaRidicare: fields.adresaRidicare || '',
      adresaLivrare: fields.adresaLivrare || '',
      ...(orderPhotos.length > 0 && { photos: orderPhotos }),
      ...typeSpecificFields,
    };
    store.addOrder(newOrder);
    toast('Comanda a fost creată cu succes!', 'success');
    setShowSuccess(true);
  };

  // ── Step validation ──
  const canAdvanceStep3 = useMemo(() => {
    if (!selectedType) return false;
    if (selectedType === 'colet') {
      return !!(fields.expeditor && fields.telefonExpeditor && fields.destinatar && fields.telefonDestinatar);
    }
    if (selectedType === 'pasager') {
      return !!(fields.numePasager && fields.telefonPasager);
    }
    return !!(fields.proprietar && fields.telefonProprietar && fields.modelAuto && fields.nrInmatriculare);
  }, [selectedType, fields]);

  const canAdvanceStep4 = finalPrice > 0 && paymentMethod !== null;

  // ═══════════════════════════════════════════════════════════
  // Render helpers
  // ═══════════════════════════════════════════════════════════

  const renderStep1 = () => (
    <div className="flex flex-col gap-3">
      <h2 className="text-[17px] font-semibold text-text-primary">Ce tip de transport?</h2>
      {typeOptions.map((opt) => {
        const Icon = opt.icon;
        const isSelected = selectedType === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => {
              setSelectedType(opt.value);
              setStep(2);
            }}
            className={[
              'flex items-center gap-4 w-full h-20 px-4 rounded-[8px] border transition-colors text-left',
              isSelected
                ? 'border-accent bg-accent/5'
                : 'border-border bg-bg-primary hover:border-border-strong hover:bg-bg-secondary',
            ].join(' ')}
          >
            <div
              className={[
                'flex items-center justify-center size-10 rounded-[8px]',
                isSelected ? 'bg-accent/10 text-accent' : 'bg-bg-tertiary text-text-secondary',
              ].join(' ')}
            >
              <Icon className="size-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[15px] font-medium text-text-primary">{opt.label}</p>
              <p className="text-[13px] text-text-secondary">{opt.desc}</p>
            </div>
            <ChevronRight className="size-4 text-text-tertiary shrink-0" />
          </button>
        );
      })}
    </div>
  );

  const renderStep2 = () => (
    <div className="flex flex-col gap-3">
      <h2 className="text-[17px] font-semibold text-text-primary">Selectează ruta</h2>
      {activeRoutes.map((route) => {
        const isSelected = selectedRouteId === route.id;
        return (
          <button
            key={route.id}
            onClick={() => {
              setSelectedRouteId(route.id);
              setStep(3);
            }}
            className={[
              'flex flex-col gap-1.5 w-full p-4 rounded-[8px] border transition-colors text-left',
              isSelected
                ? 'border-accent bg-accent/5'
                : 'border-border bg-bg-primary hover:border-border-strong hover:bg-bg-secondary',
            ].join(' ')}
          >
            <div className="flex items-center justify-between">
              <span className="text-[15px] font-medium text-text-primary">
                {route.origin} → {route.destination}
              </span>
              <span className="text-xs text-text-tertiary">{route.durata}</span>
            </div>
            <div className="flex items-center gap-3 text-[13px] text-text-secondary">
              <span>{priceUnitLabel || (selectedType === 'colet'
                ? `${formatCurrency(route.pretColetKg, route.moneda)}/kg`
                : selectedType === 'pasager'
                  ? `${formatCurrency(route.pretPasager, route.moneda)}/loc`
                  : formatCurrency(route.pretMasina, route.moneda))}</span>
              <span className="text-text-tertiary">|</span>
              <span>{route.zilePlecare}</span>
            </div>
          </button>
        );
      })}
    </div>
  );

  const renderStep3 = () => {
    const title = 'Detalii transport';

    if (selectedType === 'colet') {
      return (
        <div className="flex flex-col gap-4">
          <h2 className="text-[17px] font-semibold text-text-primary">{title}</h2>
          <Input label="Expeditor" value={fields.expeditor || ''} onChange={(e) => setField('expeditor', e.target.value)} placeholder="Numele expeditorului" />
          <Input label="Telefon expeditor" value={fields.telefonExpeditor || ''} onChange={(e) => setField('telefonExpeditor', e.target.value)} inputMode="tel" placeholder="+40..." />
          <Input label="Destinatar" value={fields.destinatar || ''} onChange={(e) => setField('destinatar', e.target.value)} placeholder="Numele destinatarului" />
          <Input label="Telefon destinatar" value={fields.telefonDestinatar || ''} onChange={(e) => setField('telefonDestinatar', e.target.value)} inputMode="tel" placeholder="+40..." />
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-medium text-text-primary leading-none">Adresă ridicare</label>
            <textarea
              value={fields.adresaRidicare || ''}
              onChange={(e) => setField('adresaRidicare', e.target.value)}
              placeholder="Adresa completă de ridicare"
              rows={2}
              className="w-full rounded-[6px] border border-border bg-bg-primary text-text-primary text-[13px] px-3 py-2 placeholder:text-text-tertiary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 resize-none"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-medium text-text-primary leading-none">Adresă livrare</label>
            <textarea
              value={fields.adresaLivrare || ''}
              onChange={(e) => setField('adresaLivrare', e.target.value)}
              placeholder="Adresa completă de livrare"
              rows={2}
              className="w-full rounded-[6px] border border-border bg-bg-primary text-text-primary text-[13px] px-3 py-2 placeholder:text-text-tertiary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Greutate (kg)" value={fields.greutate || ''} onChange={(e) => setField('greutate', e.target.value)} inputMode="decimal" placeholder="0.0" />
            <Input label="Conținut" value={fields.continut || ''} onChange={(e) => setField('continut', e.target.value)} placeholder="Descriere conținut" />
          </div>

          {/* Dimensions */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input label="Lungime (cm)" type="number" value={lungime} onChange={(e) => setLungime(e.target.value)} inputMode="decimal" placeholder="0" />
            <Input label="Lățime (cm)" type="number" value={latime} onChange={(e) => setLatime(e.target.value)} inputMode="decimal" placeholder="0" />
            <Input label="Înălțime (cm)" type="number" value={inaltime} onChange={(e) => setInaltime(e.target.value)} inputMode="decimal" placeholder="0" />
          </div>

          {/* Volumetric weight helper */}
          {volumetricKg > 0 && (
            <p className="text-xs text-text-tertiary">
              Greutate volumetrică: {volumetricKg.toFixed(2)} kg &middot; Greutate taxabilă: {chargeableWeight.toFixed(2)} kg
            </p>
          )}

          {/* Photo capture */}
          <div className="flex flex-col gap-2">
            <PhotoCapture
              label="Fotografii colet (opțional)"
              multiple
              onCapture={(base64) => setOrderPhotos((prev) => [...prev, base64])}
            />
            {orderPhotos.length > 0 && (
              <PhotoGallery
                photos={orderPhotos}
                size="sm"
                onRemove={(idx) => setOrderPhotos((prev) => prev.filter((_, i) => i !== idx))}
              />
            )}
          </div>
        </div>
      );
    }

    if (selectedType === 'pasager') {
      return (
        <div className="flex flex-col gap-4">
          <h2 className="text-[17px] font-semibold text-text-primary">{title}</h2>
          <Input label="Nume pasager" value={fields.numePasager || ''} onChange={(e) => setField('numePasager', e.target.value)} placeholder="Numele complet" />
          <Input label="Telefon pasager" value={fields.telefonPasager || ''} onChange={(e) => setField('telefonPasager', e.target.value)} inputMode="tel" placeholder="+40..." />
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-medium text-text-primary leading-none">Adresă ridicare</label>
            <textarea
              value={fields.adresaRidicare || ''}
              onChange={(e) => setField('adresaRidicare', e.target.value)}
              placeholder="Punct de îmbarcare"
              rows={2}
              className="w-full rounded-[6px] border border-border bg-bg-primary text-text-primary text-[13px] px-3 py-2 placeholder:text-text-tertiary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 resize-none"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-medium text-text-primary leading-none">Adresă livrare</label>
            <textarea
              value={fields.adresaLivrare || ''}
              onChange={(e) => setField('adresaLivrare', e.target.value)}
              placeholder="Punct de debarcare"
              rows={2}
              className="w-full rounded-[6px] border border-border bg-bg-primary text-text-primary text-[13px] px-3 py-2 placeholder:text-text-tertiary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Nr. locuri" value={fields.nrLocuri || ''} onChange={(e) => setField('nrLocuri', e.target.value)} inputMode="numeric" placeholder="1" />
            <Input label="Bagaj (kg)" value={fields.bagajKg || ''} onChange={(e) => setField('bagajKg', e.target.value)} inputMode="decimal" placeholder="0.0" />
          </div>
        </div>
      );
    }

    // masina
    return (
      <div className="flex flex-col gap-4">
        <h2 className="text-[17px] font-semibold text-text-primary">{title}</h2>
        <Input label="Proprietar" value={fields.proprietar || ''} onChange={(e) => setField('proprietar', e.target.value)} placeholder="Numele proprietarului" />
        <Input label="Telefon proprietar" value={fields.telefonProprietar || ''} onChange={(e) => setField('telefonProprietar', e.target.value)} inputMode="tel" placeholder="+40..." />
        <Input label="Model auto" value={fields.modelAuto || ''} onChange={(e) => setField('modelAuto', e.target.value)} placeholder="ex. Volkswagen Golf" />
        <Input label="Nr. înmatriculare" value={fields.nrInmatriculare || ''} onChange={(e) => setField('nrInmatriculare', e.target.value)} placeholder="ex. B 123 ABC" />
        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] font-medium text-text-primary leading-none">Adresă ridicare</label>
          <textarea
            value={fields.adresaRidicare || ''}
            onChange={(e) => setField('adresaRidicare', e.target.value)}
            placeholder="Adresa de ridicare a mașinii"
            rows={2}
            className="w-full rounded-[6px] border border-border bg-bg-primary text-text-primary text-[13px] px-3 py-2 placeholder:text-text-tertiary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 resize-none"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] font-medium text-text-primary leading-none">Adresă livrare</label>
          <textarea
            value={fields.adresaLivrare || ''}
            onChange={(e) => setField('adresaLivrare', e.target.value)}
            placeholder="Adresa de livrare a mașinii"
            rows={2}
            className="w-full rounded-[6px] border border-border bg-bg-primary text-text-primary text-[13px] px-3 py-2 placeholder:text-text-tertiary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 resize-none"
          />
        </div>
      </div>
    );
  };

  const renderStep4 = () => (
    <div className="flex flex-col gap-5">
      <h2 className="text-[17px] font-semibold text-text-primary">Preț și plată</h2>

      {/* Calculated price */}
      <div className="rounded-[8px] border border-border bg-bg-secondary p-4 text-center">
        <p className="text-[13px] text-text-secondary mb-1">Preț calculat</p>
        <p className="text-display font-mono font-semibold text-text-primary leading-tight">
          {selectedRoute ? formatCurrency(calculatedPrice, selectedRoute.moneda) : '—'}
        </p>
        {selectedType === 'colet' && (
          <p className="text-xs text-text-tertiary mt-1">
            {chargeableWeight.toFixed(2)} kg × {selectedRoute ? formatCurrency(selectedRoute.pretColetKg, selectedRoute.moneda) : ''}/kg
            {volumetricKg > 0 && chargeableWeight > actualWeight && ' (volumetric)'}
          </p>
        )}
        {selectedType === 'pasager' && (
          <p className="text-xs text-text-tertiary mt-1">
            {fields.nrLocuri || '0'} locuri × {selectedRoute ? formatCurrency(selectedRoute.pretPasager, selectedRoute.moneda) : ''}/loc
          </p>
        )}
      </div>

      {/* Price override */}
      <Input
        label={`Preț manual (${selectedRoute?.moneda || 'EUR'})`}
        value={priceOverride}
        onChange={(e) => setPriceOverride(e.target.value)}
        inputMode="decimal"
        placeholder="Lasă gol pentru preț calculat"
      />

      {/* Payment method */}
      <div className="flex flex-col gap-2">
        <p className="text-[13px] font-medium text-text-primary">Metodă de plată</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {paymentOptions.map((opt) => {
            const isSelected = paymentMethod === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => setPaymentMethod(opt.value)}
                className={[
                  'flex items-center justify-center h-11 px-3 rounded-[8px] border text-[13px] font-medium transition-colors',
                  isSelected
                    ? 'border-accent bg-accent/5 text-accent'
                    : 'border-border bg-bg-primary text-text-secondary hover:border-border-strong hover:bg-bg-secondary',
                ].join(' ')}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );

  const renderStep5 = () => {
    const detailRows: { label: string; value: string }[] = [];

    if (selectedType === 'colet') {
      detailRows.push(
        { label: 'Expeditor', value: fields.expeditor || '—' },
        { label: 'Tel. expeditor', value: fields.telefonExpeditor || '—' },
        { label: 'Destinatar', value: fields.destinatar || '—' },
        { label: 'Tel. destinatar', value: fields.telefonDestinatar || '—' },
        { label: 'Greutate', value: `${fields.greutate || '0'} kg` },
        { label: 'Conținut', value: fields.continut || '—' },
      );
      if (lungime && latime && inaltime) {
        detailRows.push({ label: 'Dimensiuni', value: `${lungime} × ${latime} × ${inaltime} cm` });
      }
      if (volumetricKg > 0) {
        detailRows.push({ label: 'Greutate volumetrică', value: `${volumetricKg.toFixed(2)} kg` });
        detailRows.push({ label: 'Greutate taxabilă', value: `${chargeableWeight.toFixed(2)} kg` });
      }
      if (orderPhotos.length > 0) {
        detailRows.push({ label: 'Fotografii', value: `${orderPhotos.length}` });
      }
    } else if (selectedType === 'pasager') {
      detailRows.push(
        { label: 'Pasager', value: fields.numePasager || '—' },
        { label: 'Telefon', value: fields.telefonPasager || '—' },
        { label: 'Nr. locuri', value: fields.nrLocuri || '1' },
        { label: 'Bagaj', value: `${fields.bagajKg || '0'} kg` },
      );
    } else {
      detailRows.push(
        { label: 'Proprietar', value: fields.proprietar || '—' },
        { label: 'Telefon', value: fields.telefonProprietar || '—' },
        { label: 'Model', value: fields.modelAuto || '—' },
        { label: 'Nr. înmatriculare', value: fields.nrInmatriculare || '—' },
      );
    }

    if (fields.adresaRidicare) detailRows.push({ label: 'Ridicare', value: fields.adresaRidicare });
    if (fields.adresaLivrare) detailRows.push({ label: 'Livrare', value: fields.adresaLivrare });

    const paymentLabel = paymentOptions.find((p) => p.value === paymentMethod)?.label || '—';

    return (
      <div className="flex flex-col gap-4">
        <h2 className="text-[17px] font-semibold text-text-primary">Confirmare comandă</h2>

        <div className="rounded-[8px] border border-border bg-bg-primary p-4 flex flex-col gap-3">
          {/* Header row: type + route */}
          <div className="flex items-center gap-2 flex-wrap">
            {selectedType && (
              <Badge variant={selectedType === 'colet' ? 'info' : selectedType === 'pasager' ? 'purple' : 'warning'}>
                {getOrderTypeLabel(selectedType)}
              </Badge>
            )}
            {selectedRoute && (
              <span className="text-[13px] text-text-primary font-medium">
                {selectedRoute.origin} → {selectedRoute.destination}
              </span>
            )}
          </div>

          {/* Detail list */}
          <div className="divide-y divide-border">
            {detailRows.map((row) => (
              <div key={row.label} className="flex items-start justify-between py-2 gap-3">
                <span className="text-[13px] text-text-secondary shrink-0">{row.label}</span>
                <span className="text-[13px] text-text-primary text-right">{row.value}</span>
              </div>
            ))}
          </div>

          {/* Price + payment */}
          <div className="border-t border-border pt-3 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-medium text-text-primary">Preț</span>
              <span className="text-subhead font-mono font-semibold text-accent">
                {selectedRoute ? formatCurrency(finalPrice, selectedRoute.moneda) : '—'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[13px] text-text-secondary">Plată</span>
              <span className="text-[13px] text-text-primary">{paymentLabel}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[13px] text-text-secondary">AWB</span>
              <span className="text-[13px] font-mono text-accent">{awb}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════
  // Main render
  // ═══════════════════════════════════════════════════════════
  return (
    <div className="bg-bg-primary min-h-screen flex flex-col">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-1">
        <button
          onClick={goBack}
          className="flex items-center justify-center size-9 rounded-[6px] text-text-secondary hover:bg-bg-tertiary hover:text-text-primary transition-colors"
          aria-label="Înapoi"
        >
          <ArrowLeft className="size-5" />
        </button>
        <h1 className="text-[17px] font-semibold text-text-primary">Comandă nouă</h1>
      </div>

      {/* Step dots */}
      <StepDots current={step} total={TOTAL_STEPS} />

      {/* Body - scrollable area */}
      <div className="flex-1 overflow-y-auto px-4 pb-28">
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        {step === 4 && renderStep4()}
        {step === 5 && renderStep5()}
      </div>

      {/* Bottom pinned button */}
      {step === 3 && (
        <div className="fixed bottom-16 md:bottom-0 left-0 right-0 bg-bg-primary border-t border-border px-4 py-3 z-40 pb-[env(safe-area-inset-bottom)]">
          <Button
            size="lg"
            className="w-full"
            disabled={!canAdvanceStep3}
            onClick={goNext}
            icon={<ChevronRight />}
          >
            Următorul
          </Button>
        </div>
      )}
      {step === 4 && (
        <div className="fixed bottom-16 md:bottom-0 left-0 right-0 bg-bg-primary border-t border-border px-4 py-3 z-40 pb-[env(safe-area-inset-bottom)]">
          <Button
            size="lg"
            className="w-full"
            disabled={!canAdvanceStep4}
            onClick={goNext}
            icon={<ChevronRight />}
          >
            Următorul
          </Button>
        </div>
      )}
      {step === 5 && (
        <div className="fixed bottom-16 md:bottom-0 left-0 right-0 bg-bg-primary border-t border-border px-4 py-3 z-40 pb-[env(safe-area-inset-bottom)]">
          <Button
            size="lg"
            className="w-full"
            onClick={handleCreate}
            icon={<Check />}
          >
            Creează comanda
          </Button>
        </div>
      )}

      <SuccessAnimation
        visible={showSuccess}
        onComplete={() => {
          setShowSuccess(false);
          navigate('/comenzi');
        }}
      />
    </div>
  );
}
