
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { AlertTriangle, Activity, TrendingUp, TrendingDown } from 'lucide-react';
import { InjuryLineImpact } from '@/types/injuries';
import { getInjurySeverityColor, getInjurySeverityLabel } from '@/utils/injuries/injuryLineImpactCalculator';
import { cn } from '@/lib/utils';

interface InjuryImpactBadgeProps {
  impact: InjuryLineImpact | null;
  compact?: boolean;
  showSpread?: boolean;
  className?: string;
}

export function InjuryImpactBadge({ 
  impact, 
  compact = false, 
  showSpread = true,
  className 
}: InjuryImpactBadgeProps) {
  if (!impact) return null;
  
  const maxImpact = Math.max(
    impact.homeTeamImpact.overallImpact,
    impact.awayTeamImpact.overallImpact
  );
  
  // Don't show badge if impact is minimal
  if (maxImpact < 5) return null;
  
  const severityLabel = getInjurySeverityLabel(maxImpact);
  const severityColor = getInjurySeverityColor(maxImpact);
  
  const getBadgeVariant = () => {
    if (maxImpact >= 40) return 'destructive';
    if (maxImpact >= 25) return 'default';
    return 'secondary';
  };
  
  const getSpreadDisplay = () => {
    if (!showSpread || Math.abs(impact.spreadAdjustment) < 0.5) return null;
    const sign = impact.spreadAdjustment > 0 ? '+' : '';
    return `${sign}${impact.spreadAdjustment.toFixed(1)}`;
  };
  
  const spreadDisplay = getSpreadDisplay();
  
  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge 
              variant={getBadgeVariant()} 
              className={cn('gap-1 cursor-help', className)}
            >
              <AlertTriangle className="h-3 w-3" />
              INJ
              {spreadDisplay && <span className="font-mono text-xs">{spreadDisplay}</span>}
            </Badge>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <div className="space-y-2">
              <p className="font-semibold flex items-center gap-1">
                <Activity className="h-4 w-4" />
                Injury Impact: {severityLabel}
              </p>
              <div className="text-xs space-y-1">
                <p>
                  <span className="text-muted-foreground">Home:</span>{' '}
                  {impact.homeTeamImpact.keyPlayersOut.length} key players affected
                </p>
                <p>
                  <span className="text-muted-foreground">Away:</span>{' '}
                  {impact.awayTeamImpact.keyPlayersOut.length} key players affected
                </p>
                {spreadDisplay && (
                  <p className="pt-1 border-t border-border">
                    <span className="text-muted-foreground">Spread Adj:</span>{' '}
                    <span className="font-mono">{spreadDisplay}</span> points
                  </p>
                )}
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
  
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Badge variant={getBadgeVariant()} className="gap-1.5">
        <AlertTriangle className="h-3.5 w-3.5" />
        <span>{severityLabel} Injury Impact</span>
      </Badge>
      
      {spreadDisplay && (
        <Badge variant="outline" className="gap-1 font-mono">
          {impact.spreadAdjustment > 0 ? (
            <TrendingUp className="h-3 w-3 text-green-500" />
          ) : (
            <TrendingDown className="h-3 w-3 text-red-500" />
          )}
          Spread: {spreadDisplay}
        </Badge>
      )}
      
      {impact.valueOpportunity && (
        <Badge variant="outline" className="gap-1 border-green-500/50 text-green-600">
          <Activity className="h-3 w-3" />
          Value: {impact.valueOpportunity.direction.toUpperCase()}
        </Badge>
      )}
    </div>
  );
}

export default InjuryImpactBadge;
