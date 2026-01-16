import { useMemo } from 'react';
import { SportradarInjury, InjuryStatus } from '@/types/sportradar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { 
  AlertTriangle, 
  Activity, 
  Calendar, 
  Clock, 
  User,
  TrendingDown,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { calculateInjuryImpact } from '@/hooks/useSportradarInjuries';

// Accept any string for league to support extended leagues like NCAAB
interface InjuryReportCardProps {
  injuries: SportradarInjury[];
  teamName?: string;
  league?: string;
  isLoading?: boolean;
  compact?: boolean;
  showImpactScore?: boolean;
  maxItems?: number;
}

const STATUS_CONFIG: Record<InjuryStatus, { 
  label: string; 
  color: string; 
  bgColor: string;
  priority: number;
}> = {
  'out': { 
    label: 'OUT', 
    color: 'text-red-600 dark:text-red-400', 
    bgColor: 'bg-red-500/20 border-red-500/30',
    priority: 1 
  },
  'out-for-season': { 
    label: 'OUT (Season)', 
    color: 'text-red-700 dark:text-red-300', 
    bgColor: 'bg-destructive/20 border-destructive/30',
    priority: 0 
  },
  'injured-reserve': { 
    label: 'IR', 
    color: 'text-destructive dark:text-destructive', 
    bgColor: 'bg-destructive/20 border-destructive/30',
    priority: 0 
  },
  'doubtful': { 
    label: 'DOUBTFUL', 
    color: 'text-cyan-700 dark:text-cyan-400', 
    bgColor: 'bg-cyan-700/20 border-cyan-700/30',
    priority: 2 
  },
  'questionable': { 
    label: 'QUESTIONABLE', 
    color: 'text-cyan-600 dark:text-cyan-400', 
    bgColor: 'bg-cyan-500/20 border-cyan-500/30',
    priority: 3 
  },
  'day-to-day': { 
    label: 'DAY-TO-DAY', 
    color: 'text-cyan-500 dark:text-cyan-300', 
    bgColor: 'bg-cyan-400/20 border-cyan-400/30',
    priority: 4 
  },
  'probable': { 
    label: 'PROBABLE', 
    color: 'text-emerald-600 dark:text-emerald-400', 
    bgColor: 'bg-emerald-500/20 border-emerald-500/30',
    priority: 5 
  },
};

const PRACTICE_CONFIG: Record<string, { label: string; icon: string }> = {
  'full': { label: 'Full Practice', icon: '✓' },
  'limited': { label: 'Limited', icon: '~' },
  'did-not-participate': { label: 'DNP', icon: '✗' },
};

function getImpactLevel(score: number): { label: string; color: string } {
  if (score >= 70) return { label: 'Severe', color: 'text-red-500' };
  if (score >= 50) return { label: 'High', color: 'text-orange-500' };
  if (score >= 30) return { label: 'Moderate', color: 'text-amber-500' };
  if (score >= 15) return { label: 'Low', color: 'text-yellow-500' };
  return { label: 'Minimal', color: 'text-emerald-500' };
}

