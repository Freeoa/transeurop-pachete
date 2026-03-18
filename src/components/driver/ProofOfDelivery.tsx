import { useState, useRef, useCallback, useEffect } from 'react';
import { Camera, Pen, Check } from 'lucide-react';
import { BottomSheet } from '../ui/BottomSheet';
import { Button } from '../ui/Button';
import { compressImage } from '../../utils/compressImage';

interface ProofOfDeliveryProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  onConfirm: (proof: { photos: string[]; signature?: string; note?: string }) => void;
}

export function ProofOfDelivery({ isOpen, onClose, orderId: _orderId, onConfirm }: ProofOfDeliveryProps) {
  const [step, setStep] = useState(1);
  const [photos, setPhotos] = useState<string[]>([]);
  const [signature, setSignature] = useState<string | undefined>();
  const [note, setNote] = useState('');
  const [isDrawing, setIsDrawing] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 280, height: 150 });

  const resetState = useCallback(() => {
    setStep(1);
    setPhotos([]);
    setSignature(undefined);
    setNote('');
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver((entries) => {
      const { width } = entries[0].contentRect;
      if (width > 0) {
        setCanvasSize({
          width: Math.round(width),
          height: Math.round(width * 0.54),
        });
      }
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  function handleClose() {
    resetState();
    onClose();
  }

  function handlePhotoCapture(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      if (typeof reader.result === 'string') {
        const compressed = await compressImage(reader.result);
        setPhotos((prev) => [...prev, compressed]);
      }
    };
    reader.readAsDataURL(file);
  }

  // Canvas touch drawing
  function getCanvasPoint(e: React.TouchEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    return {
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top,
    };
  }

  function handleTouchStart(e: React.TouchEvent<HTMLCanvasElement>) {
    e.preventDefault();
    setIsDrawing(true);
    const pt = getCanvasPoint(e);
    if (!pt) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    ctx.beginPath();
    ctx.moveTo(pt.x, pt.y);
  }

  function handleTouchMove(e: React.TouchEvent<HTMLCanvasElement>) {
    e.preventDefault();
    if (!isDrawing) return;
    const pt = getCanvasPoint(e);
    if (!pt) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineTo(pt.x, pt.y);
    ctx.stroke();
  }

  function handleTouchEnd(e: React.TouchEvent<HTMLCanvasElement>) {
    e.preventDefault();
    setIsDrawing(false);
  }

  // Mouse fallback for desktop
  function handleMouseDown(e: React.MouseEvent<HTMLCanvasElement>) {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  }

  function handleMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  }

  function handleMouseUp() {
    setIsDrawing(false);
  }

  function clearCanvas() {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx || !canvasRef.current) return;
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
  }

  function captureSignature() {
    const dataUrl = canvasRef.current?.toDataURL('image/png');
    setSignature(dataUrl);
    setStep(3);
  }

  function handleConfirm() {
    onConfirm({ photos, signature, note: note || undefined });
    resetState();
  }

  const stepLabels = ['Foto dovadă', 'Semnătură client', 'Confirmare livrare'];

  return (
    <BottomSheet isOpen={isOpen} onClose={handleClose} title={stepLabels[step - 1]}>
      {/* Step indicator */}
      <div className="flex items-center justify-center gap-2 mb-5">
        {[1, 2, 3].map((s) => (
          <span
            key={s}
            className={`size-2 rounded-full transition-colors ${
              s === step ? 'bg-accent' : s < step ? 'bg-success' : 'bg-border'
            }`}
          />
        ))}
      </div>

      {/* Step 1: Photo */}
      {step === 1 && (
        <div className="space-y-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handlePhotoCapture}
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full h-32 border-2 border-dashed border-border rounded-[8px] flex flex-col items-center justify-center gap-2 text-text-secondary hover:bg-bg-secondary transition-colors"
          >
            <Camera className="size-8" />
            <span className="text-[13px]">Adaugă foto</span>
          </button>

          {photos.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {photos.map((src, i) => (
                <img
                  key={i}
                  src={src}
                  alt={`Foto ${i + 1}`}
                  className="size-16 rounded-[6px] object-cover border border-border"
                />
              ))}
            </div>
          )}

          <Button className="w-full" onClick={() => setStep(2)}>
            Următorul
          </Button>
        </div>
      )}

      {/* Step 2: Signature */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-[13px] text-text-secondary mb-2">
            <Pen className="size-4" />
            <span>Desenați semnătura cu degetul</span>
          </div>

          <div ref={containerRef}>
            <canvas
              ref={canvasRef}
              width={canvasSize.width}
              height={canvasSize.height}
              className="w-full border border-border rounded-[8px] bg-white touch-none"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            />
          </div>

          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1" onClick={clearCanvas}>
              Șterge
            </Button>
            <Button className="flex-1" onClick={captureSignature}>
              Următorul
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Confirm */}
      {step === 3 && (
        <div className="space-y-4">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Note adiționale (opțional)..."
            rows={3}
            className="w-full rounded-[6px] border border-border bg-bg-secondary px-3 py-2 text-[13px] text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-accent resize-none"
          />

          <div className="space-y-2 text-[13px] text-text-secondary">
            <div className="flex items-center gap-2">
              <Camera className="size-4" />
              <span>
                Fotografii: <strong className="text-text-primary">{photos.length}</strong>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Pen className="size-4" />
              <span>
                Semnătură:{' '}
                <strong className="text-text-primary">{signature ? '\u2713' : '\u2717'}</strong>
              </span>
            </div>
          </div>

          <Button
            className="w-full"
            icon={<Check />}
            onClick={handleConfirm}
          >
            Confirmă livrare
          </Button>
        </div>
      )}
    </BottomSheet>
  );
}
