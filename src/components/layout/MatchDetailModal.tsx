import { Match, League } from "@/types/sports";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  Clock,
  Radio,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Zap,
  AlertTriangle,
  DollarSign,
  Activity,
  Users,
  Trophy,
  Target,
  ThermometerSun,
  Wind,
  History,
} from "lucide-react";
import { useOddsFormat } from "@/contexts/OddsFormatContext";
import { SPORTSBOOK_LOGOS, findBestOdds, SPORTSBOOK_PRIORITY } from "@/utils/sportsbook";
import { LiveOdds } from "@/types/sports";
import { TeamLogoImage } from "@/components/ui/TeamLogoImage";
import { useHeadToHead } from "@/hooks/useHeadToHead";

interface MatchDetailModalProps {
  match: Match | null;
  isOpen: boolean;
  onClose: () => void;
}

const MatchDetailModal = ({ match, isOpen, onClose }: MatchDetailModalProps) => {
  const { formatOdds } = useOddsFormat();
  const league = (match?.league || "NBA") as League;

  // Build team objects for H2H hook
  const homeTeam = match ? {
    id: match.homeTeam?.id || "home",
    name: match.homeTeam?.name || "Home",
    shortName: match.homeTeam?.shortName || "HOME",
    logo: match.homeTeam?.logo || "",
    league,
  } : null;

  const awayTeam = match ? {
    id: match.awayTeam?.id || "away",
    name: match.awayTeam?.name || "Away",
    shortName: match.awayTeam?.shortName || "AWAY",
    logo: match.awayTeam?.logo || "",
    league,
  } : null;

  const { data: h2hData, isLoading: h2hLoading } = useHeadToHead(homeTeam, awayTeam);

  if (!match) return null;

  const homeScore = match.score?.home;
  const awayScore = match.score?.away;
  const hasScores = homeScore !== undefined && awayScore !== undefined;
  const smartScore = match.smartScore;
  const prediction = match.prediction;

  const isLive = match.status === "live";
  const isFinished = match.status === "finished";

  // Get best odds
  const bestOdds = match.liveOdds ? findBestOdds(match.liveOdds) : null;

  // Sort sportsbooks by priority
  const sortedOdds = match.liveOdds
    ? [...match.liveOdds]
        .reduce((acc: LiveOdds[], odd: LiveOdds) => {
          if (!acc.find((o) => o.sportsbook.id === odd.sportsbook.id)) {
            acc.push(odd);
          }
          return acc;
        }, [])
        .sort((a, b) => {
          const priorityA = SPORTSBOOK_PRIORITY[a.sportsbook.id] || 99;
          const priorityB = SPORTSBOOK_PRIORITY[b.sportsbook.id] || 99;
          return priorityA - priorityB;
        })
    : [];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] p-0 gap-0">
        <DialogHeader className="p-6 pb-4 border-b border-border/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Badge variant="outline">{match.league}</Badge>
              {isLive && (
                <Badge className="bg-red-500 text-white animate-pulse">
                  <Radio className="h-3 w-3 mr-1" />
                  LIVE
                </Badge>
              )}
              {isFinished && (
                <Badge variant="secondary">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Final
                </Badge>
              )}
            </div>
            <span className="text-sm text-muted-foreground">
              {format(new Date(match.startTime), "MMM d, yyyy • h:mm a")}
            </span>
          </div>

          {/* Teams Display */}
          <div className="mt-4">
            <div className="grid grid-cols-3 gap-4 items-center">
              {/* Away Team */}
              <div className="text-center">
                <TeamLogoImage
                  teamName={match.awayTeam?.name || "Away"}
                  logoUrl={match.awayTeam?.logo}
                  league={league}
                  size="lg"
                  className="mx-auto mb-2"
                />
                <p className="font-semibold">{match.awayTeam?.name || "Away"}</p>
                {match.awayTeam?.record && (
                  <p className="text-xs text-muted-foreground">{match.awayTeam.record}</p>
                )}
                {hasScores && (
                  <p
                    className={cn(
                      "text-3xl font-bold mt-2",
                      (awayScore ?? 0) > (homeScore ?? 0) ? "text-green-500" : "text-muted-foreground"
                    )}
                  >
                    {awayScore}
                  </p>
                )}
              </div>

              {/* VS */}
              <div className="text-center">
                <div className="text-2xl font-bold text-muted-foreground">VS</div>
                {match.score?.period && (
                  <Badge variant="outline" className="mt-2">
                    {match.score.period}
                  </Badge>
                )}
              </div>

              {/* Home Team */}
              <div className="text-center">
                <TeamLogoImage
                  teamName={match.homeTeam?.name || "Home"}
                  logoUrl={match.homeTeam?.logo}
                  league={league}
                  size="lg"
                  className="mx-auto mb-2"
                />
                <p className="font-semibold">{match.homeTeam?.name || "Home"}</p>
                {match.homeTeam?.record && (
                  <p className="text-xs text-muted-foreground">{match.homeTeam.record}</p>
                )}
                {hasScores && (
                  <p
                    className={cn(
                      "text-3xl font-bold mt-2",
                      (homeScore ?? 0) > (awayScore ?? 0) ? "text-green-500" : "text-muted-foreground"
                    )}
                  >
                    {homeScore}
                  </p>
                )}
              </div>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-250px)]">
          <Tabs defaultValue="odds" className="w-full">
            <TabsList className="w-full justify-start rounded-none border-b border-border/50 bg-transparent p-0 h-auto">
              <TabsTrigger
                value="odds"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3"
              >
                <DollarSign className="h-4 w-4 mr-2" />
                Odds Comparison
              </TabsTrigger>
              <TabsTrigger
                value="prediction"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3"
              >
                <Target className="h-4 w-4 mr-2" />
                Predictions
              </TabsTrigger>
              <TabsTrigger
                value="smartscore"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3"
              >
                <Zap className="h-4 w-4 mr-2" />
                Smart Score
              </TabsTrigger>
              <TabsTrigger
                value="injuries"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3"
              >
                <Users className="h-4 w-4 mr-2" />
                Injuries
              </TabsTrigger>
              <TabsTrigger
                value="h2h"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3"
              >
                <History className="h-4 w-4 mr-2" />
                H2H
              </TabsTrigger>
            </TabsList>

            {/* Odds Comparison Tab */}
            <TabsContent value="odds" className="p-6 pt-4 m-0">
              {sortedOdds.length > 0 ? (
                <div className="space-y-4">
                  {/* Best Odds Summary */}
                  {bestOdds && (
                    <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <Trophy className="h-5 w-5 text-yellow-500" />
                          <h3 className="font-semibold">Best Available Odds</h3>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          {bestOdds.home && (
                            <div className="text-center p-3 bg-background rounded-lg">
                              <p className="text-xs text-muted-foreground mb-1">
                                {match.homeTeam?.shortName || "Home"}
                              </p>
                              <p className="text-xl font-bold text-green-600">
                                {formatOdds(bestOdds.home.value)}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {bestOdds.home.sportsbookId}
                              </p>
                            </div>
                          )}
                          {bestOdds.draw && (
                            <div className="text-center p-3 bg-background rounded-lg">
                              <p className="text-xs text-muted-foreground mb-1">Draw</p>
                              <p className="text-xl font-bold text-green-600">
                                {formatOdds(bestOdds.draw.value)}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {bestOdds.draw.sportsbookId}
                              </p>
                            </div>
                          )}
                          {bestOdds.away && (
                            <div className="text-center p-3 bg-background rounded-lg">
                              <p className="text-xs text-muted-foreground mb-1">
                                {match.awayTeam?.shortName || "Away"}
                              </p>
                              <p className="text-xl font-bold text-green-600">
                                {formatOdds(bestOdds.away.value)}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {bestOdds.away.sportsbookId}
                              </p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Full Odds Table */}
                  <div className="rounded-lg border border-border overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-muted/50">
                          <th className="px-4 py-3 text-left font-medium">Sportsbook</th>
                          <th className="px-4 py-3 text-center font-medium">
                            {match.homeTeam?.shortName || "Home"}
                          </th>
                          {match.odds?.draw !== undefined && (
                            <th className="px-4 py-3 text-center font-medium">Draw</th>
                          )}
                          <th className="px-4 py-3 text-center font-medium">
                            {match.awayTeam?.shortName || "Away"}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {sortedOdds.map((odd) => {
                          const isBestHome =
                            bestOdds?.home?.sportsbookId === odd.sportsbook.id;
                          const isBestAway =
                            bestOdds?.away?.sportsbookId === odd.sportsbook.id;
                          const isBestDraw =
                            bestOdds?.draw?.sportsbookId === odd.sportsbook.id;

                          return (
                            <tr key={odd.sportsbook.id} className="hover:bg-muted/30">
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <img
                                    src={
                                      odd.sportsbook.logo ||
                                      SPORTSBOOK_LOGOS[
                                        odd.sportsbook.id as keyof typeof SPORTSBOOK_LOGOS
                                      ]
                                    }
                                    alt={odd.sportsbook.name}
                                    className="w-6 h-6 rounded-full object-cover"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).src = "/placeholder.svg";
                                    }}
                                  />
                                  <span className="font-medium">{odd.sportsbook.name}</span>
                                </div>
                              </td>
                              <td
                                className={cn(
                                  "px-4 py-3 text-center font-mono",
                                  isBestHome && "bg-green-100 dark:bg-green-900/30 font-bold text-green-600"
                                )}
                              >
                                {isBestHome && <Trophy className="h-3 w-3 inline mr-1 text-yellow-500" />}
                                {formatOdds(odd.homeWin)}
                              </td>
                              {match.odds?.draw !== undefined && (
                                <td
                                  className={cn(
                                    "px-4 py-3 text-center font-mono",
                                    isBestDraw && "bg-green-100 dark:bg-green-900/30 font-bold text-green-600"
                                  )}
                                >
                                  {isBestDraw && <Trophy className="h-3 w-3 inline mr-1 text-yellow-500" />}
                                  {formatOdds(odd.draw)}
                                </td>
                              )}
                              <td
                                className={cn(
                                  "px-4 py-3 text-center font-mono",
                                  isBestAway && "bg-green-100 dark:bg-green-900/30 font-bold text-green-600"
                                )}
                              >
                                {isBestAway && <Trophy className="h-3 w-3 inline mr-1 text-yellow-500" />}
                                {formatOdds(odd.awayWin)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-30" />
                  <p>No odds data available for this match</p>
                </div>
              )}
            </TabsContent>

            {/* Predictions Tab */}
            <TabsContent value="prediction" className="p-6 pt-4 m-0">
              {prediction ? (
                <div className="space-y-6">
                  {/* Main Recommendation */}
                  <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <Target className="h-5 w-5 text-primary" />
                        <h3 className="font-semibold">AI Recommendation</h3>
                      </div>
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Recommended Bet</p>
                          <Badge className="text-lg px-4 py-2" variant="default">
                            {prediction.recommended === "home"
                              ? match.homeTeam?.name
                              : prediction.recommended === "away"
                              ? match.awayTeam?.name
                              : "Draw"}
                          </Badge>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Confidence</p>
                          <div className="flex items-center gap-3">
                            <Progress value={prediction.confidence} className="flex-1" />
                            <span className="font-bold text-lg">{prediction.confidence}%</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Projected Score */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Projected Score</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-center gap-8">
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground mb-1">
                            {match.awayTeam?.shortName}
                          </p>
                          <p className="text-4xl font-bold">{prediction.projectedScore.away}</p>
                        </div>
                        <span className="text-2xl text-muted-foreground">-</span>
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground mb-1">
                            {match.homeTeam?.shortName}
                          </p>
                          <p className="text-4xl font-bold">{prediction.projectedScore.home}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Sharp Betting Metrics */}
                  {(prediction.evPercentage || prediction.kellyFraction) && (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-2">
                          <TrendingUp className="h-4 w-4" />
                          Sharp Betting Metrics
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {prediction.evPercentage !== undefined && (
                            <div className="p-3 bg-muted/50 rounded-lg">
                              <p className="text-xs text-muted-foreground">Expected Value</p>
                              <p
                                className={cn(
                                  "text-lg font-bold",
                                  prediction.evPercentage > 0 ? "text-green-500" : "text-red-500"
                                )}
                              >
                                {prediction.evPercentage > 0 ? "+" : ""}
                                {prediction.evPercentage.toFixed(1)}%
                              </p>
                            </div>
                          )}
                          {prediction.kellyFraction !== undefined && (
                            <div className="p-3 bg-muted/50 rounded-lg">
                              <p className="text-xs text-muted-foreground">Kelly Stake</p>
                              <p className="text-lg font-bold">
                                {(prediction.kellyFraction * 100).toFixed(1)}%
                              </p>
                            </div>
                          )}
                          {prediction.trueProbability !== undefined && (
                            <div className="p-3 bg-muted/50 rounded-lg">
                              <p className="text-xs text-muted-foreground">True Probability</p>
                              <p className="text-lg font-bold">
                                {(prediction.trueProbability * 100).toFixed(1)}%
                              </p>
                            </div>
                          )}
                          {prediction.clvPercentage !== undefined && (
                            <div className="p-3 bg-muted/50 rounded-lg">
                              <p className="text-xs text-muted-foreground">CLV</p>
                              <p
                                className={cn(
                                  "text-lg font-bold",
                                  prediction.clvPercentage > 0 ? "text-green-500" : "text-red-500"
                                )}
                              >
                                {prediction.clvPercentage > 0 ? "+" : ""}
                                {prediction.clvPercentage.toFixed(1)}%
                              </p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Target className="h-12 w-12 mx-auto mb-4 opacity-30" />
                  <p>No predictions available for this match</p>
                </div>
              )}
            </TabsContent>

            {/* Smart Score Tab */}
            <TabsContent value="smartscore" className="p-6 pt-4 m-0">
              {smartScore ? (
                <div className="space-y-6">
                  {/* Overall Score */}
                  <Card className="bg-gradient-to-br from-accent/20 to-accent/5">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Overall Smart Score</p>
                          <p className="text-5xl font-bold">{smartScore.overall}</p>
                        </div>
                        {smartScore.recommendation && (
                          <div className="text-right">
                            <Badge
                              variant={
                                smartScore.recommendation.confidence === "high"
                                  ? "default"
                                  : "secondary"
                              }
                              className="mb-2"
                            >
                              {smartScore.recommendation.confidence} confidence
                            </Badge>
                            <p className="text-sm">
                              Bet on:{" "}
                              <span className="font-semibold capitalize">
                                {smartScore.recommendation.betOn}
                              </span>
                            </p>
                          </div>
                        )}
                      </div>
                      {smartScore.recommendation?.reasoning && (
                        <p className="mt-4 text-sm text-muted-foreground">
                          {smartScore.recommendation.reasoning}
                        </p>
                      )}
                    </CardContent>
                  </Card>

                  {/* Component Breakdown */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Score Components</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {Object.entries(smartScore.components).map(([key, value]) => (
                          <div key={key}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm capitalize flex items-center gap-2">
                                {key === "momentum" && <Activity className="h-4 w-4" />}
                                {key === "value" && <DollarSign className="h-4 w-4" />}
                                {key === "oddsMovement" && <TrendingUp className="h-4 w-4" />}
                                {key === "weather" && <ThermometerSun className="h-4 w-4" />}
                                {key === "injuries" && <Users className="h-4 w-4" />}
                                {key === "arbitrage" && <Zap className="h-4 w-4" />}
                                {key.replace(/([A-Z])/g, " $1").trim()}
                              </span>
                              <span className="font-semibold">{value}</span>
                            </div>
                            <Progress
                              value={value}
                              className={cn(
                                value >= 70 && "[&>div]:bg-green-500",
                                value >= 40 && value < 70 && "[&>div]:bg-yellow-500",
                                value < 40 && "[&>div]:bg-red-500"
                              )}
                            />
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Arbitrage Alert */}
                  {smartScore.hasArbitrageOpportunity && (
                    <Card className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-700">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <AlertTriangle className="h-6 w-6 text-yellow-600" />
                          <div>
                            <p className="font-semibold text-yellow-800 dark:text-yellow-200">
                              Arbitrage Opportunity Detected
                            </p>
                            <p className="text-sm text-yellow-700 dark:text-yellow-300">
                              This match has odds discrepancies across sportsbooks that may allow
                              for risk-free profit.
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Zap className="h-12 w-12 mx-auto mb-4 opacity-30" />
                  <p>Smart Score analysis not available</p>
                </div>
              )}
            </TabsContent>

            {/* Injuries Tab */}
            <TabsContent value="injuries" className="p-6 pt-4 m-0">
              <div className="space-y-4">
                {/* Home Team Injuries */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      {match.homeTeam?.name || "Home"} Injuries
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-6 text-muted-foreground">
                      <p>No injury data available</p>
                      <p className="text-xs mt-1">Connect to premium data source for injury reports</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Away Team Injuries */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      {match.awayTeam?.name || "Away"} Injuries
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-6 text-muted-foreground">
                      <p>No injury data available</p>
                      <p className="text-xs mt-1">Connect to premium data source for injury reports</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Injury Impact on Smart Score */}
                {smartScore && (
                  <Card className="bg-muted/30">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Activity className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">Injury Impact Score</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Progress value={smartScore.components.injuries} className="w-24" />
                          <span className="font-semibold">{smartScore.components.injuries}/100</span>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        Higher score means less negative impact from injuries
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            {/* H2H Tab */}
            <TabsContent value="h2h" className="p-6 pt-4 m-0">
              {h2hLoading ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-24 bg-muted animate-pulse rounded-xl" />
                    ))}
                  </div>
                  <div className="h-12 bg-muted animate-pulse rounded-lg" />
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
                    ))}
                  </div>
                </div>
              ) : h2hData ? (
                <div className="space-y-6">
                  {/* Overall Record */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-primary/10 rounded-xl">
                      <TeamLogoImage
                        teamName={match.homeTeam?.name || "Home"}
                        logoUrl={match.homeTeam?.logo}
                        league={league}
                        size="md"
                        className="mx-auto mb-2"
                      />
                      <p className={cn(
                        "text-3xl font-bold",
                        h2hData.team1Wins > h2hData.team2Wins && "text-green-500"
                      )}>
                        {h2hData.team1Wins}
                      </p>
                      <p className="text-xs text-muted-foreground uppercase">Wins</p>
                    </div>
                    <div className="text-center p-4 bg-muted/50 rounded-xl">
                      <div className="h-12 w-12 mx-auto mb-2 rounded-full bg-muted flex items-center justify-center">
                        <span className="text-2xl font-bold text-muted-foreground">-</span>
                      </div>
                      <p className="text-3xl font-bold text-muted-foreground">{h2hData.ties}</p>
                      <p className="text-xs text-muted-foreground uppercase">Draws</p>
                    </div>
                    <div className="text-center p-4 bg-secondary/50 rounded-xl">
                      <TeamLogoImage
                        teamName={match.awayTeam?.name || "Away"}
                        logoUrl={match.awayTeam?.logo}
                        league={league}
                        size="md"
                        className="mx-auto mb-2"
                      />
                      <p className={cn(
                        "text-3xl font-bold",
                        h2hData.team2Wins > h2hData.team1Wins && "text-green-500"
                      )}>
                        {h2hData.team2Wins}
                      </p>
                      <p className="text-xs text-muted-foreground uppercase">Wins</p>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-3">
                    <Card className="p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Total Games</span>
                        <span className="font-bold">{h2hData.totalGames}</span>
                      </div>
                    </Card>
                    <Card className="p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Avg Score</span>
                        <span className="font-bold">
                          {h2hData.avgTeam1Score} - {h2hData.avgTeam2Score}
                        </span>
                      </div>
                    </Card>
                  </div>

                  {/* Streak */}
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

                  {/* Recent Matchups */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-muted-foreground">Recent Matchups</h4>
                    {h2hData.lastMeetings.slice(0, 3).map((m, idx) => (
                      <div key={m.id || idx} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(m.date), "MMM d, yyyy")}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{m.homeTeam.split(" ").pop()}</span>
                          <Badge variant="outline" className="font-mono">
                            {m.homeScore} - {m.awayScore}
                          </Badge>
                          <span className="font-medium">{m.awayTeam.split(" ").pop()}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <p className="text-xs text-center text-muted-foreground">
                    {h2hData.isLiveData ? "Data from ESPN" : "Simulated data"}
                  </p>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <History className="h-12 w-12 mx-auto mb-4 opacity-30" />
                  <p>No head-to-head data available</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </ScrollArea>

        {/* Footer Actions */}
        <div className="border-t border-border/50 p-4 flex items-center justify-between bg-muted/30">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="outline">
              <TrendingUp className="h-4 w-4 mr-2" />
              Track Bet
            </Button>
            <Button>
              <Zap className="h-4 w-4 mr-2" />
              Add to Bet Slip
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MatchDetailModal;
