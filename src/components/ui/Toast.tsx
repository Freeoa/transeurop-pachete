import { X, CheckCircle2, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { useToast, type ToastVariant } from '../../contexts/ToastContext';
import { useIsMobile } from '../../hooks/useIsMobile';

const variantConfig: Record<ToastVariant, { icon: typeof Info; bg: string; border: string; text: string }> = {
  success: { icon: CheckCircle2, bg: 'bg-success-bg', border: 'border-success/30', text: 'text-success' },
  error: { icon: AlertCircle, bg: 'bg-danger-bg', border: 'border-danger/30', text: 'text-danger' },
  warning: { icon: AlertTriangle, bg: 'bg-warning-bg', border: 'border-warning/30', text: 'text-warning' },
  info: { icon: Info, bg: 'bg-info-bg', border: 'border-info/30', text: 'text-info' },
};

export function ToastContainer() {
  const { toasts, dismiss } = useToast();
  const { isMobile } = useIsMobile();

  if (toasts.length === 0) return null;

  return (
    <div
      className={[
        'fixed z-[60] flex flex-col gap-2 pointer-events-none',
        isMobile
          ? 'bottom-[calc(env(safe-area-inset-bottom,0px)+76px)] left-4 right-4'
          : 'top-4 right-4 w-[360px]',
      ].join(' ')}
    >
      {toasts.map((t) => {
        const cfg = variantConfig[t.variant];
        const Icon = cfg.icon;
        return (
          <div
            key={t.id}
            className={[
              'flex items-center gap-2.5 px-4 py-3 rounded-[8px] border shadow-lg pointer-events-auto',
              'animate-[toast-in_200ms_ease-out]',
              cfg.bg,
              cfg.border,
            ].join(' ')}
          >
            <Icon className={`size-4 shrink-0 ${cfg.text}`} />
            <span className="text-[13px] text-text-primary flex-1">{t.message}</span>
            <button
              onClick={() => dismiss(t.id)}
              className="shrink-0 p-1 rounded-[4px] text-text-tertiary hover:text-text-primary hover:bg-black/5 transition-colors"
              aria-label="Închide"
            >
              <X className="size-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
