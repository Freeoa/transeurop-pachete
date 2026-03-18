import { TrendingUp, TrendingDown } from 'lucide-react';
import { AnimatedCounter } from './AnimatedCounter';

interface KPICardProps {
  label: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  className?: string;
  onClick?: () => void;
}

function KPICard({ label, value, change, changeLabel, className = '', onClick }: KPICardProps) {
  const isPositive = change !== undefined && change >= 0;

  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') onClick(); } : undefined}
      className={[
        'flex flex-col justify-center gap-1 px-4 py-3 min-h-[72px]',
        'bg-bg-secondary rounded-[6px] border border-border',
        onClick && 'cursor-pointer hover:border-accent/40 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 active:scale-[0.98]',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <span className="text-[11px] font-medium text-text-secondary leading-none tracking-[0.01em] truncate">
        {label}
      </span>
      <div className="flex items-end gap-2">
        <span className="text-lg sm:text-2xl font-semibold font-mono text-text-primary leading-[1.2] tracking-tight">
          {typeof value === 'number' ? <AnimatedCounter value={value} /> : value}
        </span>
        {change !== undefined && (
          <span
            className={[
              'inline-flex items-center gap-0.5 text-xs font-medium leading-none pb-0.5',
              isPositive ? 'text-success' : 'text-danger',
            ].join(' ')}
          >
            {isPositive ? (
              <TrendingUp className="size-3" />
            ) : (
              <TrendingDown className="size-3" />
            )}
            {isPositive ? '+' : ''}
            {change}%
            {changeLabel && (
              <span className="text-text-tertiary ml-0.5">{changeLabel}</span>
            )}
          </span>
        )}
      </div>
    </div>
  );
}

export { KPICard };
export type { KPICardProps };
