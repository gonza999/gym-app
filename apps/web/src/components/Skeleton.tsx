export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded bg-gray-200 dark:bg-gray-700 ${className}`}
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="border rounded-lg p-4 space-y-2">
      <div className="flex justify-between">
        <div className="flex gap-2">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-24" />
        </div>
        <Skeleton className="h-5 w-20" />
      </div>
      <Skeleton className="h-4 w-3/4" />
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="border rounded-lg p-4 text-center space-y-2">
      <Skeleton className="h-8 w-12 mx-auto" />
      <Skeleton className="h-3 w-16 mx-auto" />
    </div>
  );
}

export function TableRowSkeleton({ cols = 4 }: { cols?: number }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="py-2">
          <Skeleton className="h-4 w-full" />
        </td>
      ))}
    </tr>
  );
}

export function ChartSkeleton() {
  return (
    <div className="border rounded-lg p-4">
      <Skeleton className="h-6 w-48 mb-4" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}
