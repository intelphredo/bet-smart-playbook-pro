import { League, Match } from "@/types/sports";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LeagueSelector from "@/components/LeagueSelector";
import MatchCard from "@/components/MatchCard";
import { Check, X } from "lucide-react";
import ConfidentPicks from "@/components/ConfidentPicks";
import { useState, useEffect } from "react";
import SmartScoreSection from "./SmartScoreSection";
import { applySmartScores } from "@/utils/smartScoreCalculator";

interface Props {
  selectedLeague: League | "ALL";
  setSelectedLeague: (v: League | "ALL") => void;
  activeTab: string;
  setActiveTab: (v: string) => void;
  isLoading: boolean;
  error: any;
  handleRefreshData: () => void;
  upcomingMatches: Match[];
  liveMatches: Match[];
  finishedMatches: Match[];
}

const isPredictionCorrect = (match: any) => {
  if (!match.prediction || !match.score) return null;
  const { recommended } = match.prediction;
  if (recommended === "home" && match.score.home > match.score.away) return true;
  if (recommended === "away" && match.score.away > match.score.home) return true;
  if (recommended === "draw" && match.score.home === match.score.away) return true;
  return false;
};

function getPersonalizedOutcomeReasoning(match: any, isCorrect: boolean | null): string {
  if (isCorrect === null) {
    return "No prediction or score available to analyze outcome.";
  }

  const { prediction, smartScore, score } = match;
  const team = prediction?.recommended === "home" ? match.homeTeam.shortName
    : prediction?.recommended === "away" ? match.awayTeam.shortName
    : prediction?.recommended === "draw" ? "Draw"
    : "";

  const pointsDiff = score
    ? Math.abs(score.home - score.away)
    : null;

  const confidence = prediction?.confidence;
  const smartScoreOverall = smartScore?.overall;

  if (isCorrect) {
    let base = `The model correctly identified ${team} as the likely result`;
    if (confidence) {
      base += ` with a confidence of ${confidence}%.`;
    } else {
      base += ".";
    }
    if (smartScoreOverall && smartScoreOverall >= 70) {
      base += ` This pick was also supported by a high SmartScore™ (${smartScoreOverall}), indicating robust statistical alignment.`;
    }
    if (typeof pointsDiff === "number") {
      if (pointsDiff === 0 && prediction?.recommended === "draw") {
        base += " The prediction anticipated a very close match ending in a draw, which was correct.";
      } else if (pointsDiff >= 10) {
        base += ` The victory margin (${pointsDiff}) suggests the model capitalized on clear differences between the teams.`;
      } else if (pointsDiff > 0) {
        base += ` The narrow margin (${pointsDiff}) reflects the model's recognition of a tight matchup.`;
      }
    }
    if (smartScore?.recommendation?.reasoning) {
      base += ` Key factor: ${smartScore.recommendation.reasoning}`;
    }
    return base.trim();
  } else {
    let base = `The prediction (${team}`;
    if (confidence) base += `, ${confidence}% confidence`;
    base += ") did not match the actual result.";
    if (smartScoreOverall) {
      base += ` The SmartScore™ for this prediction was ${smartScoreOverall}.`;
    }
    if (typeof pointsDiff === "number") {
      if (pointsDiff >= 10) {
        base += " The large margin suggests there were influential factors (like injuries or unexpected events) not captured by the model.";
      } else if (pointsDiff > 0) {
        base += " The close score means the game could have gone either way, but a few key plays swung it.";
      }
    }
    if (smartScore?.recommendation?.reasoning) {
      base += ` Model rationale: ${smartScore.recommendation.reasoning}`;
    }
    base += " Future predictions may benefit from additional live or contextual data.";
    return base.trim();
  }
}

