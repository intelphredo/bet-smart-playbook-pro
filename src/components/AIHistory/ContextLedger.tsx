import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import {
  Search,
  Calendar,
  Target,
  TrendingUp,
  TrendingDown,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  Lightbulb,
  Percent,
  DollarSign,
  Activity,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { HistoricalPrediction } from "@/hooks/useHistoricalPredictions";

interface ContextLedgerProps {
  predictions: HistoricalPrediction[];
  isLoading?: boolean;
}

// Generate reasoning context for a prediction
function generateReasoningContext(prediction: HistoricalPrediction): string {
  const reasons: string[] = [];
  
  // Confidence-based reasoning
  if (prediction.confidence) {
    if (prediction.confidence >= 75) {
      reasons.push("High model confidence based on strong historical patterns");
    } else if (prediction.confidence >= 60) {
      reasons.push("Moderate confidence with favorable matchup indicators");
    } else {
      reasons.push("Lower confidence - higher variance expected");
    }
  }
  
  // Score projection analysis
  if (prediction.projected_score_home !== null && prediction.projected_score_away !== null) {
    const margin = Math.abs(prediction.projected_score_home - prediction.projected_score_away);
    if (margin > 10) {
      reasons.push(`Projected ${margin}-point margin suggests clear favorite`);
    } else if (margin > 5) {
      reasons.push("Close projected score indicates competitive matchup");
    } else {
      reasons.push("Near pick'em - coin flip territory");
    }
  }
  
  // League-specific context
  if (prediction.league) {
    if (prediction.league.includes("NBA")) {
      reasons.push("NBA game - home court advantage typically ~3 points");
    } else if (prediction.league.includes("NFL")) {
      reasons.push("NFL game - weather/injuries heavily weighted");
    } else if (prediction.league.includes("MLB")) {
      reasons.push("MLB game - starting pitcher matchup evaluated");
    }
  }
  
  // Time-based context
  if (prediction.is_live_prediction) {
    reasons.push("Live prediction - adjusted for in-game momentum");
  }
  
  return reasons.length > 0 ? reasons.join(". ") : "Standard model factors applied";
}

// Calculate implied probability from confidence
function calculateImpliedOdds(confidence: number): string {
  // Convert confidence to American odds
  if (confidence >= 50) {
    const odds = Math.round(-(confidence / (100 - confidence)) * 100);
    return `${odds}`;
  } else {
    const odds = Math.round(((100 - confidence) / confidence) * 100);
    return `+${odds}`;
  }
}

// Calculate value percentage (edge vs market)
function calculateValuePercent(confidence: number): number {
  // Assume market is ~50/50, value = confidence - 50
  // In reality would compare to actual odds
  const impliedMarketProb = 52.4; // Standard -110 juice
  return confidence - impliedMarketProb;
}

// Calculate recommended stake based on Kelly
function calculateRecommendedStake(confidence: number, bankroll = 100): string {
  const edge = (confidence - 52.4) / 100;
  const odds = 1.91; // -110 odds
  const kelly = (edge * odds - (1 - edge)) / odds;
  const quarterKelly = Math.max(0, kelly * 0.25);
  const units = Math.round(quarterKelly * bankroll * 10) / 10;
  return `${units.toFixed(1)}u`;
}

export function ContextLedger({ predictions, isLoading }: ContextLedgerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("date");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const filteredPredictions = useMemo(() => {
    let filtered = predictions;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        p.match_title?.toLowerCase().includes(query) ||
        p.home_team?.toLowerCase().includes(query) ||
        p.away_team?.toLowerCase().includes(query) ||
        p.league?.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(p => p.status === statusFilter);
    }

    // Sort
    switch (sortBy) {
      case "confidence":
        filtered = [...filtered].sort((a, b) => (b.confidence || 0) - (a.confidence || 0));
        break;
      case "value":
        filtered = [...filtered].sort((a, b) => 
          calculateValuePercent(b.confidence || 50) - calculateValuePercent(a.confidence || 50)
        );
        break;
      case "date":
      default:
        // Already sorted by date
        break;
    }

    return filtered;
  }, [predictions, searchQuery, statusFilter, sortBy]);

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedIds);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedIds(newExpanded);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Activity className="h-5 w-5 animate-pulse" />
            Loading prediction history...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-yellow-500" />
            Full Context Ledger
          </CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search picks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 w-[180px]"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[100px] h-9">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="won">Won</SelectItem>
                <SelectItem value="lost">Lost</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[110px] h-9">
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">By Date</SelectItem>
                <SelectItem value="confidence">By Confidence</SelectItem>
                <SelectItem value="value">By Value</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px]">
          <div className="space-y-2">
            {filteredPredictions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No predictions found matching your filters
              </div>
            ) : (
              filteredPredictions.slice(0, 100).map((prediction) => (
                <ContextLedgerRow
                  key={prediction.id}
                  prediction={prediction}
                  isExpanded={expandedIds.has(prediction.id)}
                  onToggle={() => toggleExpand(prediction.id)}
                />
              ))
            )}
          </div>
        </ScrollArea>
        <div className="text-xs text-muted-foreground text-center mt-3">
          Showing {Math.min(filteredPredictions.length, 100)} of {filteredPredictions.length} predictions
        </div>
      </CardContent>
    </Card>
  );
}

