import { type ReactNode, useEffect, useCallback, useRef } from 'react';
import { X } from 'lucide-react';

type ModalSize = 'sm' | 'md' | 'lg';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: ModalSize;
}

const sizeStyles: Record<ModalSize, string> = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
};

function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] animate-[fade-in_150ms_ease-out]" />

      {/* Panel */}
      <div
        className={[
          'relative w-full rounded-[10px] bg-bg-primary shadow-lg border border-border',
          'animate-[modal-in_150ms_ease-out]',
          sizeStyles[size],
        ].join(' ')}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
            <h2 className="text-subhead text-text-primary">{title}</h2>
            <button
              onClick={onClose}
              className="flex items-center justify-center size-7 rounded-[6px] text-text-tertiary hover:text-text-primary hover:bg-bg-tertiary transition-colors"
              aria-label="Închide"
            >
              <X className="size-4" />
            </button>
          </div>
        )}

        {/* Body */}
        <div className="px-5 py-4 max-h-[70vh] overflow-y-auto">{children}</div>
      </div>

    </div>
  );
}

export { Modal };
export type { ModalProps, ModalSize };
