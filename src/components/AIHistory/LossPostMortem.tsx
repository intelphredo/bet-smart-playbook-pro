import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format, differenceInHours } from "date-fns";
import {
  AlertTriangle,
  XCircle,
  Target,
  TrendingDown,
  Activity,
  Brain,
  Lightbulb,
  BarChart3,
  Users,
  Zap,
  AlertCircle,
  HelpCircle,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { HistoricalPrediction } from "@/hooks/useHistoricalPredictions";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface LossPostMortemProps {
  predictions: HistoricalPrediction[];
  isLoading?: boolean;
}

type LossCategory = 
  | "bad_beat" 
  | "late_info" 
  | "model_error" 
  | "close_game" 
  | "variance" 
  | "high_confidence_miss";

interface LossAnalysis {
  prediction: HistoricalPrediction;
  category: LossCategory;
  analysis: string;
  factors: string[];
  lesson: string;
  scoreDiff: number;
  confidenceLevel: 'low' | 'medium' | 'high';
  projectionError: number | null;
}

// Analyze a losing prediction to categorize and explain it
function analyzeLoss(prediction: HistoricalPrediction): LossAnalysis {
  const confidence = prediction.confidence || 50;
  const projectedHome = prediction.projected_score_home;
  const projectedAway = prediction.projected_score_away;
  const actualHome = prediction.actual_score_home;
  const actualAway = prediction.actual_score_away;
  
  let category: LossCategory = "variance";
  let analysis = "";
  let factors: string[] = [];
  let lesson = "";
  
  // Calculate score differential
  const scoreDiff = (actualHome ?? 0) - (actualAway ?? 0);
  const projectedDiff = (projectedHome ?? 0) - (projectedAway ?? 0);
  const projectionError = Math.abs(scoreDiff - projectedDiff);
  
  // Determine confidence level
  const confidenceLevel = confidence >= 70 ? 'high' : confidence >= 55 ? 'medium' : 'low';
  
  // Analyze based on various factors
  
  // 1. High confidence miss - overconfidence
  if (confidence >= 70) {
    category = "high_confidence_miss";
    analysis = `Model was highly confident (${confidence}%) but missed. This suggests potential blind spots in high-conviction picks.`;
    factors.push("High model confidence did not translate to win");
    factors.push("May indicate over-reliance on historical patterns");
    lesson = "Consider reducing stake size on high-confidence picks or diversifying factors";
  }
  
  // 2. Close game - within a possession
  else if (actualHome !== null && actualAway !== null) {
    const pointDiff = Math.abs(actualHome - actualAway);
    
    // Check for bad beats (close finish that went wrong way)
    if (pointDiff <= 3) {
      category = "bad_beat";
      analysis = `Game ended within ${pointDiff} points - a true coin flip at the end. Model direction may have been correct but luck didn't favor.`;
      factors.push(`Final margin: ${pointDiff} points`);
      factors.push("One play could have changed outcome");
      if (projectedHome !== null && projectedAway !== null) {
        const projectedMargin = Math.abs(projectedHome - projectedAway);
        factors.push(`Projected margin was ${projectedMargin.toFixed(0)} points`);
      }
      lesson = "Close games are inherently unpredictable. Consider hedging or smaller stakes on tight spreads.";
    }
    // Close but not a bad beat
    else if (pointDiff <= 7) {
      category = "close_game";
      analysis = `Competitive game that didn't break our way. The model's read was reasonable but execution factors tilted outcome.`;
      factors.push(`Final margin: ${pointDiff} points`);
      factors.push("Game flow was competitive");
      lesson = "Look for factors beyond statistical models - momentum, matchup-specific issues.";
    }
    // Blowout loss - potential model error
    else if (pointDiff >= 15) {
      category = "model_error";
      analysis = `Significant miss - the game wasn't close. This indicates a fundamental model miscalculation or missing information.`;
      factors.push(`Final margin: ${pointDiff} points`);
      factors.push("Model significantly underestimated opponent");
      if (projectedHome !== null && projectedAway !== null) {
        factors.push(`Projection error: ${projectionError?.toFixed(0) || 'N/A'} points`);
      }
      lesson = "Review what data the model missed. Consider roster changes, travel fatigue, or motivation factors.";
    }
    // Moderate loss
    else {
      category = "variance";
      analysis = `Standard variance loss. The model's assessment was in the right ballpark but the outcome fell the other way.`;
      factors.push(`Final margin: ${pointDiff} points`);
      factors.push("Within expected variance for sports betting");
      lesson = "Continue trusting the process. Individual losses are part of the game.";
    }
  }
  
  // 3. Live prediction factors
  if (prediction.is_live_prediction) {
    factors.push("Live prediction - game dynamics shifted after bet");
    if (category === "variance") {
      category = "late_info";
      analysis = `Live betting loss - in-game information may have changed rapidly. Momentum shifts are hard to predict in real-time.`;
      lesson = "Live betting has higher variance. Consider smaller unit sizes for live plays.";
    }
  }
  
  return {
    prediction,
    category,
    analysis,
    factors,
    lesson,
    scoreDiff: Math.abs((actualHome ?? 0) - (actualAway ?? 0)),
    confidenceLevel,
    projectionError: projectionError || null,
  };
}

// Category display info
const categoryInfo: Record<LossCategory, { label: string; icon: any; color: string }> = {
  bad_beat: { label: "Bad Beat", icon: AlertTriangle, color: "text-orange-500" },
  late_info: { label: "Late Information", icon: Zap, color: "text-yellow-500" },
  model_error: { label: "Model Error", icon: Brain, color: "text-red-500" },
  close_game: { label: "Close Game", icon: Target, color: "text-blue-500" },
  variance: { label: "Variance", icon: BarChart3, color: "text-purple-500" },
  high_confidence_miss: { label: "High Conf. Miss", icon: AlertCircle, color: "text-red-600" },
};

export function LossPostMortem({ predictions, isLoading }: LossPostMortemProps) {
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // Get all losses and analyze them
  const lossAnalyses = useMemo(() => {
    return predictions
      .filter(p => p.status === 'lost')
      .map(p => analyzeLoss(p))
      .sort((a, b) => {
        // Sort by date (most recent first)
        return new Date(b.prediction.predicted_at).getTime() - new Date(a.prediction.predicted_at).getTime();
      });
  }, [predictions]);

  // Calculate category breakdown
  const categoryBreakdown = useMemo(() => {
    const breakdown: Record<LossCategory, number> = {
      bad_beat: 0,
      late_info: 0,
      model_error: 0,
      close_game: 0,
      variance: 0,
      high_confidence_miss: 0,
    };
    
    lossAnalyses.forEach(analysis => {
      breakdown[analysis.category]++;
    });
    
    return breakdown;
  }, [lossAnalyses]);

  // Filter by category
  const filteredLosses = useMemo(() => {
    if (categoryFilter === "all") return lossAnalyses;
    return lossAnalyses.filter(a => a.category === categoryFilter);
  }, [lossAnalyses, categoryFilter]);

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
            Analyzing losses...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (lossAnalyses.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Target className="h-12 w-12 mx-auto text-green-500 mb-3" />
          <h3 className="font-semibold text-lg mb-1">No Losses to Analyze</h3>
          <p className="text-muted-foreground">
            Great job! You haven't had any losing predictions in this period.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Loss Category Summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-yellow-500" />
            Learn from Losses
            <Badge variant="destructive" className="ml-2">
              {lossAnalyses.length} losses
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
            {Object.entries(categoryInfo).map(([key, info]) => {
              const count = categoryBreakdown[key as LossCategory];
              const Icon = info.icon;
              return (
                <button
                  key={key}
                  onClick={() => setCategoryFilter(categoryFilter === key ? "all" : key)}
                  className={cn(
                    "p-3 rounded-lg text-left transition-colors",
                    categoryFilter === key ? "bg-primary/10 ring-1 ring-primary" : "bg-muted/50 hover:bg-muted"
                  )}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className={cn("h-4 w-4", info.color)} />
                    <span className="font-bold text-lg">{count}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">{info.label}</div>
                </button>
              );
            })}
          </div>

          {/* Key Insights - clickable to filter */}
          <div className="grid md:grid-cols-3 gap-3">
            <button
              onClick={() => setCategoryFilter(categoryFilter === 'bad_beat' ? 'all' : 'bad_beat')}
              className={cn(
                "bg-orange-500/10 rounded-lg p-3 text-left transition-colors",
                categoryFilter === 'bad_beat' && "ring-2 ring-orange-500"
              )}
            >
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-orange-500" />
                <span className="font-medium text-sm">Bad Beats</span>
                <Badge variant="outline" className="ml-auto text-xs">{categoryBreakdown.bad_beat}</Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Losses decided by 3 points or less. Pure variance - model was likely correct.
              </p>
            </button>
            <button
              onClick={() => setCategoryFilter(categoryFilter === 'model_error' ? 'all' : 'model_error')}
              className={cn(
                "bg-red-500/10 rounded-lg p-3 text-left transition-colors",
                categoryFilter === 'model_error' && "ring-2 ring-red-500"
              )}
            >
              <div className="flex items-center gap-2 mb-2">
                <Brain className="h-4 w-4 text-red-500" />
                <span className="font-medium text-sm">Model Errors</span>
                <Badge variant="outline" className="ml-auto text-xs">{categoryBreakdown.model_error + categoryBreakdown.high_confidence_miss}</Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Potential blind spots that need investigation.
              </p>
            </button>
            <button
              onClick={() => setCategoryFilter(categoryFilter === 'variance' ? 'all' : 'variance')}
              className={cn(
                "bg-purple-500/10 rounded-lg p-3 text-left transition-colors",
                categoryFilter === 'variance' && "ring-2 ring-purple-500"
              )}
            >
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="h-4 w-4 text-purple-500" />
                <span className="font-medium text-sm">Expected Variance</span>
                <Badge variant="outline" className="ml-auto text-xs">{categoryBreakdown.variance + categoryBreakdown.close_game}</Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Normal variance losses. Trust the process.
              </p>
            </button>
          </div>

          {/* Pattern Analysis */}
          <PatternAnalysis lossAnalyses={lossAnalyses} />
        </CardContent>
      </Card>

      {/* Individual Loss Analysis */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-500" />
              Loss Post-Mortems
            </CardTitle>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[150px] h-9">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {Object.entries(categoryInfo).map(([key, info]) => (
                  <SelectItem key={key} value={key}>{info.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <div className="space-y-2">
              {filteredLosses.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No losses in this category
                </div>
              ) : (
                filteredLosses.slice(0, 50).map((analysis) => (
                  <LossCard
                    key={analysis.prediction.id}
                    analysis={analysis}
                    isExpanded={expandedIds.has(analysis.prediction.id)}
                    onToggle={() => toggleExpand(analysis.prediction.id)}
                  />
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

function LossCard({ 
  analysis, 
  isExpanded, 
  onToggle 
}: { 
  analysis: LossAnalysis; 
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const { prediction, category, factors, lesson } = analysis;
  const info = categoryInfo[category];
  const Icon = info.icon;

  return (
    <Collapsible open={isExpanded} onOpenChange={onToggle}>
      <Card className="hover:bg-muted/30 transition-colors">
        <CollapsibleTrigger asChild>
          <CardContent className="p-3 cursor-pointer">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <XCircle className="h-5 w-5 text-red-500 shrink-0" />
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">
                    {prediction.match_title || `${prediction.home_team} vs ${prediction.away_team}`}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{format(new Date(prediction.predicted_at), 'MMM d')}</span>
                    <Badge variant="outline" className="text-xs py-0">
                      {prediction.league}
                    </Badge>
                    <Badge 
                      variant="secondary" 
                      className={cn("text-xs py-0", info.color)}
                    >
                      <Icon className="h-3 w-3 mr-1" />
                      {info.label}
                    </Badge>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-4 shrink-0">
                <div className="text-right">
                  <div className="text-xs text-muted-foreground">Conf.</div>
                  <div className="font-medium text-sm">{prediction.confidence}%</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-muted-foreground">Final</div>
                  <div className="font-bold text-sm text-red-500">
                    {prediction.actual_score_home} - {prediction.actual_score_away}
                  </div>
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
          <div className="px-3 pb-3 pt-0 border-t space-y-3">
            {/* Analysis */}
            <div className="mt-3 p-3 bg-muted/30 rounded-lg">
              <div className="flex items-start gap-2">
                <Brain className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <div>
                  <div className="text-xs font-medium text-muted-foreground mb-1">Analysis</div>
                  <p className="text-sm">{analysis.analysis}</p>
                </div>
              </div>
            </div>

            {/* Contributing Factors */}
            <div className="p-3 bg-red-500/5 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                <div>
                  <div className="text-xs font-medium text-red-600 dark:text-red-400 mb-1">Contributing Factors</div>
                  <ul className="text-sm space-y-1">
                    {factors.map((factor, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-red-500">•</span>
                        <span>{factor}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Lesson Learned */}
            <div className="p-3 bg-yellow-500/10 rounded-lg">
              <div className="flex items-start gap-2">
                <Lightbulb className="h-4 w-4 text-yellow-500 mt-0.5 shrink-0" />
                <div>
                  <div className="text-xs font-medium text-yellow-600 dark:text-yellow-400 mb-1">Lesson</div>
                  <p className="text-sm">{lesson}</p>
                </div>
              </div>
            </div>

            {/* Score Comparison */}
            {prediction.projected_score_home !== null && (
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-blue-500/10 rounded-lg p-2.5">
                  <div className="text-xs text-blue-600 dark:text-blue-400 mb-1">Projected</div>
                  <div className="font-bold">
                    {prediction.projected_score_home} - {prediction.projected_score_away}
                  </div>
                </div>
                <div className="bg-red-500/10 rounded-lg p-2.5">
                  <div className="text-xs text-red-600 dark:text-red-400 mb-1">Actual</div>
                  <div className="font-bold">
                    {prediction.actual_score_home} - {prediction.actual_score_away}
                  </div>
                </div>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

// Pattern Analysis Component - identifies model weaknesses
function PatternAnalysis({ lossAnalyses }: { lossAnalyses: LossAnalysis[] }) {
  const patterns = useMemo(() => {
    const results: { title: string; description: string; severity: 'high' | 'medium' | 'low'; count: number }[] = [];
    
    // League-based patterns
    const leagueLosses: Record<string, number> = {};
    const leagueTotal: Record<string, number> = {};
    lossAnalyses.forEach(a => {
      const league = a.prediction.league || 'Unknown';
      leagueLosses[league] = (leagueLosses[league] || 0) + 1;
    });
    
    const worstLeague = Object.entries(leagueLosses).sort((a, b) => b[1] - a[1])[0];
    if (worstLeague && worstLeague[1] >= 5) {
      results.push({
        title: `Struggles with ${worstLeague[0]}`,
        description: `${worstLeague[1]} losses in ${worstLeague[0]}. Consider reducing confidence for this league.`,
        severity: worstLeague[1] >= 15 ? 'high' : 'medium',
        count: worstLeague[1],
      });
    }

    // High confidence miss pattern
    const highConfMisses = lossAnalyses.filter(a => a.category === 'high_confidence_miss');
    if (highConfMisses.length >= 3) {
      results.push({
        title: 'Overconfidence pattern detected',
        description: `${highConfMisses.length} losses at 70%+ confidence. Model assigns high confidence too liberally.`,
        severity: 'high',
        count: highConfMisses.length,
      });
    }

    // Underdog pattern
    const blowoutLosses = lossAnalyses.filter(a => a.scoreDiff >= 15);
    if (blowoutLosses.length >= 3) {
      results.push({
        title: 'Blowout losses',
        description: `${blowoutLosses.length} losses by 15+ points. Model may underestimate opponent strength in mismatches.`,
        severity: 'medium',
        count: blowoutLosses.length,
      });
    }

    // Live prediction losses
    const liveLosses = lossAnalyses.filter(a => a.prediction.is_live_prediction);
    if (liveLosses.length >= 5) {
      results.push({
        title: 'Live betting weakness',
        description: `${liveLosses.length} live prediction losses. In-game model may lag behind momentum shifts.`,
        severity: 'medium',
        count: liveLosses.length,
      });
    }

    if (results.length === 0) {
      results.push({
        title: 'No strong patterns detected',
        description: 'Losses appear distributed normally. Continue monitoring.',
        severity: 'low',
        count: 0,
      });
    }

    return results;
  }, [lossAnalyses]);

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Brain className="h-4 w-4 text-primary" />
          Model Error Patterns
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {patterns.map((pattern, i) => (
          <div key={i} className={cn(
            "p-3 rounded-lg border text-sm",
            pattern.severity === 'high' && "bg-red-500/5 border-red-500/20",
            pattern.severity === 'medium' && "bg-yellow-500/5 border-yellow-500/20",
            pattern.severity === 'low' && "bg-muted/50 border-muted",
          )}>
            <div className="flex items-center justify-between mb-1">
              <span className="font-medium">{pattern.title}</span>
              {pattern.count > 0 && (
                <Badge variant="outline" className="text-xs">{pattern.count}</Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{pattern.description}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
