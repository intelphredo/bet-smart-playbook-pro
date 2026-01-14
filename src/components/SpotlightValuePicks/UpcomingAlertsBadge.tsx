// 24/2 Upcoming Alerts Badge - Shows smart notification status

import { Bell, Clock, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { SmartAlert } from '@/hooks/useSmartNotifications';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

interface UpcomingAlertsBadgeProps {
  alerts: SmartAlert[];
  alertsToday: number;
  remainingAlerts: number;
  onViewMatch?: (matchId: string) => void;
}

export function UpcomingAlertsBadge({ 
  alerts, 
  alertsToday, 
  remainingAlerts,
  onViewMatch 
}: UpcomingAlertsBadgeProps) {
  const hasAlerts = alerts.length > 0;
  const recentAlerts = alerts.slice(0, 5);
  
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "relative gap-2 h-8 px-3",
            hasAlerts && "border-primary/50 bg-primary/5"
          )}
        >
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            <span className="text-xs font-medium">24/2</span>
          </div>
          
          {alertsToday > 0 && (
            <Badge 
              variant="secondary" 
              className="h-4 min-w-4 px-1 text-[10px] bg-primary/20 text-primary"
            >
              {alertsToday}
            </Badge>
          )}
          
          {hasAlerts && (
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full animate-pulse" />
          )}
        </Button>
      </PopoverTrigger>
      
      <PopoverContent align="end" className="w-80 p-0">
        {/* Header */}
        <div className="p-3 border-b bg-muted/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-primary/10">
                <Zap className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold">24/2 Smart Alerts</p>
                <p className="text-xs text-muted-foreground">
                  Next 24 hours • Max 2 critical alerts
                </p>
              </div>
            </div>
          </div>
          
          {/* Status */}
          <div className="flex items-center gap-2 mt-2 text-xs">
            <Badge variant="outline" className="h-5 text-[10px]">
              {alertsToday} sent today
            </Badge>
            <Badge 
              variant={remainingAlerts > 0 ? 'secondary' : 'destructive'} 
              className="h-5 text-[10px]"
            >
              {remainingAlerts} remaining
            </Badge>
          </div>
        </div>
        
        {/* Alerts list */}
        <div className="max-h-[300px] overflow-y-auto">
          {recentAlerts.length === 0 ? (
            <div className="p-6 text-center">
              <Bell className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">
                No critical alerts in the last 24 hours
              </p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                Monitoring for high-value opportunities...
              </p>
            </div>
          ) : (
            <AnimatePresence>
              {recentAlerts.map((alert, index) => (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={cn(
                    "p-3 border-b last:border-0 hover:bg-muted/30 cursor-pointer transition-colors",
                    alert.priority === 'critical' && "bg-destructive/5"
                  )}
                  onClick={() => onViewMatch?.(alert.match.id)}
                >
                  <div className="flex items-start gap-2">
                    <div className={cn(
                      "p-1 rounded-md mt-0.5",
                      alert.priority === 'critical' ? "bg-destructive/20 text-destructive" :
                      alert.priority === 'high' ? "bg-amber-500/20 text-amber-500" :
                      "bg-primary/20 text-primary"
                    )}>
                      {alert.type === 'steam_move' ? (
                        <Zap className="h-3 w-3" />
                      ) : (
                        <Bell className="h-3 w-3" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate">
                          {alert.title.replace(/^[🎯⚡🔥]\s*/, '')}
                        </p>
                        <Badge 
                          variant="outline" 
                          className={cn(
                            "text-[9px] h-4 shrink-0",
                            alert.priority === 'critical' && "border-destructive/50 text-destructive"
                          )}
                        >
                          {alert.priority}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                        {alert.message}
                      </p>
                      <p className="text-[10px] text-muted-foreground/60 mt-1">
                        {format(alert.timestamp, 'MMM d, h:mm a')}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
        
        {/* Footer info */}
        <div className="p-2 border-t bg-muted/20">
          <p className="text-[10px] text-center text-muted-foreground">
            Scanning for value thresholds & market-moving events
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
}
