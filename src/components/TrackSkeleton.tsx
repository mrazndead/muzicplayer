interface TrackSkeletonProps {
  count?: number;
}

/** Lightweight shimmering placeholder rows shown while tracks load. */
export function TrackSkeleton({ count = 8 }: TrackSkeletonProps) {
  return (
    <div className="space-y-1" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="w-full flex items-center gap-3 p-2.5 rounded-2xl">
          <div className="w-5 h-3 rounded bg-muted/50 animate-pulse" />
          <div className="w-12 h-12 rounded-xl bg-muted/60 animate-pulse" />
          <div className="flex-1 min-w-0 space-y-2">
            <div
              className="h-3 rounded bg-muted/60 animate-pulse"
              style={{ width: `${55 + ((i * 13) % 35)}%` }}
            />
            <div
              className="h-2 rounded bg-muted/40 animate-pulse"
              style={{ width: `${30 + ((i * 7) % 25)}%` }}
            />
          </div>
          <div className="w-8 h-3 rounded bg-muted/40 animate-pulse" />
        </div>
      ))}
    </div>
  );
}
