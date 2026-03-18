import type { OrderStatus } from '../../types';

interface StatusCardProps {
  status: OrderStatus;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

const statusBorderColors: Record<OrderStatus, string> = {
  nou: 'border-l-info',
  confirmat: 'border-l-accent',
  ridicat: 'border-l-warning',
  in_tranzit: 'border-l-warning',
  livrat: 'border-l-success',
  finalizat: 'border-l-success',
  anulat: 'border-l-border-strong',
  problema: 'border-l-danger',
  retur: 'border-l-purple',
};

const statusBgTint: Record<string, string> = {
  in_tranzit: 'bg-warning-bg/50',
  problema: 'bg-danger-bg/50',
  livrat: 'bg-success-bg/50',
};

export function StatusCard({ status, children, className = '', onClick }: StatusCardProps) {
  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') onClick(); } : undefined}
      className={[
        'rounded-[6px] border border-border border-l-[3px] p-3 transition-all duration-150',
        statusBorderColors[status] || 'border-l-border',
        statusBgTint[status] || 'bg-bg-primary',
        onClick && 'cursor-pointer hover:border-accent/30 hover:shadow-sm active:scale-[0.98]',
        className,
      ].filter(Boolean).join(' ')}
    >
      {children}
    </div>
  );
}

export type { StatusCardProps };
