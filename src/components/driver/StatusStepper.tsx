import { getStatusLabel } from '../../utils';
import type { OrderStatus } from '../../types';

const STEPS: OrderStatus[] = ['confirmat', 'ridicat', 'in_tranzit', 'livrat', 'finalizat'];

interface StatusStepperProps {
  currentStatus: OrderStatus;
  onAdvance?: (nextStatus: OrderStatus) => void;
}

export function StatusStepper({ currentStatus, onAdvance }: StatusStepperProps) {
  const currentIdx = STEPS.indexOf(currentStatus);

  return (
    <div className="flex items-start justify-between w-full">
      {STEPS.map((step, i) => {
        const isPast = i < currentIdx;
        const isCurrent = i === currentIdx;
        const isNext = i === currentIdx + 1;
        const isFuture = i > currentIdx;

        return (
          <div key={step} className="flex flex-col items-center flex-1 relative">
            {/* Connector line (before dot, except first) */}
            {i > 0 && (
              <div
                className={`absolute top-3 right-1/2 w-full h-0.5 -z-10 ${
                  isPast || isCurrent ? 'bg-success' : 'bg-border'
                }`}
              />
            )}

            {/* Dot */}
            <button
              type="button"
              disabled={!isNext || !onAdvance}
              onClick={() => isNext && onAdvance?.(step)}
              className={[
                'size-6 rounded-full border-2 flex items-center justify-center transition-colors',
                isPast && 'bg-success border-success text-white',
                isCurrent && 'bg-accent border-accent text-white',
                isNext && onAdvance
                  ? 'border-accent bg-bg-primary cursor-pointer hover:bg-accent/10'
                  : '',
                isFuture && !isNext && 'border-border bg-bg-primary',
              ]
                .filter(Boolean)
                .join(' ')}
              aria-label={getStatusLabel(step)}
            >
              {(isPast || isCurrent) && (
                <span className="text-[10px] font-bold text-white">&#10003;</span>
              )}
            </button>

            {/* Label */}
            <span
              className={`text-[10px] mt-1.5 text-center leading-tight ${
                isCurrent
                  ? 'font-semibold text-accent'
                  : isPast
                    ? 'text-success'
                    : 'text-text-tertiary'
              }`}
            >
              {getStatusLabel(step)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
