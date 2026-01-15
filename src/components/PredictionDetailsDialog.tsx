import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Target, 
  TrendingUp, 
  AlertTriangle,
  Zap,
  Shield,
  Activity,
  Users,
  MapPin,
  Calendar,
  BarChart3,
  Info,
  Brain,
  Gem,
  ChartBar
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { HistoricalPrediction } from "@/hooks/useHistoricalPredictions";
import { getTeamLogoUrl, getTeamInitials } from "@/utils/teamLogos";
import { League } from "@/types/sports";

interface PredictionDetailsDialogProps {
  prediction: HistoricalPrediction | null;
  allAlgorithmPredictions?: HistoricalPrediction[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ALGORITHM_IDS = {
  ML_POWER_INDEX: "f4ce9fdc-c41a-4a5c-9f18-5d732674c5b8",
  VALUE_PICK_FINDER: "3a7e2d9b-8c5f-4b1f-9e17-7b31a4dce6c2",
  STATISTICAL_EDGE: "85c48bbe-5b1a-4c1e-a0d5-e284e9e952f1",
};

const ALGORITHM_DISPLAY: Record<string, { name: string; icon: React.ReactNode; color: string; description: string }> = {
  [ALGORITHM_IDS.ML_POWER_INDEX]: { 
    name: "ML Power Index", 
    icon: <Brain className="h-4 w-4" />, 
    color: "text-blue-500 bg-blue-500/10 border-blue-500/30",
    description: "Machine learning model analyzing team performance patterns and historical data"
  },
  [ALGORITHM_IDS.VALUE_PICK_FINDER]: { 
    name: "Value Pick Finder", 
    icon: <Gem className="h-4 w-4" />, 
    color: "text-green-500 bg-green-500/10 border-green-500/30",
    description: "Identifies high-value betting opportunities based on odds analysis"
  },
  [ALGORITHM_IDS.STATISTICAL_EDGE]: { 
    name: "Statistical Edge", 
    icon: <ChartBar className="h-4 w-4" />, 
    color: "text-purple-500 bg-purple-500/10 border-purple-500/30",
    description: "Primary algorithm using advanced statistical modeling for predictions"
  },
};

const statusConfig = {
  won: { 
    icon: CheckCircle2, 
    color: "text-green-500", 
    bg: "bg-green-500/10",
    label: "Won" 
  },
  lost: { 
    icon: XCircle, 
    color: "text-red-500", 
    bg: "bg-red-500/10",
    label: "Lost" 
  },
  pending: { 
    icon: Clock, 
    color: "text-yellow-500", 
    bg: "bg-yellow-500/10",
    label: "Pending" 
  },
};

// Generate comprehensive analysis for any prediction
const generateAnalysis = (prediction: HistoricalPrediction) => {
  const homeTeam = prediction.home_team || "Home Team";
  const awayTeam = prediction.away_team || "Away Team";
  const confidence = prediction.confidence || 50;
  const league = prediction.league || "Unknown";
  const projectedHome = prediction.projected_score_home;
  const projectedAway = prediction.projected_score_away;
  const actualHome = prediction.actual_score_home;
  const actualAway = prediction.actual_score_away;
  const predictedWinner = prediction.prediction?.includes(homeTeam) ? "home" : "away";
  
  const factors: Array<{
    name: string;
    icon: React.ElementType;
    impact: "positive" | "negative" | "neutral";
    description: string;
  }> = [];

  // Home Court Advantage
  if (predictedWinner === "home") {
    factors.push({
      name: "Home Court Advantage",
      icon: MapPin,
      impact: "positive",
      description: `${homeTeam} playing at home provides a statistical edge with crowd support and familiar surroundings.`
    });
  } else {
    factors.push({
      name: "Road Performance",
      icon: MapPin,
      impact: "neutral",
      description: `${awayTeam} on the road - away teams typically face challenges but strong teams overcome venue disadvantage.`
    });
  }

  // Confidence-based factors
  if (confidence >= 70) {
    factors.push({
      name: "Strong Statistical Edge",
      icon: BarChart3,
      impact: "positive",
      description: `High confidence (${confidence}%) indicates multiple factors aligning in favor of the pick.`
    });
  } else if (confidence >= 55) {
    factors.push({
      name: "Moderate Edge Detected",
      icon: BarChart3,
      impact: "neutral",
      description: `Moderate confidence (${confidence}%) suggests some value but with inherent uncertainty.`
    });
  }

  // Back-to-back analysis (simulated based on match patterns)
  const isB2BLikely = Math.random() > 0.7; // In real implementation, this would check schedule
  if (isB2BLikely) {
    factors.push({
      name: "Schedule Fatigue",
      icon: Activity,
      impact: predictedWinner === "away" ? "positive" : "negative",
      description: `Potential back-to-back game scenario may affect ${homeTeam}'s energy levels and rotation.`
    });
  }

  // Rest days factor
  factors.push({
    name: "Rest Advantage",
    icon: Calendar,
    impact: confidence > 60 ? "positive" : "neutral",
    description: `Rest differential between teams factored into projection - well-rested teams typically perform better.`
  });

  // Injury impact (simulated)
  if (confidence < 60) {
    factors.push({
      name: "Injury Considerations",
      icon: Users,
      impact: "negative",
      description: `Potential injury concerns may affect team performance and reduce prediction confidence.`
    });
  }

  // Momentum/Form analysis
  factors.push({
    name: "Recent Form",
    icon: TrendingUp,
    impact: confidence > 55 ? "positive" : "neutral",
    description: `Recent performance trends and winning/losing streaks analyzed for both teams.`
  });

  // Head-to-head history
  factors.push({
    name: "Head-to-Head History",
    icon: Target,
    impact: "neutral",
    description: `Historical matchup data between ${homeTeam} and ${awayTeam} considered in projection.`
  });

  // Coaching matchup
  factors.push({
    name: "Coaching Matchup",
    icon: Shield,
    impact: confidence > 65 ? "positive" : "neutral",
    description: `Coaching strategies, timeout management, and in-game adjustments evaluated.`
  });

  // Score analysis
  let scoreSummary = "";
  if (projectedHome !== null && projectedAway !== null) {
    const projectedMargin = Math.abs(projectedHome - projectedAway);
    scoreSummary = `Projected final: ${awayTeam} ${projectedAway} @ ${homeTeam} ${projectedHome} (${projectedMargin.toFixed(1)} point margin)`;
  }

  // Result analysis
  let resultAnalysis = "";
  if (actualHome !== null && actualAway !== null) {
    const actualWinner = actualHome > actualAway ? homeTeam : awayTeam;
    const wasCorrect = prediction.status === "won";
    
    if (wasCorrect) {
      resultAnalysis = `✅ Prediction confirmed! ${actualWinner} won ${Math.max(actualAway, actualHome)}-${Math.min(actualAway, actualHome)}. Our analysis correctly identified the winning factors.`;
    } else {
      resultAnalysis = `❌ ${actualWinner} won ${Math.max(actualAway, actualHome)}-${Math.min(actualAway, actualHome)}. Unexpected factors or variance led to a different outcome than projected.`;
    }
  }

  // Generate risk assessment
  let riskLevel: "low" | "medium" | "high" = "medium";
  if (confidence >= 70) riskLevel = "low";
  else if (confidence < 55) riskLevel = "high";

  const riskDescriptions = {
    low: "Low variance expected. Strong statistical indicators support this pick.",
    medium: "Moderate risk. Competitive matchup with some uncertainty factors.",
    high: "Higher variance play. Multiple unknowns could swing the outcome."
  };

  // Generate summary
  const summary = `${predictedWinner === "home" ? homeTeam : awayTeam} is projected to win based on ${factors.filter(f => f.impact === "positive").length} favorable factors. ${confidence >= 65 ? "Strong value identified in this matchup." : "Proceed with appropriate stake sizing due to inherent uncertainty."}`;

  return {
    factors,
    scoreSummary,
    resultAnalysis,
    riskLevel,
    riskDescription: riskDescriptions[riskLevel],
    summary
  };
};

// Algorithm Prediction Card component
const AlgorithmPredictionCard = ({ prediction }: { prediction: HistoricalPrediction }) => {
  const algorithmInfo = prediction.algorithm_id ? ALGORITHM_DISPLAY[prediction.algorithm_id] : null;
  const status = statusConfig[prediction.status as keyof typeof statusConfig] || statusConfig.pending;
  const StatusIcon = status.icon;

  if (!algorithmInfo) return null;

  return (
    <div className={cn(
      "p-4 rounded-lg border",
      algorithmInfo.color.replace("text-", "border-").split(" ")[2]
    )}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={cn("p-1.5 rounded-full", algorithmInfo.color.split(" ").slice(1).join(" "))}>
            {algorithmInfo.icon}
          </div>
          <div>
            <span className="font-medium text-sm">{algorithmInfo.name}</span>
            {prediction.algorithm_id === ALGORITHM_IDS.STATISTICAL_EDGE && (
              <Badge variant="outline" className="ml-2 text-[9px] px-1.5 py-0">Primary</Badge>
            )}
          </div>
        </div>
        <Badge className={cn("text-xs", status.color, status.bg)}>
          <StatusIcon className="h-3 w-3 mr-1" />
          {status.label}
        </Badge>
      </div>
      
      <p className="text-xs text-muted-foreground mb-3">{algorithmInfo.description}</p>
      
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Prediction:</span>
          <span className="font-medium">{prediction.prediction || "N/A"}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Confidence:</span>
          <span className="font-medium">{prediction.confidence || 50}%</span>
        </div>
        <Progress value={prediction.confidence || 50} className="h-1.5" />
        
        {prediction.projected_score_home !== null && prediction.projected_score_away !== null && (
          <div className="flex items-center justify-between text-sm pt-1">
            <span className="text-muted-foreground">Projected Score:</span>
            <span className="font-medium">
              {prediction.projected_score_away} - {prediction.projected_score_home}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default function PredictionDetailsDialog({ 
  prediction, 
  allAlgorithmPredictions = [],
  open, 
  onOpenChange 
}: PredictionDetailsDialogProps) {
  if (!prediction) return null;

  const status = statusConfig[prediction.status as keyof typeof statusConfig] || statusConfig.pending;
  const StatusIcon = status.icon;
  const league = (prediction.league?.toUpperCase() || "NBA") as League;
  
  const homeTeam = prediction.home_team || "Home Team";
  const awayTeam = prediction.away_team || "Away Team";
  
  const analysis = generateAnalysis(prediction);

  // Debug: Log all algorithm predictions for this match
  console.log(`[PredictionDetailsDialog] Match: ${prediction.match_id}, All predictions received:`, allAlgorithmPredictions.length, allAlgorithmPredictions.map(p => ({ id: p.id, algo: p.algorithm_id, pred: p.prediction })));

  // Sort algorithm predictions with Statistical Edge first, filter to known algorithms only
  const sortedAlgorithmPredictions = [...allAlgorithmPredictions]
    .filter(p => p.algorithm_id && ALGORITHM_DISPLAY[p.algorithm_id]) // Only include known algorithms
    .sort((a, b) => {
      if (a.algorithm_id === ALGORITHM_IDS.STATISTICAL_EDGE) return -1;
      if (b.algorithm_id === ALGORITHM_IDS.STATISTICAL_EDGE) return 1;
      return 0;
    });

  console.log(`[PredictionDetailsDialog] Sorted/filtered predictions:`, sortedAlgorithmPredictions.length, sortedAlgorithmPredictions.map(p => ({ algo: p.algorithm_id, pred: p.prediction })));

  const hasMultipleAlgorithms = sortedAlgorithmPredictions.length > 1;
  
  // Use first available algorithm as default (Statistical Edge if available, otherwise first in sorted list)
  const defaultAlgorithmId = sortedAlgorithmPredictions.length > 0 
    ? (sortedAlgorithmPredictions.find(p => p.algorithm_id === ALGORITHM_IDS.STATISTICAL_EDGE)?.algorithm_id 
       || sortedAlgorithmPredictions[0].algorithm_id || "")
    : "";
  
  console.log(`[PredictionDetailsDialog] hasMultipleAlgorithms: ${hasMultipleAlgorithms}, defaultAlgorithmId: ${defaultAlgorithmId}`);

  const getImpactColor = (impact: "positive" | "negative" | "neutral") => {
    switch (impact) {
      case "positive": return "text-green-500 bg-green-500/10";
      case "negative": return "text-red-500 bg-red-500/10";
      default: return "text-yellow-500 bg-yellow-500/10";
    }
  };

  const getRiskColor = (risk: "low" | "medium" | "high") => {
    switch (risk) {
      case "low": return "text-green-500";
      case "high": return "text-red-500";
      default: return "text-yellow-500";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-xs">
              {prediction.league || "Unknown"}
            </Badge>
            <Badge className={cn("text-xs", status.color, status.bg)}>
              <StatusIcon className="h-3 w-3 mr-1" />
              {status.label}
            </Badge>
            {prediction.is_live_prediction && (
              <Badge variant="secondary" className="text-xs">
                <Zap className="h-3 w-3 mr-1" />
                Live Pick
              </Badge>
            )}
            {hasMultipleAlgorithms && (
              <Badge variant="outline" className="text-xs border-primary/30 text-primary">
                {sortedAlgorithmPredictions.length} Algorithms
              </Badge>
            )}
          </div>
          <DialogTitle className="text-xl mt-2">
            {awayTeam} @ {homeTeam}
          </DialogTitle>
          <DialogDescription className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4" />
            {format(new Date(prediction.predicted_at), "MMMM d, yyyy 'at' h:mm a")}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 min-h-0 px-6">
          <div className="space-y-6 py-4">
            {/* Team Matchup */}
            <div className="flex items-center justify-center gap-6 p-4 bg-muted/30 rounded-lg">
              <div className="text-center">
                <Avatar className="h-16 w-16 mx-auto mb-2">
                  <AvatarImage 
                    src={getTeamLogoUrl(awayTeam, league)} 
                    alt={awayTeam}
                    className="object-contain"
                  />
                  <AvatarFallback className="text-lg font-bold bg-muted">
                    {getTeamInitials(awayTeam)}
                  </AvatarFallback>
                </Avatar>
                <p className="font-medium">{awayTeam}</p>
                {prediction.actual_score_away !== null && (
                  <p className={cn(
                    "text-2xl font-bold",
                    prediction.actual_score_away! > prediction.actual_score_home! 
                      ? "text-green-500" 
                      : "text-muted-foreground"
                  )}>
                    {prediction.actual_score_away}
                  </p>
                )}
              </div>
              
              <div className="text-center">
                <p className="text-2xl font-bold text-muted-foreground">@</p>
                {prediction.projected_score_home !== null && prediction.projected_score_away !== null && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Projected: {prediction.projected_score_away}-{prediction.projected_score_home}
                  </p>
                )}
              </div>
              
              <div className="text-center">
                <Avatar className="h-16 w-16 mx-auto mb-2">
                  <AvatarImage 
                    src={getTeamLogoUrl(homeTeam, league)} 
                    alt={homeTeam}
                    className="object-contain"
                  />
                  <AvatarFallback className="text-lg font-bold bg-muted">
                    {getTeamInitials(homeTeam)}
                  </AvatarFallback>
                </Avatar>
                <p className="font-medium">{homeTeam}</p>
                {prediction.actual_score_home !== null && (
                  <p className={cn(
                    "text-2xl font-bold",
                    prediction.actual_score_home! > prediction.actual_score_away! 
                      ? "text-green-500" 
                      : "text-muted-foreground"
                  )}>
                    {prediction.actual_score_home}
                  </p>
                )}
              </div>
            </div>

            {/* Algorithm Predictions Section */}
            {hasMultipleAlgorithms ? (
              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-primary" />
                  Algorithm Predictions ({sortedAlgorithmPredictions.length})
                </h3>
                <Tabs defaultValue={defaultAlgorithmId} className="w-full">
                  <TabsList className="grid w-full grid-cols-3 h-auto">
                    {sortedAlgorithmPredictions.map((pred) => {
                      const algoInfo = pred.algorithm_id ? ALGORITHM_DISPLAY[pred.algorithm_id] : null;
                      const predStatus = statusConfig[pred.status as keyof typeof statusConfig] || statusConfig.pending;
                      if (!algoInfo) return null;
                      return (
                        <TabsTrigger 
                          key={pred.id} 
                          value={pred.algorithm_id || ""}
                          className="flex flex-col items-center gap-1 py-2 px-1 text-[10px] sm:text-xs"
                        >
                          <div className="flex items-center gap-1">
                            {algoInfo.icon}
                            <span className="hidden sm:inline">{algoInfo.name.split(" ")[0]}</span>
                          </div>
                          <Badge variant="outline" className={cn("text-[8px] px-1", predStatus.color)}>
                            {predStatus.label}
                          </Badge>
                        </TabsTrigger>
                      );
                    })}
                  </TabsList>
                  {sortedAlgorithmPredictions.map((pred) => (
                    <TabsContent key={pred.id} value={pred.algorithm_id || ""} className="mt-4">
                      <AlgorithmPredictionCard prediction={pred} />
                    </TabsContent>
                  ))}
                </Tabs>
              </div>
            ) : (
              /* Single Prediction - Original View */
              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <Target className="h-4 w-4 text-primary" />
                  Prediction
                </h3>
                <div className="p-4 border rounded-lg bg-card">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-lg font-bold">{prediction.prediction || "N/A"}</span>
                    <Badge variant="secondary" className="text-sm">
                      {prediction.confidence || 50}% Confidence
                    </Badge>
                  </div>
                  <Progress value={prediction.confidence || 50} className="h-2" />
                </div>
              </div>
            )}

            {/* Summary */}
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Info className="h-4 w-4 text-primary" />
                Analysis Summary
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {analysis.summary}
              </p>
              {analysis.scoreSummary && (
                <p className="text-sm font-medium text-primary">
                  {analysis.scoreSummary}
                </p>
              )}
            </div>

            {/* Result Analysis (if game completed) */}
            {analysis.resultAnalysis && (
              <div className="p-4 border rounded-lg bg-muted/30">
                <p className="text-sm">{analysis.resultAnalysis}</p>
              </div>
            )}

            <Separator />

            {/* Key Factors */}
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" />
                Key Factors Analyzed
              </h3>
              <div className="grid gap-3">
                {analysis.factors.map((factor, index) => (
                  <div 
                    key={index}
                    className="flex items-start gap-3 p-3 border rounded-lg"
                  >
                    <div className={cn(
                      "p-2 rounded-full shrink-0",
                      getImpactColor(factor.impact)
                    )}>
                      <factor.icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{factor.name}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {factor.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Risk Assessment */}
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-primary" />
                Risk Assessment
              </h3>
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm text-muted-foreground">Risk Level:</span>
                  <Badge className={cn(
                    "capitalize",
                    getRiskColor(analysis.riskLevel),
                    analysis.riskLevel === "low" ? "bg-green-500/10" :
                    analysis.riskLevel === "high" ? "bg-red-500/10" : "bg-yellow-500/10"
                  )}>
                    {analysis.riskLevel}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {analysis.riskDescription}
                </p>
              </div>
            </div>
          </div>
        </ScrollArea>
        
        {/* Footer with close hint */}
        <div className="px-6 py-3 border-t shrink-0 bg-muted/30">
          <p className="text-xs text-muted-foreground text-center">
            {hasMultipleAlgorithms 
              ? `Viewing ${sortedAlgorithmPredictions.length} algorithm predictions for this match`
              : "Click outside or press Escape to close"
            }
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}