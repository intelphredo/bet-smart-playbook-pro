import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import TeamLogo from "@/components/match/TeamLogo";
import { League, Match } from "@/types/sports";
import { ArrowLeft, Clock, Radio, Trophy, Info } from "lucide-react";
import { format, parseISO } from "date-fns";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface GameHeaderProps {
  match: Match;
  league: League;
}

const GameHeader: React.FC<GameHeaderProps> = ({ match, league }) => {
  const navigate = useNavigate();
  const isLive = match.status === "live";
  const isFinished = match.status === "finished";
  
  const spreadData = match.liveOdds?.[0]?.spread;
  const totalsData = match.liveOdds?.[0]?.totals;
  const bestOdds = match.liveOdds?.[0] || {
    homeWin: match.odds?.homeWin || 0,
    awayWin: match.odds?.awayWin || 0,
  };

  const formatOdds = (odds: number): string => {
    if (!odds) return "N/A";
    if (odds >= 2) {
      const american = Math.round((odds - 1) * 100);
      return american > 0 ? `+${american}` : `${american}`;
    }
    return odds > 0 ? `+${Math.round(odds)}` : `${Math.round(odds)}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Back button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate(-1)}
        className="mb-3 -ml-2"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back
      </Button>

      <Card className="overflow-hidden">
        {/* Status bar */}
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-accent/10 px-4 py-2 border-b flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-semibold text-xs">
              {match.league || "Unknown"}
            </Badge>
            {isLive && (
              <Badge className="bg-destructive text-destructive-foreground animate-pulse text-xs">
                <Radio className="h-3 w-3 mr-1" />
                LIVE
              </Badge>
            )}
            {isFinished && (
              <Badge variant="secondary" className="text-xs">
                <Trophy className="h-3 w-3 mr-1" />
                FINAL
              </Badge>
            )}
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="text-[10px] text-muted-foreground cursor-help flex items-center gap-1">
                  <Info className="h-3 w-3" />
                  ID: {match.id?.slice(-8)}
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p>Game ID: {match.id}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <CardContent className="py-6">
          {/* Teams matchup */}
          <div className="flex items-center justify-between gap-4">
            {/* Away team (visitors listed first in "@" format) */}
            <div className="flex-1 text-center space-y-2">
              <TeamLogo
                teamName={match.awayTeam?.name || "Away"}
                league={league}
                size="xl"
                className="mx-auto shadow-lg"
              />
              <h2 className="text-lg sm:text-xl font-bold leading-tight">
                {match.awayTeam?.name || "Away Team"}
              </h2>
              {match.awayTeam?.record && (
                <Badge variant="secondary" className="text-xs">
                  {match.awayTeam.record}
                </Badge>
              )}
              {match.score && (
                <p className="text-4xl sm:text-5xl font-bold text-primary">
                  {match.score.away}
                </p>
              )}
            </div>

            {/* Center divider */}
            <div className="flex flex-col items-center gap-1">
              <span className="text-sm font-bold text-muted-foreground">@</span>
              {match.score?.period && (
                <Badge variant="outline" className="text-[10px]">
                  {match.score.period}
                </Badge>
              )}
            </div>

            {/* Home team */}
            <div className="flex-1 text-center space-y-2">
              <TeamLogo
                teamName={match.homeTeam?.name || "Home"}
                league={league}
                size="xl"
                className="mx-auto shadow-lg"
              />
              <h2 className="text-lg sm:text-xl font-bold leading-tight">
                {match.homeTeam?.name || "Home Team"}
              </h2>
              {match.homeTeam?.record && (
                <Badge variant="secondary" className="text-xs">
                  {match.homeTeam.record}
                </Badge>
              )}
              {match.score && (
                <p className="text-4xl sm:text-5xl font-bold text-primary">
                  {match.score.home}
                </p>
              )}
            </div>
          </div>

          <Separator className="my-4" />

          {/* Tip-off time */}
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-4">
            <Clock className="h-4 w-4 text-primary" />
            <span>
              {format(parseISO(match.startTime), "EEEE, MMM d 'at' h:mm a")}
            </span>
          </div>

          {/* Quick bet summary strip */}
          {!isFinished && (
            <div className="grid grid-cols-3 gap-2">
              {/* Spread */}
              <div className="text-center p-2.5 bg-muted/50 rounded-lg">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Spread</p>
                <p className="text-sm font-bold">
                  {spreadData
                    ? `${match.homeTeam?.shortName || "Home"} ${spreadData.homeSpread > 0 ? "+" : ""}${spreadData.homeSpread}`
                    : "N/A"}
                </p>
              </div>
              {/* Total */}
              <div className="text-center p-2.5 bg-muted/50 rounded-lg">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Total</p>
                <p className="text-sm font-bold">
                  {totalsData ? `O/U ${totalsData.total}` : "N/A"}
                </p>
              </div>
              {/* Moneyline */}
              <div className="text-center p-2.5 bg-muted/50 rounded-lg">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">ML</p>
                <p className="text-sm font-bold">
                  {formatOdds(bestOdds.homeWin)} / {formatOdds(bestOdds.awayWin)}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default GameHeader;
