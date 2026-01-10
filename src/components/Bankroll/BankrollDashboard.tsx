
import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BankrollSettings, BankrollScenario, DEFAULT_BANKROLL_SETTINGS } from "@/types/bankroll";
import { BANKROLL_SCENARIOS, getRecommendedScenario } from "@/utils/scenarioAnalysis/bankrollScenarios";
import { 
  generateBankrollProjections, 
  calculateBankrollRisk,
  calculateOptimalUnitSize,
  runMonteCarloSimulation
} from "@/utils/betting/bankrollSimulator";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  AreaChart, Area
} from "recharts";
import { 
  Wallet, TrendingUp, AlertTriangle, Shield, Settings, ChartLine, 
  Target, Gauge, DollarSign, Percent, Calculator, ChevronRight
} from "lucide-react";

export function BankrollDashboard() {
  const [settings, setSettings] = useState<BankrollSettings>(DEFAULT_BANKROLL_SETTINGS);
  const [selectedScenario, setSelectedScenario] = useState<BankrollScenario>(
    getRecommendedScenario(0, 0.54, 'intermediate')
  );
  const [winRate, setWinRate] = useState(54);
  const [avgOdds, setAvgOdds] = useState(1.9);
  
  // Calculate projections
  const projections = useMemo(() => 
    generateBankrollProjections(settings, 30, winRate / 100, 3),
    [settings, winRate]
  );
  
  // Calculate risk metrics
  const riskMetrics = useMemo(() => 
    calculateBankrollRisk(settings, []),
    [settings]
  );
  
  // Run Monte Carlo simulation
  const simulations = useMemo(() => 
    runMonteCarloSimulation(settings, {
      numBets: 100,
      winRate: winRate / 100,
      avgOdds,
      kellyFraction: selectedScenario.kellyFraction,
      numSimulations: 500
    }),
    [settings, winRate, avgOdds, selectedScenario]
  );
  
  const optimalUnit = useMemo(() => 
    calculateOptimalUnitSize(settings.currentBankroll, winRate / 100, avgOdds, selectedScenario.kellyFraction),
    [settings.currentBankroll, winRate, avgOdds, selectedScenario]
  );
  
  const realisticSim = simulations.find(s => s.scenario === 'realistic');
  
  const getRiskColor = (health: number) => {
    if (health >= 70) return 'text-green-400';
    if (health >= 40) return 'text-yellow-400';
    return 'text-red-400';
  };
  
  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/20 rounded-lg">
                <Wallet className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Current Bankroll</p>
                <p className="text-2xl font-bold">${settings.currentBankroll.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <DollarSign className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Optimal Unit Size</p>
                <p className="text-2xl font-bold">${optimalUnit.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${riskMetrics.healthScore >= 70 ? 'bg-green-500/20' : riskMetrics.healthScore >= 40 ? 'bg-yellow-500/20' : 'bg-red-500/20'}`}>
                <Shield className={`h-5 w-5 ${getRiskColor(riskMetrics.healthScore)}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Health Score</p>
                <p className={`text-2xl font-bold ${getRiskColor(riskMetrics.healthScore)}`}>
                  {riskMetrics.healthScore.toFixed(0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-500/20 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-orange-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Risk of Ruin</p>
                <p className="text-2xl font-bold">{(riskMetrics.riskOfRuin * 100).toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="projections" className="space-y-4">
        <TabsList className="grid grid-cols-4 w-full max-w-md">
          <TabsTrigger value="projections">Projections</TabsTrigger>
          <TabsTrigger value="scenarios">Strategies</TabsTrigger>
          <TabsTrigger value="simulation">Simulation</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        
        {/* Projections Tab */}
        <TabsContent value="projections" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ChartLine className="h-5 w-5" />
                30-Day Bankroll Projection
              </CardTitle>
              <CardDescription>
                Based on {winRate}% win rate with {avgOdds.toFixed(2)} average odds
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={projections}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))' 
                      }}
                      formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
                    />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="optimistic" 
                      stroke="#22c55e" 
                      fill="#22c55e" 
                      fillOpacity={0.1}
                      name="Optimistic"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="realistic" 
                      stroke="#3b82f6" 
                      fill="#3b82f6" 
                      fillOpacity={0.2}
                      name="Realistic"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="pessimistic" 
                      stroke="#ef4444" 
                      fill="#ef4444" 
                      fillOpacity={0.1}
                      name="Pessimistic"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              
              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Expected (30d)</p>
                  <p className="text-lg font-bold text-green-400">
                    +${(projections[30]?.realistic - settings.currentBankroll).toFixed(0)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Best Case</p>
                  <p className="text-lg font-bold text-blue-400">
                    ${projections[30]?.optimistic.toLocaleString()}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Worst Case</p>
                  <p className="text-lg font-bold text-red-400">
                    ${projections[30]?.pessimistic.toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Strategies Tab */}
        <TabsContent value="scenarios" className="space-y-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {BANKROLL_SCENARIOS.map((scenario) => (
              <Card 
                key={scenario.id}
                className={`cursor-pointer transition-all hover:border-primary/50 ${
                  selectedScenario.id === scenario.id ? 'border-primary ring-1 ring-primary' : ''
                }`}
                onClick={() => setSelectedScenario(scenario)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{scenario.name}</CardTitle>
                    <Badge variant={
                      scenario.riskLevel === 'very-low' ? 'secondary' :
                      scenario.riskLevel === 'low' ? 'default' :
                      scenario.riskLevel === 'medium' ? 'default' :
                      scenario.riskLevel === 'high' ? 'destructive' : 'destructive'
                    }>
                      {scenario.riskLevel}
                    </Badge>
                  </div>
                  <CardDescription className="text-xs">
                    {scenario.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <p className="text-muted-foreground">Unit Size</p>
                      <p className="font-medium">{scenario.unitSizePercent}%</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Kelly</p>
                      <p className="font-medium">{(scenario.kellyFraction * 100).toFixed(0)}%</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">EV Threshold</p>
                      <p className="font-medium">+{scenario.evThreshold}%</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Monthly Growth</p>
                      <p className="font-medium text-green-400">+{scenario.expectedMonthlyGrowth}%</p>
                    </div>
                  </div>
                  
                  {selectedScenario.id === scenario.id && (
                    <div className="pt-2 border-t">
                      <p className="text-xs font-medium mb-1">Key Advantages:</p>
                      <ul className="text-xs text-muted-foreground space-y-0.5">
                        {scenario.advantages.slice(0, 2).map((adv, i) => (
                          <li key={i} className="flex items-center gap-1">
                            <ChevronRight className="h-3 w-3 text-green-400" />
                            {adv}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        {/* Simulation Tab */}
        <TabsContent value="simulation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Monte Carlo Simulation
              </CardTitle>
              <CardDescription>
                500 simulations of 100 bets each using {selectedScenario.name} strategy
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {realisticSim && (
                <>
                  <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={realisticSim.projectedBankroll.map((val, idx) => ({ bet: idx, bankroll: val }))}>
                        <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                        <XAxis dataKey="bet" label={{ value: 'Bets', position: 'bottom' }} />
                        <YAxis label={{ value: 'Bankroll', angle: -90, position: 'left' }} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))', 
                            border: '1px solid hsl(var(--border))' 
                          }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="bankroll" 
                          stroke="hsl(var(--primary))" 
                          strokeWidth={2}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                      <p className="text-xs text-muted-foreground">Profit Probability</p>
                      <p className={`text-xl font-bold ${realisticSim.probabilityOfProfit > 0.5 ? 'text-green-400' : 'text-red-400'}`}>
                        {(realisticSim.probabilityOfProfit * 100).toFixed(1)}%
                      </p>
                    </div>
                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                      <p className="text-xs text-muted-foreground">Ruin Probability</p>
                      <p className={`text-xl font-bold ${realisticSim.probabilityOfRuin < 0.1 ? 'text-green-400' : 'text-red-400'}`}>
                        {(realisticSim.probabilityOfRuin * 100).toFixed(1)}%
                      </p>
                    </div>
                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                      <p className="text-xs text-muted-foreground">Max Drawdown</p>
                      <p className="text-xl font-bold text-orange-400">
                        {(realisticSim.maxDrawdown * 100).toFixed(1)}%
                      </p>
                    </div>
                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                      <p className="text-xs text-muted-foreground">Expected Growth</p>
                      <p className={`text-xl font-bold ${realisticSim.expectedGrowth > 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {realisticSim.expectedGrowth > 0 ? '+' : ''}{realisticSim.expectedGrowth.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Bankroll Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Current Bankroll ($)</Label>
                    <Input 
                      type="number" 
                      value={settings.currentBankroll}
                      onChange={(e) => setSettings(s => ({ ...s, currentBankroll: parseFloat(e.target.value) || 0 }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Unit Size ($)</Label>
                    <Input 
                      type="number" 
                      value={settings.unitSize}
                      onChange={(e) => setSettings(s => ({ ...s, unitSize: parseFloat(e.target.value) || 0 }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Risk Tolerance</Label>
                    <Select 
                      value={settings.riskTolerance}
                      onValueChange={(v) => setSettings(s => ({ ...s, riskTolerance: v as any }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="conservative">Conservative</SelectItem>
                        <SelectItem value="moderate">Moderate</SelectItem>
                        <SelectItem value="aggressive">Aggressive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Win Rate (%)</Label>
                    <Input 
                      type="number" 
                      value={winRate}
                      onChange={(e) => setWinRate(parseFloat(e.target.value) || 50)}
                      min={40}
                      max={70}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Average Odds</Label>
                    <Input 
                      type="number" 
                      step="0.1"
                      value={avgOdds}
                      onChange={(e) => setAvgOdds(parseFloat(e.target.value) || 1.9)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Max Bet Percentage (%)</Label>
                    <Input 
                      type="number" 
                      value={settings.maxBetPercentage}
                      onChange={(e) => setSettings(s => ({ ...s, maxBetPercentage: parseFloat(e.target.value) || 5 }))}
                    />
                  </div>
                </div>
              </div>
              
              <div className="pt-4 border-t">
                <Button 
                  variant="outline" 
                  onClick={() => setSettings(DEFAULT_BANKROLL_SETTINGS)}
                >
                  Reset to Defaults
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
