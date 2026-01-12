// ESPN-style Sidebar Navigation
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Home,
  Trophy,
  TrendingUp,
  AlertTriangle,
  BarChart2,
  Wallet,
  History,
  Settings,
  Zap,
  Target,
  Activity,
  Calendar,
} from 'lucide-react';

interface SidebarNavProps {
  liveCount?: number;
  className?: string;
}

const mainNavItems = [
  { path: '/', label: 'Home', icon: Home },
  { path: '/live', label: 'Live', icon: Activity, badge: 'live' },
  { path: '/standings', label: 'Standings', icon: Trophy },
  { path: '/betting-trends', label: 'Trends', icon: TrendingUp },
  { path: '/injuries', label: 'Injuries', icon: AlertTriangle },
];

const toolsNavItems = [
  { path: '/algorithms', label: 'Algorithms', icon: Zap },
  { path: '/scenarios', label: 'Scenarios', icon: Target },
  { path: '/bankroll', label: 'Bankroll', icon: Wallet },
  { path: '/bet-history', label: 'Bet History', icon: History },
];

const settingsNavItems = [
  { path: '/settings', label: 'Settings', icon: Settings },
];

export function SidebarNav({ liveCount = 0, className }: SidebarNavProps) {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  const NavItem = ({ item }: { item: typeof mainNavItems[0] }) => {
    const Icon = item.icon;
    const showLiveBadge = item.badge === 'live' && liveCount > 0;

    return (
      <Link
        to={item.path}
        className={cn(
          "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
          isActive(item.path)
            ? "bg-primary text-primary-foreground font-medium"
            : "text-muted-foreground hover:bg-accent hover:text-foreground"
        )}
      >
        <Icon className="h-4 w-4 flex-shrink-0" />
        <span className="flex-1">{item.label}</span>
        {showLiveBadge && (
          <Badge variant="destructive" className="h-5 px-1.5 text-[10px] animate-pulse">
            {liveCount}
          </Badge>
        )}
      </Link>
    );
  };

  return (
    <aside className={cn("w-56 border-r bg-card/50 flex-shrink-0", className)}>
      <ScrollArea className="h-full py-4">
        <div className="px-3 space-y-6">
          {/* Main Navigation */}
          <div className="space-y-1">
            <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Main
            </h3>
            {mainNavItems.map((item) => (
              <NavItem key={item.path} item={item} />
            ))}
          </div>

          {/* Tools */}
          <div className="space-y-1">
            <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Tools
            </h3>
            {toolsNavItems.map((item) => (
              <NavItem key={item.path} item={item} />
            ))}
          </div>

          {/* Settings */}
          <div className="space-y-1">
            {settingsNavItems.map((item) => (
              <NavItem key={item.path} item={item} />
            ))}
          </div>
        </div>
      </ScrollArea>
    </aside>
  );
}

export default SidebarNav;
