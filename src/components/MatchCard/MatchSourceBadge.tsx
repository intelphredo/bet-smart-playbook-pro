import { Badge } from "@/components/ui/badge";
import { Wifi, DollarSign, Layers } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export type MatchDataSource = "espn" | "odds" | "combined";

interface MatchSourceBadgeProps {
  source: MatchDataSource;
  hasOddsData?: boolean;
}

const MatchSourceBadge = ({ source, hasOddsData = false }: MatchSourceBadgeProps) => {
  const config = {
    espn: {
      icon: Wifi,
      label: "ESPN",
      className: "bg-green-500/10 text-green-600 border-green-500/30 dark:text-green-400",
      tooltip: "Game data from ESPN"
    },
    odds: {
      icon: DollarSign,
      label: "Odds API",
      className: "bg-blue-500/10 text-blue-600 border-blue-500/30 dark:text-blue-400",
      tooltip: "Game data from The Odds API"
    },
    combined: {
      icon: Layers,
      label: "Combined",
      className: "bg-purple-500/10 text-purple-600 border-purple-500/30 dark:text-purple-400",
      tooltip: "Data merged from ESPN + Odds API"
    }
  };

  const { icon: Icon, label, className, tooltip } = config[source];

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge variant="outline" className={`gap-1 text-[10px] px-1.5 py-0.5 ${className}`}>
          <Icon className="h-2.5 w-2.5" />
          {label}
          {hasOddsData && source !== "odds" && (
            <DollarSign className="h-2.5 w-2.5 text-blue-500 ml-0.5" />
          )}
        </Badge>
      </TooltipTrigger>
      <TooltipContent>
        <p className="text-xs">{tooltip}</p>
        {hasOddsData && source !== "odds" && (
          <p className="text-xs text-muted-foreground">+ Live sportsbook odds</p>
        )}
      </TooltipContent>
    </Tooltip>
  );
};

export default MatchSourceBadge;
