/**
 * Dashboard showing model recalibration status and adjustments
 */

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Activity, 
  AlertTriangle, 
  ArrowDown, 
  ArrowUp, 
  CheckCircle2, 
  Gauge, 
  Pause,
  TrendingDown,
  TrendingUp,
  Scale,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useModelRecalibration } from "@/hooks/useModelRecalibration";
import { 
  RecalibrationRecommendation, 
  ModelWeight, 
  AlgorithmPerformanceWindow 
} from "@/utils/modelCalibration/types";

function HealthScoreGauge({ score }: { score: number }) {
  const getColor = (score: number) => {
    if (score >= 70) return 'text-green-500';
    if (score >= 50) return 'text-yellow-500';
    if (score >= 30) return 'text-orange-500';
    return 'text-red-500';
  };

  const getLabel = (score: number) => {
    if (score >= 70) return 'Healthy';
    if (score >= 50) return 'Moderate';
    if (score >= 30) return 'Concerning';
    return 'Critical';
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-24 h-24">
        <svg className="w-24 h-24 -rotate-90">
          <circle
            cx="48"
            cy="48"
            r="40"
            strokeWidth="8"
            fill="none"
            className="stroke-muted"
          />
          <circle
            cx="48"
            cy="48"
            r="40"
            strokeWidth="8"
            fill="none"
            strokeLinecap="round"
            className={cn("transition-all duration-500", getColor(score))}
            style={{
              strokeDasharray: 251.2,
              strokeDashoffset: 251.2 * (1 - score / 100),
              stroke: 'currentColor',
            }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn("text-2xl font-bold", getColor(score))}>{score}</span>
        </div>
      </div>
      <span className={cn("text-sm font-medium", getColor(score))}>{getLabel(score)}</span>
    </div>
  );
}

