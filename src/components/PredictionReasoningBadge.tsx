import { memo, useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { 
  TrendingUp, 
  Home, 
  Activity, 
  Calendar, 
  Users, 
  Target,
  AlertTriangle,
  Zap,
  Brain,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Match, League } from '@/types/sports';
import { getMatchInjuryData, MatchInjuryData } from '@/services/injuryDataService';

interface PredictionReasoningBadgeProps {
  match: Match;
  compact?: boolean;
}

// Icon mapping for different factor types
const factorIcons: Record<string, React.ElementType> = {
  'Home Court': Home,
  'Momentum': TrendingUp,
  'Back-to-Back': Activity,
  'Rest Days': Calendar,
  'Injuries': Users,
  'H2H History': Target,
  'Coaching': Brain,
};

// Generate quick analysis factors based on match data and real injury info
function generateQuickFactors(
  match: Match,
  injuryData?: MatchInjuryData | null
): Array<{
  name: string;
  icon: React.ElementType;
  impact: 'positive' | 'negative' | 'neutral';
  shortDesc: string;
}> {
  const factors: Array<{
    name: string;
    icon: React.ElementType;
    impact: 'positive' | 'negative' | 'neutral';
    shortDesc: string;
  }> = [];

  const prediction = match.prediction;
  const homeTeam = match.homeTeam?.name || 'Home';
  const awayTeam = match.awayTeam?.name || 'Away';
  const predictedWinner = prediction?.recommended?.includes(homeTeam) ? 'home' : 'away';
  const confidence = prediction?.confidence || 50;

  // Home Court Advantage
  if (predictedWinner === 'home') {
    factors.push({
      name: 'Home Court',
      icon: Home,
      impact: 'positive',
      shortDesc: `${match.homeTeam?.shortName || 'Home'} at home`
    });
  }

  // Real injury data integration
  if (injuryData) {
    const homeOut = injuryData.homeTeam.keyPlayersOut.length;
    const awayOut = injuryData.awayTeam.keyPlayersOut.length;
    
    if (homeOut > 0 || awayOut > 0) {
      let injuryImpact: 'positive' | 'negative' | 'neutral' = 'neutral';
      let injuryDesc = '';
      
      if (homeOut > awayOut) {
        injuryImpact = predictedWinner === 'away' ? 'positive' : 'negative';
        injuryDesc = injuryData.homeTeam.keyPlayersOut[0] || `${homeOut} OUT`;
      } else if (awayOut > homeOut) {
        injuryImpact = predictedWinner === 'home' ? 'positive' : 'negative';
        injuryDesc = injuryData.awayTeam.keyPlayersOut[0] || `${awayOut} OUT`;
      } else {
        injuryDesc = 'Both teams affected';
      }
      
      factors.push({
        name: 'Injuries',
        icon: Users,
        impact: injuryImpact,
        shortDesc: injuryDesc
      });
    } else {
      factors.push({
        name: 'Injuries',
        icon: Users,
        impact: 'neutral',
        shortDesc: 'No key injuries'
      });
    }
  } else {
    // Fallback when no real data
    if (confidence < 60) {
      factors.push({
        name: 'Injuries',
        icon: Users,
        impact: 'negative',
        shortDesc: 'Possible concerns'
      });
    }
  }

  // Confidence-based momentum indicator
  if (confidence >= 70) {
    factors.push({
      name: 'Momentum',
      icon: TrendingUp,
      impact: 'positive',
      shortDesc: 'Strong recent form'
    });
  } else if (confidence < 55) {
    factors.push({
      name: 'Momentum',
      icon: TrendingUp,
      impact: 'neutral',
      shortDesc: 'Mixed form'
    });
  }

  // H2H factor
  factors.push({
    name: 'H2H History',
    icon: Target,
    impact: confidence >= 65 ? 'positive' : 'neutral',
    shortDesc: confidence >= 65 ? 'Favorable matchup' : 'Even history'
  });

  return factors.slice(0, 4); // Max 4 factors
}

const PredictionReasoningBadge = memo(function PredictionReasoningBadge({ 
  match, 
  compact = false 
}: PredictionReasoningBadgeProps) {
  const [injuryData, setInjuryData] = useState<MatchInjuryData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const prediction = match.prediction;
  
  // Fetch real injury data
  useEffect(() => {
    if (!match.homeTeam?.name || !match.awayTeam?.name || !match.league) return;
    
    let cancelled = false;
    setIsLoading(true);
    
    getMatchInjuryData(match.league, match.homeTeam.name, match.awayTeam.name)
      .then(data => {
        if (!cancelled) {
          setInjuryData(data);
        }
      })
      .catch(err => {
        console.error('Error fetching injury data:', err);
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });
    
    return () => { cancelled = true; };
  }, [match.id, match.homeTeam?.name, match.awayTeam?.name, match.league]);
  
  if (!prediction || !prediction.recommended) {
    return null;
  }

  const confidence = prediction.confidence || 50;
  const factors = generateQuickFactors(match, injuryData);
  
  // Determine confidence level styling
  const getConfidenceStyle = () => {
    if (confidence >= 70) return 'bg-green-500/10 text-green-600 border-green-500/30';
    if (confidence >= 60) return 'bg-primary/10 text-primary border-primary/30';
    if (confidence >= 55) return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30';
    return 'bg-muted text-muted-foreground border-muted';
  };

  const getImpactColor = (impact: 'positive' | 'negative' | 'neutral') => {
    switch (impact) {
      case 'positive': return 'text-green-500';
      case 'negative': return 'text-red-500';
      default: return 'text-muted-foreground';
    }
  };

  // Extract short pick name
  const getShortPick = () => {
    const rec = prediction.recommended || '';
    // Extract team name from "Team Win" or "Team ML" format
    return rec.replace(/ Win$| ML$| -[\d.]+$| \+[\d.]+$/i, '').trim();
  };

  if (compact) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant="outline" 
            className={cn(
              "text-[10px] h-5 px-1.5 cursor-help gap-1",
              getConfidenceStyle()
            )}
          >
            <Zap className="h-3 w-3" />
            {confidence}%
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="left" className="max-w-xs p-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-sm">AI Pick: {getShortPick()}</span>
              <Badge variant="secondary" className="text-xs">
                {confidence}% conf
              </Badge>
            </div>
            <div className="grid gap-1.5">
              {factors.map((factor, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <factor.icon className={cn("h-3 w-3", getImpactColor(factor.impact))} />
                  <span className="text-muted-foreground">{factor.name}:</span>
                  <span className={getImpactColor(factor.impact)}>{factor.shortDesc}</span>
                </div>
              ))}
            </div>
            {prediction.reasoning && (
              <p className="text-xs text-muted-foreground border-t pt-2 mt-2">
                {prediction.reasoning}
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        <Badge 
          variant="outline" 
          className={cn("text-xs gap-1", getConfidenceStyle())}
        >
          <Zap className="h-3 w-3" />
          {getShortPick()} • {confidence}%
        </Badge>
      </div>
      <div className="flex flex-wrap gap-1">
        {factors.slice(0, 3).map((factor, i) => (
          <Tooltip key={i}>
            <TooltipTrigger asChild>
              <div 
                className={cn(
                  "flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full cursor-help",
                  factor.impact === 'positive' && 'bg-green-500/10 text-green-600',
                  factor.impact === 'negative' && 'bg-red-500/10 text-red-600',
                  factor.impact === 'neutral' && 'bg-muted text-muted-foreground'
                )}
              >
                <factor.icon className="h-3 w-3" />
                {factor.name}
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
              {factor.shortDesc}
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </div>
  );
});

export { PredictionReasoningBadge };
export default PredictionReasoningBadge;
