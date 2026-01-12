import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import TeamLogo from "./TeamLogo";
import { League } from "@/types/sports";
import { InjuryStatus } from "@/types/injuries";
import { useMatchInjuries, ESPNInjury } from "@/hooks/useESPNInjuries";
import { 
  Newspaper, 
  AlertCircle, 
  UserX, 
  UserCheck, 
  Clock, 
  TrendingUp,
  TrendingDown,
  Activity,
  Zap,
  RefreshCw,
  Wifi,
  WifiOff
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface TeamNewsInjuriesProps {
  homeTeamName: string;
  awayTeamName: string;
  league: League;
  className?: string;
}

const getStatusColor = (status?: InjuryStatus) => {
  switch (status) {
    case 'out': return 'bg-red-500/10 text-red-600 border-red-500/30';
    case 'doubtful': return 'bg-orange-500/10 text-orange-600 border-orange-500/30';
    case 'questionable': return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30';
    case 'probable': return 'bg-green-500/10 text-green-600 border-green-500/30';
    case 'day-to-day': return 'bg-amber-500/10 text-amber-600 border-amber-500/30';
    default: return 'bg-muted text-muted-foreground';
  }
};

const getStatusIcon = (status?: InjuryStatus) => {
  switch (status) {
    case 'out':
    case 'doubtful':
      return <UserX className="h-4 w-4 text-red-500" />;
    case 'probable':
      return <UserCheck className="h-4 w-4 text-green-500" />;
    default:
      return <Activity className="h-4 w-4 text-yellow-500" />;
  }
};

const getImpactLevel = (status?: InjuryStatus): 'high' | 'medium' | 'low' => {
  switch (status) {
    case 'out': return 'high';
    case 'doubtful': return 'high';
    case 'questionable': return 'medium';
    case 'day-to-day': return 'medium';
    case 'probable': return 'low';
    default: return 'low';
  }
};

const getImpactBadge = (impact: 'high' | 'medium' | 'low') => {
  switch (impact) {
    case 'high':
      return <Badge className="bg-red-500/10 text-red-600 border-red-500/30 text-[10px]">High Impact</Badge>;
    case 'medium':
      return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/30 text-[10px]">Med Impact</Badge>;
    default:
      return null;
  }
};

const formatRelativeTime = (timestamp: string): string => {
  try {
    const date = new Date(timestamp);
    return formatDistanceToNow(date, { addSuffix: true });
  } catch {
    return 'Recently';
  }
};

// Loading skeleton
const InjuryListSkeleton = () => (
  <div className="space-y-3">
    {[1, 2, 3].map((i) => (
      <div key={i} className="p-4 bg-muted/20 rounded-lg">
        <div className="flex items-start gap-3">
          <Skeleton className="h-8 w-8 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        </div>
      </div>
    ))}
  </div>
);

const TeamNewsInjuries: React.FC<TeamNewsInjuriesProps> = ({
  homeTeamName,
  awayTeamName,
  league,
  className,
}) => {
  // Fetch real injury data
  const { data: injuries, isLoading, isError, refetch } = useMatchInjuries(
    league,
    homeTeamName,
    awayTeamName
  );

  // Combine and process injuries
  const processedData = useMemo(() => {
    if (!injuries) return { home: [], away: [], all: [] };

    const homeInjuries = injuries.home || [];
    const awayInjuries = injuries.away || [];

    // Sort by severity (out > doubtful > questionable > etc.)
    const sortByStatus = (a: ESPNInjury, b: ESPNInjury) => {
      const statusOrder: Record<InjuryStatus, number> = {
        'out': 0,
        'doubtful': 1,
        'questionable': 2,
        'day-to-day': 3,
        'probable': 4,
        'healthy': 5,
      };
      return (statusOrder[a.status] || 5) - (statusOrder[b.status] || 5);
    };

    return {
      home: homeInjuries.sort(sortByStatus),
      away: awayInjuries.sort(sortByStatus),
      all: [...homeInjuries, ...awayInjuries].sort(sortByStatus),
    };
  }, [injuries]);

  // Count players out
  const homeOut = processedData.home.filter(i => i.status === 'out' || i.status === 'doubtful').length;
  const awayOut = processedData.away.filter(i => i.status === 'out' || i.status === 'doubtful').length;
  const hasRealData = processedData.all.length > 0;

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="bg-gradient-to-r from-muted/50 to-muted/30">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-lg">
            <Newspaper className="h-5 w-5 text-primary" />
            Team News & Injuries
            {hasRealData ? (
              <Badge variant="outline" className="text-[10px] bg-green-500/10 text-green-600 border-green-500/30">
                <Wifi className="h-3 w-3 mr-1" />
                Live
              </Badge>
            ) : (
              <Badge variant="outline" className="text-[10px]">
                <WifiOff className="h-3 w-3 mr-1" />
                No Data
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => refetch()}
              className="p-1 hover:bg-muted rounded transition-colors"
              title="Refresh injuries"
            >
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            </button>
            {homeOut > 0 && (
              <Badge variant="outline" className="text-xs text-red-500 border-red-500/30">
                {homeOut} out
              </Badge>
            )}
            {awayOut > 0 && (
              <Badge variant="outline" className="text-xs text-red-500 border-red-500/30">
                {awayOut} out
              </Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        {isLoading ? (
          <InjuryListSkeleton />
        ) : isError ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <AlertCircle className="h-10 w-10 mb-3" />
            <p className="text-sm">Unable to load injury data</p>
            <button
              onClick={() => refetch()}
              className="mt-2 text-xs text-primary hover:underline"
            >
              Try again
            </button>
          </div>
        ) : (
          <>
            {/* Quick Injury Summary */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              {/* Home Team Summary */}
              <div className="p-4 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <TeamLogo teamName={homeTeamName} league={league} size="md" />
                  <div>
                    <p className="font-semibold text-sm">{homeTeamName.split(' ').pop()}</p>
                    <p className="text-xs text-muted-foreground">
                      {processedData.home.length > 0 ? (
                        homeOut > 0 ? (
                          <span className="text-red-500">{homeOut} player(s) out/doubtful</span>
                        ) : (
                          <span className="text-yellow-500">{processedData.home.length} on report</span>
                        )
                      ) : (
                        <span className="text-green-500">No injuries reported</span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1">
                  {processedData.home.slice(0, 3).map(injury => (
                    <Badge 
                      key={injury.id} 
                      variant="outline" 
                      className={cn("text-[10px]", getStatusColor(injury.status))}
                    >
                      {injury.playerPosition}: {injury.status}
                    </Badge>
                  ))}
                  {processedData.home.length > 3 && (
                    <Badge variant="outline" className="text-[10px]">
                      +{processedData.home.length - 3} more
                    </Badge>
                  )}
                </div>
              </div>

              {/* Away Team Summary */}
              <div className="p-4 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <TeamLogo teamName={awayTeamName} league={league} size="md" />
                  <div>
                    <p className="font-semibold text-sm">{awayTeamName.split(' ').pop()}</p>
                    <p className="text-xs text-muted-foreground">
                      {processedData.away.length > 0 ? (
                        awayOut > 0 ? (
                          <span className="text-red-500">{awayOut} player(s) out/doubtful</span>
                        ) : (
                          <span className="text-yellow-500">{processedData.away.length} on report</span>
                        )
                      ) : (
                        <span className="text-green-500">No injuries reported</span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1">
                  {processedData.away.slice(0, 3).map(injury => (
                    <Badge 
                      key={injury.id} 
                      variant="outline" 
                      className={cn("text-[10px]", getStatusColor(injury.status))}
                    >
                      {injury.playerPosition}: {injury.status}
                    </Badge>
                  ))}
                  {processedData.away.length > 3 && (
                    <Badge variant="outline" className="text-[10px]">
                      +{processedData.away.length - 3} more
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <Separator className="mb-4" />

            {/* Injury List */}
            <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-2 mb-4">
              <Zap className="h-4 w-4" />
              Injury Report ({processedData.all.length})
            </h4>

            {processedData.all.length === 0 ? (
              <div className="text-center py-8">
                <UserCheck className="h-12 w-12 mx-auto mb-3 text-green-500/50" />
                <p className="text-sm text-muted-foreground">
                  No injuries reported for either team
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Both teams appear to be at full strength
                </p>
              </div>
            ) : (
              <ScrollArea className="h-[320px] pr-4">
                <div className="space-y-3">
                  {processedData.all.map((injury, index) => {
                    const impact = getImpactLevel(injury.status);
                    const isHomeTeam = injury.team.toLowerCase().includes(homeTeamName.toLowerCase().split(' ').pop() || '');
                    
                    return (
                      <motion.div
                        key={injury.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className="p-4 bg-muted/20 hover:bg-muted/40 rounded-lg transition-colors border border-transparent hover:border-border"
                      >
                        <div className="flex items-start gap-3">
                          {/* Status Icon */}
                          <div className="flex-shrink-0 mt-1">
                            {getStatusIcon(injury.status)}
                          </div>

                          {/* Player Image or Placeholder */}
                          <div className="flex-shrink-0">
                            {injury.playerHeadshot ? (
                              <img 
                                src={injury.playerHeadshot} 
                                alt={injury.playerName}
                                className="w-10 h-10 rounded-full object-cover bg-muted"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                                <span className="text-xs font-bold text-muted-foreground">
                                  {injury.playerName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            {/* Header */}
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className="font-semibold text-sm">{injury.playerName}</span>
                              <Badge variant="outline" className="text-[10px]">
                                {injury.playerPosition}
                              </Badge>
                              {getImpactBadge(impact)}
                            </div>

                            {/* Team & Status */}
                            <div className="flex items-center gap-2 mb-2">
                              <TeamLogo 
                                teamName={injury.team} 
                                league={league} 
                                size="sm" 
                              />
                              <span className="text-xs text-muted-foreground">{injury.team}</span>
                              <Badge 
                                variant="outline" 
                                className={cn("text-[10px] capitalize", getStatusColor(injury.status))}
                              >
                                {injury.status}
                              </Badge>
                            </div>

                            {/* Injury Details */}
                            <div className="space-y-1">
                              <p className="text-sm">
                                <span className="font-medium">{injury.injuryType}:</span>{' '}
                                <span className="text-muted-foreground">
                                  {injury.description || 'No details available'}
                                </span>
                              </p>
                              
                              {injury.returnDate && (
                                <p className="text-xs text-muted-foreground">
                                  Expected return: {format(new Date(injury.returnDate), 'MMM d, yyyy')}
                                </p>
                              )}
                              
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                Updated {formatRelativeTime(injury.updatedAt)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </ScrollArea>
            )}

            {/* Data Source Note */}
            <p className="text-xs text-center text-muted-foreground pt-4 border-t mt-4">
              {hasRealData ? (
                <>Data from ESPN • Last updated {formatRelativeTime(new Date().toISOString())}</>
              ) : (
                <>Injury data unavailable • Check back later</>
              )}
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default TeamNewsInjuries;
