interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div className={`bg-bg-tertiary rounded-[6px] overflow-hidden relative ${className}`}>
      <div
        className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent"
        style={{ animation: 'shimmer 1.5s infinite' }}
      />
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="border border-border rounded-[6px] p-4 space-y-3">
      <div className="flex justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-5 w-16 rounded-[4px]" />
      </div>
      <Skeleton className="h-3 w-48" />
      <div className="flex justify-between">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-4 w-16" />
      </div>
    </div>
  );
}

export function SkeletonKPI() {
  return (
    <div className="border border-border rounded-[6px] p-3 min-h-[72px]">
      <Skeleton className="h-3 w-20 mb-2" />
      <Skeleton className="h-6 w-16" />
    </div>
  );
}
