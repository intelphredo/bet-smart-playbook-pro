import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface MatchCardSkeletonProps {
  variant?: 'default' | 'compact' | 'expanded';
  className?: string;
  count?: number;
  gold?: boolean;
}

/**
 * Skeleton loading state for match cards
 * Matches the layout of actual MatchCard components
 */
export function MatchCardSkeleton({ 
  variant = 'default', 
  className,
  count = 1,
  gold = false
}: MatchCardSkeletonProps) {
  const skeletons = Array.from({ length: count }, (_, i) => i);
  
  if (variant === 'compact') {
    return (
      <>
        {skeletons.map((i) => (
          <Card key={i} className={cn("overflow-hidden", className)}>
            <CardContent className="p-3">
              <div className="flex items-center justify-between gap-2">
                {/* Team logos and names */}
                <div className="flex items-center gap-2 flex-1">
                  <Skeleton className="h-6 w-6 rounded-full" gold={gold} />
                  <Skeleton className="h-4 w-20" gold={gold} />
                  <span className="text-muted-foreground text-xs">vs</span>
                  <Skeleton className="h-6 w-6 rounded-full" gold={gold} />
                  <Skeleton className="h-4 w-20" gold={gold} />
                </div>
                {/* Time/Score */}
                <Skeleton className="h-5 w-12" gold={gold} />
              </div>
            </CardContent>
          </Card>
        ))}
      </>
    );
  }

  if (variant === 'expanded') {
    return (
      <>
        {skeletons.map((i) => (
          <Card key={i} className={cn("overflow-hidden", className)}>
            <CardContent className="p-4 space-y-4">
              {/* Header with league badge */}
              <div className="flex items-center justify-between">
                <Skeleton className="h-5 w-16 rounded-full" gold={gold} />
                <Skeleton className="h-4 w-24" gold={gold} />
              </div>
              
              {/* Teams section */}
              <div className="flex items-center justify-between">
                {/* Home team */}
                <div className="flex flex-col items-center gap-2 flex-1">
                  <Skeleton className="h-12 w-12 rounded-full" gold={gold} />
                  <Skeleton className="h-4 w-24" gold={gold} />
                  <Skeleton className="h-3 w-12" gold={gold} />
                </div>
                
                {/* Score/Time */}
                <div className="flex flex-col items-center gap-1 px-4">
                  <Skeleton className="h-8 w-20" gold={gold} />
                  <Skeleton className="h-3 w-12" gold={gold} />
                </div>
                
                {/* Away team */}
                <div className="flex flex-col items-center gap-2 flex-1">
                  <Skeleton className="h-12 w-12 rounded-full" gold={gold} />
                  <Skeleton className="h-4 w-24" gold={gold} />
                  <Skeleton className="h-3 w-12" gold={gold} />
                </div>
              </div>
              
              {/* Prediction section */}
              <div className="flex items-center justify-between pt-2 border-t border-border">
                <Skeleton className="h-6 w-24" gold={gold} />
                <Skeleton className="h-6 w-16" gold={gold} />
                <Skeleton className="h-8 w-20 rounded-md" gold={gold} />
              </div>
            </CardContent>
          </Card>
        ))}
      </>
    );
  }

  // Default variant
  return (
    <>
      {skeletons.map((i) => (
        <Card key={i} className={cn("overflow-hidden", className)}>
          <CardContent className="p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <Skeleton className="h-5 w-12 rounded-full" gold={gold} />
              <Skeleton className="h-4 w-20" gold={gold} />
            </div>
            
            {/* Teams */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Skeleton className="h-8 w-8 rounded-full" gold={gold} />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-24" gold={gold} />
                  <Skeleton className="h-3 w-12" gold={gold} />
                </div>
              </div>
              <Skeleton className="h-6 w-12" gold={gold} />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Skeleton className="h-8 w-8 rounded-full" gold={gold} />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-24" gold={gold} />
                  <Skeleton className="h-3 w-12" gold={gold} />
                </div>
              </div>
              <Skeleton className="h-6 w-12" gold={gold} />
            </div>
            
            {/* Footer */}
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
              <Skeleton className="h-5 w-20" gold={gold} />
              <Skeleton className="h-7 w-16 rounded-md" gold={gold} />
            </div>
          </CardContent>
        </Card>
      ))}
    </>
  );
}

export default MatchCardSkeleton;
