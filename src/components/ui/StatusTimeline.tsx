type TimelineColor = 'success' | 'warning' | 'danger' | 'info' | 'accent' | 'neutral';

interface TimelineEntry {
  status: string;
  timestamp: string;
  user?: string;
  note?: string;
  color?: TimelineColor;
}

interface StatusTimelineProps {
  entries: TimelineEntry[];
  className?: string;
}

const dotColors: Record<TimelineColor, string> = {
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
  info: 'bg-info',
  accent: 'bg-accent',
  neutral: 'bg-text-tertiary',
};

function StatusTimeline({ entries, className = '' }: StatusTimelineProps) {
  if (!entries.length) return null;

  return (
    <div className={['relative', className].filter(Boolean).join(' ')}>
      {entries.map((entry, idx) => {
        const isLast = idx === entries.length - 1;
        const color = entry.color || 'neutral';

        return (
          <div key={idx} className="relative flex gap-3 pb-4 last:pb-0">
            {/* Vertical line */}
            {!isLast && (
              <div className="absolute left-[5px] top-3 bottom-0 w-px bg-border" />
            )}

            {/* Dot */}
            <div className="relative shrink-0 mt-0.5">
              <div
                className={[
                  'size-[11px] rounded-full ring-2 ring-bg-primary',
                  dotColors[color],
                ].join(' ')}
              />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 -mt-0.5">
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-[13px] font-medium text-text-primary">
                  {entry.status}
                </span>
                <span className="text-[11px] text-text-tertiary">{entry.timestamp}</span>
              </div>
              {entry.user && (
                <p className="text-xs text-text-secondary mt-0.5">{entry.user}</p>
              )}
              {entry.note && (
                <p className="text-xs text-text-tertiary mt-1 leading-relaxed">
                  {entry.note}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export { StatusTimeline };
export type { StatusTimelineProps, TimelineEntry, TimelineColor };
