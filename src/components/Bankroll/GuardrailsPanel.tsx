/**
 * Psychological Guardrails - Enforces user-set betting rules
 */

import { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { 
  Shield, Lock, Clock, AlertTriangle, Ban, Settings2, 
  Unlock, CheckCircle2, XCircle, Timer
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { UserBet } from '@/types/betting';
import { 
  evaluateGuardrails, 
  getGuardrailsConfig, 
  saveGuardrailsConfig,
  checkLockoutState,
  triggerLockout,
  clearLockout,
  startSession,
  getSessionDuration,
} from '@/utils/riskManagement/guardrails';
import { GuardrailsConfig, PsychologicalGuardrail } from '@/types/riskManagement';

interface GuardrailsPanelProps {
  bets: UserBet[];
  bankroll: number;
}

export function GuardrailsPanel({ bets, bankroll }: GuardrailsPanelProps) {
  const [config, setConfig] = useState<GuardrailsConfig>(getGuardrailsConfig());
  const [showSettings, setShowSettings] = useState(false);
  const [lockoutState, setLockoutState] = useState(checkLockoutState());
  
  // Start session tracking
  useEffect(() => {
    startSession();
  }, []);
  
  // Refresh lockout state periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setLockoutState(checkLockoutState());
    }, 60000); // Every minute
    
    return () => clearInterval(interval);
  }, []);
  
  const guardrails = useMemo(() => 
    evaluateGuardrails(bets, bankroll),
    [bets, bankroll]
  );
  
  const triggeredCount = guardrails.filter(g => g.isTriggered).length;
  const sessionMinutes = getSessionDuration();
  
  const updateConfig = (updates: Partial<GuardrailsConfig>) => {
    const newConfig = { ...config, ...updates };
    setConfig(newConfig);
    saveGuardrailsConfig(updates);
  };
  
  const handleManualLockout = () => {
    triggerLockout('Manual lockout requested', config.lockoutHours);
    setLockoutState(checkLockoutState());
  };
  
  const handleClearLockout = () => {
    clearLockout();
    setLockoutState(checkLockoutState());
  };
  
  const getGuardrailIcon = (type: PsychologicalGuardrail['type']) => {
    switch (type) {
      case 'loss_streak_lockout': return <Lock className="h-4 w-4" />;
      case 'max_bet_limit': return <Ban className="h-4 w-4" />;
      case 'daily_loss_limit': return <AlertTriangle className="h-4 w-4" />;
      case 'session_time_limit': return <Clock className="h-4 w-4" />;
      case 'cool_down_period': return <Timer className="h-4 w-4" />;
      default: return <Shield className="h-4 w-4" />;
    }
  };
  
  return (
    <div className="space-y-4">
      {/* Lockout Status */}
      {lockoutState.isLocked && (
        <Card className="border-red-500 bg-red-500/10">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-500/20 rounded-full">
                  <Lock className="h-5 w-5 text-red-500" />
                </div>
                <div>
                  <p className="font-medium text-red-500">Account Locked</p>
                  <p className="text-sm text-muted-foreground">{lockoutState.reason}</p>
                  <p className="text-xs text-muted-foreground">
                    Unlocks in {lockoutState.remainingMinutes} minutes
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={handleClearLockout}>
                <Unlock className="h-4 w-4 mr-1" />
                Override
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Status Summary */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4 text-center">
            <Shield className={cn(
              "h-6 w-6 mx-auto mb-1",
              triggeredCount === 0 ? 'text-green-500' : 'text-orange-500'
            )} />
            <p className="text-xs text-muted-foreground">Active Rules</p>
            <p className="text-lg font-bold">{guardrails.filter(g => g.enabled).length}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4 text-center">
            <AlertTriangle className={cn(
              "h-6 w-6 mx-auto mb-1",
              triggeredCount > 0 ? 'text-orange-500' : 'text-muted-foreground'
            )} />
            <p className="text-xs text-muted-foreground">Triggered</p>
            <p className={cn(
              "text-lg font-bold",
              triggeredCount > 0 && 'text-orange-500'
            )}>{triggeredCount}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4 text-center">
            <Clock className="h-6 w-6 mx-auto mb-1 text-blue-500" />
            <p className="text-xs text-muted-foreground">Session Time</p>
            <p className="text-lg font-bold">{sessionMinutes}m</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Guardrails List */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Betting Rules
            </CardTitle>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
            >
              <Settings2 className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {guardrails.map((guardrail) => (
            <div 
              key={guardrail.id}
              className={cn(
                "flex items-center justify-between p-3 rounded-lg border",
                guardrail.isTriggered 
                  ? guardrail.action === 'block' 
                    ? 'bg-red-500/10 border-red-500/30' 
                    : 'bg-orange-500/10 border-orange-500/30'
                  : 'bg-muted/30'
              )}
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  "p-1.5 rounded",
                  guardrail.isTriggered ? 'bg-orange-500/20' : 'bg-muted'
                )}>
                  {getGuardrailIcon(guardrail.type)}
                </div>
                <div>
                  <p className="text-sm font-medium">{guardrail.description}</p>
                  <p className="text-xs text-muted-foreground">
                    Current: {guardrail.currentValue.toFixed(guardrail.type === 'max_bet_limit' ? 1 : 0)} / {guardrail.threshold}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {guardrail.isTriggered ? (
                  <Badge variant="destructive" className="text-xs">
                    {guardrail.action === 'block' ? 'Blocked' : 'Warning'}
                  </Badge>
                ) : (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
      
      {/* Settings Panel */}
      {showSettings && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Guardrail Settings</CardTitle>
            <CardDescription className="text-xs">
              Customize your betting rules
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs">Max Single Bet (%)</Label>
                <Input
                  type="number"
                  value={config.maxSingleBetPercent}
                  onChange={(e) => updateConfig({ maxSingleBetPercent: Number(e.target.value) })}
                  min={1}
                  max={25}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Loss Streak Lockout</Label>
                <Input
                  type="number"
                  value={config.maxLossStreak}
                  onChange={(e) => updateConfig({ maxLossStreak: Number(e.target.value) })}
                  min={1}
                  max={10}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Lockout Duration (hours)</Label>
                <Input
                  type="number"
                  value={config.lockoutHours}
                  onChange={(e) => updateConfig({ lockoutHours: Number(e.target.value) })}
                  min={1}
                  max={72}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Daily Loss Limit ($)</Label>
                <Input
                  type="number"
                  value={config.dailyLossLimit}
                  onChange={(e) => updateConfig({ dailyLossLimit: Number(e.target.value) })}
                  min={0}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Cool Down After Loss (min)</Label>
                <Input
                  type="number"
                  value={config.coolDownAfterLoss}
                  onChange={(e) => updateConfig({ coolDownAfterLoss: Number(e.target.value) })}
                  min={0}
                  max={60}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Session Time Limit (min)</Label>
                <Input
                  type="number"
                  value={config.sessionTimeLimit}
                  onChange={(e) => updateConfig({ sessionTimeLimit: Number(e.target.value) })}
                  min={30}
                  max={480}
                />
              </div>
            </div>
            
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2">
                <Switch
                  checked={config.enableAutoLockout}
                  onCheckedChange={(checked) => updateConfig({ enableAutoLockout: checked })}
                />
                <Label className="text-sm">Enable Auto-Lockout</Label>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Manual Controls */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Take a Break</p>
              <p className="text-xs text-muted-foreground">
                Voluntarily lock your account for {config.lockoutHours} hours
              </p>
            </div>
            <Button 
              variant="outline" 
              onClick={handleManualLockout}
              disabled={lockoutState.isLocked}
            >
              <Lock className="h-4 w-4 mr-1" />
              Self-Exclude
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
