import { Bell, Check, CheckCheck, Trophy, TrendingUp, AlertTriangle, Clock, Trash2, X, Eye, Brain, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useUserAlerts, UserAlert } from '@/hooks/useUserAlerts';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

const alertTypeConfig: Record<UserAlert['type'], { icon: typeof Bell; color: string }> = {
  bet_result: { icon: Trophy, color: 'text-amber-500' },
  clv_update: { icon: TrendingUp, color: 'text-emerald-500' },
  line_movement: { icon: AlertTriangle, color: 'text-orange-500' },
  arbitrage: { icon: TrendingUp, color: 'text-blue-500' },
  game_start: { icon: Clock, color: 'text-purple-500' },
  system: { icon: Bell, color: 'text-muted-foreground' },
  sharp_money: { icon: Brain, color: 'text-purple-500' },
  reverse_line: { icon: Zap, color: 'text-orange-500' }
};

function AlertItem({ 
  alert, 
  onMarkRead, 
  onDelete,
  onView
}: { 
  alert: UserAlert; 
  onMarkRead: (id: string) => void;
  onDelete: (id: string) => void;
  onView: (alert: UserAlert) => void;
}) {
  const config = alertTypeConfig[alert.type] || alertTypeConfig.system;
  const Icon = config.icon;

  return (
    <div 
      className={cn(
        "flex items-start gap-3 p-3 rounded-lg transition-colors hover:bg-muted/50 cursor-pointer",
        !alert.is_read && "bg-primary/5 border-l-2 border-l-primary"
      )}
      onClick={() => onView(alert)}
    >
      <div className={cn("mt-0.5", config.color)}>
        <Icon size={18} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className={cn(
            "text-sm font-medium truncate",
            !alert.is_read && "text-foreground",
            alert.is_read && "text-muted-foreground"
          )}>
            {alert.title}
          </p>
          {!alert.is_read && (
            <span className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
          {alert.message}
        </p>
        <p className="text-xs text-muted-foreground/70 mt-1">
          {formatDistanceToNow(new Date(alert.created_at), { addSuffix: true })}
        </p>
      </div>
      <div className="flex items-center gap-1">
        {/* View button */}
        {(alert.match_id || alert.bet_id) && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-primary"
            onClick={(e) => {
              e.stopPropagation();
              onView(alert);
            }}
            title="View details"
          >
            <Eye size={14} />
          </Button>
        )}
        {!alert.is_read && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={(e) => {
              e.stopPropagation();
              onMarkRead(alert.id);
            }}
            title="Mark as read"
          >
            <Check size={14} />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-destructive"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(alert.id);
          }}
          title="Delete"
        >
          <X size={14} />
        </Button>
      </div>
    </div>
  );
}

export default function NotificationCenter() {
  const navigate = useNavigate();
  const { alerts, unreadCount, isLoading, markAsRead, markAllAsRead, deleteAlert } = useUserAlerts();

  // Handle viewing an alert - navigate to appropriate page
  const handleViewAlert = (alert: UserAlert) => {
    // Mark as read when viewing
    if (!alert.is_read) {
      markAsRead(alert.id);
    }

    // Navigate based on alert type and available IDs
    if (alert.match_id) {
      navigate(`/game/${alert.match_id}`);
    } else if (alert.bet_id) {
      navigate(`/bet-history`);
    } else {
      // For system alerts without specific navigation, just mark as read
      switch (alert.type) {
        case 'line_movement':
          navigate('/?tab=insights');
          break;
        case 'arbitrage':
          navigate('/?tab=overview');
          break;
        case 'clv_update':
          navigate('/bet-history');
          break;
        default:
          // No specific navigation for this alert type
          break;
      }
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" className="relative">
          <Bell size={18} />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 min-w-5 px-1 flex items-center justify-center text-[10px] notification-badge"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 bg-popover/95 backdrop-blur-md border shadow-xl z-50">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-7 text-xs"
              onClick={markAllAsRead}
            >
              <CheckCheck size={14} className="mr-1" />
              Mark all read
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {isLoading ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            Loading...
          </div>
        ) : alerts.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-14 h-14 mx-auto rounded-full bg-muted/50 flex items-center justify-center mb-3 animate-float">
              <Bell className="h-7 w-7 text-muted-foreground/50" />
            </div>
            <p className="text-sm font-medium text-foreground mb-1">No notifications yet</p>
            <p className="text-xs text-muted-foreground">
              You'll see bet results and alerts here
            </p>
          </div>
        ) : (
          <ScrollArea className="max-h-[400px]">
            <div className="space-y-1 p-1">
              {alerts.map(alert => (
                <AlertItem 
                  key={alert.id} 
                  alert={alert} 
                  onMarkRead={markAsRead}
                  onDelete={deleteAlert}
                  onView={handleViewAlert}
                />
              ))}
            </div>
          </ScrollArea>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
