import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import TeamLogo from "./TeamLogo";
import { League } from "@/types/sports";
import { InjuryStatus } from "@/types/injuries";
import { 
  Newspaper, 
  AlertCircle, 
  UserX, 
  UserCheck, 
  Clock, 
  TrendingUp,
  TrendingDown,
  Activity,
  Zap
} from "lucide-react";
import { format, subDays, subHours } from "date-fns";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface NewsItem {
  id: string;
  type: 'injury' | 'return' | 'trade' | 'roster' | 'general';
  headline: string;
  summary: string;
  team: string;
  playerName?: string;
  position?: string;
  status?: InjuryStatus;
  previousStatus?: InjuryStatus;
  timestamp: string;
  impact: 'high' | 'medium' | 'low';
}

interface TeamNewsInjuriesProps {
  homeTeamName: string;
  awayTeamName: string;
  league: League;
  className?: string;
}

// Generate mock news based on team names
const generateMockNews = (
  homeTeam: string,
  awayTeam: string,
  league: League
): NewsItem[] => {
  const now = new Date();
  const seed = (homeTeam.length * 11 + awayTeam.length * 17) % 100;
  
  const positions: Record<string, string[]> = {
    NBA: ['PG', 'SG', 'SF', 'PF', 'C'],
    NFL: ['QB', 'RB', 'WR', 'TE', 'LB', 'CB'],
    NHL: ['C', 'LW', 'RW', 'D', 'G'],
    MLB: ['SP', 'RP', 'C', '1B', 'SS', 'OF'],
    SOCCER: ['GK', 'CB', 'MF', 'FW'],
  };

  const injuryTypes = ['hamstring strain', 'ankle sprain', 'knee soreness', 'back tightness', 'illness', 'concussion protocol'];
  
  const leaguePositions = positions[league] || positions.NBA;
  
  const news: NewsItem[] = [
    // Home team injury update
    {
      id: '1',
      type: 'injury',
      headline: `${homeTeam} star ${leaguePositions[seed % leaguePositions.length]} ruled out`,
      summary: `Key player will miss tonight's game due to ${injuryTypes[seed % injuryTypes.length]}. This is a significant blow to the team's offensive production.`,
      team: homeTeam,
      playerName: `Player ${seed % 10 + 1}`,
      position: leaguePositions[seed % leaguePositions.length],
      status: 'out',
      previousStatus: 'questionable',
      timestamp: subHours(now, 2).toISOString(),
      impact: 'high',
    },
    // Away team return
    {
      id: '2',
      type: 'return',
      headline: `${awayTeam} gets boost with key player returning`,
      summary: `After missing the last 3 games, the team's leading scorer has been cleared to play. Expected to be on minutes restriction.`,
      team: awayTeam,
      playerName: `Player ${(seed + 5) % 10 + 1}`,
      position: leaguePositions[(seed + 1) % leaguePositions.length],
      status: 'probable',
      previousStatus: 'out',
      timestamp: subHours(now, 4).toISOString(),
      impact: 'high',
    },
    // Questionable update
    {
      id: '3',
      type: 'injury',
      headline: `${homeTeam} ${leaguePositions[(seed + 2) % leaguePositions.length]} questionable with ${injuryTypes[(seed + 1) % injuryTypes.length]}`,
      summary: `Game-time decision expected. Participated in morning shootaround but was limited.`,
      team: homeTeam,
      playerName: `Player ${(seed + 2) % 10 + 1}`,
      position: leaguePositions[(seed + 2) % leaguePositions.length],
      status: 'questionable',
      timestamp: subHours(now, 6).toISOString(),
      impact: 'medium',
    },
    // General team news
    {
      id: '4',
      type: 'general',
      headline: `${awayTeam} coming off back-to-back road games`,
      summary: `Team fatigue could be a factor. Coach mentioned rotating players to manage rest.`,
      team: awayTeam,
      timestamp: subDays(now, 1).toISOString(),
      impact: 'medium',
    },
    // Roster move
    {
      id: '5',
      type: 'roster',
      headline: `${homeTeam} signs veteran ${leaguePositions[(seed + 3) % leaguePositions.length]}`,
      summary: `Emergency signing to provide depth. Could see limited minutes tonight.`,
      team: homeTeam,
      playerName: `New Signing`,
      position: leaguePositions[(seed + 3) % leaguePositions.length],
      timestamp: subDays(now, 1).toISOString(),
      impact: 'low',
    },
    // Away injury
    {
      id: '6',
      type: 'injury',
      headline: `${awayTeam} backup ${leaguePositions[(seed + 4) % leaguePositions.length]} day-to-day`,
      summary: `Role player dealing with minor ${injuryTypes[(seed + 2) % injuryTypes.length]}. Depth could be tested.`,
      team: awayTeam,
      playerName: `Player ${(seed + 7) % 10 + 1}`,
      position: leaguePositions[(seed + 4) % leaguePositions.length],
      status: 'day-to-day',
      timestamp: subDays(now, 1).toISOString(),
      impact: 'low',
    },
  ];

  return news.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

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

const getTypeIcon = (type: NewsItem['type']) => {
  switch (type) {
    case 'injury': return <UserX className="h-4 w-4 text-red-500" />;
    case 'return': return <UserCheck className="h-4 w-4 text-green-500" />;
    case 'trade': return <TrendingUp className="h-4 w-4 text-blue-500" />;
    case 'roster': return <Activity className="h-4 w-4 text-purple-500" />;
    default: return <Newspaper className="h-4 w-4 text-muted-foreground" />;
  }
};

const getImpactBadge = (impact: NewsItem['impact']) => {
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
  const now = new Date();
  const date = new Date(timestamp);
  const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
  
  if (diffHours < 1) return 'Just now';
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'Yesterday';
  return `${diffDays} days ago`;
};

const TeamNewsInjuries: React.FC<TeamNewsInjuriesProps> = ({
  homeTeamName,
  awayTeamName,
  league,
  className,
}) => {
  const news = useMemo(
    () => generateMockNews(homeTeamName, awayTeamName, league),
    [homeTeamName, awayTeamName, league]
  );

  // Separate by team
  const homeNews = news.filter(n => n.team === homeTeamName);
  const awayNews = news.filter(n => n.team === awayTeamName);

  // Count injuries
  const homeInjuries = homeNews.filter(n => n.type === 'injury' && n.status !== 'probable').length;
  const awayInjuries = awayNews.filter(n => n.type === 'injury' && n.status !== 'probable').length;

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="bg-gradient-to-r from-muted/50 to-muted/30">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-lg">
            <Newspaper className="h-5 w-5 text-primary" />
            Team News & Injuries
          </div>
          <div className="flex items-center gap-2">
            {homeInjuries > 0 && (
              <Badge variant="outline" className="text-xs">
                <TeamLogo teamName={homeTeamName} league={league} size="sm" className="mr-1" />
                {homeInjuries} out
              </Badge>
            )}
            {awayInjuries > 0 && (
              <Badge variant="outline" className="text-xs">
                <TeamLogo teamName={awayTeamName} league={league} size="sm" className="mr-1" />
                {awayInjuries} out
              </Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        {/* Quick Injury Summary */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* Home Team Summary */}
          <div className="p-4 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <TeamLogo teamName={homeTeamName} league={league} size="md" />
              <div>
                <p className="font-semibold text-sm">{homeTeamName.split(' ').pop()}</p>
                <p className="text-xs text-muted-foreground">
                  {homeInjuries > 0 ? (
                    <span className="text-red-500">{homeInjuries} player(s) out</span>
                  ) : (
                    <span className="text-green-500">Fully healthy</span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-1">
              {homeNews
                .filter(n => n.status)
                .slice(0, 3)
                .map(n => (
                  <Badge 
                    key={n.id} 
                    variant="outline" 
                    className={cn("text-[10px]", getStatusColor(n.status))}
                  >
                    {n.position}: {n.status}
                  </Badge>
                ))
              }
            </div>
          </div>

          {/* Away Team Summary */}
          <div className="p-4 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <TeamLogo teamName={awayTeamName} league={league} size="md" />
              <div>
                <p className="font-semibold text-sm">{awayTeamName.split(' ').pop()}</p>
                <p className="text-xs text-muted-foreground">
                  {awayInjuries > 0 ? (
                    <span className="text-red-500">{awayInjuries} player(s) out</span>
                  ) : (
                    <span className="text-green-500">Fully healthy</span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-1">
              {awayNews
                .filter(n => n.status)
                .slice(0, 3)
                .map(n => (
                  <Badge 
                    key={n.id} 
                    variant="outline" 
                    className={cn("text-[10px]", getStatusColor(n.status))}
                  >
                    {n.position}: {n.status}
                  </Badge>
                ))
              }
            </div>
          </div>
        </div>

        <Separator className="mb-4" />

        {/* Recent Updates Feed */}
        <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-2 mb-4">
          <Zap className="h-4 w-4" />
          Recent Updates
        </h4>

        <ScrollArea className="h-[320px] pr-4">
          <div className="space-y-3">
            {news.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="p-4 bg-muted/20 hover:bg-muted/40 rounded-lg transition-colors border border-transparent hover:border-border"
              >
                <div className="flex items-start gap-3">
                  {/* Type Icon */}
                  <div className="flex-shrink-0 mt-1">
                    {getTypeIcon(item.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    {/* Header */}
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <TeamLogo teamName={item.team} league={league} size="sm" />
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatRelativeTime(item.timestamp)}
                      </span>
                      {getImpactBadge(item.impact)}
                    </div>

                    {/* Headline */}
                    <p className="font-medium text-sm mb-1">{item.headline}</p>

                    {/* Status Change */}
                    {item.status && (
                      <div className="flex items-center gap-2 mb-2">
                        {item.previousStatus && (
                          <>
                            <Badge variant="outline" className={cn("text-[10px]", getStatusColor(item.previousStatus))}>
                              {item.previousStatus}
                            </Badge>
                            <TrendingDown className="h-3 w-3 text-muted-foreground" />
                          </>
                        )}
                        <Badge variant="outline" className={cn("text-[10px]", getStatusColor(item.status))}>
                          {item.status}
                        </Badge>
                        {item.playerName && item.position && (
                          <span className="text-xs text-muted-foreground">
                            ({item.position})
                          </span>
                        )}
                      </div>
                    )}

                    {/* Summary */}
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {item.summary}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </ScrollArea>

        {/* Note */}
        <p className="text-xs text-center text-muted-foreground pt-4 border-t mt-4">
          News updates for demonstration purposes
        </p>
      </CardContent>
    </Card>
  );
};

export default TeamNewsInjuries;
