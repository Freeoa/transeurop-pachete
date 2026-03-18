import { useState, useCallback } from 'react';
import { Check } from 'lucide-react';
import { BottomSheet } from '../ui/BottomSheet';
import { Button } from '../ui/Button';
import { PhotoCapture } from '../shared/PhotoCapture';
import { PhotoGallery } from '../shared/PhotoGallery';

type Severitate = 'minor' | 'major' | 'total';

interface DamageReportSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: { photos: string[]; descriere: string; severitate: Severitate }) => void;
}

const severitateOptions: { key: Severitate; label: string; style: string; activeStyle: string }[] = [
  {
    key: 'minor',
    label: 'Minor',
    style: 'border-border text-text-secondary hover:bg-bg-secondary',
    activeStyle: 'border-warning bg-warning/10 text-warning',
  },
  {
    key: 'major',
    label: 'Major',
    style: 'border-border text-text-secondary hover:bg-bg-secondary',
    activeStyle: 'border-danger bg-danger/10 text-danger',
  },
  {
    key: 'total',
    label: 'Total',
    style: 'border-border text-text-secondary hover:bg-bg-secondary',
    activeStyle: 'border-danger bg-danger text-white',
  },
];

export function DamageReportSheet({ isOpen, onClose, onConfirm }: DamageReportSheetProps) {
  const [photos, setPhotos] = useState<string[]>([]);
  const [descriere, setDescriere] = useState('');
  const [severitate, setSeveritate] = useState<Severitate | null>(null);

  const resetState = useCallback(() => {
    setPhotos([]);
    setDescriere('');
    setSeveritate(null);
  }, []);

  function handleClose() {
    resetState();
    onClose();
  }

  function handleCapture(base64: string) {
    setPhotos((prev) => [...prev, base64]);
  }

  function handleRemovePhoto(index: number) {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  }

  function handleConfirm() {
    if (!severitate) return;
    onConfirm({ photos, descriere, severitate });
    resetState();
  }

  const isValid = photos.length > 0 && descriere.trim().length > 0 && severitate !== null;

  return (
    <BottomSheet isOpen={isOpen} onClose={handleClose} title="Raport daune">
      <div className="space-y-4">
        {/* Photos */}
        <div>
          <label className="block text-[13px] text-text-secondary mb-2">Fotografii daune</label>
          <PhotoCapture onCapture={handleCapture} multiple label="Adaugă foto daune" />
        </div>
        <PhotoGallery photos={photos} onRemove={handleRemovePhoto} size="sm" />

        {/* Description */}
        <div>
          <label className="block text-[13px] text-text-secondary mb-1">Descriere</label>
          <textarea
            value={descriere}
            onChange={(e) => setDescriere(e.target.value)}
            placeholder="Descrieți problema..."
            rows={3}
            className="w-full rounded-[6px] border border-border bg-bg-secondary px-3 py-2 text-[13px] text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-accent resize-none"
          />
        </div>

        {/* Severity */}
        <div>
          <label className="block text-[13px] text-text-secondary mb-2">Severitate</label>
          <div className="flex gap-2">
            {severitateOptions.map((opt) => (
              <button
                key={opt.key}
                type="button"
                onClick={() => setSeveritate(opt.key)}
                className={[
                  'flex-1 py-2.5 rounded-[6px] border text-[13px] font-semibold transition-colors',
                  severitate === opt.key ? opt.activeStyle : opt.style,
                ].join(' ')}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Confirm */}
        <Button
          className="w-full"
          variant="danger"
          icon={<Check />}
          onClick={handleConfirm}
          disabled={!isValid}
        >
          Trimite raport
        </Button>
      </div>
    </BottomSheet>
  );
}
