
import React, { useState } from "react";
import { Match } from "@/types/sports";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import SmartScoreCard from "./SmartScoreCard";
import { hasArbitrageOpportunity } from "@/utils/smartScore/arbitrageFactors";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle, TrendingUp } from "lucide-react";

interface Props {
  matches: Match[];
}

const SmartScoreSection = ({ matches }: Props) => {
  const { toast } = useToast();
  const [alertedMatches, setAlertedMatches] = useState<Set<string>>(new Set());

  // Filter matches to only include those with smart scores
  const matchesWithScores = matches.filter(match => match.smartScore);

  // Find top scoring match for display
  const topMatch = matchesWithScores.length > 0
    ? matchesWithScores.reduce((prev, current) => 
        (current.smartScore?.overall || 0) > (prev.smartScore?.overall || 0) ? current : prev
      )
    : null;

  // Check for arbitrage opportunities
  React.useEffect(() => {
    matches.forEach(match => {
      if (match.smartScore?.hasArbitrageOpportunity && !alertedMatches.has(match.id)) {
        // Show toast for arbitrage opportunity
        toast({
          title: "Arbitrage Opportunity Detected!",
          description: `${match.homeTeam.shortName} vs ${match.awayTeam.shortName} has a potential arbitrage opportunity.`,
          variant: "default",
          duration: 6000,
        });
        
        // Update the set of already alerted matches
        setAlertedMatches(prev => new Set([...prev, match.id]));
      }
    });
  }, [matches, toast, alertedMatches]);

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
            {arbitrageCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                <AlertTriangle size={14} className="mr-1" />
                {arbitrageCount} Arbitrage Alert{arbitrageCount > 1 ? 's' : ''}
              </Badge>
            )}
          </h2>
          <div className="flex items-center gap-2">
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
