import React, { useState, useEffect, useMemo } from 'react';
import { Match } from '@/types/sports';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { 
  X, 
  Bell, 
  Target, 
  Zap, 
  DollarSign, 
  TrendingUp,
  ChevronRight,
  Flame
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface HighValueAlertBannerProps {
  matches: Match[];
  confidenceThreshold?: number;
  smartScoreThreshold?: number;
  evThreshold?: number;
  maxAlerts?: number;
  onMatchClick?: (match: Match) => void;
}

interface AlertItem {
  id: string;
  type: 'high_confidence' | 'smart_score' | 'positive_ev' | 'arbitrage';
  match: Match;
  value: number;
  label: string;
}

const ALERT_CONFIG = {
  high_confidence: {
    icon: Target,
    color: 'text-green-500',
    bg: 'bg-green-500/10',
    border: 'border-green-500/30',
    label: 'High Confidence',
  },
  smart_score: {
    icon: Zap,
    color: 'text-yellow-500',
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/30',
    label: 'High SmartScore',
  },
  positive_ev: {
    icon: TrendingUp,
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    label: '+EV',
  },
  arbitrage: {
    icon: DollarSign,
    color: 'text-purple-500',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/30',
    label: 'Arbitrage',
  },
};

export const HighValueAlertBanner: React.FC<HighValueAlertBannerProps> = ({
  matches,
  confidenceThreshold = 75,
  smartScoreThreshold = 70,
  evThreshold = 5,
  maxAlerts = 5,
  onMatchClick,
}) => {
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [isExpanded, setIsExpanded] = useState(true);

  const alerts = useMemo((): AlertItem[] => {
    const items: AlertItem[] = [];

    matches.forEach((match) => {
      const confidence = match.prediction?.confidence || 0;
      const smartScore = match.smartScore?.overall || 0;
      const evPercentage = match.prediction?.evPercentage || 0;
      const hasArbitrage = match.smartScore?.hasArbitrageOpportunity || false;

      // Arbitrage is highest priority
      if (hasArbitrage) {
        items.push({
          id: `arb_${match.id}`,
          type: 'arbitrage',
          match,
          value: 100,
          label: 'Risk-free profit available',
        });
      }

      // Positive EV
      if (evPercentage >= evThreshold) {
        items.push({
          id: `ev_${match.id}`,
          type: 'positive_ev',
          match,
          value: evPercentage,
          label: `+${evPercentage.toFixed(1)}% EV`,
        });
      }

      // High confidence
      if (confidence >= confidenceThreshold) {
        items.push({
          id: `conf_${match.id}`,
          type: 'high_confidence',
          match,
          value: confidence,
          label: `${Math.round(confidence)}% confidence`,
        });
      }

      // High SmartScore
      if (smartScore >= smartScoreThreshold) {
        items.push({
          id: `ss_${match.id}`,
          type: 'smart_score',
          match,
          value: smartScore,
          label: `SmartScore: ${Math.round(smartScore)}`,
        });
      }
    });

    // Sort by value (highest first) and limit
    return items
      .filter((item) => !dismissedIds.has(item.id))
      .sort((a, b) => b.value - a.value)
      .slice(0, maxAlerts);
  }, [matches, confidenceThreshold, smartScoreThreshold, evThreshold, maxAlerts, dismissedIds]);

  const dismissAlert = (id: string) => {
    setDismissedIds((prev) => new Set([...prev, id]));
  };

  const dismissAll = () => {
    setDismissedIds(new Set(alerts.map((a) => a.id)));
  };

  if (alerts.length === 0) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="mb-4"
      >
        <Card className="border-primary/30 bg-gradient-to-r from-primary/5 via-background to-accent/5 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-border/50 bg-muted/30">
            <div className="flex items-center gap-2">
              <div className="relative">
                <Bell className="h-4 w-4 text-primary" />
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-destructive rounded-full animate-pulse" />
              </div>
              <span className="text-sm font-medium">High-Value Opportunities</span>
              <Badge variant="secondary" className="text-xs">
                {alerts.length} active
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-muted-foreground"
                onClick={dismissAll}
              >
                Dismiss all
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                <ChevronRight className={cn(
                  "h-4 w-4 transition-transform",
                  isExpanded && "rotate-90"
                )} />
              </Button>
            </div>
          </div>

          {/* Alerts List */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: 'auto' }}
                exit={{ height: 0 }}
                className="overflow-hidden"
              >
                <ScrollArea className="w-full">
                  <div className="flex gap-3 p-3">
                    {alerts.map((alert) => {
                      const config = ALERT_CONFIG[alert.type];
                      const Icon = config.icon;
                      
                      return (
                        <motion.div
                          key={alert.id}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          className="flex-shrink-0"
                        >
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  onClick={() => onMatchClick?.(alert.match)}
                                  className={cn(
                                    "relative group flex items-center gap-3 px-4 py-3 rounded-lg border transition-all",
                                    "hover:scale-[1.02] hover:shadow-md",
                                    config.bg,
                                    config.border
                                  )}
                                >
                                  {/* Dismiss button */}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      dismissAlert(alert.id);
                                    }}
                                    className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-muted border border-border flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>

                                  {/* Icon */}
                                  <div className={cn("p-2 rounded-lg", config.bg)}>
                                    <Icon className={cn("h-4 w-4", config.color)} />
                                  </div>

                                  {/* Content */}
                                  <div className="text-left min-w-[140px]">
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs font-medium text-muted-foreground">
                                        {config.label}
                                      </span>
                                      {alert.type === 'arbitrage' && (
                                        <Flame className="h-3 w-3 text-orange-500 animate-pulse" />
                                      )}
                                    </div>
                                    <p className="text-sm font-semibold truncate max-w-[160px]">
                                      {alert.match.homeTeam?.shortName} vs {alert.match.awayTeam?.shortName}
                                    </p>
                                    <p className={cn("text-xs font-medium", config.color)}>
                                      {alert.label}
                                    </p>
                                  </div>

                                  {/* League badge */}
                                  <Badge variant="outline" className="text-[10px] ml-2">
                                    {alert.match.league}
                                  </Badge>
                                </button>
                              </TooltipTrigger>
                              <TooltipContent side="bottom" className="max-w-[250px]">
                                <div className="space-y-2">
                                  <p className="font-medium">
                                    {alert.match.homeTeam?.name} vs {alert.match.awayTeam?.name}
                                  </p>
                                  <div className="text-xs space-y-1">
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">League:</span>
                                      <span>{alert.match.league}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Time:</span>
                                      <span>{format(parseISO(alert.match.startTime), "MMM d, h:mm a")}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Confidence:</span>
                                      <span>{Math.round(alert.match.prediction?.confidence || 0)}%</span>
                                    </div>
                                    {alert.match.smartScore && (
                                      <div className="flex justify-between">
                                        <span className="text-muted-foreground">SmartScore:</span>
                                        <span>{Math.round(alert.match.smartScore.overall)}</span>
                                      </div>
                                    )}
                                    {alert.match.prediction?.recommended && (
                                      <div className="flex justify-between">
                                        <span className="text-muted-foreground">Pick:</span>
                                        <span className="capitalize">{alert.match.prediction.recommended}</span>
                                      </div>
                                    )}
                                  </div>
                                  <p className="text-xs text-primary pt-1 border-t border-border">
                                    Click to view match details
                                  </p>
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </motion.div>
                      );
                    })}
                  </div>
                  <ScrollBar orientation="horizontal" />
                </ScrollArea>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
};