function RecommendationCard({ recommendation }: { recommendation: RecalibrationRecommendation }) {
  const getIcon = () => {
    switch (recommendation.type) {
      case 'pause_algorithm': return <Pause className="h-4 w-4 text-red-500" />;
      case 'decrease_confidence': return <TrendingDown className="h-4 w-4 text-orange-500" />;
      case 'boost_algorithm': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'increase_confidence': return <ArrowUp className="h-4 w-4 text-blue-500" />;
      default: return <CheckCircle2 className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getSeverityColor = () => {
    switch (recommendation.severity) {
      case 'critical': return 'border-red-500/50 bg-red-500/5';
      case 'high': return 'border-orange-500/50 bg-orange-500/5';
      case 'medium': return 'border-yellow-500/50 bg-yellow-500/5';
      default: return 'border-border';
    }
  };

  return (
    <div className={cn("border rounded-lg p-3 space-y-2", getSeverityColor())}>
      <div className="flex items-center gap-2">
        {getIcon()}
        <span className="font-medium text-sm">{recommendation.algorithmName}</span>
        <Badge variant={recommendation.severity === 'critical' ? 'destructive' : 'outline'} className="ml-auto text-xs">
          {recommendation.severity}
        </Badge>
      </div>
      <p className="text-sm text-muted-foreground">{recommendation.message}</p>
      <p className="text-xs text-muted-foreground">
        <strong>Impact:</strong> {recommendation.impact}
      </p>
    </div>
  );
}

function WeightAdjustmentCard({ weight }: { weight: ModelWeight }) {
  const changePercent = ((weight.adjustedWeight - weight.baseWeight) / weight.baseWeight) * 100;
  const isIncreased = changePercent > 0;
  const isDecreased = changePercent < 0;
  const isSignificant = Math.abs(changePercent) > 10;

  return (
    <div className="border rounded-lg p-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="font-medium text-sm">{weight.algorithmName}</span>
        <div className="flex items-center gap-1">
          {isIncreased && <ArrowUp className="h-3 w-3 text-green-500" />}
          {isDecreased && <ArrowDown className="h-3 w-3 text-red-500" />}
          <span className={cn(
            "text-sm font-mono",
            isIncreased && "text-green-500",
            isDecreased && "text-red-500",
            !isIncreased && !isDecreased && "text-muted-foreground"
          )}>
            {(weight.adjustedWeight * 100).toFixed(1)}%
          </span>
        </div>
      </div>
      
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Base: {(weight.baseWeight * 100).toFixed(0)}%</span>
          <span className={cn(
            isIncreased && "text-green-500",
            isDecreased && "text-red-500"
          )}>
            {isIncreased ? '+' : ''}{changePercent.toFixed(1)}%
          </span>
        </div>
        <Progress value={weight.adjustedWeight * 100} className="h-1.5" />
      </div>

      <div className="flex items-center gap-2 text-xs">
        <Badge variant="outline" className="text-xs">
          Conf: ×{weight.confidenceMultiplier.toFixed(2)}
        </Badge>
        <Badge variant="outline" className="text-xs">
          Min: {weight.minConfidenceThreshold}%
        </Badge>
      </div>
      
      <p className="text-xs text-muted-foreground">{weight.adjustmentReason}</p>
    </div>
  );
}

function PerformanceRow({ performance }: { performance: AlgorithmPerformanceWindow }) {
  return (
    <div className="flex items-center justify-between py-2 border-b last:border-0">
      <div className="flex items-center gap-2">
        <span className="font-medium text-sm">{performance.algorithmName}</span>
        {performance.isUnderperforming && (
          <Badge variant="destructive" className="text-xs">Underperforming</Badge>
        )}
        {performance.isOverperforming && (
          <Badge className="text-xs bg-green-500">Outperforming</Badge>
        )}
      </div>
      
      <div className="flex items-center gap-4 text-sm">
        <div className="text-right">
          <div className={cn(
            "font-mono",
            performance.winRate >= 55 && "text-green-500",
            performance.winRate < 45 && "text-red-500"
          )}>
            {performance.winRate.toFixed(1)}%
          </div>
          <div className="text-xs text-muted-foreground">
            {performance.wins}W / {performance.losses}L
          </div>
        </div>
        
        <div className="flex gap-0.5">
          {performance.recentResults.slice(0, 5).map((r, i) => (
            <div
              key={i}
              className={cn(
                "w-4 h-4 rounded text-xs flex items-center justify-center font-medium",
                r === 'W' ? "bg-green-500/20 text-green-500" : "bg-red-500/20 text-red-500"
              )}
            >
              {r}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function RecalibrationDashboard() {
  const { data, isLoading, error } = useModelRecalibration();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-48" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
          <p>Unable to load recalibration data</p>
        </CardContent>
      </Card>
    );
  }

  const criticalRecommendations = data.recommendations.filter(
    r => r.severity === 'critical' || r.severity === 'high'
  );

  const hasSignificantActions = data.actionsTaken.length > 0;

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Model Health</p>
                <p className="text-2xl font-bold">{data.overallHealthScore}/100</p>
              </div>
              <HealthScoreGauge score={data.overallHealthScore} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="h-5 w-5 text-primary" />
              <p className="text-sm text-muted-foreground">Active Adjustments</p>
            </div>
            <p className="text-2xl font-bold">{data.actionsTaken.length}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Weight/confidence changes applied
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              <p className="text-sm text-muted-foreground">Alerts</p>
            </div>
            <p className="text-2xl font-bold">{criticalRecommendations.length}</p>
            <p className="text-xs text-muted-foreground mt-1">
              High priority issues detected
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Critical Alerts */}
      {criticalRecommendations.length > 0 && (
        <Card className="border-orange-500/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Attention Required
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {criticalRecommendations.map((rec, i) => (
              <RecommendationCard key={i} recommendation={rec} />
            ))}
          </CardContent>
        </Card>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Weight Adjustments */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Scale className="h-5 w-5" />
              Weight Adjustments
            </CardTitle>
            <CardDescription>
              Dynamic weights based on {data.windowDays}-day performance
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.modelWeights.map((weight) => (
              <WeightAdjustmentCard key={weight.algorithmId} weight={weight} />
            ))}
          </CardContent>
        </Card>

        {/* Performance Summary */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Recent Performance
            </CardTitle>
            <CardDescription>
              Last {data.windowDays} days
            </CardDescription>
          </CardHeader>
          <CardContent>
            {data.algorithmPerformance.map((perf) => (
              <PerformanceRow key={perf.algorithmId} performance={perf} />
            ))}
          </CardContent>
        </Card>
      </div>

      {/* All Recommendations */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Gauge className="h-5 w-5" />
            All Recommendations
          </CardTitle>
          <CardDescription>
            Automatic adjustments and suggestions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {data.recommendations.map((rec, i) => (
            <RecommendationCard key={i} recommendation={rec} />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
