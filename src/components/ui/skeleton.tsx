import { cn } from "@/lib/utils"

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  shimmer?: boolean;
  gold?: boolean;
}

function Skeleton({
  className,
  shimmer = false,
  gold = false,
  ...props
}: SkeletonProps) {
  return (
    <div
      className={cn(
        "rounded-md relative overflow-hidden",
        gold 
          ? "bg-gradient-to-r from-amber-950/30 via-amber-900/20 to-amber-950/30" 
          : "bg-muted",
        shimmer || gold ? "skeleton-gold-shimmer" : "animate-pulse",
        className
      )}
      {...props}
    >
      {gold && (
        <div className="absolute inset-0 skeleton-gold-shimmer" />
      )}
    </div>
  )
}

export { Skeleton }