const LiveESPNSection = ({
  selectedLeague,
  setSelectedLeague,
  activeTab,
  setActiveTab,
  isLoading,
  error,
  handleRefreshData,
  upcomingMatches,
  liveMatches,
  finishedMatches,
}: Props) => {
  const [processedMatches, setProcessedMatches] = useState({
    upcoming: [] as Match[],
    live: [] as Match[],
    finished: [] as Match[],
  });

  useEffect(() => {
    setProcessedMatches({
      upcoming: applySmartScores(upcomingMatches),
      live: applySmartScores(liveMatches),
      finished: finishedMatches,
    });
  }, [upcomingMatches, liveMatches, finishedMatches]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-bold">Live ESPN Data</h2>
          <Button
            size="sm"
            variant="outline"
            onClick={handleRefreshData}
            disabled={isLoading}
          >
            {isLoading ? "Refreshing..." : "Refresh Data"}
          </Button>
          <Badge variant="outline" className="bg-navy-50 dark:bg-navy-700">
            Auto-updates every 60s
          </Badge>
        </div>
        <LeagueSelector
          selectedLeague={selectedLeague}
          onSelectLeague={setSelectedLeague}
        />
      </div>

      {error && (
        <Card className="border-red-300 bg-red-50 dark:bg-red-900/20">
          <CardContent className="p-4">
            <p className="text-red-600 dark:text-red-400">
              Error loading ESPN data. Please try refreshing.
            </p>
          </CardContent>
        </Card>
      )}

      {(processedMatches.upcoming.length > 0 || processedMatches.live.length > 0) && (
        <SmartScoreSection 
          matches={[...processedMatches.live, ...processedMatches.upcoming]} 
        />
      )}

      <Tabs defaultValue="future" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="future">Future Games</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="live">Live</TabsTrigger>
          <TabsTrigger value="finished">Finished</TabsTrigger>
        </TabsList>
        <TabsContent value="future" className="mt-4">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <Card key={i}>
                  <CardContent className="p-12 flex justify-center items-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy-500" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : processedMatches.upcoming.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {processedMatches.upcoming.map(match => (
                <MatchCard key={match.id} match={match} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6 text-center">
                <p>No future games for this league.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="upcoming" className="mt-4">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <Card key={i}>
                  <CardContent className="p-12 flex justify-center items-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy-500" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : processedMatches.upcoming.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {processedMatches.upcoming.map(match => (
                <MatchCard key={match.id} match={match} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6 text-center">
                <p>No upcoming matches for this league.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="live" className="mt-4">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <Card key={i}>
                  <CardContent className="p-12 flex justify-center items-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy-500" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : processedMatches.live.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {processedMatches.live.map(match => (
                <MatchCard key={match.id} match={match} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6 text-center">
                <p>No live matches currently for this league.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="finished" className="mt-4">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <Card key={i}>
                  <CardContent className="p-12 flex justify-center items-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy-500" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : finishedMatches.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {finishedMatches.map(match => (
                <Card key={match.id} className="overflow-hidden">
                  <CardHeader className="p-3 bg-navy-50 dark:bg-navy-700 flex flex-row justify-between items-center space-y-0">
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="text-xs font-normal bg-white dark:bg-navy-600">{match.league}</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Finished
                    </div>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="grid grid-cols-3 gap-2 items-center mb-2">
                      <div className="text-center">
                        <div className="w-10 h-10 bg-navy-50 dark:bg-navy-700 rounded-full mx-auto mb-1 flex items-center justify-center">
                          {match.homeTeam.logo ? (
                            <img
                              src={match.homeTeam.logo}
                              alt={match.homeTeam.name}
                              className="w-8 h-8 object-contain rounded-full"
                            />
                          ) : (
                            match.homeTeam.shortName.substring(0, 2)
                          )}
                        </div>
                        <div className="text-sm font-medium truncate">{match.homeTeam.shortName}</div>
                        <div className="text-xs text-muted-foreground">{match.homeTeam.record}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl font-bold">
                          {match.score?.home} - {match.score?.away}
                          <div className="text-xs text-muted-foreground mt-1">{match.score?.period}</div>
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="w-10 h-10 bg-navy-50 dark:bg-navy-700 rounded-full mx-auto mb-1 flex items-center justify-center">
                          {match.awayTeam.logo ? (
                            <img
                              src={match.awayTeam.logo}
                              alt={match.awayTeam.name}
                              className="w-8 h-8 object-contain rounded-full"
                            />
                          ) : (
                            match.awayTeam.shortName.substring(0, 2)
                          )}
                        </div>
                        <div className="text-sm font-medium truncate">{match.awayTeam.shortName}</div>
                        <div className="text-xs text-muted-foreground">{match.awayTeam.record}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      {isPredictionCorrect(match) === true && (
                        <Badge className="bg-green-500 text-white flex items-center gap-1">
                          <Check className="w-4 h-4" /> Correct Pick
                        </Badge>
                      )}
                      {isPredictionCorrect(match) === false && (
                        <Badge className="bg-red-500 text-white flex items-center gap-1">
                          <X className="w-4 h-4" /> Incorrect Pick
                        </Badge>
                      )}
                      {isPredictionCorrect(match) === null && (
                        <Badge className="bg-gray-200 text-gray-600">N/A</Badge>
                      )}
                      <span className="text-xs text-muted-foreground">
                        Algo pick:
                        <span className="font-bold ml-1 uppercase">
                          {match.prediction?.recommended === "home"
                            ? match.homeTeam.shortName
                            : match.prediction?.recommended === "away"
                            ? match.awayTeam.shortName
                            : "Draw"}
                        </span>
                      </span>
                      <span className="text-xs text-muted-foreground ml-2">{match.prediction?.confidence}%</span>
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground italic pl-1 space-y-1">
                      {match.smartScore?.recommendation?.reasoning ? (
                        <div>
                          <span className="font-semibold text-navy-600 dark:text-navy-200">
                            Reason:{" "}
                          </span>
                          {match.smartScore.recommendation.reasoning}
                        </div>
                      ) : match.prediction?.recommended ? (
                        <div>
                          <span className="font-semibold text-navy-600 dark:text-navy-200">
                            Reason:{" "}
                          </span>
                          Prediction based on statistical edge from available match data.
                        </div>
                      ) : null}
                      {(() => {
                        const outcome = isPredictionCorrect(match);
                        if (outcome === true) {
                          return (
                            <div>
                              <span className="font-semibold text-green-700 dark:text-green-400">
                                Why Correct?{" "}
                              </span>
                              {getPersonalizedOutcomeReasoning(match, true)}
                            </div>
                          );
                        }
                        if (outcome === false) {
                          return (
                            <div>
                              <span className="font-semibold text-red-700 dark:text-red-400">
                                Why Incorrect?{" "}
                              </span>
                              {getPersonalizedOutcomeReasoning(match, false)}
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6 text-center">
                <p>No finished matches for this league.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LiveESPNSection;
