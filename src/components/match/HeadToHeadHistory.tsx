import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import TeamLogo from "./TeamLogo";
import { League } from "@/types/sports";
import { Trophy, TrendingUp, Calendar, Minus } from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface MatchResult {
  date: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  venue?: string;
  competition?: string;
}

interface HeadToHeadHistoryProps {
  homeTeamName: string;
  awayTeamName: string;
  league: League;
  className?: string;
}

// Generate mock historical data based on team names for demo purposes
const generateMockHistory = (
  homeTeam: string,
  awayTeam: string
): MatchResult[] => {
  // Use team names to generate consistent "random" results
  const seed = (homeTeam.length * 7 + awayTeam.length * 13) % 100;
  
  const results: MatchResult[] = [];
  const now = new Date();
  
  for (let i = 0; i < 5; i++) {
    const daysAgo = 30 + i * 60 + (seed % 20);
    const date = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
    
    // Alternate home/away and generate scores based on seed
    const isHomeFirst = i % 2 === 0;
    const homeScore = ((seed + i * 3) % 5) + (i % 2);
    const awayScore = ((seed + i * 7) % 4) + ((i + 1) % 2);
    
    results.push({
      date: date.toISOString(),
      homeTeam: isHomeFirst ? homeTeam : awayTeam,
      awayTeam: isHomeFirst ? awayTeam : homeTeam,
      homeScore,
      awayScore,
      venue: isHomeFirst ? `${homeTeam} Stadium` : `${awayTeam} Arena`,
      competition: i === 0 ? "Playoffs" : "Regular Season",
    });
  }
  
  return results;
};

const HeadToHeadHistory: React.FC<HeadToHeadHistoryProps> = ({
  homeTeamName,
  awayTeamName,
  league,
  className,
}) => {
  const history = useMemo(
    () => generateMockHistory(homeTeamName, awayTeamName),
    [homeTeamName, awayTeamName]
  );

  // Calculate head-to-head stats
  const stats = useMemo(() => {
    let homeWins = 0;
    let awayWins = 0;
    let draws = 0;
    let totalHomeGoals = 0;
    let totalAwayGoals = 0;

    history.forEach((match) => {
      const isHome = match.homeTeam === homeTeamName;
      const teamScore = isHome ? match.homeScore : match.awayScore;
      const oppScore = isHome ? match.awayScore : match.homeScore;

      totalHomeGoals += teamScore;
      totalAwayGoals += oppScore;

      if (teamScore > oppScore) homeWins++;
      else if (teamScore < oppScore) awayWins++;
      else draws++;
    });

    return {
      homeWins,
      awayWins,
      draws,
      totalGames: history.length,
      avgHomeGoals: (totalHomeGoals / history.length).toFixed(1),
      avgAwayGoals: (totalAwayGoals / history.length).toFixed(1),
    };
  }, [history, homeTeamName]);

  const getResultForTeam = (match: MatchResult, teamName: string) => {
    const isHome = match.homeTeam === teamName;
    const teamScore = isHome ? match.homeScore : match.awayScore;
    const oppScore = isHome ? match.awayScore : match.homeScore;
    
    if (teamScore > oppScore) return "win";
    if (teamScore < oppScore) return "loss";
    return "draw";
  };

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="bg-gradient-to-r from-muted/50 to-muted/30">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Trophy className="h-5 w-5 text-primary" />
          Head-to-Head History
        </CardTitle>
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
            <TeamLogo 
              teamName={homeTeamName} 
              league={league} 
              size="md" 
              className="mx-auto mb-2"
            />
            <p className="text-3xl font-bold text-primary">{stats.homeWins}</p>
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
            <p className="text-3xl font-bold text-muted-foreground">{stats.draws}</p>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Draws</p>
          </motion.div>

          {/* Away Team Wins */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center p-4 bg-secondary/50 rounded-xl"
          >
            <TeamLogo 
              teamName={awayTeamName} 
              league={league} 
              size="md" 
              className="mx-auto mb-2"
            />
            <p className="text-3xl font-bold text-secondary-foreground">{stats.awayWins}</p>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Wins</p>
          </motion.div>
        </div>

        {/* Average Score */}
        <div className="flex items-center justify-center gap-4 p-3 bg-muted/30 rounded-lg">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            <span className="text-sm text-muted-foreground">Avg Score:</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold">{homeTeamName.split(' ').pop()}</span>
            <Badge variant="outline">{stats.avgHomeGoals}</Badge>
            <span className="text-muted-foreground">-</span>
            <Badge variant="outline">{stats.avgAwayGoals}</Badge>
            <span className="font-semibold">{awayTeamName.split(' ').pop()}</span>
          </div>
        </div>

        <Separator />

        {/* Recent Matches */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Recent Matchups
          </h4>
          
          <div className="space-y-2">
            {history.map((match, index) => {
              const homeResult = getResultForTeam(match, homeTeamName);
              
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + index * 0.05 }}
                  className="flex items-center gap-3 p-3 bg-muted/30 hover:bg-muted/50 rounded-lg transition-colors"
                >
                  {/* Result Indicator for Home Team */}
                  <div
                    className={cn(
                      "w-2 h-8 rounded-full",
                      homeResult === "win" && "bg-green-500",
                      homeResult === "loss" && "bg-red-500",
                      homeResult === "draw" && "bg-yellow-500"
                    )}
                  />
                  
                  {/* Date */}
                  <div className="w-20 text-xs text-muted-foreground">
                    {format(new Date(match.date), "MMM d, yyyy")}
                  </div>
                  
                  {/* Teams & Score */}
                  <div className="flex-1 flex items-center justify-center gap-2">
                    <div className="flex items-center gap-2 flex-1 justify-end">
                      <span className={cn(
                        "text-sm font-medium truncate max-w-[100px]",
                        match.homeTeam === homeTeamName ? "text-primary" : ""
                      )}>
                        {match.homeTeam.split(' ').pop()}
                      </span>
                      <TeamLogo 
                        teamName={match.homeTeam} 
                        league={league} 
                        size="sm" 
                      />
                    </div>
                    
                    <div className="flex items-center gap-1 px-3 py-1 bg-background rounded-md min-w-[60px] justify-center">
                      <span className={cn(
                        "font-bold",
                        match.homeScore > match.awayScore && "text-green-500",
                        match.homeScore < match.awayScore && "text-muted-foreground"
                      )}>
                        {match.homeScore}
                      </span>
                      <span className="text-muted-foreground">-</span>
                      <span className={cn(
                        "font-bold",
                        match.awayScore > match.homeScore && "text-green-500",
                        match.awayScore < match.homeScore && "text-muted-foreground"
                      )}>
                        {match.awayScore}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2 flex-1">
                      <TeamLogo 
                        teamName={match.awayTeam} 
                        league={league} 
                        size="sm" 
                      />
                      <span className={cn(
                        "text-sm font-medium truncate max-w-[100px]",
                        match.awayTeam === awayTeamName ? "text-primary" : ""
                      )}>
                        {match.awayTeam.split(' ').pop()}
                      </span>
                    </div>
                  </div>
                  
                  {/* Competition Badge */}
                  <Badge variant="outline" className="text-xs hidden sm:flex">
                    {match.competition}
                  </Badge>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Note about mock data */}
        <p className="text-xs text-center text-muted-foreground pt-2">
          Historical data for demonstration purposes
        </p>
      </CardContent>
    </Card>
  );
};

export default HeadToHeadHistory;
