// Individual Spotlight Pick Card - displays one high-value pick

import { Match } from '@/types/sports';
import { cn } from '@/lib/utils';
import { TrendingUp, Target, Zap, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { format, parseISO } from 'date-fns';

export interface SpotlightPick {
  match: Match;
  recommendation: 'home' | 'away';
  recommendedTeam: string;
  confidence: number;
  evPercentage: number;
  odds: number;
  reasoning: string;
  algorithmName: string;
}

interface SpotlightPickCardProps {
  pick: SpotlightPick;
  index: number;
  onViewMatch?: (match: Match) => void;
}

export function SpotlightPickCard({ pick, index, onViewMatch }: SpotlightPickCardProps) {
  const { match, recommendedTeam, confidence, evPercentage, odds, reasoning, algorithmName } = pick;
  
  // Format odds for display
  const formattedOdds = odds > 0 ? `+${odds}` : String(odds);
  
  // Determine confidence tier for styling
  const confidenceTier = confidence >= 80 ? 'elite' : confidence >= 70 ? 'strong' : 'solid';
  
  const tierConfig = {
    elite: {
      border: 'border-amber-500/50',
      bg: 'bg-gradient-to-br from-amber-500/10 via-primary/5 to-transparent',
      glow: 'shadow-amber-500/20',
      badge: 'bg-amber-500/20 text-amber-400',
    },
    strong: {
      border: 'border-emerald-500/40',
      bg: 'bg-gradient-to-br from-emerald-500/10 via-primary/5 to-transparent',
      glow: 'shadow-emerald-500/15',
      badge: 'bg-emerald-500/20 text-emerald-400',
    },
    solid: {
      border: 'border-primary/30',
      bg: 'bg-gradient-to-br from-primary/10 via-primary/5 to-transparent',
      glow: 'shadow-primary/10',
      badge: 'bg-primary/20 text-primary',
    },
  };
  
  const config = tierConfig[confidenceTier];
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
      className={cn(
        "relative flex-shrink-0 w-[320px] rounded-xl border p-4 cursor-pointer",
        "hover:scale-[1.02] hover:shadow-lg transition-all duration-200",
        config.border,
        config.bg,
        `shadow-md ${config.glow}`
      )}
      onClick={() => onViewMatch?.(match)}
    >
      {/* Rank badge */}
      <div className="absolute -top-2 -left-2 w-7 h-7 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold shadow-lg">
        #{index + 1}
      </div>
      
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-xs text-muted-foreground font-medium flex items-center gap-1">
            <Target className="h-3 w-3" />
            {algorithmName}
          </p>
          <Badge variant="outline" className="mt-1 text-[10px]">
            {match.league}
          </Badge>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">
            {format(parseISO(match.startTime), 'MMM d, h:mm a')}
          </p>
        </div>
      </div>
      
      {/* Match info */}
      <div className="mb-3">
        <p className="text-sm text-muted-foreground">
          {match.homeTeam.shortName || match.homeTeam.name} vs {match.awayTeam.shortName || match.awayTeam.name}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <Zap className="h-4 w-4 text-primary" />
          <p className="text-base font-bold text-foreground">
            {recommendedTeam}
          </p>
          <Badge className={cn("text-xs font-mono", config.badge)}>
            {formattedOdds}
          </Badge>
        </div>
      </div>
      
      {/* Stats row */}
      <div className="flex items-center gap-4 mb-3">
        <div className="flex items-center gap-1.5">
          <Target className="h-3.5 w-3.5 text-primary" />
          <span className="text-sm font-semibold">{confidence.toFixed(0)}%</span>
          <span className="text-xs text-muted-foreground">conf</span>
        </div>
        <div className="flex items-center gap-1.5">
          <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
          <span className="text-sm font-semibold text-emerald-500">+{evPercentage.toFixed(1)}%</span>
          <span className="text-xs text-muted-foreground">EV</span>
        </div>
      </div>
      
      {/* Reasoning */}
      <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
        {reasoning}
      </p>
      
      {/* Action */}
      <Button 
        variant="ghost" 
        size="sm" 
        className="w-full h-8 text-xs text-primary hover:bg-primary/10"
        onClick={(e) => {
          e.stopPropagation();
          onViewMatch?.(match);
        }}
      >
        View Analysis
        <ArrowRight className="h-3 w-3 ml-1" />
      </Button>
    </motion.div>
  );
}
