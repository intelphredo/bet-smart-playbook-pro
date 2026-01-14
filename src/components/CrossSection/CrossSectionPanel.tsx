// Cross-Section Intelligence Panel
// Displays unified insights from multiple data sources

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Brain,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Users,
  Activity,
  Zap,
  Target,
  Shield,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronRight,
  Lightbulb,
  History,
  BarChart3,
  Stethoscope,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Match } from "@/types/sports";
import { CrossSectionData, CrossSectionInsight } from "@/hooks/useCrossSectionData";
import { format } from "date-fns";

interface CrossSectionPanelProps {
  match: Match;
  crossSectionData: CrossSectionData;
  compact?: boolean;
}

const INSIGHT_ICONS = {
  warning: AlertTriangle,
  opportunity: Zap,
  validation: CheckCircle2,
  info: Lightbulb,
};

const INSIGHT_COLORS = {
  warning: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/30',
  opportunity: 'text-green-500 bg-green-500/10 border-green-500/30',
  validation: 'text-blue-500 bg-blue-500/10 border-blue-500/30',
  info: 'text-muted-foreground bg-muted/50 border-muted',
};

export function CrossSectionPanel({ match, crossSectionData, compact = false }: CrossSectionPanelProps) {
  const [expandedInsight, setExpandedInsight] = useState<string | null>(null);
  const { insights, validations, isLoading, hasData } = crossSectionData;

  // Calculate overall cross-section score
  const crossSectionScore = useMemo(() => {
    const validationCount = Object.values(validations).filter(Boolean).length;
    const totalValidations = Object.keys(validations).length;
    const opportunityCount = insights.filter(i => i.type === 'opportunity').length;
    const warningCount = insights.filter(i => i.type === 'warning').length;
    
    const baseScore = (validationCount / totalValidations) * 100;
    const bonus = opportunityCount * 5;
    const penalty = warningCount * 10;
    
    return Math.max(0, Math.min(100, baseScore + bonus - penalty));
  }, [validations, insights]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-6">
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Activity className="h-5 w-5 animate-pulse" />
            Analyzing cross-section data...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!hasData) {
    return null;
  }

  if (compact) {
    return <CompactCrossSectionView match={match} crossSectionData={crossSectionData} score={crossSectionScore} />;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Brain className="h-4 w-4 text-primary" />
            Cross-Section Intelligence
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant={crossSectionScore >= 70 ? "default" : crossSectionScore >= 50 ? "secondary" : "destructive"}>
              Score: {crossSectionScore.toFixed(0)}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Validation Status */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <ValidationBadge 
            label="Sharp Alignment" 
            isValid={validations.aiAlignedWithSharps}
            icon={Users}
          />
          <ValidationBadge 
            label="Injury Accounted" 
            isValid={validations.injuryAccountedFor}
            icon={Stethoscope}
          />
          <ValidationBadge 
            label="Scenario Positive" 
            isValid={validations.scenarioMatchesHistory}
            icon={BarChart3}
          />
          <ValidationBadge 
            label="Trend Support" 
            isValid={validations.trendSupportsProjection}
            icon={TrendingUp}
          />
        </div>

        {/* Main Insights */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-yellow-500" />
            Key Insights
            <Badge variant="outline" className="ml-auto">
              {insights.length} found
            </Badge>
          </h4>
          
          <ScrollArea className="h-[300px]">
            <div className="space-y-2">
              {insights.map((insight, idx) => (
                <InsightCard
                  key={idx}
                  insight={insight}
                  isExpanded={expandedInsight === `${idx}`}
                  onToggle={() => setExpandedInsight(expandedInsight === `${idx}` ? null : `${idx}`)}
                />
              ))}
              
              {insights.length === 0 && (
                <div className="text-center py-6 text-muted-foreground">
                  <Shield className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No significant cross-section patterns detected</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Data Sources Summary */}
        <Tabs defaultValue="history" className="mt-4">
          <TabsList className="grid w-full grid-cols-4 h-8">
            <TabsTrigger value="history" className="text-xs gap-1">
              <History className="h-3 w-3" />
              <span className="hidden sm:inline">History</span>
            </TabsTrigger>
            <TabsTrigger value="injuries" className="text-xs gap-1">
              <Stethoscope className="h-3 w-3" />
              <span className="hidden sm:inline">Injuries</span>
            </TabsTrigger>
            <TabsTrigger value="trends" className="text-xs gap-1">
              <TrendingUp className="h-3 w-3" />
              <span className="hidden sm:inline">Trends</span>
            </TabsTrigger>
            <TabsTrigger value="scenario" className="text-xs gap-1">
              <Target className="h-3 w-3" />
              <span className="hidden sm:inline">Scenario</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="history" className="mt-3">
            <HistoricalMatchupsView matchups={crossSectionData.historicalMatchups} winRate={crossSectionData.historicalWinRate} />
          </TabsContent>

          <TabsContent value="injuries" className="mt-3">
            <InjuriesView injuries={crossSectionData.injuries} />
          </TabsContent>

          <TabsContent value="trends" className="mt-3">
            <BettingTrendView trend={crossSectionData.bettingTrend} />
          </TabsContent>

          <TabsContent value="scenario" className="mt-3">
            <ScenarioView scenario={crossSectionData.primaryScenario} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

// Compact view for inline display
function CompactCrossSectionView({ 
  match, 
  crossSectionData, 
  score 
}: { 
  match: Match; 
  crossSectionData: CrossSectionData; 
  score: number;
}) {
  const { insights, validations } = crossSectionData;
  const topInsight = insights[0];
  const warningCount = insights.filter(i => i.type === 'warning').length;
  const opportunityCount = insights.filter(i => i.type === 'opportunity').length;

  return (
    <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/30 border">
      <div className="flex items-center gap-2">
        <Brain className="h-4 w-4 text-primary" />
        <span className="text-xs font-medium">Cross-Section</span>
      </div>
      
      <Progress value={score} className="w-16 h-1.5" />
      
      <div className="flex items-center gap-1.5">
        {opportunityCount > 0 && (
          <Badge variant="default" className="text-xs py-0 px-1.5 h-5 bg-green-500">
            <Zap className="h-3 w-3 mr-0.5" />
            {opportunityCount}
          </Badge>
        )}
        {warningCount > 0 && (
          <Badge variant="destructive" className="text-xs py-0 px-1.5 h-5">
            <AlertTriangle className="h-3 w-3 mr-0.5" />
            {warningCount}
          </Badge>
        )}
      </div>
      
      {topInsight && (
        <span className="text-xs text-muted-foreground truncate max-w-[200px]">
          {topInsight.title}
        </span>
      )}
    </div>
  );
}

function ValidationBadge({ label, isValid, icon: Icon }: { label: string; isValid: boolean; icon: any }) {
  return (
    <div className={cn(
      "flex items-center gap-2 p-2 rounded-lg border",
      isValid ? "bg-green-500/10 border-green-500/30" : "bg-red-500/10 border-red-500/30"
    )}>
      <Icon className={cn("h-4 w-4", isValid ? "text-green-500" : "text-red-500")} />
      <div className="flex-1 min-w-0">
        <p className="text-xs truncate">{label}</p>
      </div>
      {isValid ? (
        <CheckCircle2 className="h-3 w-3 text-green-500" />
      ) : (
        <XCircle className="h-3 w-3 text-red-500" />
      )}
    </div>
  );
}

function InsightCard({ 
  insight, 
  isExpanded, 
  onToggle 
}: { 
  insight: CrossSectionInsight; 
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const Icon = INSIGHT_ICONS[insight.type];
  const colorClass = INSIGHT_COLORS[insight.type];

  return (
    <Collapsible open={isExpanded} onOpenChange={onToggle}>
      <div className={cn("rounded-lg border p-3", colorClass)}>
        <CollapsibleTrigger asChild>
          <div className="flex items-start justify-between cursor-pointer">
            <div className="flex items-start gap-2">
              <Icon className="h-4 w-4 mt-0.5" />
              <div>
                <p className="text-sm font-medium">{insight.title}</p>
                <p className="text-xs opacity-70">{insight.source}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {insight.confidence}%
              </Badge>
              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </div>
          </div>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <div className="mt-2 pt-2 border-t border-current/20 space-y-2">
            <p className="text-sm">{insight.description}</p>
            {insight.action && (
              <div className="flex items-center gap-2 text-xs">
                <Target className="h-3 w-3" />
                <span className="font-medium">Action:</span>
                <span>{insight.action}</span>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

function HistoricalMatchupsView({ matchups, winRate }: { matchups: any[]; winRate: number }) {
  if (matchups.length === 0) {
    return (
      <div className="text-center py-4 text-muted-foreground text-sm">
        No historical data for similar matchups
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Historical Win Rate:</span>
        <span className={cn("font-bold", winRate >= 55 ? "text-green-500" : winRate <= 45 ? "text-red-500" : "")}>
          {winRate.toFixed(1)}%
        </span>
      </div>
      <div className="space-y-1">
        {matchups.slice(0, 5).map((m, i) => (
          <div key={i} className="flex items-center justify-between text-xs p-2 bg-muted/30 rounded">
            <span className="truncate">{format(new Date(m.date), 'MMM d')}</span>
            <Badge variant={m.status === 'won' ? "default" : "destructive"} className="text-xs">
              {m.status}
            </Badge>
          </div>
        ))}
      </div>
    </div>
  );
}

function InjuriesView({ injuries }: { injuries: CrossSectionData['injuries'] }) {
  if (!injuries || injuries.totalImpact === 0) {
    return (
      <div className="text-center py-4 text-muted-foreground text-sm">
        No significant injuries reported
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Total Impact:</span>
        <span className={cn("font-bold", injuries.totalImpact > 15 ? "text-red-500" : "text-yellow-500")}>
          {injuries.totalImpact.toFixed(0)}%
        </span>
      </div>
      {injuries.keyInjuries.length > 0 && (
        <div className="space-y-1">
          {injuries.keyInjuries.map((injury, i) => (
            <div key={i} className="text-xs p-2 bg-red-500/10 rounded flex items-center gap-2">
              <Stethoscope className="h-3 w-3 text-red-500" />
              {injury}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function BettingTrendView({ trend }: { trend: CrossSectionData['bettingTrend'] }) {
  if (!trend) {
    return (
      <div className="text-center py-4 text-muted-foreground text-sm">
        No betting trend data available
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <div className="p-2 bg-muted/50 rounded text-center">
          <div className="text-xs text-muted-foreground">Public %</div>
          <div className="font-bold">{trend.publicPercent}%</div>
        </div>
        <div className="p-2 bg-muted/50 rounded text-center">
          <div className="text-xs text-muted-foreground">Sharp %</div>
          <div className="font-bold">{trend.sharpPercent}%</div>
        </div>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Line Movement:</span>
        <span className={cn("font-medium", trend.lineMovement > 0 ? "text-green-500" : trend.lineMovement < 0 ? "text-red-500" : "")}>
          {trend.lineMovement > 0 ? '+' : ''}{trend.lineMovement.toFixed(1)}%
        </span>
      </div>
      {trend.isReverseLineMovement && (
        <Badge variant="secondary" className="w-full justify-center">
          <Zap className="h-3 w-3 mr-1" />
          Reverse Line Movement
        </Badge>
      )}
    </div>
  );
}

function ScenarioView({ scenario }: { scenario: CrossSectionData['primaryScenario'] }) {
  if (!scenario) {
    return (
      <div className="text-center py-4 text-muted-foreground text-sm">
        No specific scenario detected
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="font-medium">{scenario.name}</div>
      <p className="text-xs text-muted-foreground">{scenario.description}</p>
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="p-2 bg-muted/50 rounded">
          <div className="text-xs text-muted-foreground">Win Rate</div>
          <div className="font-bold">{scenario.historicalWinRate}%</div>
        </div>
        <div className="p-2 bg-muted/50 rounded">
          <div className="text-xs text-muted-foreground">Exp. ROI</div>
          <div className={cn("font-bold", scenario.expectedROI > 0 ? "text-green-500" : "text-red-500")}>
            {scenario.expectedROI > 0 ? '+' : ''}{scenario.expectedROI.toFixed(1)}%
          </div>
        </div>
        <div className="p-2 bg-muted/50 rounded">
          <div className="text-xs text-muted-foreground">Risk</div>
          <div className="font-bold capitalize">{scenario.riskLevel}</div>
        </div>
      </div>
    </div>
  );
}
