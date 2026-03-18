import { type ReactNode, useEffect, useCallback, useRef } from 'react';
import { X } from 'lucide-react';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

function Drawer({ isOpen, onClose, title, children }: DrawerProps) {
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
      className="fixed inset-0 z-50"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] animate-[fade-in_150ms_ease-out]" />

      {/* Panel */}
      <div
        className={[
          'absolute top-0 right-0 h-full w-full sm:w-[480px] sm:max-w-[calc(100vw-48px)]',
          'bg-bg-primary border-l border-border shadow-xl',
          'flex flex-col',
          'animate-[slide-in_200ms_ease-out]',
        ].join(' ')}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border shrink-0">
          <h2 className="text-subhead text-text-primary truncate">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="flex items-center justify-center size-7 rounded-[6px] text-text-tertiary hover:text-text-primary hover:bg-bg-tertiary transition-colors ml-3 shrink-0"
            aria-label="Închide"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
      </div>

    </div>
  );
}

export { Drawer };
export type { DrawerProps };
