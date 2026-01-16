import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Line,
  ComposedChart,
  Bar,
  Legend,
  Cell,
} from "recharts";
import { Activity, Target, AlertTriangle, CheckCircle, TrendingUp, TrendingDown, Wrench, Lightbulb, AlertCircle, CheckCircle2, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { HistoricalPrediction } from "@/hooks/useHistoricalPredictions";
import { getBinCalibrationSummary } from "@/utils/modelCalibration/binCalibration";

interface CalibrationChartProps {
  predictions: HistoricalPrediction[];
  confidenceVsAccuracy: { confidence: number; winRate: number; count: number }[];
  isLoading?: boolean;
}

interface CalibrationBin {
  confidence: number;
  label: string;
  actualWinRate: number;
  count: number;
  won: number;
  lost: number;
  calibrationError: number;
  isOverconfident: boolean;
  isUnderconfident: boolean;
}

interface TuningRecommendation {
  severity: 'critical' | 'warning' | 'info' | 'success';
  title: string;
  description: string;
  action: string;
  impactedBins: string[];
}

export function CalibrationChart({ predictions, confidenceVsAccuracy, isLoading }: CalibrationChartProps) {
  // Calculate detailed calibration bins
  const calibrationData = useMemo(() => {
    const bins: Record<number, { won: number; lost: number }> = {};
    
    // Initialize bins from 50-100 in 5% increments
    for (let i = 50; i <= 95; i += 5) {
      bins[i] = { won: 0, lost: 0 };
    }
    
    // Populate bins
    predictions
      .filter(p => p.status === 'won' || p.status === 'lost')
      .forEach(p => {
        const conf = p.confidence || 50;
        const binKey = Math.floor(conf / 5) * 5;
        const adjustedBin = Math.max(50, Math.min(95, binKey));
        
        if (bins[adjustedBin]) {
          if (p.status === 'won') {
            bins[adjustedBin].won++;
          } else {
            bins[adjustedBin].lost++;
          }
        }
      });
    
    // Convert to array with calibration calculations
    return Object.entries(bins).map(([conf, data]) => {
      const confidence = parseInt(conf);
      const total = data.won + data.lost;
      const actualWinRate = total > 0 ? (data.won / total) * 100 : 0;
      const calibrationError = actualWinRate - confidence;
      
      return {
        confidence,
        label: `${confidence}-${confidence + 4}%`,
        actualWinRate: Math.round(actualWinRate * 10) / 10,
        count: total,
        won: data.won,
        lost: data.lost,
        calibrationError: Math.round(calibrationError * 10) / 10,
        isOverconfident: calibrationError < -5 && total >= 3,
        isUnderconfident: calibrationError > 5 && total >= 3,
      } as CalibrationBin;
    }).filter(bin => bin.count >= 1);
  }, [predictions]);

  // Calculate overall calibration metrics
  const calibrationMetrics = useMemo(() => {
    const settledPredictions = predictions.filter(p => p.status === 'won' || p.status === 'lost');
    const totalCount = settledPredictions.length;
    
    if (totalCount === 0) {
      return {
        brierScore: 0,
        meanAbsoluteError: 0,
        isWellCalibrated: true,
        overconfidentBins: 0,
        underconfidentBins: 0,
        reliabilityDiagram: [],
      };
    }
    
    // Calculate Brier score and MAE
    let brierSum = 0;
    let maeSum = 0;
    
    settledPredictions.forEach(p => {
      const prob = (p.confidence || 50) / 100;
      const outcome = p.status === 'won' ? 1 : 0;
      brierSum += Math.pow(prob - outcome, 2);
      maeSum += Math.abs(prob - outcome);
    });
    
    const brierScore = brierSum / totalCount;
    const meanAbsoluteError = (maeSum / totalCount) * 100;
    
    // Count over/under confident bins
    const overconfidentBins = calibrationData.filter(b => b.isOverconfident).length;
    const underconfidentBins = calibrationData.filter(b => b.isUnderconfident).length;
    
    // Well calibrated if Brier score < 0.25 and most bins are within 5%
    const isWellCalibrated = brierScore < 0.25 && 
      (overconfidentBins + underconfidentBins) <= Math.ceil(calibrationData.length * 0.3);
    
    return {
      brierScore: Math.round(brierScore * 1000) / 1000,
      meanAbsoluteError: Math.round(meanAbsoluteError * 10) / 10,
      isWellCalibrated,
      overconfidentBins,
      underconfidentBins,
    };
  }, [predictions, calibrationData]);

  // Generate tuning recommendations based on calibration analysis
  const tuningRecommendations = useMemo((): TuningRecommendation[] => {
    const recommendations: TuningRecommendation[] = [];
    
    // Analyze overconfident bins
    const overconfidentBins = calibrationData.filter(b => b.isOverconfident);
    if (overconfidentBins.length > 0) {
      const avgError = overconfidentBins.reduce((sum, b) => sum + Math.abs(b.calibrationError), 0) / overconfidentBins.length;
      const impactedBins = overconfidentBins.map(b => b.label);
      
      if (avgError > 15) {
        recommendations.push({
          severity: 'critical',
          title: 'Severe Overconfidence Detected',
          description: `${overconfidentBins.length} confidence bins are significantly overconfident (avg ${avgError.toFixed(1)}% gap). The model is predicting higher win rates than it achieves.`,
          action: 'Consider reducing confidence scores by 10-15% for high-confidence picks, or add stricter filters before assigning high confidence.',
          impactedBins,
        });
      } else {
        recommendations.push({
          severity: 'warning',
          title: 'Moderate Overconfidence',
          description: `${overconfidentBins.length} bins show overconfidence (avg ${avgError.toFixed(1)}% gap). Picks are winning less often than predicted.`,
          action: 'Apply a 5-10% confidence reduction multiplier for affected ranges, or require additional validation signals.',
          impactedBins,
        });
      }
    }
    
    // Analyze underconfident bins
    const underconfidentBins = calibrationData.filter(b => b.isUnderconfident);
    if (underconfidentBins.length > 0) {
      const avgError = underconfidentBins.reduce((sum, b) => sum + b.calibrationError, 0) / underconfidentBins.length;
      const impactedBins = underconfidentBins.map(b => b.label);
      
      recommendations.push({
        severity: 'info',
        title: 'Underconfidence Opportunity',
        description: `${underconfidentBins.length} bins are underconfident (avg +${avgError.toFixed(1)}% better than predicted). The model is performing better than expected.`,
        action: 'Consider boosting confidence by 5-8% for these ranges, or increasing bet sizes for picks in these confidence levels.',
        impactedBins,
      });
    }
    
    // Check for low sample sizes
    const lowSampleBins = calibrationData.filter(b => b.count < 5 && b.count > 0);
    if (lowSampleBins.length >= 3) {
      recommendations.push({
        severity: 'info',
        title: 'Insufficient Data for Some Ranges',
        description: `${lowSampleBins.length} confidence bins have fewer than 5 picks, making calibration uncertain.`,
        action: 'Continue tracking predictions to build statistical significance. Aim for 10+ picks per bin for reliable calibration.',
        impactedBins: lowSampleBins.map(b => b.label),
      });
    }
    
    // Check for high-confidence accuracy
    const highConfBins = calibrationData.filter(b => b.confidence >= 70);
    const highConfWinRate = highConfBins.reduce((sum, b) => sum + b.won, 0) / 
      Math.max(1, highConfBins.reduce((sum, b) => sum + b.count, 0)) * 100;
    
    if (highConfBins.length > 0 && highConfWinRate < 65) {
      recommendations.push({
        severity: 'critical',
        title: 'High Confidence Picks Underperforming',
        description: `Picks with 70%+ confidence are only winning ${highConfWinRate.toFixed(1)}% of the time.`,
        action: 'Raise the minimum confidence threshold to 75%, or add additional validation requirements for high-confidence picks.',
        impactedBins: highConfBins.map(b => b.label),
      });
    } else if (highConfBins.length > 0 && highConfWinRate >= 75) {
      recommendations.push({
        severity: 'success',
        title: 'High Confidence Picks Performing Well',
        description: `Picks with 70%+ confidence are winning ${highConfWinRate.toFixed(1)}% of the time - exceeding expectations.`,
        action: 'Consider prioritizing these picks or increasing unit sizes for high-confidence selections.',
        impactedBins: highConfBins.map(b => b.label),
      });
    }
    
    // Brier score recommendations
    if (calibrationMetrics.brierScore > 0.3) {
      recommendations.push({
        severity: 'warning',
        title: 'High Brier Score',
        description: `Brier score of ${calibrationMetrics.brierScore} indicates poor probability calibration overall.`,
        action: 'Review the confidence calculation methodology. Consider using logistic regression to recalibrate probability outputs.',
        impactedBins: [],
      });
    }
    
    // If well calibrated, add success message
    if (calibrationMetrics.isWellCalibrated && recommendations.filter(r => r.severity === 'critical' || r.severity === 'warning').length === 0) {
      recommendations.unshift({
        severity: 'success',
        title: 'Model is Well Calibrated',
        description: 'The model\'s confidence scores accurately reflect actual win probabilities.',
        action: 'Continue monitoring performance. Consider slightly more aggressive position sizing on high-confidence picks.',
        impactedBins: [],
      });
    }
    
    return recommendations;
  }, [calibrationData, calibrationMetrics]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Activity className="h-5 w-5 animate-pulse" />
            Loading calibration data...
          </div>
        </CardContent>
      </Card>
    );
  }

  const settledCount = predictions.filter(p => p.status === 'won' || p.status === 'lost').length;

  return (
    <div className="space-y-4">
      {/* Calibration Overview */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            Model Calibration Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {/* Calibration Status */}
            <div className="bg-muted/50 rounded-lg p-3">
              <div className="text-xs text-muted-foreground mb-1">Calibration Status</div>
              <div className="flex items-center gap-2">
                {calibrationMetrics.isWellCalibrated ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="font-bold text-green-500">Well Calibrated</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    <span className="font-bold text-yellow-500">Needs Tuning</span>
                  </>
                )}
              </div>
              {(() => {
                const binSummary = getBinCalibrationSummary();
                if (binSummary.isActive && binSummary.adjustedBinsCount > 0) {
                  return (
                    <div className="mt-1.5 flex items-center gap-1 text-xs text-cyan-500">
                      <Zap className="h-3 w-3" />
                      <span>Auto-tuning {binSummary.adjustedBinsCount} bins</span>
                    </div>
                  );
                }
                return null;
              })()}
            </div>
            
            {/* Brier Score */}
            <div className="bg-muted/50 rounded-lg p-3">
              <div className="text-xs text-muted-foreground mb-1">Brier Score</div>
              <div className="flex items-baseline gap-1">
                <span className="font-bold text-lg">{calibrationMetrics.brierScore}</span>
                <span className="text-xs text-muted-foreground">/ 1.0</span>
              </div>
              <div className="text-xs text-muted-foreground">Lower is better</div>
            </div>
            
            {/* Mean Absolute Error */}
            <div className="bg-muted/50 rounded-lg p-3">
              <div className="text-xs text-muted-foreground mb-1">Avg. Calibration Error</div>
              <div className="font-bold text-lg">{calibrationMetrics.meanAbsoluteError}%</div>
              <Progress 
                value={100 - Math.min(calibrationMetrics.meanAbsoluteError * 2, 100)} 
                className="h-1.5 mt-1" 
              />
            </div>
            
            {/* Confidence Bias */}
            <div className="bg-muted/50 rounded-lg p-3">
              <div className="text-xs text-muted-foreground mb-1">Confidence Bias</div>
              {calibrationMetrics.overconfidentBins > calibrationMetrics.underconfidentBins ? (
                <div className="flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-red-500" />
                  <span className="font-bold text-red-500">Overconfident</span>
                </div>
              ) : calibrationMetrics.underconfidentBins > calibrationMetrics.overconfidentBins ? (
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-blue-500" />
                  <span className="font-bold text-blue-500">Underconfident</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="font-bold text-green-500">Balanced</span>
                </div>
              )}
            </div>
          </div>

          {/* Calibration Chart */}
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={calibrationData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="confidence" 
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v) => `${v}%`}
                  label={{ value: 'Model Confidence', position: 'bottom', fontSize: 12, offset: -5 }}
                />
                <YAxis 
                  domain={[0, 100]}
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v) => `${v}%`}
                  label={{ value: 'Actual Win Rate', angle: -90, position: 'insideLeft', fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                  formatter={(value: number, name: string) => {
                    if (name === 'actualWinRate') return [`${value}%`, 'Actual Win Rate'];
                    if (name === 'count') return [value, 'Sample Size'];
                    return [value, name];
                  }}
                  labelFormatter={(label) => `Confidence: ${label}-${label + 4}%`}
                />
                
                {/* Perfect calibration line */}
                <ReferenceLine
                  segment={[{ x: 50, y: 50 }, { x: 100, y: 100 }]}
                  stroke="hsl(var(--primary))"
                  strokeDasharray="5 5"
                  strokeWidth={2}
                  label={{ value: 'Perfect Calibration', position: 'top', fontSize: 10 }}
                />
                
                {/* Bars for sample size */}
                <Bar 
                  dataKey="count" 
                  fill="hsl(var(--muted-foreground))"
                  opacity={0.2}
                  yAxisId="right"
                  name="count"
                />
                
                {/* Actual win rate points */}
                <Scatter
                  dataKey="actualWinRate"
                  fill="hsl(var(--primary))"
                  name="actualWinRate"
                >
                  {calibrationData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        entry.isOverconfident 
                          ? "hsl(0, 84%, 60%)" 
                          : entry.isUnderconfident 
                          ? "hsl(221, 83%, 53%)" 
                          : "hsl(142, 76%, 36%)"
                      }
                    />
                  ))}
                </Scatter>
                
                <YAxis 
                  yAxisId="right" 
                  orientation="right" 
                  hide 
                  domain={[0, Math.max(...calibrationData.map(d => d.count)) * 5]}
                />
                
                <Legend 
                  formatter={(value) => {
                    if (value === 'actualWinRate') return 'Actual Win Rate';
                    if (value === 'count') return 'Sample Size (bars)';
                    return value;
                  }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-center gap-6 mt-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span>Well Calibrated</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span>Overconfident</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span>Underconfident</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tuning Recommendations */}
      {tuningRecommendations.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Wrench className="h-4 w-4 text-primary" />
              Tuning Recommendations
              <Badge variant="secondary" className="ml-2">
                {tuningRecommendations.filter(r => r.severity === 'critical' || r.severity === 'warning').length} actions needed
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {tuningRecommendations.map((rec, index) => {
                const severityConfig = {
                  critical: {
                    icon: <AlertCircle className="h-4 w-4" />,
                    bg: 'bg-red-500/10 border-red-500/30',
                    iconColor: 'text-red-500',
                    badge: 'bg-red-500/20 text-red-600 border-red-500/30',
                  },
                  warning: {
                    icon: <AlertTriangle className="h-4 w-4" />,
                    bg: 'bg-yellow-500/10 border-yellow-500/30',
                    iconColor: 'text-yellow-500',
                    badge: 'bg-yellow-500/20 text-yellow-600 border-yellow-500/30',
                  },
                  info: {
                    icon: <Lightbulb className="h-4 w-4" />,
                    bg: 'bg-blue-500/10 border-blue-500/30',
                    iconColor: 'text-blue-500',
                    badge: 'bg-blue-500/20 text-blue-600 border-blue-500/30',
                  },
                  success: {
                    icon: <CheckCircle2 className="h-4 w-4" />,
                    bg: 'bg-green-500/10 border-green-500/30',
                    iconColor: 'text-green-500',
                    badge: 'bg-green-500/20 text-green-600 border-green-500/30',
                  },
                }[rec.severity];

                return (
                  <div
                    key={index}
                    className={cn(
                      "p-4 rounded-lg border",
                      severityConfig.bg
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn("mt-0.5", severityConfig.iconColor)}>
                        {severityConfig.icon}
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm">{rec.title}</span>
                          <Badge variant="outline" className={cn("text-xs", severityConfig.badge)}>
                            {rec.severity}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{rec.description}</p>
                        <div className="bg-background/50 rounded p-2.5 border border-border/50">
                          <div className="text-xs font-medium text-primary mb-1">Recommended Action:</div>
                          <p className="text-xs text-foreground">{rec.action}</p>
                        </div>
                        {rec.impactedBins.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {rec.impactedBins.map((bin, i) => (
                              <Badge key={i} variant="secondary" className="text-xs">
                                {bin}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Confidence Breakdown Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Accuracy by Confidence Level
            <Badge variant="secondary" className="ml-2">
              {settledCount} settled picks
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {calibrationData.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                Not enough data for calibration analysis
              </div>
            ) : (
              calibrationData.map((bin) => (
                <div
                  key={bin.confidence}
                  className={cn(
                    "flex items-center justify-between p-2.5 rounded-lg",
                    bin.isOverconfident ? "bg-red-500/10" :
                    bin.isUnderconfident ? "bg-blue-500/10" : "bg-muted/50"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="text-sm font-medium w-20">{bin.label}</div>
                    <div className="text-xs text-muted-foreground">
                      {bin.won}W - {bin.lost}L ({bin.count} picks)
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-24">
                      <Progress value={bin.actualWinRate} className="h-2" />
                    </div>
                    <div className={cn(
                      "text-sm font-bold w-16 text-right",
                      bin.isOverconfident ? "text-red-500" :
                      bin.isUnderconfident ? "text-blue-500" : "text-green-500"
                    )}>
                      {bin.actualWinRate.toFixed(1)}%
                    </div>
                    <div className={cn(
                      "text-xs w-16 text-right",
                      bin.calibrationError > 0 ? "text-blue-500" : 
                      bin.calibrationError < 0 ? "text-red-500" : ""
                    )}>
                      {bin.calibrationError > 0 ? '+' : ''}{bin.calibrationError}%
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          
          <div className="mt-4 p-3 bg-muted/30 rounded-lg text-sm">
            <div className="font-medium mb-1">How to Read This Chart</div>
            <p className="text-muted-foreground text-xs">
              If the model is perfectly calibrated, picks at 70% confidence should win ~70% of the time.
              <span className="text-red-500"> Red</span> indicates overconfidence (winning less than predicted),
              <span className="text-blue-500"> Blue</span> indicates underconfidence (winning more than predicted).
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
