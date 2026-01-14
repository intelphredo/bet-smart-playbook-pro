/**
 * Goal Tracking - Progress towards profit goals
 */

import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { 
  Target, TrendingUp, Calendar, Clock, CheckCircle2, 
  AlertTriangle, Flame, Trophy, Edit2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { calculateGoalProgress } from '@/utils/riskManagement/exposureCalculator';

interface GoalTrackerProps {
  currentBankroll: number;
  startingBankroll: number;
  currentROI: number;
}

export function GoalTracker({
  currentBankroll,
  startingBankroll,
  currentROI,
}: GoalTrackerProps) {
  const [targetProfit, setTargetProfit] = useState(500);
  const [periodDays, setPeriodDays] = useState(30);
  const [daysElapsed, setDaysElapsed] = useState(12);
  const [isEditing, setIsEditing] = useState(false);
  
  const progress = useMemo(() => 
    calculateGoalProgress(
      currentBankroll,
      startingBankroll,
      targetProfit,
      periodDays,
      daysElapsed,
      currentROI
    ),
    [currentBankroll, startingBankroll, targetProfit, periodDays, daysElapsed, currentROI]
  );
  
  const getProgressColor = (percent: number) => {
    if (percent >= 100) return 'text-green-500';
    if (percent >= 75) return 'text-blue-500';
    if (percent >= 50) return 'text-yellow-500';
    return 'text-orange-500';
  };
  
  return (
    <div className="space-y-4">
      {/* Main Progress Card */}
      <Card className="overflow-hidden">
        <div className={cn(
          "h-2",
          progress.progressPercent >= 100 ? 'bg-green-500' :
          progress.isOnTrack ? 'bg-blue-500' : 'bg-orange-500'
        )} style={{ width: `${Math.min(100, progress.progressPercent)}%` }} />
        
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={cn(
                "p-3 rounded-full",
                progress.progressPercent >= 100 ? 'bg-green-500/20' : 'bg-primary/20'
              )}>
                {progress.progressPercent >= 100 ? (
                  <Trophy className="h-6 w-6 text-green-500" />
                ) : (
                  <Target className="h-6 w-6 text-primary" />
                )}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Monthly Profit Goal</p>
                <p className="text-2xl font-bold">${targetProfit}</p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setIsEditing(!isEditing)}
            >
              <Edit2 className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Progress Bar */}
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className={cn("font-bold", getProgressColor(progress.progressPercent))}>
                {progress.progressPercent.toFixed(1)}%
              </span>
            </div>
            <Progress 
              value={Math.min(100, progress.progressPercent)} 
              className="h-3"
            />
          </div>
          
          {/* Stats Grid */}
          <div className="grid grid-cols-4 gap-3 text-center">
            <div className="p-2 bg-muted/50 rounded-lg">
              <p className={cn(
                "text-lg font-bold",
                progress.currentProgress >= 0 ? 'text-green-500' : 'text-red-500'
              )}>
                ${Math.abs(progress.currentProgress).toFixed(0)}
              </p>
              <p className="text-xs text-muted-foreground">Current</p>
            </div>
            <div className="p-2 bg-muted/50 rounded-lg">
              <p className="text-lg font-bold">${progress.remainingAmount.toFixed(0)}</p>
              <p className="text-xs text-muted-foreground">Remaining</p>
            </div>
            <div className="p-2 bg-muted/50 rounded-lg">
              <p className="text-lg font-bold">{progress.daysRemaining}</p>
              <p className="text-xs text-muted-foreground">Days Left</p>
            </div>
            <div className="p-2 bg-muted/50 rounded-lg">
              <p className={cn(
                "text-lg font-bold",
                progress.isOnTrack ? 'text-green-500' : 'text-orange-500'
              )}>
                {progress.projectedDaysToGoal === 999 ? '∞' : progress.projectedDaysToGoal}
              </p>
              <p className="text-xs text-muted-foreground">Days to Goal</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Status Badge */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center gap-3">
            {progress.isOnTrack ? (
              <>
                <div className="p-2 bg-green-500/20 rounded-full">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="font-medium text-green-500">On Track</p>
                  <p className="text-sm text-muted-foreground">
                    At current ROI of {currentROI.toFixed(1)}%, you'll hit your goal in ~{progress.projectedDaysToGoal} days
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="p-2 bg-orange-500/20 rounded-full">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                </div>
                <div>
                  <p className="font-medium text-orange-500">Behind Schedule</p>
                  <p className="text-sm text-muted-foreground">
                    Need ${progress.dailyTargetRequired.toFixed(0)}/day to hit goal
                  </p>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Recommendation */}
      <Card className="bg-muted/30">
        <CardContent className="py-4">
          <p className="text-sm">{progress.recommendation}</p>
        </CardContent>
      </Card>
      
      {/* Settings */}
      {isEditing && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Goal Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-xs">Target Profit ($)</Label>
                <Input
                  type="number"
                  value={targetProfit}
                  onChange={(e) => setTargetProfit(Number(e.target.value))}
                  min={0}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Period (days)</Label>
                <Input
                  type="number"
                  value={periodDays}
                  onChange={(e) => setPeriodDays(Number(e.target.value))}
                  min={1}
                  max={365}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Days Elapsed</Label>
                <Input
                  type="number"
                  value={daysElapsed}
                  onChange={(e) => setDaysElapsed(Number(e.target.value))}
                  min={0}
                  max={periodDays}
                />
              </div>
            </div>
            <Button size="sm" onClick={() => setIsEditing(false)}>
              Save Goal
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
