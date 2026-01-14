
import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BankrollScenario, DEFAULT_BANKROLL_SETTINGS } from "@/types/bankroll";
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
  Target, Gauge, DollarSign, Percent, Calculator, ChevronRight, PieChart, Lock, Save, History
} from "lucide-react";
import { useBetTracking } from "@/hooks/useBetTracking";
import { useBankrollSettings } from "@/hooks/useBankrollSettings";
import { RiskExposureDashboard } from "./RiskExposureDashboard";
import { WithdrawalScheduler } from "./WithdrawalScheduler";
import { GuardrailsPanel } from "./GuardrailsPanel";
import { GoalTracker } from "./GoalTracker";
import { BankrollHistoryChart } from "./BankrollHistoryChart";
import { toast } from "sonner";

const SIMULATION_STORAGE_KEY = "bankroll_simulation_settings";

export function BankrollDashboard() {
  const { settings, setSettings, resetSettings, isLoaded } = useBankrollSettings();
  const [selectedScenario, setSelectedScenario] = useState<BankrollScenario>(
    getRecommendedScenario(0, 0.54, 'intermediate')
  );
  const [winRate, setWinRate] = useState(54);
  const [avgOdds, setAvgOdds] = useState(1.9);
  
  // Load simulation settings from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(SIMULATION_STORAGE_KEY);
      if (stored) {
        const { winRate: wr, avgOdds: ao } = JSON.parse(stored);
        if (wr) setWinRate(wr);
        if (ao) setAvgOdds(ao);
      }
    } catch (error) {
      console.error("Failed to load simulation settings:", error);
    }
  }, []);
  
  // Save simulation settings when they change
  useEffect(() => {
    try {
      localStorage.setItem(SIMULATION_STORAGE_KEY, JSON.stringify({ winRate, avgOdds }));
    } catch (error) {
      console.error("Failed to save simulation settings:", error);
    }
  }, [winRate, avgOdds]);
  
  // Get user bets for risk exposure
  const { bets, stats } = useBetTracking();
  const openBets = bets.filter(b => b.status === 'pending');
  const currentROI = stats?.roi_percentage || 0;
  
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
        <TabsList className="grid grid-cols-5 md:grid-cols-9 w-full">
          <TabsTrigger value="projections">Projections</TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-1">
            <History className="h-3 w-3" />
            History
          </TabsTrigger>
          <TabsTrigger value="scenarios">Strategies</TabsTrigger>
          <TabsTrigger value="simulation">Simulation</TabsTrigger>
          <TabsTrigger value="exposure" className="flex items-center gap-1">
            <PieChart className="h-3 w-3" />
            Exposure
          </TabsTrigger>
          <TabsTrigger value="goals" className="flex items-center gap-1">
            <Target className="h-3 w-3" />
            Goals
          </TabsTrigger>
          <TabsTrigger value="guardrails" className="flex items-center gap-1">
            <Lock className="h-3 w-3" />
            Guardrails
          </TabsTrigger>
          <TabsTrigger value="withdraw">Withdraw</TabsTrigger>
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
        
        {/* History Tab */}
        <TabsContent value="history">
          <BankrollHistoryChart startingBankroll={settings.startingBankroll} />
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
        
        {/* Risk Exposure Tab */}
        <TabsContent value="exposure">
          <RiskExposureDashboard 
            openBets={openBets} 
            bankroll={settings.currentBankroll} 
          />
        </TabsContent>
        
        {/* Goal Tracking Tab */}
        <TabsContent value="goals">
          <GoalTracker 
            currentBankroll={settings.currentBankroll}
            startingBankroll={settings.startingBankroll}
            currentROI={currentROI}
          />
        </TabsContent>
        
        {/* Psychological Guardrails Tab */}
        <TabsContent value="guardrails">
          <GuardrailsPanel 
            bets={bets}
            bankroll={settings.currentBankroll}
          />
        </TabsContent>
        
        {/* Withdrawal Scheduler Tab */}
        <TabsContent value="withdraw">
          <WithdrawalScheduler 
            currentBankroll={settings.currentBankroll}
            startingBankroll={settings.startingBankroll}
            currentROI={currentROI}
          />
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
              {/* Validation Rules */}
              {(() => {
                const errors = {
                  currentBankroll: settings.currentBankroll < 10 ? "Minimum $10 recommended" : 
                                   settings.currentBankroll > 10000000 ? "Value too high" : null,
                  startingBankroll: settings.startingBankroll < 10 ? "Minimum $10 recommended" :
                                    settings.startingBankroll > 10000000 ? "Value too high" : null,
                  unitSize: settings.unitSize <= 0 ? "Must be greater than 0" :
                            settings.unitSize > settings.currentBankroll * 0.1 ? "Should be ≤10% of bankroll" : null,
                  kellyFraction: settings.kellyFraction < 0.1 ? "Minimum 10% recommended" :
                                 settings.kellyFraction > 1 ? "Maximum 100%" : null,
                  winRate: winRate < 40 ? "Below 40% is not profitable" :
                           winRate > 80 ? "Unrealistic win rate" : null,
                  avgOdds: avgOdds < 1.1 ? "Minimum odds 1.10" :
                           avgOdds > 10 ? "Odds above 10 are risky" : null,
                  maxBetPercentage: settings.maxBetPercentage < 1 ? "Minimum 1%" :
                                    settings.maxBetPercentage > 25 ? "Max 25% recommended for safety" : null,
                  dailyLossLimit: settings.dailyLossLimit !== undefined && 
                                  settings.dailyLossLimit > settings.currentBankroll * 0.2 ? 
                                  "Should be ≤20% of bankroll" : null,
                  weeklyLossLimit: settings.weeklyLossLimit !== undefined && 
                                   settings.weeklyLossLimit > settings.currentBankroll * 0.5 ? 
                                   "Should be ≤50% of bankroll" : null,
                };
                
                const hasErrors = Object.values(errors).some(e => e !== null);
                
                return (
                  <>
                    {hasErrors && (
                      <div className="mb-4 p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
                        <p className="text-sm text-destructive font-medium flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4" />
                          Some settings need attention
                        </p>
                      </div>
                    )}
                    
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label className={errors.currentBankroll ? "text-destructive" : ""}>
                            Current Bankroll ($)
                          </Label>
                          <Input 
                            type="text"
                            inputMode="decimal"
                            value={String(settings.currentBankroll)}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === '' || /^\d*\.?\d*$/.test(val)) {
                                setSettings(s => ({ ...s, currentBankroll: val === '' ? 0 : parseFloat(val) || 0 }));
                              }
                            }}
                            placeholder="1000"
                            className={errors.currentBankroll ? "border-destructive focus-visible:ring-destructive" : ""}
                          />
                          {errors.currentBankroll && (
                            <p className="text-xs text-destructive">{errors.currentBankroll}</p>
                          )}
                        </div>
                        
                        <div className="space-y-2">
                          <Label className={errors.startingBankroll ? "text-destructive" : ""}>
                            Starting Bankroll ($)
                          </Label>
                          <Input 
                            type="text"
                            inputMode="decimal"
                            value={String(settings.startingBankroll)}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === '' || /^\d*\.?\d*$/.test(val)) {
                                setSettings(s => ({ ...s, startingBankroll: val === '' ? 0 : parseFloat(val) || 0 }));
                              }
                            }}
                            placeholder="1000"
                            className={errors.startingBankroll ? "border-destructive focus-visible:ring-destructive" : ""}
                          />
                          {errors.startingBankroll && (
                            <p className="text-xs text-destructive">{errors.startingBankroll}</p>
                          )}
                        </div>
                        
                        <div className="space-y-2">
                          <Label className={errors.unitSize ? "text-destructive" : ""}>
                            Unit Size ($)
                          </Label>
                          <Input 
                            type="text"
                            inputMode="decimal"
                            value={String(settings.unitSize)}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === '' || /^\d*\.?\d*$/.test(val)) {
                                setSettings(s => ({ ...s, unitSize: val === '' ? 0 : parseFloat(val) || 0 }));
                              }
                            }}
                            placeholder="20"
                            className={errors.unitSize ? "border-destructive focus-visible:ring-destructive" : ""}
                          />
                          {errors.unitSize && (
                            <p className="text-xs text-destructive">{errors.unitSize}</p>
                          )}
                        </div>
                        
                        <div className="space-y-2">
                          <Label className={errors.kellyFraction ? "text-destructive" : ""}>
                            Kelly Fraction (%)
                          </Label>
                          <Input 
                            type="text"
                            inputMode="decimal"
                            value={String(settings.kellyFraction * 100)}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === '' || /^\d*\.?\d*$/.test(val)) {
                                const pct = val === '' ? 0 : parseFloat(val) || 0;
                                setSettings(s => ({ ...s, kellyFraction: Math.min(100, Math.max(0, pct)) / 100 }));
                              }
                            }}
                            placeholder="25"
                            className={errors.kellyFraction ? "border-destructive focus-visible:ring-destructive" : ""}
                          />
                          {errors.kellyFraction && (
                            <p className="text-xs text-destructive">{errors.kellyFraction}</p>
                          )}
                        </div>
                        
                        <div className="space-y-2">
                          <Label>Risk Tolerance</Label>
                          <Select 
                            value={settings.riskTolerance}
                            onValueChange={(v) => setSettings(s => ({ ...s, riskTolerance: v as 'conservative' | 'moderate' | 'aggressive' }))}
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
                          <Label className={errors.winRate ? "text-destructive" : ""}>
                            Win Rate (%)
                          </Label>
                          <Input 
                            type="text"
                            inputMode="decimal"
                            value={String(winRate)}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === '' || /^\d*\.?\d*$/.test(val)) {
                                const pct = val === '' ? 50 : parseFloat(val) || 50;
                                setWinRate(Math.min(100, Math.max(0, pct)));
                              }
                            }}
                            placeholder="54"
                            className={errors.winRate ? "border-destructive focus-visible:ring-destructive" : ""}
                          />
                          {errors.winRate && (
                            <p className="text-xs text-destructive">{errors.winRate}</p>
                          )}
                        </div>
                        
                        <div className="space-y-2">
                          <Label className={errors.avgOdds ? "text-destructive" : ""}>
                            Average Odds (Decimal)
                          </Label>
                          <Input 
                            type="text"
                            inputMode="decimal"
                            value={String(avgOdds)}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === '' || /^\d*\.?\d*$/.test(val)) {
                                setAvgOdds(val === '' ? 1.9 : parseFloat(val) || 1.9);
                              }
                            }}
                            placeholder="1.9"
                            className={errors.avgOdds ? "border-destructive focus-visible:ring-destructive" : ""}
                          />
                          {errors.avgOdds && (
                            <p className="text-xs text-destructive">{errors.avgOdds}</p>
                          )}
                        </div>
                        
                        <div className="space-y-2">
                          <Label className={errors.maxBetPercentage ? "text-destructive" : ""}>
                            Max Bet Percentage (%)
                          </Label>
                          <Input 
                            type="text"
                            inputMode="decimal"
                            value={String(settings.maxBetPercentage)}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === '' || /^\d*\.?\d*$/.test(val)) {
                                const pct = val === '' ? 5 : parseFloat(val) || 5;
                                setSettings(s => ({ ...s, maxBetPercentage: Math.min(100, Math.max(0, pct)) }));
                              }
                            }}
                            placeholder="5"
                            className={errors.maxBetPercentage ? "border-destructive focus-visible:ring-destructive" : ""}
                          />
                          {errors.maxBetPercentage && (
                            <p className="text-xs text-destructive">{errors.maxBetPercentage}</p>
                          )}
                        </div>
                        
                        <div className="space-y-2">
                          <Label className={errors.dailyLossLimit ? "text-destructive" : ""}>
                            Daily Loss Limit ($) <span className="text-muted-foreground text-xs">(optional)</span>
                          </Label>
                          <Input 
                            type="text"
                            inputMode="decimal"
                            value={String(settings.dailyLossLimit ?? '')}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === '' || /^\d*\.?\d*$/.test(val)) {
                                setSettings(s => ({ ...s, dailyLossLimit: val === '' ? undefined : parseFloat(val) || 0 }));
                              }
                            }}
                            placeholder="100"
                            className={errors.dailyLossLimit ? "border-destructive focus-visible:ring-destructive" : ""}
                          />
                          {errors.dailyLossLimit && (
                            <p className="text-xs text-destructive">{errors.dailyLossLimit}</p>
                          )}
                        </div>
                        
                        <div className="space-y-2">
                          <Label className={errors.weeklyLossLimit ? "text-destructive" : ""}>
                            Weekly Loss Limit ($) <span className="text-muted-foreground text-xs">(optional)</span>
                          </Label>
                          <Input 
                            type="text"
                            inputMode="decimal"
                            value={String(settings.weeklyLossLimit ?? '')}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === '' || /^\d*\.?\d*$/.test(val)) {
                                setSettings(s => ({ ...s, weeklyLossLimit: val === '' ? undefined : parseFloat(val) || 0 }));
                              }
                            }}
                            placeholder="250"
                            className={errors.weeklyLossLimit ? "border-destructive focus-visible:ring-destructive" : ""}
                          />
                          {errors.weeklyLossLimit && (
                            <p className="text-xs text-destructive">{errors.weeklyLossLimit}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </>
                );
              })()}
              
              <div className="pt-4 border-t flex gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    resetSettings();
                    setWinRate(54);
                    setAvgOdds(1.9);
                    localStorage.removeItem(SIMULATION_STORAGE_KEY);
                    toast.success("Settings reset to defaults");
                  }}
                >
                  Reset to Defaults
                </Button>
                <div className="flex items-center gap-2 text-sm text-muted-foreground ml-auto">
                  <Save className="h-4 w-4" />
                  <span>Settings auto-save</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
