import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, Pencil, X, Check, Trophy, Flame, Star, PartyPopper } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface Milestone {
  pct: number;
  label: string;
  icon: React.ReactNode;
}

const MILESTONES: Milestone[] = [
  { pct: 25,  label: '25%',  icon: <Star className="h-3 w-3" /> },
  { pct: 50,  label: '50%',  icon: <Flame className="h-3 w-3" /> },
  { pct: 75,  label: '75%',  icon: <Trophy className="h-3 w-3" /> },
  { pct: 100, label: '100%', icon: <PartyPopper className="h-3 w-3" /> },
];

function formatCurrency(v: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(v);
}

interface SavingsGoalSectionProps {
  balance: number;
  goal: number | null;
  celebrated: number[];
  isSaving: boolean;
  onSetGoal: (goal: number | null) => void;
}

export function SavingsGoalSection({ balance, goal, celebrated, isSaving, onSetGoal }: SavingsGoalSectionProps) {
  const [editing, setEditing] = useState(false);
  const [inputVal, setInputVal] = useState('');

  const progress = goal ? Math.min((balance / goal) * 100, 100) : 0;
  const remaining = goal ? Math.max(goal - balance, 0) : 0;

  const handleSubmit = () => {
    const parsed = parseFloat(inputVal.replace(/[^0-9.]/g, ''));
    if (!isNaN(parsed) && parsed > 0) {
      onSetGoal(parsed);
      setEditing(false);
      setInputVal('');
    }
  };

  const handleClear = () => {
    onSetGoal(null);
    setEditing(false);
    setInputVal('');
  };

  // No goal set yet
  if (!goal && !editing) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-3 rounded-xl border border-dashed border-border/50 bg-muted/20 flex items-center justify-between gap-3"
      >
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Target className="h-4 w-4 text-primary/60" />
          <span>Set a savings goal to track progress</span>
        </div>
        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setEditing(true)}>
          Set Goal
        </Button>
      </motion.div>
    );
  }

  // Editing input
  if (editing) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="p-3 rounded-xl border border-primary/30 bg-primary/5 space-y-2"
      >
        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
          <Target className="h-3.5 w-3.5 text-primary" />
          {goal ? 'Update your savings goal' : 'Enter a savings goal amount'}
        </p>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
            <Input
              type="number"
              min="1"
              placeholder="500"
              value={inputVal}
              onChange={e => setInputVal(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              className="pl-7 h-9 text-sm"
              autoFocus
            />
          </div>
          <Button size="sm" className="h-9 px-3" onClick={handleSubmit} disabled={isSaving}>
            <Check className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" className="h-9 px-3" onClick={() => { setEditing(false); setInputVal(''); }}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        {goal && (
          <button
            onClick={handleClear}
            className="text-xs text-destructive/70 hover:text-destructive transition-colors"
          >
            Remove goal
          </button>
        )}
      </motion.div>
    );
  }

  // Goal set — show progress
  const progressVariant = progress >= 100 ? 'success' : progress >= 50 ? 'gold' : 'default';

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-3 rounded-xl border border-border/30 bg-muted/20 space-y-3"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-sm font-medium">
          <Target className="h-4 w-4 text-primary" />
          <span>Savings Goal</span>
          {progress >= 100 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="text-primary text-xs font-bold ml-1"
            >
              🎉 Complete!
            </motion.span>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={() => { setInputVal(String(goal)); setEditing(true); }}
        >
          <Pencil className="h-3 w-3" />
        </Button>
      </div>

      {/* Amount display */}
      <div className="flex items-end justify-between text-xs text-muted-foreground">
        <span className="text-base font-bold text-foreground">{formatCurrency(balance)}</span>
        <span>of {formatCurrency(goal!)}</span>
      </div>

      {/* Progress bar */}
      <div className="relative">
        <Progress
          value={progress}
          variant={progressVariant}
          showGlow={progress >= 50}
          className="h-3"
        />
        {/* Milestone tick marks */}
        <div className="absolute inset-0 flex pointer-events-none">
          {MILESTONES.slice(0, -1).map(m => (
            <div
              key={m.pct}
              className="absolute top-0 bottom-0 w-px bg-background/40"
              style={{ left: `${m.pct}%` }}
            />
          ))}
        </div>
      </div>

      {/* Milestone badges */}
      <div className="flex items-center gap-1.5">
        {MILESTONES.map(m => {
          const reached = progress >= m.pct;
          const wasCelebrated = celebrated.includes(m.pct);
          return (
            <motion.div
              key={m.pct}
              initial={false}
              animate={reached ? { scale: [1, 1.2, 1] } : { scale: 1 }}
              transition={{ duration: 0.4 }}
              className={cn(
                "flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium border transition-all duration-300",
                reached
                  ? cn("border-transparent bg-primary/15 text-primary")
                  : "border-border/30 text-muted-foreground/40 bg-transparent"
              )}
              title={reached ? (wasCelebrated ? `${m.pct}% milestone reached!` : `${m.pct}% — keep going!`) : `${m.pct}% milestone`}
            >
              {m.icon}
              <span>{m.label}</span>
            </motion.div>
          );
        })}
        <span className="ml-auto text-xs text-muted-foreground">
          {progress >= 100 ? 'Goal reached! 🏆' : `${formatCurrency(remaining)} to go`}
        </span>
      </div>
    </motion.div>
  );
}
