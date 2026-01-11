import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Activity, TrendingUp, Shield, Sword } from 'lucide-react';
import { InjuryLineImpact } from '@/types/injuries';
import { SportradarInjury } from '@/types/sportradar';
import { cn } from '@/lib/utils';

interface InjuryBreakdownProps {
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
      return 'text-destructive bg-destructive/10';
    case 'doubtful':
      return 'text-orange-500 bg-orange-500/10';
    case 'questionable':
      return 'text-yellow-600 bg-yellow-500/10';
    default:
      return 'text-muted-foreground bg-muted';
  }
};

const formatStatus = (status: string) => {
  return status.toUpperCase().replace(/-/g, ' ');
};

interface TeamInjuryListProps {
  teamName: string;
  injuries: SportradarInjury[];
  impactData: InjuryLineImpact['homeTeamImpact'] | InjuryLineImpact['awayTeamImpact'];
  hasAdvantage: boolean;
}

function TeamInjuryList({ teamName, injuries, impactData, hasAdvantage }: TeamInjuryListProps) {
  const significantInjuries = injuries.filter(
    inj => ['out', 'doubtful', 'questionable', 'day-to-day'].includes(inj.status)
  );

  return (
    <div className={cn(
      "space-y-2 p-3 rounded-lg border",
      hasAdvantage ? "border-green-500/30 bg-green-500/5" : "border-border/50 bg-card/50"
    )}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">{teamName}</span>
          {hasAdvantage && (
            <Badge variant="outline" className="text-xs h-4 border-green-500/50 text-green-600">
              Healthier
            </Badge>
          )}
        </div>
        <span className="text-xs text-muted-foreground">
          -{impactData.overallImpact.toFixed(0)}% impact
        </span>
      </div>

      {/* Impact breakdown */}
      <div className="flex gap-3 text-xs">
        <div className="flex items-center gap-1 text-muted-foreground">
          <Sword className="h-3 w-3" />
          <span>Off: -{impactData.offensiveImpact.toFixed(0)}%</span>
        </div>
        <div className="flex items-center gap-1 text-muted-foreground">
          <Shield className="h-3 w-3" />
          <span>Def: -{impactData.defensiveImpact.toFixed(0)}%</span>
        </div>
      </div>

      {/* Injury list */}
      {significantInjuries.length > 0 ? (
        <div className="space-y-1.5">
          {significantInjuries.slice(0, 5).map((injury) => (
            <div 
              key={injury.id} 
              className="flex items-center justify-between text-xs bg-background/50 rounded px-2 py-1"
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <span className="font-medium truncate">{injury.playerName}</span>
                <span className="text-muted-foreground shrink-0">({injury.position})</span>
              </div>
              <Badge 
                variant="secondary" 
                className={cn("h-4 text-[10px] shrink-0", getStatusColor(injury.status))}
              >
                {formatStatus(injury.status)}
              </Badge>
            </div>
          ))}
          {significantInjuries.length > 5 && (
            <div className="text-xs text-muted-foreground text-center">
              +{significantInjuries.length - 5} more
            </div>
          )}
        </div>
      ) : (
        <div className="text-xs text-muted-foreground italic">No significant injuries</div>
      )}

      {/* Key players out */}
      {impactData.keyPlayersOut.length > 0 && (
        <div className="text-xs text-destructive flex items-center gap-1 mt-1">
          <AlertTriangle className="h-3 w-3" />
          <span>Key players out: {impactData.keyPlayersOut.map(p => p.playerName).join(', ')}</span>
        </div>
      )}
    </div>
  );
}

export function InjuryBreakdown({ 
  impact, 
  homeInjuries, 
  awayInjuries,
  homeTeamName,
  awayTeamName
}: InjuryBreakdownProps) {
  return (
    <Card className="border-border/50 bg-card/50">
      <CardHeader className="p-3 pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <AlertTriangle className="h-4 w-4 text-orange-500" />
          Injury Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 pt-0 space-y-3">
        {/* Summary */}
        <div className="text-xs text-muted-foreground bg-accent/30 rounded p-2">
          {impact.impactSummary}
        </div>

        {/* Team breakdowns side by side on larger screens */}
        <div className="grid gap-3 md:grid-cols-2">
          <TeamInjuryList 
            teamName={homeTeamName}
            injuries={homeInjuries}
            impactData={impact.homeTeamImpact}
            hasAdvantage={impact.advantageTeam === 'home'}
          />
          <TeamInjuryList 
            teamName={awayTeamName}
            injuries={awayInjuries}
            impactData={impact.awayTeamImpact}
            hasAdvantage={impact.advantageTeam === 'away'}
          />
        </div>

        {/* Line adjustments */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-accent/30 rounded p-2">
            <div className="text-xs text-muted-foreground">Spread Adj</div>
            <div className="font-mono font-medium text-sm">
              {impact.spreadAdjustment > 0 ? '+' : ''}{impact.spreadAdjustment.toFixed(1)}
            </div>
          </div>
          <div className="bg-accent/30 rounded p-2">
            <div className="text-xs text-muted-foreground">Total Adj</div>
            <div className="font-mono font-medium text-sm">
              {impact.totalAdjustment > 0 ? '+' : ''}{impact.totalAdjustment.toFixed(1)}
            </div>
          </div>
          <div className="bg-accent/30 rounded p-2">
            <div className="text-xs text-muted-foreground">ML Shift</div>
            <div className="font-mono font-medium text-sm">
              {impact.moneylineShift > 0 ? '+' : ''}{impact.moneylineShift.toFixed(0)}
            </div>
          </div>
        </div>

        {/* Value opportunity */}
        {impact.valueOpportunity && (
          <div className="flex items-center gap-2 p-2 rounded border border-green-500/30 bg-green-500/10">
            <TrendingUp className="h-4 w-4 text-green-600 shrink-0" />
            <div className="text-xs">
              <span className="font-medium text-green-600">Value Alert: </span>
              <span className="text-foreground">
                {impact.advantageTeam === 'home' ? homeTeamName : awayTeamName} {impact.valueOpportunity.direction} may have value 
                ({impact.valueOpportunity.edgePercentage.toFixed(1)}% edge)
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default InjuryBreakdown;
