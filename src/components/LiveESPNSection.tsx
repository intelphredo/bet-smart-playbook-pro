import { League, Match } from "@/types";
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
import FinishedMatchInfo from "./FinishedMatchInfo";
import LiveESPNHeader from "./LiveESPNHeader";
import LoadingCardGrid from "./LoadingCardGrid";
import FutureMatchesTab from "./LiveESPNTabs/FutureMatchesTab";
import UpcomingMatchesTab from "./LiveESPNTabs/UpcomingMatchesTab";
import LiveMatchesTab from "./LiveESPNTabs/LiveMatchesTab";
import FinishedMatchesTab from "./LiveESPNTabs/FinishedMatchesTab";

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
      <LiveESPNHeader
        selectedLeague={selectedLeague}
        setSelectedLeague={setSelectedLeague}
        isLoading={isLoading}
        handleRefreshData={handleRefreshData}
      />

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
          <FutureMatchesTab isLoading={isLoading} upcomingMatches={processedMatches.upcoming} />
        </TabsContent>
        <TabsContent value="upcoming" className="mt-4">
          <UpcomingMatchesTab isLoading={isLoading} upcomingMatches={processedMatches.upcoming} />
        </TabsContent>
        <TabsContent value="live" className="mt-4">
          <LiveMatchesTab isLoading={isLoading} liveMatches={processedMatches.live} />
        </TabsContent>
        <TabsContent value="finished" className="mt-4">
          <FinishedMatchesTab isLoading={isLoading} finishedMatches={finishedMatches} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LiveESPNSection;
