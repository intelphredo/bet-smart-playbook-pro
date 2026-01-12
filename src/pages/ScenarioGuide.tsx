import { useState, useMemo } from "react";
import NavBar from "@/components/NavBar";
import PageFooter from "@/components/PageFooter";
import AppBreadcrumb from "@/components/layout/AppBreadcrumb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BETTING_SCENARIOS, 
  getScenariosByCategory, 
  getLowRiskScenarios,
  getHighROIScenarios 
} from "@/utils/scenarioAnalysis/bettingScenarios";
import { BettingScenario, RiskLevel } from "@/utils/scenarioAnalysis/types";
import ScenarioCard from "@/components/ScenarioAnalysis/ScenarioCard";
import { 
  Filter, 
  TrendingUp, 
  Shield, 
  AlertTriangle,
  DollarSign,
  Target
} from "lucide-react";

const RISK_COLORS: Record<RiskLevel, string> = {
  'very-low': 'bg-green-500',
  'low': 'bg-green-400',
  'medium': 'bg-amber-500',
  'high': 'bg-orange-500',
  'very-high': 'bg-red-500'
};

const CATEGORY_LABELS: Record<string, string> = {
  'moneyline': 'Moneyline',
  'spread': 'Spread',
  'totals': 'Totals',
  'live': 'Live Betting',
  'parlay': 'Parlays',
  'props': 'Props',
  'strategic': 'Strategic',
  'situational': 'Situational'
};

export default function ScenarioGuide() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedRisk, setSelectedRisk] = useState<RiskLevel | null>(null);
  const [expandedScenario, setExpandedScenario] = useState<string | null>(null);

  const filteredScenarios = useMemo(() => {
    let scenarios = [...BETTING_SCENARIOS];
    
    if (selectedCategory) {
      scenarios = scenarios.filter(s => s.category === selectedCategory);
    }
    
    if (selectedRisk) {
      scenarios = scenarios.filter(s => s.riskLevel === selectedRisk);
    }
    
    return scenarios;
  }, [selectedCategory, selectedRisk]);

  const categories = useMemo(() => {
    const cats = new Set(BETTING_SCENARIOS.map(s => s.category));
    return Array.from(cats);
  }, []);

  const lowRiskScenarios = getLowRiskScenarios();
  const highROIScenarios = getHighROIScenarios();

  const clearFilters = () => {
    setSelectedCategory(null);
    setSelectedRisk(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-accent/10">
      <NavBar />
      <div className="container px-4 py-6">
        <AppBreadcrumb className="mb-4" />
        
        <div className="flex flex-col space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold mb-2">Betting Scenario Analysis</h1>
            <p className="text-muted-foreground">
              Deep dive into the advantages and disadvantages of every betting scenario. 
              Understand when to bet and when to walk away.
            </p>
          </div>

          {/* Quick Access Tabs */}
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full max-w-lg grid-cols-4">
              <TabsTrigger value="all" className="flex items-center gap-1">
                <Target className="h-4 w-4" />
                All
              </TabsTrigger>
              <TabsTrigger value="low-risk" className="flex items-center gap-1">
                <Shield className="h-4 w-4" />
                Low Risk
              </TabsTrigger>
              <TabsTrigger value="high-roi" className="flex items-center gap-1">
                <TrendingUp className="h-4 w-4" />
                High ROI
              </TabsTrigger>
              <TabsTrigger value="warnings" className="flex items-center gap-1">
                <AlertTriangle className="h-4 w-4" />
                Warnings
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-6">
              {/* Filters */}
              <Card className="mb-6">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Filter className="h-5 w-5" />
                    Filters
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Category Filter */}
                    <div>
                      <p className="text-sm font-medium mb-2">Category</p>
                      <div className="flex flex-wrap gap-2">
                        {categories.map(cat => (
                          <Button
                            key={cat}
                            variant={selectedCategory === cat ? "default" : "outline"}
                            size="sm"
                            onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
                          >
                            {CATEGORY_LABELS[cat] || cat}
                          </Button>
                        ))}
                      </div>
                    </div>
                    
                    {/* Risk Filter */}
                    <div>
                      <p className="text-sm font-medium mb-2">Risk Level</p>
                      <div className="flex flex-wrap gap-2">
                        {(['very-low', 'low', 'medium', 'high', 'very-high'] as RiskLevel[]).map(risk => (
                          <Button
                            key={risk}
                            variant={selectedRisk === risk ? "default" : "outline"}
                            size="sm"
                            onClick={() => setSelectedRisk(selectedRisk === risk ? null : risk)}
                            className="flex items-center gap-1"
                          >
                            <div className={`h-2 w-2 rounded-full ${RISK_COLORS[risk]}`} />
                            {risk.replace('-', ' ')}
                          </Button>
                        ))}
                      </div>
                    </div>

                    {(selectedCategory || selectedRisk) && (
                      <Button variant="ghost" size="sm" onClick={clearFilters}>
                        Clear Filters
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Scenario Grid */}
              <div className="grid gap-4 md:grid-cols-2">
                {filteredScenarios.map(scenario => (
                  <ScenarioCard 
                    key={scenario.id} 
                    scenario={scenario}
                    expanded={expandedScenario === scenario.id}
                    onToggle={() => setExpandedScenario(
                      expandedScenario === scenario.id ? null : scenario.id
                    )}
                  />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="low-risk" className="mt-6">
              <div className="mb-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <Shield className="h-5 w-5 text-green-500" />
                  Low Risk Scenarios
                </h2>
                <p className="text-muted-foreground text-sm">
                  These scenarios offer the best risk-adjusted returns for consistent bankroll growth.
                </p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {lowRiskScenarios.map(scenario => (
                  <ScenarioCard 
                    key={scenario.id} 
                    scenario={scenario}
                    expanded={expandedScenario === scenario.id}
                    onToggle={() => setExpandedScenario(
                      expandedScenario === scenario.id ? null : scenario.id
                    )}
                  />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="high-roi" className="mt-6">
              <div className="mb-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-green-500" />
                  Highest Expected ROI
                </h2>
                <p className="text-muted-foreground text-sm">
                  Scenarios with historically positive returns. Requires discipline and proper execution.
                </p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {highROIScenarios.map(scenario => (
                  <ScenarioCard 
                    key={scenario.id} 
                    scenario={scenario}
                    expanded={expandedScenario === scenario.id}
                    onToggle={() => setExpandedScenario(
                      expandedScenario === scenario.id ? null : scenario.id
                    )}
                    showROI
                  />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="warnings" className="mt-6">
              <div className="mb-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  High Risk / Negative ROI Scenarios
                </h2>
                <p className="text-muted-foreground text-sm">
                  These scenarios have historically negative expected returns. Proceed with extreme caution.
                </p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {BETTING_SCENARIOS
                  .filter(s => s.expectedROI < 0 || s.riskLevel === 'very-high')
                  .map(scenario => (
                    <ScenarioCard 
                      key={scenario.id} 
                      scenario={scenario}
                      expanded={expandedScenario === scenario.id}
                      onToggle={() => setExpandedScenario(
                        expandedScenario === scenario.id ? null : scenario.id
                      )}
                      showWarning
                    />
                  ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      <PageFooter />
    </div>
  );
}
