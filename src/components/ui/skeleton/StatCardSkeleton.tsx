import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatCardSkeletonProps {
  variant?: 'simple' | 'detailed' | 'chart';
  className?: string;
  count?: number;
  gold?: boolean;
}

/**
 * Skeleton loading state for statistics cards
 * Matches various stat display layouts
 */
export function StatCardSkeleton({ 
  variant = 'simple', 
  className,
  count = 1,
  gold = false
}: StatCardSkeletonProps) {
  const skeletons = Array.from({ length: count }, (_, i) => i);
  
  if (variant === 'detailed') {
    return (
      <>
        {skeletons.map((i) => (
          <Card key={i} className={cn("overflow-hidden", className)}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <Skeleton className="h-5 w-32" gold={gold} />
                <Skeleton className="h-4 w-4 rounded" gold={gold} />
              </div>
              <Skeleton className="h-3 w-48 mt-1" gold={gold} />
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Main value */}
              <div className="flex items-end gap-2">
                <Skeleton className="h-10 w-24" gold={gold} />
                <Skeleton className="h-4 w-16 mb-1" gold={gold} />
              </div>
              
              {/* Secondary stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Skeleton className="h-3 w-16" gold={gold} />
                  <Skeleton className="h-5 w-12" gold={gold} />
                </div>
                <div className="space-y-1">
                  <Skeleton className="h-3 w-16" gold={gold} />
                  <Skeleton className="h-5 w-12" gold={gold} />
                </div>
              </div>
              
              {/* Progress bar */}
              <Skeleton className="h-2 w-full rounded-full" gold={gold} />
            </CardContent>
          </Card>
        ))}
      </>
    );
  }

  if (variant === 'chart') {
    return (
      <>
        {skeletons.map((i) => (
          <Card key={i} className={cn("overflow-hidden", className)}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <Skeleton className="h-5 w-28" gold={gold} />
                <div className="flex gap-1">
                  <Skeleton className="h-6 w-12 rounded" gold={gold} />
                  <Skeleton className="h-6 w-12 rounded" gold={gold} />
                  <Skeleton className="h-6 w-12 rounded" gold={gold} />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Chart area */}
              <div className="h-48 flex items-end justify-between gap-1 pt-4">
                {Array.from({ length: 12 }).map((_, j) => (
                  <Skeleton 
                    key={j} 
                    className="flex-1 rounded-t" 
                    style={{ height: `${Math.random() * 60 + 20}%` }}
                    gold={gold}
                  />
                ))}
              </div>
              
              {/* X-axis labels */}
              <div className="flex justify-between mt-2">
                <Skeleton className="h-3 w-8" gold={gold} />
                <Skeleton className="h-3 w-8" gold={gold} />
                <Skeleton className="h-3 w-8" gold={gold} />
                <Skeleton className="h-3 w-8" gold={gold} />
              </div>
            </CardContent>
          </Card>
        ))}
      </>
    );
  }

  // Simple variant (default)
  return (
    <>
      {skeletons.map((i) => (
        <Card key={i} className={cn("overflow-hidden", className)}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-3 w-20" gold={gold} />
                <Skeleton className="h-7 w-16" gold={gold} />
              </div>
              <Skeleton className="h-10 w-10 rounded-full" gold={gold} />
            </div>
            <Skeleton className="h-1 w-full mt-3 rounded-full" gold={gold} />
          </CardContent>
        </Card>
      ))}
    </>
  );
}

export default StatCardSkeleton;
