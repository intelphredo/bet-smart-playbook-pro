
import React from "react";
import { Match } from "@/types/sports";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import SmartScoreCard from "./SmartScoreCard";
import { calculateSmartScore, applySmartScores } from "@/utils/smartScoreCalculator";
import { ChartLineUp } from "lucide-react";

interface SmartScoreSectionProps {
  matches: Match[];
}

const SmartScoreSection = ({ matches }: SmartScoreSectionProps) => {
  // Apply smart scores to matches if needed
  const matchesWithScores = React.useMemo(() => {
    return matches.map(match => {
      if (!match.smartScore) {
        return {
          ...match,
          smartScore: calculateSmartScore(match)
        };
      }
      return match;
    });
  }, [matches]);

  // Filter for matches with high smart scores
  const highValueMatches = React.useMemo(() => {
    return matchesWithScores
      .filter(match => match.smartScore && match.smartScore.overall >= 70)
      .sort((a, b) => (b.smartScore?.overall || 0) - (a.smartScore?.overall || 0))
      .slice(0, 3); // Take top 3
  }, [matchesWithScores]);

  if (highValueMatches.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h2 className="text-2xl font-bold">Smart Score™ Analysis</h2>
        <Badge className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
          Premium
        </Badge>
      </div>
      
      <div className="flex items-center gap-1 mb-4">
        <ChartLineUp className="h-4 w-4 text-blue-500" />
        <p className="text-sm text-muted-foreground">
          Our exclusive SmartScore™ algorithm analyzes multiple factors to identify the best betting opportunities
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {highValueMatches.map(match => (
          <SmartScoreCard key={match.id} match={match} />
        ))}
      </div>
    </div>
  );
};

export default SmartScoreSection;