function formatExpectedReturn(dateStr?: string): string | null {
  if (!dateStr) return null;
  
  const returnDate = new Date(dateStr);
  const today = new Date();
  const diffDays = Math.ceil((returnDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) return 'Overdue';
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays <= 7) return `${diffDays} days`;
  if (diffDays <= 30) return `${Math.ceil(diffDays / 7)} weeks`;
  return returnDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function InjuryRow({ injury, compact }: { injury: SportradarInjury; compact?: boolean }) {
  const config = STATUS_CONFIG[injury.status] || STATUS_CONFIG['questionable'];
  const practiceInfo = injury.practice ? PRACTICE_CONFIG[injury.practice] : null;
  const expectedReturn = formatExpectedReturn(injury.expectedReturn);

  return (
    <div className={cn(
      'flex items-start gap-3 p-3 rounded-lg border bg-card/50 hover:bg-muted/50 transition-colors',
      compact && 'p-2'
    )}>
      <div className="flex-shrink-0">
        <div className={cn(
          'w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold',
          config.bgColor
        )}>
          {injury.position || '?'}
        </div>
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-foreground truncate">
            {injury.playerName}
          </span>
          <Badge 
            variant="outline" 
            className={cn('text-xs px-1.5 py-0 font-medium', config.bgColor, config.color)}
          >
            {config.label}
          </Badge>
          {practiceInfo && (
            <span className="text-xs text-muted-foreground">
              {practiceInfo.icon} {practiceInfo.label}
            </span>
          )}
        </div>
        
        <p className="text-sm text-muted-foreground mt-0.5 truncate">
          {injury.description || injury.injuryType}
        </p>
        
        {!compact && (
          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <User className="h-3 w-3" />
              {injury.team}
            </span>
            {expectedReturn && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Return: {expectedReturn}
              </span>
            )}
            {injury.startDate && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Since {new Date(injury.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
            )}
          </div>
        )}
      </div>
      
      {expectedReturn && compact && (
        <div className="flex-shrink-0 text-xs text-muted-foreground">
          {expectedReturn}
        </div>
      )}
    </div>
  );
}

export function InjuryReportCard({
  injuries,
  teamName,
  league,
  isLoading,
  compact = false,
  showImpactScore = true,
  maxItems = 10,
}: InjuryReportCardProps) {
  const sortedInjuries = useMemo(() => {
    return [...injuries]
      .sort((a, b) => {
        const priorityA = STATUS_CONFIG[a.status]?.priority ?? 99;
        const priorityB = STATUS_CONFIG[b.status]?.priority ?? 99;
        return priorityA - priorityB;
      })
      .slice(0, maxItems);
  }, [injuries, maxItems]);

  const impactScore = useMemo(() => calculateInjuryImpact(injuries), [injuries]);
  const impactLevel = getImpactLevel(impactScore);

  const statusCounts = useMemo(() => {
    return injuries.reduce((acc, inj) => {
      acc[inj.status] = (acc[inj.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [injuries]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32" />
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(
      'overflow-hidden',
      impactScore >= 50 && 'border-orange-500/30',
      impactScore >= 70 && 'border-red-500/30'
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <AlertTriangle className={cn(
                'h-5 w-5',
                impactScore >= 50 ? 'text-orange-500' : 'text-muted-foreground'
              )} />
              {teamName ? `${teamName} Injuries` : 'Injury Report'}
            </CardTitle>
            <CardDescription className="flex items-center gap-2 mt-1">
              <span>{injuries.length} player{injuries.length !== 1 ? 's' : ''} listed</span>
              {league && (
                <>
                  <span>•</span>
                  <span>{league}</span>
                </>
              )}
            </CardDescription>
          </div>
          
          {showImpactScore && injuries.length > 0 && (
            <div className="text-right">
              <div className="flex items-center gap-1.5">
                <TrendingDown className={cn('h-4 w-4', impactLevel.color)} />
                <span className={cn('text-sm font-semibold', impactLevel.color)}>
                  {impactLevel.label} Impact
                </span>
              </div>
              <div className="mt-1.5 w-24">
                <Progress 
                  value={impactScore} 
                  className="h-1.5"
                />
              </div>
            </div>
          )}
        </div>

        {/* Status summary badges */}
        {!compact && injuries.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {Object.entries(statusCounts).map(([status, count]) => {
              const config = STATUS_CONFIG[status as InjuryStatus];
              if (!config) return null;
              return (
                <Badge 
                  key={status} 
                  variant="outline"
                  className={cn('text-xs', config.bgColor)}
                >
                  {count} {config.label}
                </Badge>
              );
            })}
          </div>
        )}
      </CardHeader>
      
      <CardContent className="pt-0">
        {injuries.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <Activity className="h-5 w-5 mr-2" />
            <span>No injuries reported</span>
          </div>
        ) : (
          <div className="space-y-2">
            {sortedInjuries.map((injury) => (
              <InjuryRow key={injury.id} injury={injury} compact={compact} />
            ))}
            
            {injuries.length > maxItems && (
              <button className="w-full flex items-center justify-center gap-1 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                View {injuries.length - maxItems} more
                <ChevronRight className="h-4 w-4" />
              </button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default InjuryReportCard;
