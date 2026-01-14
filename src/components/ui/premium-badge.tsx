import { Crown, Sparkles, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface PremiumBadgeProps {
  className?: string;
  children?: React.ReactNode;
  variant?: "default" | "compact" | "glow";
  icon?: "crown" | "sparkles" | "zap";
}

const PremiumBadge = ({ 
  className, 
  children, 
  variant = "default",
  icon = "crown" 
}: PremiumBadgeProps) => {
  const Icon = icon === "crown" ? Crown : icon === "sparkles" ? Sparkles : Zap;
  
  const baseStyles = "font-semibold gap-1.5 transition-all duration-300";
  
  const variants = {
    default: "bg-gradient-to-r from-primary via-primary to-accent text-primary-foreground shadow-lg hover:shadow-xl hover:scale-105",
    compact: "bg-primary/15 text-primary border border-primary/30 hover:bg-primary/20",
    glow: "bg-gradient-to-r from-primary via-primary to-accent text-primary-foreground shadow-lg hover:shadow-xl hover:scale-105 animate-pulse",
  };

  return (
    <Badge 
      className={cn(baseStyles, variants[variant], className)}
    >
      <Icon className={cn("w-3 h-3", variant === "glow" && "animate-spin")} />
      {children || "Premium"}
    </Badge>
  );
};

// Status indicator badges
interface StatusBadgeProps {
  status: "live" | "upcoming" | "finished" | "hot" | "new";
  className?: string;
  children?: React.ReactNode;
}

const StatusBadge = ({ status, className, children }: StatusBadgeProps) => {
  const statusConfig = {
    live: {
      variant: "live" as const,
      defaultText: "LIVE",
    },
    upcoming: {
      variant: "outline" as const,
      defaultText: "Upcoming",
    },
    finished: {
      variant: "secondary" as const,
      defaultText: "Final",
    },
    hot: {
      variant: "hot" as const,
      defaultText: "Hot",
    },
    new: {
      variant: "gold" as const,
      defaultText: "New",
    },
  };

  const config = statusConfig[status];

  return (
    <Badge variant={config.variant} className={className}>
      {children || config.defaultText}
    </Badge>
  );
};

// Confidence badge with gold gradient based on level
interface ConfidenceBadgeProps {
  confidence: number;
  className?: string;
  showIcon?: boolean;
}

const ConfidenceBadge = ({ confidence, className, showIcon = true }: ConfidenceBadgeProps) => {
  const getVariant = () => {
    if (confidence >= 80) return "gold-solid";
    if (confidence >= 65) return "gold";
    if (confidence >= 50) return "premium";
    return "secondary";
  };

  return (
    <Badge variant={getVariant()} className={cn("gap-1", className)}>
      {showIcon && confidence >= 65 && <Sparkles className="w-3 h-3" />}
      {confidence}%
    </Badge>
  );
};

export { PremiumBadge, StatusBadge, ConfidenceBadge };