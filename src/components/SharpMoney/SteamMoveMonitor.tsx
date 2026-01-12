// Steam Move Monitor - Floating indicator for active monitoring
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Zap, Activity, Settings, Bell, BellOff, X } from 'lucide-react';
import { useSteamMoveDetector, SteamMove } from '@/hooks/useSteamMoveDetector';
import { SteamMoveAlert } from './SteamMoveAlert';
import { Match } from '@/types/sports';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

interface SteamMoveMonitorProps {
  matches: Match[];
  enabled?: boolean;
  className?: string;
}

export function SteamMoveMonitor({ 
  matches, 
  enabled: initialEnabled = true,
  className 
}: SteamMoveMonitorProps) {
  const navigate = useNavigate();
  const [enabled, setEnabled] = useState(initialEnabled);
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [dismissedMoves, setDismissedMoves] = useState<Set<string>>(new Set());

  const { steamMoves, stats, isMonitoring, clearAlerts } = useSteamMoveDetector(
    matches,
    { enabled, alertsEnabled }
  );

  const visibleMoves = steamMoves.filter(m => !dismissedMoves.has(m.id));
  const hasNewMoves = visibleMoves.length > 0;

  const handleDismiss = (id: string) => {
    setDismissedMoves(prev => new Set([...prev, id]));
  };

  const handleViewMatch = (matchId: string) => {
    setIsOpen(false);
    navigate(`/game/${matchId}`);
  };

  const handleClearAll = () => {
    const allIds = new Set(steamMoves.map(m => m.id));
    setDismissedMoves(allIds);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={hasNewMoves ? "default" : "outline"}
          size="sm"
          className={cn(
            'relative gap-2',
            hasNewMoves && 'bg-orange-500 hover:bg-orange-600 text-white',
            className
          )}
        >
          <Zap className={cn(
            'h-4 w-4',
            isMonitoring && 'animate-pulse'
          )} />
          Steam
          {hasNewMoves && (
            <Badge 
              variant="secondary" 
              className="h-5 px-1.5 text-[10px] bg-white text-orange-600"
            >
              {visibleMoves.length}
            </Badge>
          )}
          {isMonitoring && !hasNewMoves && (
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="absolute -top-1 -right-1 h-2 w-2 bg-green-500 rounded-full"
            />
          )}
        </Button>
      </PopoverTrigger>
      
      <PopoverContent 
        align="end" 
        className="w-[420px] p-0"
        sideOffset={8}
      >
        {/* Header */}
        <div className="p-4 border-b bg-muted/50">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-orange-500" />
              <h3 className="font-semibold">Steam Move Monitor</h3>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2"
                onClick={() => setEnabled(!enabled)}
              >
                {enabled ? (
                  <Activity className="h-4 w-4 text-green-500" />
                ) : (
                  <Activity className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2"
                onClick={() => setAlertsEnabled(!alertsEnabled)}
              >
                {alertsEnabled ? (
                  <Bell className="h-4 w-4 text-primary" />
                ) : (
                  <BellOff className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>
          </div>
          
          {/* Stats */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className={cn(
              'flex items-center gap-1 px-2 py-1 rounded-full',
              enabled ? 'bg-green-500/10 text-green-600' : 'bg-muted text-muted-foreground'
            )}>
              <Activity className="h-3 w-3" />
              {enabled ? 'Monitoring' : 'Paused'}
            </span>
            {stats.totalDetected > 0 && (
              <>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-red-500" />
                  {stats.extreme} extreme
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-orange-500" />
                  {stats.strong} strong
                </span>
              </>
            )}
          </div>
        </div>
        
        {/* Content */}
        <div className="max-h-[400px] overflow-auto">
          {visibleMoves.length > 0 ? (
            <>
              <div className="p-2 border-b flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                  {visibleMoves.length} active alert{visibleMoves.length !== 1 ? 's' : ''}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs"
                  onClick={handleClearAll}
                >
                  Clear All
                </Button>
              </div>
              <div className="divide-y">
                {visibleMoves.slice(0, 10).map((move) => (
                  <SteamMoveAlertItem
                    key={move.id}
                    move={move}
                    onDismiss={() => handleDismiss(move.id)}
                    onView={() => handleViewMatch(move.matchId)}
                  />
                ))}
              </div>
            </>
          ) : (
            <div className="py-12 text-center text-muted-foreground">
              <Zap className="h-10 w-10 mx-auto mb-3 opacity-20" />
              <p className="font-medium">No Steam Moves Detected</p>
              <p className="text-sm mt-1">
                {enabled 
                  ? 'Monitoring for 2+ point moves in 5 minutes'
                  : 'Enable monitoring to detect steam moves'
                }
              </p>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="p-3 border-t bg-muted/30 text-xs text-muted-foreground">
          <p>Steam moves indicate sharp money entering the market rapidly.</p>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// Individual alert item
function SteamMoveAlertItem({ 
  move, 
  onDismiss, 
  onView 
}: { 
  move: SteamMove; 
  onDismiss: () => void;
  onView: () => void;
}) {
  const strengthColors = {
    extreme: 'border-l-red-500 bg-red-500/5',
    strong: 'border-l-orange-500 bg-orange-500/5',
    moderate: 'border-l-yellow-500 bg-yellow-500/5',
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
      className={cn(
        'p-3 border-l-4 cursor-pointer hover:bg-muted/50 transition-colors',
        strengthColors[move.strength]
      )}
      onClick={onView}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Badge 
              variant="outline" 
              className={cn(
                'text-[10px]',
                move.strength === 'extreme' && 'border-red-500 text-red-600',
                move.strength === 'strong' && 'border-orange-500 text-orange-600',
                move.strength === 'moderate' && 'border-yellow-500 text-yellow-600'
              )}
            >
              {move.strength.toUpperCase()}
            </Badge>
            <Badge variant="secondary" className="text-[10px]">
              {move.league}
            </Badge>
          </div>
          <p className="font-medium text-sm mt-1 truncate">{move.matchTitle}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {move.marketType.toUpperCase()} {move.side.toUpperCase()}: {' '}
            <span className={cn(
              'font-mono',
              move.movement > 0 ? 'text-green-600' : 'text-red-600'
            )}>
              {move.movement > 0 ? '+' : ''}{move.movement.toFixed(1)}
            </span>
            {' '}pts in {Math.round(move.timeWindow / 60)}min
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 shrink-0"
          onClick={(e) => {
            e.stopPropagation();
            onDismiss();
          }}
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    </motion.div>
  );
}

export default SteamMoveMonitor;
