
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Match } from "@/types/sports";
import { calculateSocialImpact } from "@/utils/predictions/factors/socialFactors";
import { SignalBadges } from "./SignalBadges";
import { Users, TrendingUp, TrendingDown, Minus, Brain, AlertCircle } from "lucide-react";

interface SocialFactorsCardProps {
  match: Match;
  compact?: boolean;
}

export function SocialFactorsCard({ match, compact = false }: SocialFactorsCardProps) {
  const socialImpact = calculateSocialImpact(match);
  
  const getEdgeIcon = () => {
    if (socialImpact.edgeDirection === 'home') return <TrendingUp className="h-4 w-4 text-green-400" />;
    if (socialImpact.edgeDirection === 'away') return <TrendingDown className="h-4 w-4 text-red-400" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };
  
  const getScoreColor = () => {
    if (socialImpact.score >= 65) return 'text-green-400';
    if (socialImpact.score <= 35) return 'text-red-400';
    return 'text-yellow-400';
  };
  
  if (compact) {
    return (
      <div className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
        <div className="flex items-center gap-2">
          <Brain className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">Social Intel</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-sm font-bold ${getScoreColor()}`}>
            {socialImpact.score}
          </span>
          {getEdgeIcon()}
        </div>
      </div>
    );
  }
  
  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Brain className="h-4 w-4 text-primary" />
          Social Intelligence
          <Badge variant="outline" className={getScoreColor()}>
            Score: {socialImpact.score}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Score Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span>{match.awayTeam?.name}</span>
            <span>{match.homeTeam?.name}</span>
          </div>
          <Progress 
            value={socialImpact.score} 
            className="h-2"
          />
        </div>
        
        {/* Edge Direction */}
        <div className="flex items-center justify-center gap-2 p-2 bg-muted/50 rounded">
          {getEdgeIcon()}
          <span className="text-sm">
            {socialImpact.edgeDirection === 'home' && `Favors ${match.homeTeam?.name}`}
            {socialImpact.edgeDirection === 'away' && `Favors ${match.awayTeam?.name}`}
            {socialImpact.edgeDirection === 'neutral' && 'Neutral outlook'}
          </span>
          {socialImpact.confidenceAdjustment !== 0 && (
            <Badge variant="secondary" className="text-xs">
              {socialImpact.confidenceAdjustment > 0 ? '+' : ''}{socialImpact.confidenceAdjustment}% conf
            </Badge>
          )}
        </div>
        
        {/* Key Signals */}
        {socialImpact.signals.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              Key Signals
            </p>
            <SignalBadges signals={socialImpact.signals} maxBadges={4} />
          </div>
        )}
        
        {/* Key Factors */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Impact Factors</p>
          <div className="grid grid-cols-2 gap-2">
            {socialImpact.factors.slice(0, 4).map((factor, idx) => (
              <div 
                key={idx}
                className="flex items-center justify-between p-2 bg-muted/30 rounded text-xs"
              >
                <span className="truncate">{factor.name}</span>
                <span className={factor.impact > 0 ? 'text-green-400' : factor.impact < 0 ? 'text-red-400' : 'text-muted-foreground'}>
                  {factor.impact > 0 ? '+' : ''}{factor.impact.toFixed(1)}
                </span>
              </div>
            ))}
          </div>
        </div>
        
        {/* Recommendation */}
        <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
          <p className="text-xs text-muted-foreground mb-1">AI Analysis</p>
          <p className="text-sm">{socialImpact.recommendation}</p>
        </div>
      </CardContent>
    </Card>
  );
}
