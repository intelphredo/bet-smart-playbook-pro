// Spotlight Value Picks Header - Curates 1-3 best picks for the day

import { useMemo } from 'react';
import { Match } from '@/types/sports';
import { SpotlightPickCard, SpotlightPick } from './SpotlightPickCard';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Crown, Sparkles, Flame } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface SpotlightHeaderProps {
  matches: Match[];
  onViewMatch?: (match: Match) => void;
  maxPicks?: number;
  minConfidence?: number;
  minEV?: number;
}

// Generate reasoning based on match data
function generateReasoning(match: Match, recommendation: 'home' | 'away'): string {
  const prediction = match.prediction;
  const smartScore = match.smartScore;
  const team = recommendation === 'home' ? match.homeTeam.name : match.awayTeam.name;
  
  const factors: string[] = [];
  
  if (prediction?.confidence && prediction.confidence >= 75) {
    factors.push(`Strong model confidence at ${prediction.confidence.toFixed(0)}%`);
  }
  
  if (prediction?.evPercentage && prediction.evPercentage >= 5) {
    factors.push(`+${prediction.evPercentage.toFixed(1)}% expected value edge`);
  }
  
  if (smartScore?.overall && smartScore.overall >= 70) {
    factors.push(`High SmartScore of ${smartScore.overall.toFixed(0)}`);
  }
  
  // Check momentum from components if available
  if (smartScore?.components?.momentum && smartScore.components.momentum >= 60) {
    factors.push('Strong recent momentum');
  }
  
  if (prediction?.projectedScore) {
    const margin = Math.abs(prediction.projectedScore.home - prediction.projectedScore.away);
    if (margin >= 5) {
      factors.push(`Projected ${margin.toFixed(1)} point margin`);
    }
  }
  
  if (factors.length === 0) {
    return `Our algorithms favor ${team} based on current metrics and trends.`;
  }
  
  return factors.slice(0, 2).join('. ') + '.';
}

// Determine algorithm name from prediction source
function getAlgorithmName(match: Match): string {
  const prediction = match.prediction;
  // Use algorithmId if available
  if (prediction?.algorithmId) {
    // Map common algorithm IDs to readable names
    const algorithmMap: Record<string, string> = {
      'ml-power-index': 'ML Power Index',
      'value-pick-finder': 'Value Pick Finder',
      'statistical-edge': 'Statistical Edge',
    };
    return algorithmMap[prediction.algorithmId] || prediction.algorithmId;
  }
  
  // Infer from confidence level
  if (prediction?.confidence && prediction.confidence >= 80) {
    return 'ML Power Index';
  }
  if (prediction?.evPercentage && prediction.evPercentage >= 8) {
    return 'Value Pick Finder';
  }
  return 'Statistical Edge';
}

export function SpotlightHeader({ 
  matches, 
  onViewMatch,
  maxPicks = 3,
  minConfidence = 65,
  minEV = 3
}: SpotlightHeaderProps) {
  
  // Curate top picks based on conviction + value
  const spotlightPicks = useMemo((): SpotlightPick[] => {
    if (!Array.isArray(matches) || matches.length === 0) return [];
    
    // Score each match for spotlight worthiness
    const scoredMatches = matches
      .filter(match => {
        const confidence = match.prediction?.confidence || 0;
        const ev = match.prediction?.evPercentage || 0;
        const hasRecommendation = match.prediction?.recommended;
        return confidence >= minConfidence && ev >= minEV && hasRecommendation;
      })
      .map(match => {
        const prediction = match.prediction!;
        const confidence = prediction.confidence || 0;
        const evPercentage = prediction.evPercentage || 0;
        const smartScore = match.smartScore?.overall || 50;
        
        // Calculate composite score (weighted combination)
        const compositeScore = (
          confidence * 0.35 +
          (evPercentage * 5) * 0.35 + // Scale EV to be comparable
          smartScore * 0.30
        );
        
        const recommendation = prediction.recommended as 'home' | 'away';
        const recommendedTeam = recommendation === 'home' 
          ? match.homeTeam.name 
          : match.awayTeam.name;
        const odds = recommendation === 'home' 
          ? match.odds.homeWin 
          : match.odds.awayWin;
        
        return {
          match,
          recommendation,
          recommendedTeam,
          confidence,
          evPercentage,
          odds: odds || 0,
          reasoning: generateReasoning(match, recommendation),
          algorithmName: getAlgorithmName(match),
          compositeScore,
        };
      })
      // Sort by composite score (highest first)
      .sort((a, b) => b.compositeScore - a.compositeScore)
      .slice(0, maxPicks);
    
    // Remove compositeScore from final output
    return scoredMatches.map(({ compositeScore, ...pick }) => pick);
  }, [matches, maxPicks, minConfidence, minEV]);
  
  if (spotlightPicks.length === 0) {
    return null;
  }
  
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="mb-6"
      >
        <Card className="overflow-hidden border-primary/20 bg-gradient-to-r from-primary/5 via-background to-amber-500/5">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-primary/10 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Crown className="h-5 w-5 text-amber-500" />
                <Sparkles className="absolute -top-1 -right-1 h-3 w-3 text-amber-400 animate-pulse" />
              </div>
              <div>
                <h3 className="text-sm font-bold flex items-center gap-2">
                  <span className="bg-gradient-to-r from-amber-500 to-primary bg-clip-text text-transparent">
                    Spotlight Value Picks
                  </span>
                  <Badge variant="outline" className="text-[10px] border-amber-500/40 text-amber-500">
                    AI Curated
                  </Badge>
                </h3>
                <p className="text-xs text-muted-foreground">
                  Today's highest-conviction, highest-value opportunities
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Flame className="h-4 w-4 text-orange-500 animate-pulse" />
              <Badge className="bg-gradient-to-r from-amber-500/20 to-primary/20 text-amber-400 border-0">
                {spotlightPicks.length} {spotlightPicks.length === 1 ? 'Pick' : 'Picks'}
              </Badge>
            </div>
          </div>
          
          {/* Picks carousel */}
          <ScrollArea className="w-full">
            <div className="flex gap-4 p-4">
              {spotlightPicks.map((pick, index) => (
                <SpotlightPickCard 
                  key={pick.match.id}
                  pick={pick}
                  index={index}
                  onViewMatch={onViewMatch}
                />
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}
