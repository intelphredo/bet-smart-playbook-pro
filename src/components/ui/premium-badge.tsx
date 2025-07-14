import { Crown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface PremiumBadgeProps {
  className?: string;
  children?: React.ReactNode;
}

const PremiumBadge = ({ className, children }: PremiumBadgeProps) => {
  return (
    <Badge 
      className={cn(
        "bg-gradient-to-r from-yellow-400 to-yellow-600 text-yellow-900 font-semibold gap-1 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105",
        className
      )}
    >
      <Crown className="w-3 h-3" />
      {children || "Premium"}
    </Badge>
  );
};

export { PremiumBadge };