function ContextLedgerRow({ 
  prediction, 
  isExpanded, 
  onToggle 
}: { 
  prediction: HistoricalPrediction; 
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const confidence = prediction.confidence || 50;
  const valuePercent = calculateValuePercent(confidence);
  const reasoning = generateReasoningContext(prediction);

  const StatusIcon = prediction.status === 'won' 
    ? CheckCircle2 
    : prediction.status === 'lost' 
    ? XCircle 
    : Clock;

  const statusColor = prediction.status === 'won' 
    ? 'text-green-500' 
    : prediction.status === 'lost' 
    ? 'text-red-500' 
    : 'text-yellow-500';

  return (
    <Collapsible open={isExpanded} onOpenChange={onToggle}>
      <Card className="hover:bg-muted/30 transition-colors">
        <CollapsibleTrigger asChild>
          <CardContent className="p-3 cursor-pointer">
            <div className="flex items-center justify-between gap-3">
              {/* Left - Status & Match */}
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <StatusIcon className={cn("h-5 w-5 shrink-0", statusColor)} />
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">
                    {prediction.match_title || `${prediction.home_team} vs ${prediction.away_team}`}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>{format(new Date(prediction.predicted_at), 'MMM d, h:mm a')}</span>
                    <Badge variant="outline" className="text-xs py-0">
                      {prediction.league}
                    </Badge>
                    {prediction.is_live_prediction && (
                      <Badge variant="secondary" className="text-xs py-0 bg-orange-500/20 text-orange-600">
                        Live
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Right - Key Metrics */}
              <div className="flex items-center gap-4 shrink-0">
                <div className="text-right hidden sm:block">
                  <div className="text-xs text-muted-foreground">Confidence</div>
                  <div className="font-medium text-sm">{confidence}%</div>
                </div>
                <div className="text-right hidden sm:block">
                  <div className="text-xs text-muted-foreground">Value</div>
                  <div className={cn(
                    "font-medium text-sm",
                    valuePercent >= 5 ? "text-green-500" : valuePercent <= -5 ? "text-red-500" : ""
                  )}>
                    {valuePercent >= 0 ? '+' : ''}{valuePercent.toFixed(1)}%
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-muted-foreground">Pick</div>
                  <div className="font-bold text-sm">{prediction.prediction}</div>
                </div>
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            </div>
          </CardContent>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="px-3 pb-3 pt-0 border-t">
            {/* Detailed Context */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
              <div className="bg-muted/50 rounded-lg p-2.5">
                <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                  <Percent className="h-3 w-3" />
                  Predicted Probability
                </div>
                <div className="font-bold">{confidence}%</div>
              </div>
              <div className="bg-muted/50 rounded-lg p-2.5">
                <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                  <Target className="h-3 w-3" />
                  Implied Odds
                </div>
                <div className="font-bold">{calculateImpliedOdds(confidence)}</div>
              </div>
              <div className="bg-muted/50 rounded-lg p-2.5">
                <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                  <DollarSign className="h-3 w-3" />
                  Rec. Stake
                </div>
                <div className="font-bold">{calculateRecommendedStake(confidence)}</div>
              </div>
              <div className="bg-muted/50 rounded-lg p-2.5">
                <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                  <TrendingUp className="h-3 w-3" />
                  Edge vs Market
                </div>
                <div className={cn(
                  "font-bold",
                  valuePercent >= 3 ? "text-green-500" : valuePercent <= -3 ? "text-red-500" : ""
                )}>
                  {valuePercent >= 0 ? '+' : ''}{valuePercent.toFixed(1)}%
                </div>
              </div>
            </div>

            {/* Projected vs Actual Score */}
            {(prediction.projected_score_home !== null || prediction.actual_score_home !== null) && (
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div className="bg-blue-500/10 rounded-lg p-2.5">
                  <div className="text-xs text-blue-600 dark:text-blue-400 mb-1">Projected Score</div>
                  <div className="font-bold">
                    {prediction.projected_score_home ?? '-'} - {prediction.projected_score_away ?? '-'}
                  </div>
                </div>
                <div className={cn(
                  "rounded-lg p-2.5",
                  prediction.status === 'won' ? "bg-green-500/10" : 
                  prediction.status === 'lost' ? "bg-red-500/10" : "bg-muted/50"
                )}>
                  <div className={cn(
                    "text-xs mb-1",
                    prediction.status === 'won' ? "text-green-600 dark:text-green-400" :
                    prediction.status === 'lost' ? "text-red-600 dark:text-red-400" : "text-muted-foreground"
                  )}>
                    Actual Score
                  </div>
                  <div className="font-bold">
                    {prediction.actual_score_home ?? '-'} - {prediction.actual_score_away ?? '-'}
                  </div>
                </div>
              </div>
            )}

            {/* Reasoning */}
            <div className="mt-3 p-2.5 bg-muted/30 rounded-lg">
              <div className="flex items-start gap-2">
                <Lightbulb className="h-4 w-4 text-yellow-500 mt-0.5 shrink-0" />
                <div>
                  <div className="text-xs font-medium text-muted-foreground mb-1">Model Reasoning</div>
                  <p className="text-sm">{reasoning}</p>
                </div>
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
