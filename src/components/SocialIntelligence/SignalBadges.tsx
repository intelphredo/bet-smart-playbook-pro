
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { SocialSignal } from "@/types/socialIntelligence";
import { AlertTriangle, Heart, Users, Flame, Plane, TrendingUp, UserMinus, Target } from "lucide-react";

interface SignalBadgesProps {
  signals: SocialSignal[];
  maxBadges?: number;
}

const getSignalIcon = (type: string) => {
  switch (type) {
    case 'injury':
      return <Heart className="h-3 w-3" />;
    case 'locker_room':
      return <Users className="h-3 w-3" />;
    case 'motivation':
      return <Flame className="h-3 w-3" />;
    case 'travel':
      return <Plane className="h-3 w-3" />;
    case 'coaching':
      return <Target className="h-3 w-3" />;
    case 'suspension':
      return <UserMinus className="h-3 w-3" />;
    case 'lineup':
      return <TrendingUp className="h-3 w-3" />;
    default:
      return <AlertTriangle className="h-3 w-3" />;
  }
};

const getSignalColor = (signal: SocialSignal): string => {
  if (signal.severity === 'high') {
    return signal.sentiment === 'positive' 
      ? 'bg-green-500/20 text-green-400 border-green-500/30' 
      : 'bg-red-500/20 text-red-400 border-red-500/30';
  }
  if (signal.severity === 'medium') {
    return signal.sentiment === 'positive'
      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
      : signal.sentiment === 'negative'
      ? 'bg-orange-500/20 text-orange-400 border-orange-500/30'
      : 'bg-blue-500/20 text-blue-400 border-blue-500/30';
  }
  return 'bg-muted text-muted-foreground border-border';
};

export function SignalBadges({ signals, maxBadges = 3 }: SignalBadgesProps) {
  const displaySignals = signals.slice(0, maxBadges);
  const remaining = signals.length - maxBadges;
  
  if (signals.length === 0) return null;
  
  return (
    <div className="flex flex-wrap gap-1">
      {displaySignals.map((signal) => (
        <Tooltip key={signal.id}>
          <TooltipTrigger asChild>
            <Badge 
              variant="outline" 
              className={`text-xs cursor-help ${getSignalColor(signal)}`}
            >
              {getSignalIcon(signal.type)}
              <span className="ml-1 capitalize">{signal.type.replace('_', ' ')}</span>
            </Badge>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <div className="space-y-1">
              <p className="font-semibold">{signal.headline}</p>
              <p className="text-xs text-muted-foreground">{signal.details}</p>
              <div className="flex items-center gap-2 text-xs">
                <span className="capitalize">{signal.source}</span>
                <span>•</span>
                <span className={signal.impactOnBetting > 0 ? 'text-green-400' : signal.impactOnBetting < 0 ? 'text-red-400' : ''}>
                  Impact: {signal.impactOnBetting > 0 ? '+' : ''}{signal.impactOnBetting}
                </span>
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      ))}
      {remaining > 0 && (
        <Badge variant="outline" className="text-xs">
          +{remaining} more
        </Badge>
      )}
    </div>
  );
}
