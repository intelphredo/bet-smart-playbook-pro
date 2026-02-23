import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TeamLogo from "@/components/match/TeamLogo";
import AddToBetSlipButton from "@/components/BetSlip/AddToBetSlipButton";
import { League, Match } from "@/types/sports";
import { BetType } from "@/types/betting";
import { Ticket, Target, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface PlaceBetCardProps {
  match: Match;
  league: League;
}

const formatOdds = (odds: number): string => {
  if (!odds) return "N/A";
  if (odds >= 2) {
    const american = Math.round((odds - 1) * 100);
    return american > 0 ? `+${american}` : `${american}`;
  }
  return odds > 0 ? `+${Math.round(odds)}` : `${Math.round(odds)}`;
};

const PlaceBetCard: React.FC<PlaceBetCardProps> = ({ match, league }) => {
  const [selectedBetType, setSelectedBetType] = useState<BetType>("moneyline");

  const isFinished = match.status === "finished";
  if (isFinished) return null;

  const matchTitle = `${match.homeTeam?.name || "Home"} vs ${match.awayTeam?.name || "Away"}`;
  const bestOdds = match.liveOdds?.[0] || {
    homeWin: match.odds?.homeWin || 1.91,
    awayWin: match.odds?.awayWin || 1.91,
    draw: match.odds?.draw,
  };
  const spreadData = match.liveOdds?.[0]?.spread;
  const totalsData = match.liveOdds?.[0]?.totals;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.12 }}
    >
      <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-accent/5">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Ticket className="h-5 w-5 text-primary" />
            Place Your Bet
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs value={selectedBetType} onValueChange={(v) => setSelectedBetType(v as BetType)}>
            <TabsList className="grid w-full grid-cols-3 h-12">
              <TabsTrigger value="moneyline" className="text-sm min-h-[44px]">Moneyline</TabsTrigger>
              <TabsTrigger value="spread" disabled={!spreadData} className="text-sm min-h-[44px]">Spread</TabsTrigger>
              <TabsTrigger value="total" disabled={!totalsData} className="text-sm min-h-[44px]">Total</TabsTrigger>
            </TabsList>

            <TabsContent value="moneyline" className="mt-3">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <BetOptionCard
                  matchId={match.id}
                  matchTitle={matchTitle}
                  league={match.league}
                  betType="moneyline"
                  selection={match.homeTeam?.name || "Home"}
                  odds={bestOdds.homeWin}
                  teamName={match.homeTeam?.name}
                  leagueType={league}
                  label="Home Win"
                  isRecommended={match.prediction?.recommended === "home"}
                  confidence={match.prediction?.recommended === "home" ? match.prediction?.confidence : undefined}
                />
                {bestOdds.draw && (
                  <BetOptionCard
                    matchId={match.id}
                    matchTitle={matchTitle}
                    league={match.league}
                    betType="moneyline"
                    selection="Draw"
                    odds={bestOdds.draw}
                    label="Draw"
                  />
                )}
                <BetOptionCard
                  matchId={match.id}
                  matchTitle={matchTitle}
                  league={match.league}
                  betType="moneyline"
                  selection={match.awayTeam?.name || "Away"}
                  odds={bestOdds.awayWin}
                  teamName={match.awayTeam?.name}
                  leagueType={league}
                  label="Away Win"
                  isRecommended={match.prediction?.recommended === "away"}
                  confidence={match.prediction?.recommended === "away" ? match.prediction?.confidence : undefined}
                />
              </div>
            </TabsContent>

            <TabsContent value="spread" className="mt-3">
              {spreadData ? (
                <div className="grid grid-cols-2 gap-3">
                  <BetOptionCard
                    matchId={match.id}
                    matchTitle={matchTitle}
                    league={match.league}
                    betType="spread"
                    selection={`${match.homeTeam?.name} ${spreadData.homeSpread > 0 ? "+" : ""}${spreadData.homeSpread}`}
                    odds={spreadData.homeSpreadOdds}
                    teamName={match.homeTeam?.name}
                    leagueType={league}
                    label={`${match.homeTeam?.shortName || "Home"} ${spreadData.homeSpread > 0 ? "+" : ""}${spreadData.homeSpread}`}
                  />
                  <BetOptionCard
                    matchId={match.id}
                    matchTitle={matchTitle}
                    league={match.league}
                    betType="spread"
                    selection={`${match.awayTeam?.name} ${spreadData.awaySpread > 0 ? "+" : ""}${spreadData.awaySpread}`}
                    odds={spreadData.awaySpreadOdds}
                    teamName={match.awayTeam?.name}
                    leagueType={league}
                    label={`${match.awayTeam?.shortName || "Away"} ${spreadData.awaySpread > 0 ? "+" : ""}${spreadData.awaySpread}`}
                  />
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-4 text-sm">
                  Spread betting not available
                </p>
              )}
            </TabsContent>

            <TabsContent value="total" className="mt-3">
              {totalsData ? (
                <div className="grid grid-cols-2 gap-3">
                  <BetOptionCard
                    matchId={match.id}
                    matchTitle={matchTitle}
                    league={match.league}
                    betType="total"
                    selection={`Over ${totalsData.total}`}
                    odds={totalsData.overOdds}
                    label={`Over ${totalsData.total}`}
                    icon={<TrendingUp className="h-4 w-4" />}
                  />
                  <BetOptionCard
                    matchId={match.id}
                    matchTitle={matchTitle}
                    league={match.league}
                    betType="total"
                    selection={`Under ${totalsData.total}`}
                    odds={totalsData.underOdds}
                    label={`Under ${totalsData.total}`}
                    icon={<TrendingUp className="h-4 w-4 rotate-180" />}
                  />
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-4 text-sm">
                  Total betting not available
                </p>
              )}
            </TabsContent>
          </Tabs>

          {/* AI Recommendation */}
          {match.prediction?.recommended && match.prediction.confidence >= 60 && (
            <div className="p-3 bg-primary/10 border border-primary/30 rounded-lg">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">AI Recommends:</span>
                <Badge className="bg-primary text-primary-foreground capitalize text-xs">
                  {match.prediction.recommended}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  ({Math.round(match.prediction.confidence)}% confidence)
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

interface BetOptionCardProps {
  matchId: string;
  matchTitle: string;
  league?: string;
  betType: BetType;
  selection: string;
  odds: number;
  teamName?: string;
  leagueType?: League;
  label: string;
  icon?: React.ReactNode;
  isRecommended?: boolean;
  confidence?: number;
}

const BetOptionCard: React.FC<BetOptionCardProps> = ({
  matchId, matchTitle, league, betType, selection, odds,
  teamName, leagueType, label, icon, isRecommended, confidence,
}) => (
  <div
    className={cn(
      "relative p-3 rounded-lg border transition-all",
      isRecommended
        ? "bg-gradient-to-br from-primary/15 to-primary/5 border-primary/40"
        : "bg-muted/50 border-border hover:border-primary/30"
    )}
  >
    {isRecommended && (
      <Badge className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-[10px]">
        <Target className="h-3 w-3 mr-1" />
        Pick
      </Badge>
    )}
    <div className="flex flex-col items-center gap-2">
      {teamName && leagueType ? (
        <TeamLogo teamName={teamName} league={leagueType} size="md" />
      ) : icon ? (
        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
          {icon}
        </div>
      ) : null}
      <div className="text-center">
        <p className="text-xs font-medium">{label}</p>
        <p className="text-xl font-bold font-mono mt-1">{formatOdds(odds)}</p>
      </div>
      {isRecommended && confidence && (
        <span className="text-[10px] text-muted-foreground">
          {Math.round(confidence)}% confidence
        </span>
      )}
      <AddToBetSlipButton
        matchId={matchId}
        matchTitle={matchTitle}
        league={league}
        betType={betType}
        selection={selection}
        odds={odds}
        modelConfidence={confidence}
        className="w-full"
      />
    </div>
  </div>
);

export default PlaceBetCard;
