import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import TeamLogo from "./TeamLogo";
import { League } from "@/types/sports";
import { Trophy, TrendingUp, Calendar, Minus, RefreshCw, Wifi, WifiOff, MapPin, BarChart3, Home, Plane, Zap } from "lucide-react";
import { format, parseISO } from "date-fns";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useHeadToHead } from "@/hooks/useHeadToHead";
import { TeamSeasonRecord } from "@/services/espnHeadToHead";
import { RankingsBadge } from "@/components/NCAAB";
import { useNCAABRankings, getTeamRanking } from "@/hooks/useNCAABRankings";

interface SeasonRecordCardProps {
  record: TeamSeasonRecord;
  teamName: string;
  league: League;
  isHighlighted?: boolean;
}

const SeasonRecordCard: React.FC<SeasonRecordCardProps> = ({ 
  record, 
  teamName, 
  league, 
  isHighlighted = false 
}) => {
  const getStreakColor = (streak: string | number | undefined | null) => {
    if (!streak) return "text-muted-foreground";
    const streakStr = String(streak);
    if (streakStr.startsWith("W")) return "text-green-500";
    if (streakStr.startsWith("L")) return "text-red-500";
    return "text-muted-foreground";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "p-4 rounded-xl border transition-all",
        isHighlighted 
          ? "bg-primary/10 border-primary/30" 
          : "bg-muted/30 border-muted"
      )}
    >
      {/* Team Header */}
      <div className="flex items-center gap-2 mb-3">
        <TeamLogo teamName={teamName} league={league} size="sm" />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate">{record.teamName}</p>
          <p className="text-xs text-muted-foreground">{record.season} Season</p>
        </div>
        {isHighlighted && (
          <Badge variant="default" className="text-[10px] shrink-0">
            Better Record
          </Badge>
        )}
      </div>

      {/* Main Record */}
      <div className="flex items-center justify-center gap-1 mb-3 p-2 bg-background rounded-lg">
        <span className="text-2xl font-bold text-green-500">{record.wins}</span>
        <span className="text-xl text-muted-foreground">-</span>
        <span className="text-2xl font-bold text-red-500">{record.losses}</span>
        {record.ties > 0 && (
          <>
            <span className="text-xl text-muted-foreground">-</span>
            <span className="text-2xl font-bold text-yellow-500">{record.ties}</span>
          </>
        )}
        <span className="ml-2 text-sm text-muted-foreground">
          ({record.winPercentage}%)
        </span>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        {/* Home Record */}
        <div className="flex items-center gap-1.5 p-2 bg-background/50 rounded">
          <Home className="h-3 w-3 text-primary" />
          <span className="text-muted-foreground">Home:</span>
          <span className="font-medium">{record.homeRecord}</span>
        </div>

        {/* Away Record */}
        <div className="flex items-center gap-1.5 p-2 bg-background/50 rounded">
          <Plane className="h-3 w-3 text-secondary-foreground" />
          <span className="text-muted-foreground">Away:</span>
          <span className="font-medium">{record.awayRecord}</span>
        </div>

        {/* Streak */}
        <div className="flex items-center gap-1.5 p-2 bg-background/50 rounded">
          <Zap className={cn("h-3 w-3", getStreakColor(record.streak))} />
          <span className="text-muted-foreground">Streak:</span>
          <span className={cn("font-medium", getStreakColor(record.streak))}>
            {record.streak}
          </span>
        </div>

        {/* Point Differential */}
        <div className="flex items-center gap-1.5 p-2 bg-background/50 rounded">
          <TrendingUp className={cn(
            "h-3 w-3",
            record.pointDifferential > 0 ? "text-green-500" : 
            record.pointDifferential < 0 ? "text-red-500" : "text-muted-foreground"
          )} />
          <span className="text-muted-foreground">Pt Diff:</span>
          <span className={cn(
            "font-medium",
            record.pointDifferential > 0 ? "text-green-500" : 
            record.pointDifferential < 0 ? "text-red-500" : ""
          )}>
            {record.pointDifferential > 0 ? "+" : ""}{record.pointDifferential}
          </span>
        </div>

        {/* Conference Record */}
        {record.conferenceRecord && (
          <div className="flex items-center gap-1.5 p-2 bg-background/50 rounded col-span-2">
            <Trophy className="h-3 w-3 text-amber-500" />
            <span className="text-muted-foreground">Conference:</span>
            <span className="font-medium">{record.conferenceRecord}</span>
          </div>
        )}

        {/* Last 10 */}
        {record.last10 && (
          <div className="flex items-center gap-1.5 p-2 bg-background/50 rounded col-span-2">
            <Calendar className="h-3 w-3 text-blue-500" />
            <span className="text-muted-foreground">Last 10:</span>
            <span className="font-medium">{record.last10}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
};

interface HeadToHeadHistoryProps {
  homeTeamId: string;
  homeTeamName: string;
  homeTeamShortName?: string;
  homeTeamLogo?: string;
  awayTeamId: string;
  awayTeamName: string;
  awayTeamShortName?: string;
  awayTeamLogo?: string;
  league: League;
  className?: string;
}

const HeadToHeadHistory: React.FC<HeadToHeadHistoryProps> = ({
  homeTeamId,
  homeTeamName,
  homeTeamShortName,
  homeTeamLogo,
  awayTeamId,
  awayTeamName,
  awayTeamShortName,
  awayTeamLogo,
  league,
  className,
}) => {
  // NCAAB Rankings
  const isNCAAB = league === "NCAAB";
  const { data: rankings } = useNCAABRankings();
  const homeRank = isNCAAB ? getTeamRanking(rankings, homeTeamName) : null;
  const awayRank = isNCAAB ? getTeamRanking(rankings, awayTeamName) : null;

  // Build team info objects for the hook
  const homeTeam = {
    id: homeTeamId,
    name: homeTeamName,
    shortName: homeTeamShortName || homeTeamName.split(" ").pop() || homeTeamName,
    logo: homeTeamLogo || "",
    league,
  };

  const awayTeam = {
    id: awayTeamId,
    name: awayTeamName,
    shortName: awayTeamShortName || awayTeamName.split(" ").pop() || awayTeamName,
    logo: awayTeamLogo || "",
    league,
  };

  const { data: h2hData, isLoading, refetch, isFetching } = useHeadToHead(homeTeam, awayTeam);

  const getResultForTeam = (match: any, teamId: string) => {
    const isHome = match.homeTeamId === teamId || 
      match.homeTeam.toLowerCase().includes(homeTeamName.toLowerCase().split(" ").pop() || "");
    const teamScore = isHome ? match.homeScore : match.awayScore;
    const oppScore = isHome ? match.awayScore : match.homeScore;
    
    if (teamScore > oppScore) return "win";
    if (teamScore < oppScore) return "loss";
    return "draw";
  };

  if (isLoading) {
    return (
      <Card className={cn("overflow-hidden", className)}>
        <CardHeader className="bg-gradient-to-r from-muted/50 to-muted/30">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Trophy className="h-5 w-5 text-primary" />
            Head-to-Head History
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-28 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-12 w-full" />
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!h2hData || h2hData.totalGames === 0) {
    return (
      <Card className={cn("overflow-hidden", className)}>
        <CardHeader className="bg-gradient-to-r from-muted/50 to-muted/30">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Trophy className="h-5 w-5 text-primary" />
            Head-to-Head History
          </CardTitle>
        </CardHeader>
        <CardContent className="py-12 text-center">
          <Trophy className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
          <p className="text-muted-foreground mb-2">No head-to-head history found</p>
          <p className="text-xs text-muted-foreground">
            These teams may not have played each other recently
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="mt-4"
            disabled={isFetching}
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", isFetching && "animate-spin")} />
            Refresh
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="bg-gradient-to-r from-muted/50 to-muted/30">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Trophy className="h-5 w-5 text-primary" />
            Head-to-Head History
            {h2hData.isLiveData ? (
              <Badge variant="outline" className="text-[10px] gap-1 ml-2">
                <Wifi className="h-3 w-3 text-green-500" />
                Live Data
              </Badge>
            ) : (
              <Badge variant="outline" className="text-[10px] gap-1 ml-2">
                <WifiOff className="h-3 w-3 text-muted-foreground" />
                Simulated
              </Badge>
            )}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="h-8"
          >
            <RefreshCw className={cn("h-4 w-4", isFetching && "animate-spin")} />
          </Button>
        </div>
        
        {/* NCAAB Ranked Matchup Banner */}
        {isNCAAB && (homeRank || awayRank) && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 p-3 bg-gradient-to-r from-yellow-500/10 via-amber-500/10 to-orange-500/10 border border-yellow-500/20 rounded-lg"
          >
            <div className="flex items-center justify-center gap-4">
              {homeRank && (
                <div className="flex items-center gap-2">
                  <RankingsBadge rank={homeRank} size="md" showTrend />
                  <span className="text-sm font-medium">{homeTeam.shortName}</span>
                </div>
              )}
              {homeRank && awayRank && (
                <span className="text-muted-foreground font-bold">vs</span>
              )}
              {awayRank && (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{awayTeam.shortName}</span>
                  <RankingsBadge rank={awayRank} size="md" showTrend />
                </div>
              )}
              {homeRank && awayRank && (
                <Badge className="ml-2 bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border-yellow-500/30">
                  🏀 Top 25 Matchup
                </Badge>
              )}
            </div>
          </motion.div>
        )}
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4">
          {/* Home Team Wins */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-center p-4 bg-primary/10 rounded-xl"
          >
            <div className="flex flex-col items-center gap-1 mb-2">
              {homeRank && <RankingsBadge rank={homeRank} size="sm" showTrend={false} />}
              <TeamLogo 
                teamName={homeTeamName} 
                league={league} 
                size="md" 
              />
            </div>
            <p className={cn(
              "text-3xl font-bold",
              h2hData.team1Wins > h2hData.team2Wins ? "text-green-500" : "text-primary"
            )}>
              {h2hData.team1Wins}
            </p>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Wins</p>
          </motion.div>

          {/* Draws */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="text-center p-4 bg-muted/50 rounded-xl"
          >
            <div className="flex items-center justify-center h-12 w-12 mx-auto mb-2 rounded-full bg-muted">
              <Minus className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-3xl font-bold text-muted-foreground">{h2hData.ties}</p>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Draws</p>
          </motion.div>

          {/* Away Team Wins */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center p-4 bg-secondary/50 rounded-xl"
          >
            <div className="flex flex-col items-center gap-1 mb-2">
              {awayRank && <RankingsBadge rank={awayRank} size="sm" showTrend={false} />}
              <TeamLogo 
                teamName={awayTeamName} 
                league={league} 
                size="md" 
              />
            </div>
            <p className={cn(
              "text-3xl font-bold",
              h2hData.team2Wins > h2hData.team1Wins ? "text-green-500" : "text-secondary-foreground"
            )}>
              {h2hData.team2Wins}
            </p>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Wins</p>
          </motion.div>
        </div>

        {/* Average Score & Stats */}
          <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center justify-center gap-2 p-3 bg-muted/30 rounded-lg">
            <TrendingUp className="h-4 w-4 text-primary" />
            <span className="text-sm text-muted-foreground">Avg:</span>
            <span className="font-semibold">{homeTeam.shortName}</span>
            <Badge variant="outline">
              {(!h2hData.avgTeam1Score && h2hData.avgTeam1Score !== 0) || isNaN(h2hData.avgTeam1Score) || h2hData.avgTeam1Score === 0 ? "N/A" : h2hData.avgTeam1Score}
            </Badge>
          </div>
          <div className="flex items-center justify-center gap-2 p-3 bg-muted/30 rounded-lg">
            <TrendingUp className="h-4 w-4 text-secondary-foreground" />
            <span className="text-sm text-muted-foreground">Avg:</span>
            <span className="font-semibold">{awayTeam.shortName}</span>
            <Badge variant="outline">
              {(!h2hData.avgTeam2Score && h2hData.avgTeam2Score !== 0) || isNaN(h2hData.avgTeam2Score) || h2hData.avgTeam2Score === 0 ? "N/A" : h2hData.avgTeam2Score}
            </Badge>
          </div>
        </div>

        {/* Trend summary */}
        {h2hData.totalGames > 0 && (
          <div className="p-3 bg-muted/30 rounded-lg text-center text-sm">
            {(() => {
              const hasScoreData = h2hData.avgTeam1Score > 0 || h2hData.avgTeam2Score > 0;
              const t1Wins = h2hData.team1Wins;
              const t2Wins = h2hData.team2Wins;
              
              if (t1Wins === 0 && t2Wins === 0 && !hasScoreData) {
                return <span>{h2hData.totalGames} matchups found — score data unavailable from ESPN</span>;
              }
              
              if (t1Wins > t2Wins) {
                return (
                  <span>
                    <strong>{homeTeam.shortName}</strong> leads the series{" "}
                    <strong>{t1Wins}-{t2Wins}</strong>
                    {hasScoreData && !isNaN(h2hData.avgTeam1Score) && !isNaN(h2hData.avgTeam2Score) && (
                      <> • Avg margin: <strong>{Math.abs(h2hData.avgTeam1Score - h2hData.avgTeam2Score)} pts</strong></>
                    )}
                  </span>
                );
              }
              if (t2Wins > t1Wins) {
                return (
                  <span>
                    <strong>{awayTeam.shortName}</strong> leads the series{" "}
                    <strong>{t2Wins}-{t1Wins}</strong>
                    {hasScoreData && !isNaN(h2hData.avgTeam1Score) && !isNaN(h2hData.avgTeam2Score) && (
                      <> • Avg margin: <strong>{Math.abs(h2hData.avgTeam1Score - h2hData.avgTeam2Score)} pts</strong></>
                    )}
                  </span>
                );
              }
              return <span>Series is <strong>tied {t1Wins}-{t2Wins}</strong></span>;
            })()}
          </div>
        )}

        {/* Streak Info */}
        {h2hData.streakTeam && h2hData.streakCount > 1 && (
          <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg text-center">
            <span className="text-sm">
              🔥 <strong>{h2hData.streakTeam}</strong> is on a{" "}
              <Badge className="bg-primary text-primary-foreground">
                {h2hData.streakCount} game
              </Badge>{" "}
              winning streak
            </span>
          </div>
        )}

        <Separator />

        {/* Season Records Section */}
        {(h2hData.team1SeasonRecord || h2hData.team2SeasonRecord) && (
          <>
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Current Season Records
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Team 1 Season Record */}
                {h2hData.team1SeasonRecord && (
                  <SeasonRecordCard 
                    record={h2hData.team1SeasonRecord} 
                    teamName={homeTeamName}
                    league={league}
                    isHighlighted={
                      (h2hData.team1SeasonRecord?.winPercentage || 0) > 
                      (h2hData.team2SeasonRecord?.winPercentage || 0)
                    }
                  />
                )}
                
                {/* Team 2 Season Record */}
                {h2hData.team2SeasonRecord && (
                  <SeasonRecordCard 
                    record={h2hData.team2SeasonRecord} 
                    teamName={awayTeamName}
                    league={league}
                    isHighlighted={
                      (h2hData.team2SeasonRecord?.winPercentage || 0) > 
                      (h2hData.team1SeasonRecord?.winPercentage || 0)
                    }
                  />
                )}
              </div>
            </div>

            <Separator />
          </>
        )}

        {/* Recent Matches */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Recent Matchups ({h2hData.totalGames} games)
          </h4>
          
          <div className="space-y-2">
            {h2hData.lastMeetings.slice(0, 5).map((match, index) => {
              const homeResult = getResultForTeam(match, homeTeamId);
              
              return (
                <motion.div
                  key={match.id || index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + index * 0.05 }}
                  className="flex items-center gap-3 p-3 bg-muted/30 hover:bg-muted/50 rounded-lg transition-colors"
                >
                  {/* Result Indicator for Home Team */}
                  <div
                    className={cn(
                      "w-2 h-8 rounded-full flex-shrink-0",
                      homeResult === "win" && "bg-green-500",
                      homeResult === "loss" && "bg-red-500",
                      homeResult === "draw" && "bg-yellow-500"
                    )}
                  />
                  
                  {/* Date */}
                  <div className="w-20 text-xs text-muted-foreground flex-shrink-0">
                    {format(parseISO(match.date), "MMM d, yyyy")}
                  </div>
                  
                  {/* Teams & Score */}
                  <div className="flex-1 flex items-center justify-center gap-2">
                    <div className="flex items-center gap-2 flex-1 justify-end">
                      <span className={cn(
                        "text-sm font-medium truncate max-w-[80px]",
                        match.homeTeam.toLowerCase().includes(homeTeamName.toLowerCase().split(" ").pop() || "") 
                          ? "text-primary" 
                          : ""
                      )}>
                        {match.homeTeam.split(" ").pop()}
                      </span>
                      <TeamLogo 
                        teamName={match.homeTeam} 
                        league={league} 
                        size="sm" 
                      />
                    </div>
                    
                    <div className="flex items-center gap-1 px-3 py-1 bg-background rounded-md min-w-[60px] justify-center">
                      {(() => {
                        const homeS = match.homeScore;
                        const awayS = match.awayScore;
                        const hasValidScores = !isNaN(homeS) && !isNaN(awayS) && !(homeS === 0 && awayS === 0);
                        if (!hasValidScores) {
                          return <span className="text-xs text-muted-foreground">No score</span>;
                        }
                        return (
                          <>
                            <span className={cn("font-bold", homeS > awayS && "text-green-500", homeS < awayS && "text-muted-foreground")}>
                              {homeS}
                            </span>
                            <span className="text-muted-foreground">-</span>
                            <span className={cn("font-bold", awayS > homeS && "text-green-500", awayS < homeS && "text-muted-foreground")}>
                              {awayS}
                            </span>
                          </>
                        );
                      })()}
                    </div>
                    
                    <div className="flex items-center gap-2 flex-1">
                      <TeamLogo 
                        teamName={match.awayTeam} 
                        league={league} 
                        size="sm" 
                      />
                      <span className={cn(
                        "text-sm font-medium truncate max-w-[80px]",
                        match.awayTeam.toLowerCase().includes(awayTeamName.toLowerCase().split(" ").pop() || "") 
                          ? "text-primary" 
                          : ""
                      )}>
                        {match.awayTeam.split(" ").pop()}
                      </span>
                    </div>
                  </div>
                  
                  {/* Venue */}
                  {match.venue && (
                    <div className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground max-w-[100px]">
                      <MapPin className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">{match.venue}</span>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Data source note */}
        <p className="text-xs text-center text-muted-foreground pt-2">
          {h2hData.isLiveData
            ? `Data from ESPN • ${h2hData.totalGames} historical matchups`
            : "Simulated data (no historical matchups found in API)"}
        </p>
      </CardContent>
    </Card>
  );
};

export default HeadToHeadHistory;
