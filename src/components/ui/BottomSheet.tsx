import { type ReactNode, useEffect, useCallback, useRef } from 'react';
import { X } from 'lucide-react';
import { useIsMobile } from '../../hooks/useIsMobile';
import { Modal } from './Modal';
import type { ModalSize } from './Modal';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: ModalSize;
}

function MobileSheet({ isOpen, onClose, title, children }: BottomSheetProps) {
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
      className="fixed inset-0 z-50 flex items-end"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 animate-[fade-in_150ms_ease-out]" />

      {/* Sheet */}
      <div
        className="relative w-full max-h-[90vh] rounded-t-[16px] bg-bg-primary shadow-lg border-t border-border animate-[slide-up_200ms_ease-out] flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-border-strong" />
        </div>

        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-5 py-2 border-b border-border">
            <h2 className="text-subhead text-text-primary">{title}</h2>
            <button
              onClick={onClose}
              className="flex items-center justify-center size-10 sm:size-8 rounded-[6px] text-text-tertiary hover:text-text-primary hover:bg-bg-tertiary transition-colors"
              aria-label="Închide"
            >
              <X className="size-5 sm:size-4" />
            </button>
          </div>
        )}

        {/* Body */}
        <div className="px-5 py-4 overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  );
}

export function BottomSheet(props: BottomSheetProps) {
  const { isMobile } = useIsMobile();

  if (isMobile) {
    return <MobileSheet {...props} />;
  }

  return (
    <Modal isOpen={props.isOpen} onClose={props.onClose} title={props.title} size={props.size}>
      {props.children}
    </Modal>
  );
}

export type { BottomSheetProps };
