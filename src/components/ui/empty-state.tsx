import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: LucideIcon;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  children?: ReactNode;
  className?: string;
  variant?: "default" | "compact" | "card";
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
  children,
  className,
  variant = "default",
}: EmptyStateProps) {
  const isCompact = variant === "compact";
  
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        isCompact ? "py-6 px-4" : "py-12 px-6",
        className
      )}
    >
      <div
        className={cn(
          "rounded-full bg-gradient-to-br from-primary/10 via-primary/5 to-transparent flex items-center justify-center mb-4",
          isCompact ? "w-12 h-12" : "w-16 h-16"
        )}
      >
        <Icon
          className={cn(
            "text-primary/60",
            isCompact ? "w-6 h-6" : "w-8 h-8"
          )}
        />
      </div>
      
      <h3
        className={cn(
          "font-semibold text-foreground mb-1",
          isCompact ? "text-sm" : "text-lg"
        )}
      >
        {title}
      </h3>
      
      <p
        className={cn(
          "text-muted-foreground max-w-[280px]",
          isCompact ? "text-xs" : "text-sm"
        )}
      >
        {description}
      </p>
      
      {children}
      
      {(action || secondaryAction) && (
        <div className={cn("flex items-center gap-2", isCompact ? "mt-3" : "mt-5")}>
          {action && (
            <Button
              onClick={action.onClick}
              size={isCompact ? "sm" : "default"}
              className="gap-2"
            >
              {action.icon && <action.icon className="w-4 h-4" />}
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button
              variant="ghost"
              onClick={secondaryAction.onClick}
              size={isCompact ? "sm" : "default"}
            >
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
