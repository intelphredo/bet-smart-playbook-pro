
import { BettingScenario, RiskLevel } from "@/utils/scenarioAnalysis/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  ChevronDown, 
  ChevronUp, 
  TrendingUp, 
  TrendingDown,
  Check,
  X,
  AlertTriangle,
  Lightbulb,
  Target,
  Ban
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ScenarioCardProps {
  scenario: BettingScenario;
  expanded: boolean;
  onToggle: () => void;
  showROI?: boolean;
  showWarning?: boolean;
}

const RISK_COLORS: Record<RiskLevel, string> = {
  'very-low': 'bg-green-500 text-white',
  'low': 'bg-green-400 text-white',
  'medium': 'bg-amber-500 text-white',
  'high': 'bg-orange-500 text-white',
  'very-high': 'bg-red-500 text-white'
};

const RISK_BG: Record<RiskLevel, string> = {
  'very-low': 'border-green-500/30 bg-green-500/5',
  'low': 'border-green-400/30 bg-green-400/5',
  'medium': 'border-amber-500/30 bg-amber-500/5',
  'high': 'border-orange-500/30 bg-orange-500/5',
  'very-high': 'border-red-500/30 bg-red-500/5'
};

export default function ScenarioCard({ 
  scenario, 
  expanded, 
  onToggle,
  showROI,
  showWarning 
}: ScenarioCardProps) {
  const isPositiveROI = scenario.expectedROI > 0;
  
  return (
    <Card className={cn("transition-all duration-200", RISK_BG[scenario.riskLevel])}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">{scenario.name}</CardTitle>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className={RISK_COLORS[scenario.riskLevel]}>
                {scenario.riskLevel.replace('-', ' ')}
              </Badge>
              <Badge variant="outline">{scenario.category}</Badge>
              {showROI && (
                <Badge variant={isPositiveROI ? "default" : "destructive"} className="flex items-center gap-1">
                  {isPositiveROI ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {isPositiveROI ? '+' : ''}{scenario.expectedROI.toFixed(1)}% ROI
                </Badge>
              )}
              {showWarning && scenario.expectedROI < 0 && (
                <Badge variant="destructive" className="flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Negative EV
                </Badge>
              )}
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onToggle}>
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        <p className="text-sm text-muted-foreground mb-3">{scenario.description}</p>
        
        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="text-center p-2 rounded-lg bg-background/50">
            <div className="text-lg font-bold">{scenario.historicalWinRate}%</div>
            <div className="text-xs text-muted-foreground">Win Rate</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-background/50">
            <div className={cn("text-lg font-bold", isPositiveROI ? "text-green-500" : "text-red-500")}>
              {isPositiveROI ? '+' : ''}{scenario.expectedROI.toFixed(1)}%
            </div>
            <div className="text-xs text-muted-foreground">Exp. ROI</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-background/50">
            <div className="text-lg font-bold">{scenario.variance}</div>
            <div className="text-xs text-muted-foreground">Variance</div>
          </div>
        </div>

        {expanded && (
          <div className="space-y-4 mt-4 pt-4 border-t">
            {/* Advantages */}
            <div>
              <h4 className="font-semibold text-green-500 flex items-center gap-2 mb-2">
                <Check className="h-4 w-4" />
                Advantages
              </h4>
              <div className="space-y-2">
                {scenario.advantages.map((adv, i) => (
                  <div key={i} className="text-sm p-2 rounded bg-green-500/10">
                    <div className="font-medium flex items-center gap-2">
                      {adv.title}
                      <Badge variant="outline" className="text-xs">
                        {adv.impact} impact
                      </Badge>
                    </div>
                    <p className="text-muted-foreground mt-1">{adv.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Disadvantages */}
            <div>
              <h4 className="font-semibold text-red-500 flex items-center gap-2 mb-2">
                <X className="h-4 w-4" />
                Disadvantages
              </h4>
              <div className="space-y-2">
                {scenario.disadvantages.map((dis, i) => (
                  <div key={i} className={cn(
                    "text-sm p-2 rounded",
                    dis.severity === 'critical' ? "bg-red-500/20" : 
                    dis.severity === 'major' ? "bg-red-500/10" : "bg-red-500/5"
                  )}>
                    <div className="font-medium flex items-center gap-2">
                      {dis.title}
                      <Badge 
                        variant={dis.severity === 'critical' ? "destructive" : "outline"}
                        className="text-xs"
                      >
                        {dis.severity}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground mt-1">{dis.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* When to Use */}
            <div>
              <h4 className="font-semibold flex items-center gap-2 mb-2">
                <Target className="h-4 w-4 text-primary" />
                When to Use
              </h4>
              <ul className="text-sm space-y-1">
                {scenario.whenToUse.map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* When to Avoid */}
            <div>
              <h4 className="font-semibold flex items-center gap-2 mb-2">
                <Ban className="h-4 w-4 text-red-500" />
                When to Avoid
              </h4>
              <ul className="text-sm space-y-1">
                {scenario.whenToAvoid.map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <X className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Pro Tips */}
            <div>
              <h4 className="font-semibold flex items-center gap-2 mb-2">
                <Lightbulb className="h-4 w-4 text-amber-500" />
                Pro Tips
              </h4>
              <ul className="text-sm space-y-1">
                {scenario.proTips.map((tip, i) => (
                  <li key={i} className="flex items-start gap-2 p-2 rounded bg-amber-500/10">
                    <Lightbulb className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Bankroll Guidance */}
            <div className="p-3 rounded-lg bg-muted/50">
              <h4 className="font-semibold mb-2">Bankroll Management</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Recommended Kelly:</span>
                  <span className="ml-2 font-medium">{(scenario.recommendedKellyFraction * 100).toFixed(0)}%</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Max Bet Size:</span>
                  <span className="ml-2 font-medium">{scenario.maxBankrollPercentage}% of bankroll</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
