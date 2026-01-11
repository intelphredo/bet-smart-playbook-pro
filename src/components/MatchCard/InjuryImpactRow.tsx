import { Badge } from '@/components/ui/badge';
import { AlertTriangle, TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { InjuryLineImpact } from '@/types/injuries';
import { SportradarInjury } from '@/types/sportradar';
import { cn } from '@/lib/utils';

interface InjuryImpactRowProps {
  impact: InjuryLineImpact;
  homeInjuries: SportradarInjury[];
  awayInjuries: SportradarInjury[];
  homeTeamName: string;
  awayTeamName: string;
}

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'out':
    case 'out-for-season':
    case 'injured-reserve':
      return 'text-destructive';
    case 'doubtful':
      return 'text-orange-500';
    case 'questionable':
      return 'text-yellow-500';
    default:
      return 'text-muted-foreground';
  }
};

const formatStatus = (status: string) => {
  return status.toUpperCase().replace(/-/g, ' ');
};

export function InjuryImpactRow({ 
  impact, 
  homeInjuries, 
  awayInjuries,
  homeTeamName,
  awayTeamName
}: InjuryImpactRowProps) {
  const keyPlayers = impact.keyPlayersAffected.slice(0, 3);
  const spreadDisplay = Math.abs(impact.spreadAdjustment) >= 0.5 
    ? `${impact.spreadAdjustment > 0 ? '+' : ''}${impact.spreadAdjustment.toFixed(1)}` 
    : null;

  // Find key injured players to display
  const getKeyInjuredPlayers = () => {
    const allInjuries = [...homeInjuries, ...awayInjuries];
    return allInjuries
      .filter(inj => ['out', 'doubtful', 'questionable'].includes(inj.status))
      .slice(0, 2);
  };

  const keyInjuredPlayers = getKeyInjuredPlayers();

  return (
    <div className="bg-accent/30 rounded-lg p-3 mb-3 border border-border/30">
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-orange-500" />
          <span className="text-xs font-medium text-foreground">Injury Impact</span>
        </div>
        
        {spreadDisplay && (
          <Badge variant="outline" className="gap-1 font-mono text-xs h-5">
            {impact.spreadAdjustment > 0 ? (
              <TrendingUp className="h-3 w-3 text-green-500" />
            ) : (
              <TrendingDown className="h-3 w-3 text-red-500" />
            )}
            {spreadDisplay}
          </Badge>
        )}
      </div>

      {/* Team impact comparison */}
      <div className="flex items-center justify-between text-xs mb-2">
        <div className={cn(
          "flex items-center gap-1",
          impact.advantageTeam === 'away' && "opacity-60"
        )}>
          <span className="font-medium">{homeTeamName}</span>
          <span className="text-muted-foreground">
            (-{impact.homeTeamImpact.overallImpact.toFixed(0)}%)
          </span>
        </div>
        <span className="text-muted-foreground">vs</span>
        <div className={cn(
          "flex items-center gap-1",
          impact.advantageTeam === 'home' && "opacity-60"
        )}>
          <span className="font-medium">{awayTeamName}</span>
          <span className="text-muted-foreground">
            (-{impact.awayTeamImpact.overallImpact.toFixed(0)}%)
          </span>
        </div>
      </div>

      {/* Key injured players */}
      {keyInjuredPlayers.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {keyInjuredPlayers.map((player) => (
            <Badge 
              key={player.id} 
              variant="secondary" 
              className="text-xs h-5 gap-1 bg-background/50"
            >
              <span className="truncate max-w-[100px]">{player.playerName}</span>
              <span className={cn("font-medium", getStatusColor(player.status))}>
                {formatStatus(player.status)}
              </span>
            </Badge>
          ))}
        </div>
      )}

      {/* Value opportunity callout */}
      {impact.valueOpportunity && (
        <div className="mt-2 flex items-center gap-1.5 text-xs text-green-600">
          <Activity className="h-3 w-3" />
          <span>
            Value on <span className="font-medium">{impact.advantageTeam === 'home' ? homeTeamName : awayTeamName}</span> {impact.valueOpportunity.direction}
          </span>
        </div>
      )}
    </div>
  );
}

export default InjuryImpactRow;
