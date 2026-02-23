import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import TeamLogo from "@/components/match/TeamLogo";
import { League, Match } from "@/types/sports";
import { BarChart3, DollarSign, TrendingUp, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { BettingTrend } from "@/types/bettingTrends";

interface OddsValueSectionProps {
  match: Match;
  league: League;
  bettingTrend?: BettingTrend | null;
}

const formatOdds = (odds: number): string => {
  if (!odds) return "N/A";
  if (odds >= 2) {
    const american = Math.round((odds - 1) * 100);
    return `+${american}`;
  }
  const american = Math.round(-100 / (odds - 1));
  return `${american}`;
};

const BOOK_EMOJI: Record<string, string> = {
  draftkings: "🎰",
  fanduel: "🏇",
  betmgm: "🦁",
  caesars: "👑",
  pointsbet: "📍",
  betrivers: "🌊",
  williamhill_us: "🇬🇧",
  unibet_us: "🎯",
  espnbet: "📺",
};

const getBookEmoji = (bookId: string): string => {
  const id = bookId.toLowerCase();
  for (const [key, emoji] of Object.entries(BOOK_EMOJI)) {
    if (id.includes(key)) return emoji;
  }
  return "📊";
};

const roundSpread = (spread: number): number => {
  // Round to nearest 0.5
  return Math.round(spread * 2) / 2;
};

const OddsValueSection: React.FC<OddsValueSectionProps> = ({ match, league, bettingTrend }) => {
  const matchTitle = `${match.homeTeam?.name || "Home"} vs ${match.awayTeam?.name || "Away"}`;
  const liveOdds = match.liveOdds || [];

  if (liveOdds.length === 0 && !match.odds) return null;

  // Find best spread and moneyline across sportsbooks
  let bestSpread: { book: string; spread: number; odds: number } | null = null;
  let bestML: { book: string; odds: number; side: string } | null = null;

  for (const odds of liveOdds) {
    const bookName = typeof odds.sportsbook === "string" ? odds.sportsbook : odds.sportsbook?.name || "Unknown";

    if (odds.spread) {
      if (!bestSpread || Math.abs(odds.spread.homeSpread) < Math.abs(bestSpread.spread)) {
        bestSpread = {
          book: bookName,
          spread: odds.spread.homeSpread,
          odds: odds.spread.homeSpreadOdds,
        };
      }
    }

    // Best ML = highest implied probability for the favorite
    if (!bestML || odds.homeWin > bestML.odds) {
      bestML = { book: bookName, odds: odds.homeWin, side: "home" };
    }
    if (odds.awayWin > (bestML?.odds || 0)) {
      bestML = { book: bookName, odds: odds.awayWin, side: "away" };
    }
  }

  // Line movement from betting trend - round to standard increments
  const lineMovement = bettingTrend?.lineMovement;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25 }}
    >
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            Odds & Value
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Best odds highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {bestSpread && (
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">
                  Best Spread
                </p>
                <p className="text-lg font-bold">
                  {match.homeTeam?.shortName}{" "}
                  {bestSpread.spread > 0 ? "+" : ""}
                  {bestSpread.spread}
                </p>
                <p className="text-xs text-muted-foreground">
                  {bestSpread.book} • {formatOdds(bestSpread.odds)}
                </p>
              </div>
            )}
            {bestML && (
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">
                  Best Moneyline
                </p>
                <p className="text-lg font-bold">
                  {bestML.side === "home"
                    ? match.homeTeam?.shortName
                    : match.awayTeam?.shortName}{" "}
                  {formatOdds(bestML.odds)}
                </p>
                <p className="text-xs text-muted-foreground">{bestML.book}</p>
              </div>
            )}
          </div>

          {/* Sharp money indicator */}
          {bettingTrend?.sharpBetting && bettingTrend.sharpBetting.confidence > 50 && (
            <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Sharp Money Signal</span>
                <Badge variant="outline" className="text-[10px]">
                  {bettingTrend.sharpBetting.confidence}% confidence
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Sharps favor{" "}
                <span className="font-medium text-foreground">
                  {bettingTrend.sharpBetting.spreadFavorite === "home"
                    ? match.homeTeam?.name
                    : bettingTrend.sharpBetting.spreadFavorite === "away"
                    ? match.awayTeam?.name
                    : "Neither side"}
                </span>
                {bettingTrend.sharpBetting.signals.length > 0 && (
                  <> — {bettingTrend.sharpBetting.signals[0].description}</>
                )}
              </p>
            </div>
          )}

          {/* Line movement */}
          {lineMovement && lineMovement.spreadMovement !== 0 && (
            <div className="p-3 bg-muted/30 rounded-lg flex items-center gap-3">
              <ArrowRight
                className={cn(
                  "h-4 w-4",
                  lineMovement.spreadMovement > 0 ? "text-red-500 rotate-45" : "text-green-500 -rotate-45"
                )}
              />
              <div>
                <p className="text-xs font-medium">Line Movement</p>
                <p className="text-xs text-muted-foreground">
                  Opened {roundSpread(lineMovement.openSpread) > 0 ? "+" : ""}{roundSpread(lineMovement.openSpread).toFixed(1)}
                  {" → "}
                  Current {roundSpread(lineMovement.currentSpread) > 0 ? "+" : ""}{roundSpread(lineMovement.currentSpread).toFixed(1)}
                  {lineMovement.reverseLineMovement && (
                    <Badge variant="destructive" className="text-[9px] ml-2">
                      RLM
                    </Badge>
                  )}
                </p>
              </div>
            </div>
          )}

          {/* Full sportsbook comparison — horizontal scroll on mobile */}
          {liveOdds.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                All Sportsbooks
              </p>
              <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
              <div className="min-w-[480px] md:min-w-0 space-y-2">
              {liveOdds.map((odds, index) => {
                const bookName = typeof odds.sportsbook === "string" ? odds.sportsbook : odds.sportsbook?.name || `Book ${index + 1}`;
                const bookId = typeof odds.sportsbook === "string" ? odds.sportsbook : odds.sportsbook?.id || "";
                const emoji = getBookEmoji(bookId);
                const homeShort = match.homeTeam?.shortName || "Home";
                const awayShort = match.awayTeam?.shortName || "Away";
                
                return (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-base">{emoji}</span>
                      <span className="text-sm font-medium">{bookName}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      {/* Spread */}
                      {odds.spread && (
                        <div className="text-right">
                          <p className="text-[10px] text-muted-foreground uppercase">Spread</p>
                          <p className="text-xs font-mono font-medium">
                            {homeShort} {roundSpread(odds.spread.homeSpread) > 0 ? "+" : ""}{roundSpread(odds.spread.homeSpread).toFixed(1)}
                          </p>
                        </div>
                      )}
                      {/* Moneyline */}
                      <div className="text-right">
                        <p className="text-[10px] text-muted-foreground uppercase">Moneyline</p>
                        <div className="flex items-center gap-2">
                          <TeamLogo teamName={match.homeTeam?.name || ""} league={league} size="sm" />
                          <span className="text-xs font-mono font-medium">{formatOdds(odds.homeWin)}</span>
                          <span className="text-muted-foreground text-xs">/</span>
                          <span className="text-xs font-mono font-medium">{formatOdds(odds.awayWin)}</span>
                          <TeamLogo teamName={match.awayTeam?.name || ""} league={league} size="sm" />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default OddsValueSection;
