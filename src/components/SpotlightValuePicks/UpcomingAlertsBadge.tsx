// 24/2 Upcoming Alerts Badge - Shows smart notification status with injury monitoring

import { Bell, Clock, Zap, AlertTriangle, Activity } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
  injuryAlertsCount?: number;
  isInjuryScanning?: boolean;
  onViewMatch?: (matchId: string) => void;
}

// Get icon for alert type
function getAlertIcon(type: SmartAlert['type']) {
  switch (type) {
    case 'major_injury':
      return AlertTriangle;
    case 'steam_move':
      return Zap;
    case 'value_threshold':
    case 'closing_line_value':
    default:
      return Bell;
  }
}

// Get alert type label
function getAlertTypeLabel(type: SmartAlert['type']) {
  switch (type) {
    case 'major_injury':
      return 'Injury';
    case 'steam_move':
      return 'Steam';
    case 'value_threshold':
      return 'Value';
    case 'closing_line_value':
      return 'CLV';
    default:
      return 'Alert';
  }
}

export function UpcomingAlertsBadge({ 
  alerts, 
  alertsToday, 
  remainingAlerts,
  injuryAlertsCount = 0,
  isInjuryScanning = false,
  onViewMatch 
}: UpcomingAlertsBadgeProps) {
  const hasAlerts = alerts.length > 0;
  const recentAlerts = alerts.slice(0, 8);
  const hasInjuryAlerts = alerts.some(a => a.type === 'major_injury');
  
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "relative gap-2 h-8 px-3",
            hasAlerts && "border-primary/50 bg-primary/5",
            hasInjuryAlerts && "border-destructive/50 bg-destructive/5"
          )}
        >
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            <span className="text-xs font-medium">24/2</span>
          </div>
          
          {alertsToday > 0 && (
            <Badge 
              variant="secondary" 
              className={cn(
                "h-4 min-w-4 px-1 text-[10px]",
                hasInjuryAlerts ? "bg-destructive/20 text-destructive" : "bg-primary/20 text-primary"
              )}
            >
              {alertsToday}
            </Badge>
          )}
          
          {isInjuryScanning && (
            <Activity className="h-3 w-3 animate-pulse text-muted-foreground" />
          )}
          
          {hasAlerts && (
            <span className={cn(
              "absolute -top-1 -right-1 w-2 h-2 rounded-full animate-pulse",
              hasInjuryAlerts ? "bg-destructive" : "bg-primary"
            )} />
          )}
        </Button>
      </PopoverTrigger>
      
      <PopoverContent align="end" className="w-[340px] p-0 bg-popover/95 backdrop-blur-md">
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
                  Value, injuries & market-moving events
                </p>
              </div>
            </div>
          </div>
          
          {/* Status badges */}
          <div className="flex flex-wrap items-center gap-2 mt-2 text-xs">
            <Badge variant="outline" className="h-5 text-[10px]">
              {alertsToday} sent today
            </Badge>
            <Badge 
              variant={remainingAlerts > 0 ? 'secondary' : 'destructive'} 
              className="h-5 text-[10px]"
            >
              {remainingAlerts} remaining
            </Badge>
            {injuryAlertsCount > 0 && (
              <Badge 
                variant="outline" 
                className="h-5 text-[10px] border-destructive/50 text-destructive"
              >
                <AlertTriangle className="h-2.5 w-2.5 mr-1" />
                {injuryAlertsCount} injuries
              </Badge>
            )}
            {isInjuryScanning && (
              <Badge variant="outline" className="h-5 text-[10px] animate-pulse">
                <Activity className="h-2.5 w-2.5 mr-1" />
                Scanning...
              </Badge>
            )}
          </div>
        </div>
        
        {/* Alerts list */}
        <div className="max-h-[350px] overflow-y-auto">
          {recentAlerts.length === 0 ? (
            <div className="p-6 text-center">
              <Bell className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">
                No critical alerts in the last 24 hours
              </p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                Monitoring value thresholds, injuries & steam moves...
              </p>
            </div>
          ) : (
            <AnimatePresence>
              {recentAlerts.map((alert, index) => {
                const Icon = getAlertIcon(alert.type);
                const typeLabel = getAlertTypeLabel(alert.type);
                const isInjury = alert.type === 'major_injury';
                
                return (
                  <motion.div
                    key={alert.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={cn(
                      "p-3 border-b last:border-0 hover:bg-muted/30 cursor-pointer transition-colors",
                      alert.priority === 'critical' && "bg-destructive/5",
                      isInjury && "border-l-2 border-l-destructive"
                    )}
                    onClick={() => onViewMatch?.(alert.match.id)}
                  >
                    <div className="flex items-start gap-2">
                      <div className={cn(
                        "p-1.5 rounded-md mt-0.5",
                        isInjury ? "bg-destructive/20 text-destructive" :
                        alert.priority === 'critical' ? "bg-destructive/20 text-destructive" :
                        alert.priority === 'high' ? "bg-amber-500/20 text-amber-500" :
                        "bg-primary/20 text-primary"
                      )}>
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge 
                            variant="outline" 
                            className={cn(
                              "text-[9px] h-4 shrink-0",
                              isInjury && "border-destructive/50 text-destructive bg-destructive/10"
                            )}
                          >
                            {typeLabel}
                          </Badge>
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
                        <p className="text-sm font-medium mt-1 line-clamp-1">
                          {alert.title.replace(/^[🎯⚡🔥🚨]\s*/, '')}
                        </p>
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                          {alert.message}
                        </p>
                        {/* Show injury-specific data */}
                        {alert.injuryData && (
                          <div className="flex items-center gap-2 mt-1.5">
                            <Badge variant="secondary" className="text-[9px] h-4">
                              {alert.injuryData.position}
                            </Badge>
                            <span className="text-[10px] text-destructive font-medium">
                              Est. {Math.abs(alert.injuryData.estimatedSpreadShift).toFixed(1)}pt shift
                            </span>
                          </div>
                        )}
                        <p className="text-[10px] text-muted-foreground/60 mt-1">
                          {format(alert.timestamp, 'MMM d, h:mm a')}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>
        
        {/* Footer info */}
        <div className="p-2 border-t bg-muted/20">
          <p className="text-[10px] text-center text-muted-foreground">
            Scanning next 24 hours for value thresholds, major injuries & steam moves
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
}
