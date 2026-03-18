import { useState, useCallback } from 'react';
import { Check } from 'lucide-react';
import { BottomSheet } from '../ui/BottomSheet';
import { Button } from '../ui/Button';
import { PhotoCapture } from '../shared/PhotoCapture';
import { PhotoGallery } from '../shared/PhotoGallery';
import { compressImage } from '../../utils/compressImage';

interface ProofOfPickupProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: { photos: string[]; note?: string }) => void;
}

export function ProofOfPickup({ isOpen, onClose, onConfirm }: ProofOfPickupProps) {
  const [step, setStep] = useState(1);
  const [photos, setPhotos] = useState<string[]>([]);
  const [note, setNote] = useState('');

  const resetState = useCallback(() => {
    setStep(1);
    setPhotos([]);
    setNote('');
  }, []);

  function handleClose() {
    resetState();
    onClose();
  }

  async function handleCapture(base64: string) {
    const compressed = await compressImage(base64);
    setPhotos((prev) => [...prev, compressed]);
  }

  function handleRemovePhoto(index: number) {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  }

  function handleConfirm() {
    onConfirm({ photos, note: note || undefined });
    resetState();
  }

  const stepLabels = ['Foto marfă', 'Confirmare ridicare'];

  return (
    <BottomSheet isOpen={isOpen} onClose={handleClose} title={stepLabels[step - 1]}>
      {/* Step indicator */}
      <div className="flex items-center justify-center gap-2 mb-5">
        {[1, 2].map((s) => (
          <span
            key={s}
            className={`size-2 rounded-full transition-colors ${
              s === step ? 'bg-accent' : s < step ? 'bg-success' : 'bg-border'
            }`}
          />
        ))}
      </div>

      {/* Step 1: Photos */}
      {step === 1 && (
        <div className="space-y-4">
          <PhotoCapture onCapture={handleCapture} multiple label="Adaugă foto marfă" />
          <PhotoGallery photos={photos} onRemove={handleRemovePhoto} size="sm" />
          <Button className="w-full" onClick={() => setStep(2)}>
            Următorul
          </Button>
        </div>
      )}

      {/* Step 2: Confirm */}
      {step === 2 && (
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
              <span>
                Fotografii: <strong className="text-text-primary">{photos.length}</strong>
              </span>
            </div>
          </div>

          <Button className="w-full" icon={<Check />} onClick={handleConfirm}>
            Confirmă ridicare
          </Button>
        </div>
      )}
    </BottomSheet>
  );
}
