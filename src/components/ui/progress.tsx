import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"

import { cn } from "@/lib/utils"

interface ProgressProps extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
  indicatorClassName?: string;
  variant?: "default" | "gold" | "success" | "destructive";
  showGlow?: boolean;
}

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  ProgressProps
>(({ className, value, indicatorClassName, variant = "default", showGlow = false, ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn(
      "relative h-4 w-full overflow-hidden rounded-full",
      "bg-secondary/50 dark:bg-secondary/30",
      showGlow && "shadow-[inset_0_1px_2px_rgba(0,0,0,0.1)]",
      className
    )}
    {...props}
  >
    <ProgressPrimitive.Indicator
      className={cn(
        "h-full w-full flex-1 transition-all duration-500 ease-out",
        // Default variant
        variant === "default" && "bg-gradient-to-r from-primary to-primary/80",
        // Gold variant with shimmer
        variant === "gold" && [
          "bg-gradient-to-r from-primary via-amber-400 to-primary",
          "bg-[length:200%_100%]",
          "animate-[shimmer_2s_linear_infinite]"
        ],
        // Success variant
        variant === "success" && "bg-gradient-to-r from-emerald-500 to-emerald-400",
        // Destructive variant
        variant === "destructive" && "bg-gradient-to-r from-destructive to-destructive/80",
        // Glow effect
        showGlow && variant === "default" && "shadow-[0_0_8px_hsl(var(--primary)/0.4)]",
        showGlow && variant === "gold" && "shadow-[0_0_12px_hsl(38_90%_55%/0.5)]",
        showGlow && variant === "success" && "shadow-[0_0_8px_hsl(152_69%_40%/0.4)]",
        indicatorClassName
      )}
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
    />
    
    {/* Animated highlight line */}
    {(variant === "gold" || showGlow) && (
      <div 
        className="absolute inset-0 rounded-full overflow-hidden pointer-events-none"
        style={{ clipPath: `inset(0 ${100 - (value || 0)}% 0 0)` }}
      >
        <div 
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] animate-[shimmer_2s_linear_infinite]"
          style={{ backgroundSize: '200% 100%' }}
        />
      </div>
    )}
  </ProgressPrimitive.Root>
))
Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress }
