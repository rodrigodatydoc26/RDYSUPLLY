export const Skeleton = ({ className = '' }: { className?: string }) => (
  <div className={`animate-pulse bg-white/5 rounded-xl ${className}`} />
);

export const SkeletonCard = () => (
  <div className="rdy-card p-6 space-y-4">
    <Skeleton className="w-14 h-14 rounded-2xl" />
    <Skeleton className="h-3 w-24" />
    <Skeleton className="h-10 w-16" />
  </div>
);

export const SkeletonRow = () => (
  <tr>
    {Array.from({ length: 5 }).map((_, i) => (
      <td key={i} className="px-6 py-4"><Skeleton className="h-4 w-full" /></td>
    ))}
  </tr>
);
