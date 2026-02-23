
import React, { useState } from "react";
import { Match } from "@/types/sports";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import SmartScoreCard from "./SmartScoreCard";
import { hasArbitrageOpportunity } from "@/utils/smartScore/arbitrageFactors";
// toast import removed - no longer used in this component
import { AlertTriangle, TrendingUp } from "lucide-react";
import { InfoExplainer } from "@/components/ui/InfoExplainer";
import { CalibrationStatusIndicator } from "@/components/ModelCalibration";

interface Props {
  matches: Match[];
}

const SmartScoreSection = ({ matches }: Props) => {
  const [alertedMatches, setAlertedMatches] = useState<Set<string>>(new Set());

  // Filter matches to only include those with smart scores
  const matchesWithScores = matches.filter(match => match.smartScore);

  // Find top scoring match for display
  const topMatch = matchesWithScores.length > 0
    ? matchesWithScores.reduce((prev, current) => 
        (current.smartScore?.overall || 0) > (prev.smartScore?.overall || 0) ? current : prev
      )
    : null;

  // Track arbitrage opportunities (no toast notifications)
  React.useEffect(() => {
    matches.forEach(match => {
      if (match.smartScore?.hasArbitrageOpportunity && !alertedMatches.has(match.id)) {
        // Update the set of already alerted matches (no toast)
        setAlertedMatches(prev => new Set([...prev, match.id]));
      }
    });
  }, [matches, alertedMatches]);

  // If no matches have smart scores, don't render this section
  if (matchesWithScores.length === 0) return null;

  // Count of arbitrage opportunities
  const arbitrageCount = matches.filter(m => 
    m.smartScore?.hasArbitrageOpportunity
  ).length;

  return (
    <Card className="mb-6">
      <CardHeader className="pb-2">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <h2 className="text-xl font-bold flex items-center gap-2">
            SmartScore™ Analysis
            <InfoExplainer term="smart_score" size="md" />
            {arbitrageCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                <AlertTriangle size={14} className="mr-1" />
                {arbitrageCount} Arbitrage Alert{arbitrageCount > 1 ? 's' : ''}
                <InfoExplainer term="arbitrage" size="sm" className="ml-1" />
              </Badge>
            )}
          </h2>
          <div className="flex items-center gap-2">
            <CalibrationStatusIndicator />
            <Badge variant="outline" className="bg-muted">
              AI-Powered Insights
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {topMatch && (
          <div className="mb-4">
            <h3 className="text-sm uppercase font-semibold text-muted-foreground mb-2 flex items-center">
              <TrendingUp size={16} className="mr-1" />
              Top Rated Match
            </h3>
            <SmartScoreCard match={topMatch} showArbitrageAlert={true} />
          </div>
        )}
        
        {matchesWithScores.length > 1 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            {matchesWithScores
              .filter(m => m.id !== topMatch?.id)
              .slice(0, 3)
              .map(match => (
                <SmartScoreCard key={match.id} match={match} showArbitrageAlert={true} />
              ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SmartScoreSection;
