import { useState } from 'react';
import { X } from 'lucide-react';

interface PhotoGalleryProps {
  photos: string[];
  onRemove?: (index: number) => void;
  size?: 'sm' | 'md' | 'lg';
}

const sizeMap = {
  sm: 'size-16',
  md: 'size-24',
  lg: 'size-32',
} as const;

export function PhotoGallery({ photos, onRemove, size = 'md' }: PhotoGalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  if (photos.length === 0) return null;

  return (
    <>
      <div className="flex gap-2 flex-wrap">
        {photos.map((src, i) => (
          <div key={i} className="relative group">
            <img
              src={src}
              alt={`Foto ${i + 1}`}
              className={`${sizeMap[size]} rounded-[6px] object-cover border border-border cursor-pointer`}
              onClick={() => setLightboxIndex(i)}
            />
            {onRemove && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(i);
                }}
                className="absolute -top-1.5 -right-1.5 size-8 sm:size-6 rounded-full bg-danger text-white flex items-center justify-center opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
              >
                <X className="size-4 sm:size-3" />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-[70] bg-black/90 flex items-center justify-center"
          onClick={() => setLightboxIndex(null)}
        >
          <button
            type="button"
            onClick={() => setLightboxIndex(null)}
            className="absolute top-4 right-4 size-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors"
          >
            <X className="size-5" />
          </button>
          <img
            src={photos[lightboxIndex]}
            alt={`Foto ${lightboxIndex + 1}`}
            className="max-w-[90vw] max-h-[90vh] object-contain rounded-[8px]"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
