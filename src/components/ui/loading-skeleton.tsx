import { cn } from "@/lib/utils";

interface SkeletonLineProps extends React.HTMLAttributes<HTMLDivElement> {
  gold?: boolean;
}

function SkeletonLine({
  className,
  gold = false,
  ...props
}: SkeletonLineProps) {
  return (
    <div
      className={cn(
        "rounded-md",
        gold ? "skeleton-line" : "animate-pulse bg-muted",
        className
      )}
      {...props}
    />
  );
}

function LoadingSkeleton({ gold = false }: { gold?: boolean }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-4">
        <SkeletonLine gold={gold} className="h-12 w-12 rounded-full" />
        <div className="space-y-2">
          <SkeletonLine gold={gold} className="h-4 w-[250px]" />
          <SkeletonLine gold={gold} className="h-4 w-[200px]" />
        </div>
      </div>
      <div className="space-y-2">
        <SkeletonLine gold={gold} className="h-4 w-full" />
        <SkeletonLine gold={gold} className="h-4 w-[90%]" />
        <SkeletonLine gold={gold} className="h-4 w-[80%]" />
      </div>
    </div>
  );
}

// Premium card skeleton with gold shimmer
function PremiumCardSkeleton() {
  return (
    <div className="skeleton-card-premium p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="skeleton-circle h-10 w-10" />
          <div className="space-y-2">
            <div className="skeleton-line h-4 w-32" />
            <div className="skeleton-line h-3 w-24" />
          </div>
        </div>
        <div className="skeleton-line h-6 w-16 rounded-full" />
      </div>
      
      {/* Content */}
      <div className="space-y-3">
        <div className="skeleton-line h-4 w-full" />
        <div className="skeleton-line h-4 w-3/4" />
      </div>
      
      {/* Footer */}
      <div className="flex items-center justify-between pt-2">
        <div className="skeleton-line h-8 w-24 rounded-lg" />
        <div className="skeleton-line h-8 w-20 rounded-lg" />
      </div>
    </div>
  );
}

// Match card skeleton
function MatchCardSkeleton() {
  return (
    <div className="skeleton-card-premium p-5 space-y-4">
      {/* League badge */}
      <div className="flex items-center justify-between">
        <div className="skeleton-line h-5 w-20 rounded-full" />
        <div className="skeleton-line h-5 w-16 rounded-full" />
      </div>
      
      {/* Teams */}
      <div className="flex items-center justify-between py-3">
        <div className="flex items-center gap-3">
          <div className="skeleton-circle h-12 w-12" />
          <div className="skeleton-line h-5 w-28" />
        </div>
        <div className="skeleton-line h-8 w-14 rounded-lg" />
      </div>
      
      <div className="flex items-center justify-between py-3">
        <div className="flex items-center gap-3">
          <div className="skeleton-circle h-12 w-12" />
          <div className="skeleton-line h-5 w-24" />
        </div>
        <div className="skeleton-line h-8 w-14 rounded-lg" />
      </div>
      
      {/* Odds row */}
      <div className="grid grid-cols-3 gap-3 pt-2">
        <div className="skeleton-line h-12 rounded-lg" />
        <div className="skeleton-line h-12 rounded-lg" />
        <div className="skeleton-line h-12 rounded-lg" />
      </div>
    </div>
  );
}

// Stats skeleton
function StatsSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="skeleton-card-premium p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="skeleton-line h-3 w-16" />
            <div className="skeleton-circle h-8 w-8" />
          </div>
          <div className="skeleton-line h-8 w-20" />
          <div className="skeleton-line h-3 w-14" />
        </div>
      ))}
    </div>
  );
}

export { SkeletonLine, LoadingSkeleton, PremiumCardSkeleton, MatchCardSkeleton, StatsSkeleton };