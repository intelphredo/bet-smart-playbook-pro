import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, TrendingUp, BarChart3 } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { BettingTrend } from "@/types/bettingTrends";
import { Match } from "@/types/sports";

interface BettingTrendsSectionProps {
  bettingTrend?: BettingTrend | null;
  isLoading?: boolean;
  match: Match;
}

const BettingTrendsSection: React.FC<BettingTrendsSectionProps> = ({
  bettingTrend,
  isLoading,
  match,
}) => {
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5" />
            Betting Trends
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!bettingTrend) return null;

  const pub = bettingTrend.publicBetting;
  const sharp = bettingTrend.sharpBetting;
  const isTopRated = match.smartScore && match.smartScore.overall >= 70;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Betting Trends
            </CardTitle>
            {isTopRated && (
              <Badge className="bg-primary text-primary-foreground text-[10px]">
                ⭐ Top Rated
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Public vs Sharp splits */}
          <div className="space-y-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Public vs Sharp
            </p>

            {/* Spread */}
            <SplitBar
              label="Spread"
              publicPct={pub.spreadHome}
              sharpSide={sharp.spreadFavorite}
              homeName={match.homeTeam?.shortName || "Home"}
              awayName={match.awayTeam?.shortName || "Away"}
            />

            {/* Moneyline */}
            <SplitBar
              label="Moneyline"
              publicPct={pub.moneylineHome}
              sharpSide={sharp.moneylineFavorite}
              homeName={match.homeTeam?.shortName || "Home"}
              awayName={match.awayTeam?.shortName || "Away"}
            />

            {/* Total */}
            <SplitBar
              label="Total"
              publicPct={pub.over}
              sharpSide={sharp.totalFavorite === "over" ? "home" : sharp.totalFavorite === "under" ? "away" : "neutral"}
              homeName="Over"
              awayName="Under"
            />
          </div>

          {/* Sharp signals */}
          {sharp.signals.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Sharp Signals
              </p>
              {sharp.signals.slice(0, 3).map((signal, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg text-xs"
                >
                  <Badge
                    variant={
                      signal.strength === "strong"
                        ? "default"
                        : signal.strength === "moderate"
                        ? "secondary"
                        : "outline"
                    }
                    className="text-[9px] shrink-0"
                  >
                    {signal.type.replace("_", " ")}
                  </Badge>
                  <span className="text-muted-foreground">{signal.description}</span>
                </div>
              ))}
            </div>
          )}

          {/* Money flow */}
          {bettingTrend.moneyFlow && (
            <div className="p-3 bg-muted/30 rounded-lg">
              <p className="text-xs font-medium text-muted-foreground mb-2">
                Money Flow
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-muted-foreground">{match.homeTeam?.shortName}:</span>{" "}
                 <span className="font-medium">{Math.round(bettingTrend.moneyFlow.homeMoneyPct)}%</span>
                </div>
                <div>
                  <span className="text-muted-foreground">{match.awayTeam?.shortName}:</span>{" "}
                  <span className="font-medium">{Math.round(bettingTrend.moneyFlow.awayMoneyPct)}%</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

const SplitBar: React.FC<{
  label: string;
  publicPct: number;
  sharpSide: "home" | "away" | "neutral";
  homeName: string;
  awayName: string;
}> = ({ label, publicPct, sharpSide, homeName, awayName }) => {
  // Clamp to 0-100 and handle NaN
  const safePct = isNaN(publicPct) || !isFinite(publicPct) ? 50 : Math.max(0, Math.min(100, publicPct));
  const awayPct = Math.round(100 - safePct);
  const homePctDisplay = Math.round(safePct);

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <div className="flex items-center gap-1">
          {sharpSide !== "neutral" && (
            <Badge variant="outline" className="text-[9px]">
              Sharp: {sharpSide === "home" ? homeName : awayName}
            </Badge>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1">
        <span className="text-[10px] font-medium w-10 text-right">{homeName}</span>
        <div className="flex-1 flex h-2.5 rounded-full overflow-hidden bg-muted">
          <div
            className="bg-primary/70 transition-all"
            style={{ width: `${homePctDisplay}%` }}
          />
          <div
            className="bg-secondary transition-all"
            style={{ width: `${awayPct}%` }}
          />
        </div>
        <span className="text-[10px] font-medium w-10">{awayName}</span>
      </div>
      <div className="flex justify-between text-[10px] text-muted-foreground px-11">
        <span>{homePctDisplay}%</span>
        <span>{awayPct}%</span>
      </div>
    </div>
  );
};

export default BettingTrendsSection;
