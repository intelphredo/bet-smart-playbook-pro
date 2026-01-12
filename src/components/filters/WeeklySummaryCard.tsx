import React, { useMemo } from "react";
import { Match } from "@/types/sports";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, 
  TrendingUp, 
  Target, 
  Trophy, 
  Zap,
  BarChart3,
  ArrowUpRight,
  Flame
} from "lucide-react";
import { format, parseISO, startOfDay, addDays } from "date-fns";
import { cn } from "@/lib/utils";

interface WeeklySummaryCardProps {
  matches: Match[];
  daysAhead?: number;
}

interface DaySummary {
  date: Date;
  dateLabel: string;
  gameCount: number;
  highConfidenceCount: number;
  topPicksCount: number;
  avgConfidence: number;
  leagueBreakdown: Record<string, number>;
}

interface WeeklyStats {
  totalGames: number;
  totalHighConfidence: number;
  totalTopPicks: number;
  avgConfidence: number;
  bestDay: DaySummary | null;
  topLeagues: Array<{ league: string; count: number }>;
  dailySummaries: DaySummary[];
  expectedWins: number;
  expectedROI: number;
}

export const WeeklySummaryCard: React.FC<WeeklySummaryCardProps> = ({
  matches,
  daysAhead = 7,
}) => {
  const weeklyStats = useMemo((): WeeklyStats => {
    const today = startOfDay(new Date());
    const dailySummaries: DaySummary[] = [];
    const leagueTotals: Record<string, number> = {};
    
    let totalGames = 0;
    let totalHighConfidence = 0;
    let totalTopPicks = 0;
    let totalConfidence = 0;
    let bestDay: DaySummary | null = null;
    
    // Generate summaries for each day
    for (let i = 0; i < daysAhead; i++) {
      const date = addDays(today, i);
      const dateKey = format(date, "yyyy-MM-dd");
      
      const dayMatches = matches.filter((match) => {
        const matchDate = parseISO(match.startTime);
        return format(startOfDay(matchDate), "yyyy-MM-dd") === dateKey;
      });
      
      const highConfidence = dayMatches.filter(
        (m) => (m.prediction?.confidence || 0) >= 70
      ).length;
      
      const topPicks = dayMatches.filter(
        (m) => (m.smartScore?.overall || 0) >= 65
      ).length;
      
      const avgConf = dayMatches.length > 0
        ? dayMatches.reduce((sum, m) => sum + (m.prediction?.confidence || 0), 0) / dayMatches.length
        : 0;
      
      const leagueBreakdown: Record<string, number> = {};
      dayMatches.forEach((match) => {
        const league = match.league || "Other";
        leagueBreakdown[league] = (leagueBreakdown[league] || 0) + 1;
        leagueTotals[league] = (leagueTotals[league] || 0) + 1;
      });
      
      const summary: DaySummary = {
        date,
        dateLabel: i === 0 ? "Today" : i === 1 ? "Tomorrow" : format(date, "EEE"),
        gameCount: dayMatches.length,
        highConfidenceCount: highConfidence,
        topPicksCount: topPicks,
        avgConfidence: avgConf,
        leagueBreakdown,
      };
      
      dailySummaries.push(summary);
      
      totalGames += dayMatches.length;
      totalHighConfidence += highConfidence;
      totalTopPicks += topPicks;
      totalConfidence += avgConf * dayMatches.length;
      
      // Track best day (by high confidence picks)
      if (!bestDay || highConfidence > bestDay.highConfidenceCount) {
        bestDay = summary;
      }
    }
    
    // Sort leagues by count
    const topLeagues = Object.entries(leagueTotals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([league, count]) => ({ league, count }));
    
    // Calculate expected outcomes based on confidence
    const avgConfidence = totalGames > 0 ? totalConfidence / totalGames : 0;
    const expectedWinRate = avgConfidence / 100;
    const expectedWins = Math.round(totalHighConfidence * expectedWinRate);
    
    // Simplified expected ROI calculation (assuming avg odds of 1.9)
    const avgOdds = 1.9;
    const expectedROI = totalHighConfidence > 0 
      ? ((expectedWinRate * avgOdds) - 1) * 100 
      : 0;
    
    return {
      totalGames,
      totalHighConfidence,
      totalTopPicks,
      avgConfidence,
      bestDay,
      topLeagues,
      dailySummaries,
      expectedWins,
      expectedROI,
    };
  }, [matches, daysAhead]);

  if (matches.length === 0) {
    return null;
  }

  return (
    <Card className="bg-gradient-to-br from-primary/5 via-background to-accent/5 border-primary/20">
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Weekly Overview</h3>
              <p className="text-xs text-muted-foreground">Next 7 days betting summary</p>
            </div>
          </div>
          {weeklyStats.bestDay && (
            <Badge variant="outline" className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/30">
              <Trophy className="h-3 w-3 mr-1" />
              Best: {weeklyStats.bestDay.dateLabel}
            </Badge>
          )}
        </div>

        {/* Main Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <StatBox
            icon={BarChart3}
            label="Total Games"
            value={weeklyStats.totalGames}
            color="blue"
          />
          <StatBox
            icon={Target}
            label="High Confidence"
            value={weeklyStats.totalHighConfidence}
            subtext={`${Math.round((weeklyStats.totalHighConfidence / Math.max(weeklyStats.totalGames, 1)) * 100)}% of games`}
            color="green"
          />
          <StatBox
            icon={Zap}
            label="Top Picks"
            value={weeklyStats.totalTopPicks}
            subtext="SmartScore 65+"
            color="yellow"
          />
          <StatBox
            icon={TrendingUp}
            label="Avg Confidence"
            value={`${Math.round(weeklyStats.avgConfidence)}%`}
            color="purple"
          />
        </div>

        {/* Expected Value Section */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-muted/50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <ArrowUpRight className="h-4 w-4 text-green-500" />
              <span className="text-xs text-muted-foreground">Expected Wins</span>
            </div>
            <p className="text-xl font-bold text-green-600 dark:text-green-400">
              {weeklyStats.expectedWins}
              <span className="text-sm font-normal text-muted-foreground ml-1">
                of {weeklyStats.totalHighConfidence}
              </span>
            </p>
          </div>
          <div className="bg-muted/50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Flame className="h-4 w-4 text-orange-500" />
              <span className="text-xs text-muted-foreground">Expected ROI</span>
            </div>
            <p className={cn(
              "text-xl font-bold",
              weeklyStats.expectedROI >= 0 
                ? "text-green-600 dark:text-green-400" 
                : "text-red-600 dark:text-red-400"
            )}>
              {weeklyStats.expectedROI >= 0 ? "+" : ""}{weeklyStats.expectedROI.toFixed(1)}%
            </p>
          </div>
        </div>

        {/* Daily Mini Chart */}
        <div className="mb-4">
          <p className="text-xs text-muted-foreground mb-2">Games by Day</p>
          <div className="flex items-end gap-1 h-16">
            {weeklyStats.dailySummaries.map((day, index) => {
              const maxGames = Math.max(...weeklyStats.dailySummaries.map(d => d.gameCount), 1);
              const height = (day.gameCount / maxGames) * 100;
              const isBestDay = day === weeklyStats.bestDay;
              
              return (
                <div key={index} className="flex-1 flex flex-col items-center gap-1">
                  <div 
                    className={cn(
                      "w-full rounded-t transition-all",
                      isBestDay 
                        ? "bg-green-500" 
                        : day.highConfidenceCount > 0 
                          ? "bg-primary" 
                          : "bg-muted-foreground/30"
                    )}
                    style={{ height: `${Math.max(height, 4)}%` }}
                  />
                  <span className="text-[10px] text-muted-foreground">
                    {day.dateLabel.slice(0, 3)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Leagues */}
        <div>
          <p className="text-xs text-muted-foreground mb-2">Top Leagues This Week</p>
          <div className="flex flex-wrap gap-2">
            {weeklyStats.topLeagues.map(({ league, count }) => (
              <Badge key={league} variant="secondary" className="text-xs">
                {league}: {count}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Helper component for stat boxes
const StatBox: React.FC<{
  icon: React.ElementType;
  label: string;
  value: string | number;
  subtext?: string;
  color: "blue" | "green" | "yellow" | "purple";
}> = ({ icon: Icon, label, value, subtext, color }) => {
  const colorClasses = {
    blue: "text-blue-600 dark:text-blue-400 bg-blue-500/10",
    green: "text-green-600 dark:text-green-400 bg-green-500/10",
    yellow: "text-yellow-600 dark:text-yellow-400 bg-yellow-500/10",
    purple: "text-purple-600 dark:text-purple-400 bg-purple-500/10",
  };

  return (
    <div className="bg-background/50 rounded-lg p-3 border border-border/50">
      <div className="flex items-center gap-2 mb-1">
        <div className={cn("p-1 rounded", colorClasses[color])}>
          <Icon className="h-3 w-3" />
        </div>
        <span className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-xl font-bold">{value}</p>
      {subtext && (
        <p className="text-[10px] text-muted-foreground">{subtext}</p>
      )}
    </div>
  );
};
