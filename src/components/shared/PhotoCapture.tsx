import { useRef } from 'react';
import { Camera } from 'lucide-react';
import { compressImage } from '../../utils/compressImage';

interface PhotoCaptureProps {
  onCapture: (base64: string) => void;
  label?: string;
  multiple?: boolean;
  className?: string;
}

export function PhotoCapture({
  onCapture,
  label = 'Adaugă foto',
  multiple = false,
  className = '',
}: PhotoCaptureProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;

    const readFile = (file: File) => {
      const reader = new FileReader();
      reader.onload = async () => {
        if (typeof reader.result === 'string') {
          const compressed = await compressImage(reader.result);
          onCapture(compressed);
        }
      };
      reader.readAsDataURL(file);
    };

    if (multiple) {
      Array.from(files).forEach(readFile);
    } else {
      readFile(files[0]);
    }

    // Reset so the same file can be selected again
    e.target.value = '';
  }

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        multiple={multiple}
        className="hidden"
        onChange={handleChange}
      />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className={[
          'w-full h-24 border-2 border-dashed border-border rounded-[8px] flex flex-col items-center justify-center gap-2 text-text-secondary hover:bg-bg-secondary transition-colors cursor-pointer',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <Camera className="size-8" />
        <span className="text-[13px]">{label}</span>
      </button>
    </>
  );
}
