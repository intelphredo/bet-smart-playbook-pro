import { Skeleton } from "@/components/ui/skeleton";

/**
 * Full-page loading skeleton shown while lazy-loaded routes are being fetched.
 * Prevents blank screens during code-splitting transitions.
 */
export function RouteLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav placeholder */}
      <div className="h-16 border-b border-border/30 bg-background/80 backdrop-blur-sm">
        <div className="container flex items-center h-full gap-4 px-4">
          <Skeleton className="h-8 w-8 rounded" />
          <Skeleton className="h-5 w-24" />
          <div className="flex-1" />
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
      </div>

      {/* Content skeleton */}
      <div className="container px-4 py-6 space-y-6">
        {/* Page title */}
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>

        {/* Stat cards row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-lg border border-border/30 p-4 space-y-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-7 w-20" />
              <Skeleton className="h-2 w-full" />
            </div>
          ))}
        </div>

        {/* Main content blocks */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-lg border border-border/30 p-6 space-y-4">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-[200px] w-full rounded" />
            <div className="space-y-2">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-4/5" />
              <Skeleton className="h-3 w-3/5" />
            </div>
          </div>
          <div className="rounded-lg border border-border/30 p-6 space-y-4">
            <Skeleton className="h-5 w-40" />
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-6 w-14 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
