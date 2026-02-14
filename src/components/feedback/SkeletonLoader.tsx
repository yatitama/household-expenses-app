interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '' }) => {
  return (
    <div
      className={`bg-gray-200 dark:bg-gray-700 animate-pulse rounded-lg ${className}`}
      aria-hidden="true"
    />
  );
};

export const SkeletonCard: React.FC = () => {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>

      {/* Content */}
      <div className="space-y-3">
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>

      {/* Footer */}
      <div className="flex gap-2 pt-2">
        <Skeleton className="h-8 flex-1 rounded-lg" />
        <Skeleton className="h-8 flex-1 rounded-lg" />
      </div>
    </div>
  );
};

export const SkeletonChart: React.FC = () => {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-4">
      <Skeleton className="h-6 w-32 mb-4" />
      <Skeleton className="h-64 w-full rounded-lg" />
    </div>
  );
};

export const SkeletonTable: React.FC = () => {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex gap-4 p-3 bg-white dark:bg-slate-800 rounded-lg">
          <Skeleton className="w-12 h-12 rounded-lg flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-32" />
          </div>
          <Skeleton className="w-16 h-6 rounded-lg flex-shrink-0" />
        </div>
      ))}
    </div>
  );
};

interface SkeletonGridProps {
  count?: number;
  columns?: number;
}

export const SkeletonGrid: React.FC<SkeletonGridProps> = ({ count = 6, columns = 3 }) => {
  return (
    <div className={`grid gap-4 grid-cols-1 md:grid-cols-${columns} lg:grid-cols-${columns}`}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
};
