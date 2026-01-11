
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  Activity, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown,
  Target,
  ArrowRight,
  User,
  Minus
} from 'lucide-react';
import { InjuryLineImpact } from '@/types/injuries';
import { Match } from '@/types/sports';
import { 
  getInjurySeverityColor, 
  getInjurySeverityLabel 
} from '@/utils/injuries/injuryLineImpactCalculator';
import { cn } from '@/lib/utils';

interface InjuryLineAdjustmentCardProps {
  impact: InjuryLineImpact;
  match: Match;
  showDetails?: boolean;
}

export function InjuryLineAdjustmentCard({ 
  impact, 
  match, 
  showDetails = true 
}: InjuryLineAdjustmentCardProps) {
  const hasSpreadAdjustment = Math.abs(impact.spreadAdjustment) >= 0.5;
  const hasTotalAdjustment = Math.abs(impact.totalAdjustment) >= 1;
  const hasMoneylineShift = Math.abs(impact.moneylineShift) >= 5;
  
  // Get current spread from match data
  const currentSpread = match.liveOdds?.[0]?.spread?.homeSpread ?? 0;
  const adjustedSpread = currentSpread + impact.spreadAdjustment;
  
  // Get current total from match data
  const currentTotal = match.liveOdds?.[0]?.totals?.total ?? 0;
  const adjustedTotal = currentTotal + impact.totalAdjustment;
  
  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            Injury Line Impact
          </CardTitle>
          <Badge 
            variant={impact.confidenceLevel === 'high' ? 'default' : 'secondary'}
            className="text-xs"
          >
            {impact.confidenceLevel.toUpperCase()} Confidence
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Team Impact Summary */}
        <div className="grid grid-cols-2 gap-4">
          <TeamImpactSection 
            teamName={match.homeTeam.shortName}
            impact={impact.homeTeamImpact.overallImpact}
            playersAffected={impact.homeTeamImpact.totalPlayersAffected}
            keyPlayers={impact.homeTeamImpact.keyPlayersOut}
          />
          <TeamImpactSection 
            teamName={match.awayTeam.shortName}
            impact={impact.awayTeamImpact.overallImpact}
            playersAffected={impact.awayTeamImpact.totalPlayersAffected}
            keyPlayers={impact.awayTeamImpact.keyPlayersOut}
          />
        </div>
        
        <Separator />
        
        {/* Line Adjustments */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground">Line Adjustments</h4>
          
          {/* Spread */}
          <div className="flex items-center justify-between p-2 rounded-lg bg-accent/30">
            <span className="text-sm font-medium">SPREAD</span>
            <div className="flex items-center gap-2">
              {hasSpreadAdjustment ? (
                <>
                  <span className="text-sm text-muted-foreground font-mono">
                    {match.homeTeam.shortName} {currentSpread >= 0 ? '+' : ''}{currentSpread.toFixed(1)}
                  </span>
                  <ArrowRight className="h-3 w-3 text-muted-foreground" />
                  <Badge variant="outline" className="font-mono gap-1">
                    {impact.spreadAdjustment > 0 ? (
                      <TrendingUp className="h-3 w-3 text-green-500" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-red-500" />
                    )}
                    {adjustedSpread >= 0 ? '+' : ''}{adjustedSpread.toFixed(1)}
                    <span className="text-xs text-muted-foreground ml-1">
                      ({impact.spreadAdjustment > 0 ? '+' : ''}{impact.spreadAdjustment.toFixed(1)})
                    </span>
                  </Badge>
                </>
              ) : (
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <Minus className="h-3 w-3" />
                  No adjustment
                </span>
              )}
            </div>
          </div>
          
          {/* Total */}
          <div className="flex items-center justify-between p-2 rounded-lg bg-accent/30">
            <span className="text-sm font-medium">TOTAL</span>
            <div className="flex items-center gap-2">
              {hasTotalAdjustment ? (
                <>
                  <span className="text-sm text-muted-foreground font-mono">
                    O/U {currentTotal.toFixed(1)}
                  </span>
                  <ArrowRight className="h-3 w-3 text-muted-foreground" />
                  <Badge variant="outline" className="font-mono gap-1">
                    {impact.totalAdjustment < 0 ? (
                      <TrendingDown className="h-3 w-3 text-amber-500" />
                    ) : (
                      <TrendingUp className="h-3 w-3 text-green-500" />
                    )}
                    {adjustedTotal.toFixed(1)}
                    <span className="text-xs text-muted-foreground ml-1">
                      ({impact.totalAdjustment > 0 ? '+' : ''}{impact.totalAdjustment.toFixed(1)})
                    </span>
                  </Badge>
                </>
              ) : (
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <Minus className="h-3 w-3" />
                  No adjustment
                </span>
              )}
            </div>
          </div>
          
          {/* Moneyline */}
          {hasMoneylineShift && (
            <div className="flex items-center justify-between p-2 rounded-lg bg-accent/30">
              <span className="text-sm font-medium">MONEYLINE</span>
              <Badge variant="outline" className="font-mono gap-1">
                {impact.advantageTeam === 'home' ? (
                  <TrendingUp className="h-3 w-3 text-green-500" />
                ) : impact.advantageTeam === 'away' ? (
                  <TrendingDown className="h-3 w-3 text-red-500" />
                ) : (
                  <Minus className="h-3 w-3" />
                )}
                {impact.advantageTeam === 'home' 
                  ? `${match.homeTeam.shortName} +${Math.abs(impact.moneylineShift)}` 
                  : impact.advantageTeam === 'away'
                  ? `${match.awayTeam.shortName} +${Math.abs(impact.moneylineShift)}`
                  : 'Even'}
              </Badge>
            </div>
          )}
        </div>
        
        {/* Value Opportunity */}
        {impact.valueOpportunity && (
          <>
            <Separator />
            <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Target className="h-4 w-4 text-green-500" />
                <span className="font-medium text-green-600">Value Opportunity Detected</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {impact.valueOpportunity.reasoning}
              </p>
              <div className="mt-2 flex items-center gap-2">
                <Badge variant="outline" className="border-green-500/50">
                  {impact.valueOpportunity.betType.toUpperCase()}
                </Badge>
                <Badge variant="outline" className="border-green-500/50">
                  {impact.valueOpportunity.direction.toUpperCase()}
                </Badge>
                <Badge className="bg-green-500/20 text-green-600">
                  +{impact.valueOpportunity.edgePercentage.toFixed(1)}% Edge
                </Badge>
              </div>
            </div>
          </>
        )}
        
        {/* Summary */}
        {showDetails && impact.impactSummary && (
          <p className="text-xs text-muted-foreground italic">
            {impact.impactSummary}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

interface TeamImpactSectionProps {
  teamName: string;
  impact: number;
  playersAffected: number;
  keyPlayers: Array<{ playerName: string; status: string; position: string }>;
}

function TeamImpactSection({ 
  teamName, 
  impact, 
  playersAffected, 
  keyPlayers 
}: TeamImpactSectionProps) {
  const severityColor = getInjurySeverityColor(impact);
  const severityLabel = getInjurySeverityLabel(impact);
  
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{teamName}</span>
        <Badge variant="outline" className={cn('text-xs', severityColor)}>
          {severityLabel}
        </Badge>
      </div>
      
      <Progress 
        value={Math.min(impact, 100)} 
        className="h-2"
      />
      
      <div className="text-xs text-muted-foreground">
        {playersAffected} player{playersAffected !== 1 ? 's' : ''} affected
      </div>
      
      {keyPlayers.length > 0 && (
        <div className="space-y-1">
          {keyPlayers.slice(0, 2).map((player, idx) => (
            <div key={idx} className="flex items-center gap-1 text-xs">
              <User className="h-3 w-3 text-muted-foreground" />
              <span className="truncate">{player.playerName}</span>
              <Badge variant="destructive" className="h-4 text-[10px] px-1">
                {player.status.toUpperCase()}
              </Badge>
            </div>
          ))}
          {keyPlayers.length > 2 && (
            <span className="text-xs text-muted-foreground">
              +{keyPlayers.length - 2} more
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export default InjuryLineAdjustmentCard;
