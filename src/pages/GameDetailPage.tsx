import React, { useMemo, lazy, Suspense } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSportsData } from "@/hooks/useSportsData";
import { applySmartScores } from "@/utils/smartScoreCalculator";
import { Match, League } from "@/types/sports";
import NavBar from "@/components/NavBar";
import AppBreadcrumb from "@/components/layout/AppBreadcrumb";
import HeadToHeadHistory from "@/components/match/HeadToHeadHistory";
import TeamNewsInjuries from "@/components/match/TeamNewsInjuries";
import { SharpMoneyAlertBanner } from "@/components/BettingTrends";
import { useMatchBettingTrend } from "@/hooks/useBettingTrends";
import { useCrossSectionData } from "@/hooks/useCrossSectionData";
import { CrossSectionPanel } from "@/components/CrossSection";
import { useAlgorithmComparison } from "@/hooks/usePredictions";
import { useLocalEnsemble, useFullEnsemble } from "@/hooks/useEnsemblePrediction";
import { MatchData } from "@/domain/prediction/interfaces";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ArrowLeft } from "lucide-react";
import { useLockedPredictions } from "@/hooks/useLockedPredictions";
import { motion } from "framer-motion";

// New section components
import {
  GameHeader,
  TeamSnapshots,
  AIPredictionDashboard,
  EnsembleSummary,
  OddsValueSection,
  BettingTrendsSection,
  PlaceBetCard,
} from "@/components/GameDetail";

// Lazy-load heavy analytics
const DebateAnalysisCard = lazy(() => import("@/components/DebateAnalysisCard"));
const MonteCarloCard = lazy(() => import("@/components/MonteCarloCard"));
const MLBWorldModelCard = lazy(() => import("@/components/MLBWorldModelCard"));

import { useDebateAnalysis } from "@/hooks/useDebateAnalysis";
import { useMonteCarloUncertainty } from "@/hooks/useMonteCarloUncertainty";
import { getMCConfigForLeague } from "@/domain/prediction/monteCarloEngine";

const GameDetailPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { upcomingMatches, liveMatches, finishedMatches, isLoading } = useSportsData({
    refreshInterval: 30000,
    useExternalApis: true,
  });

  useLockedPredictions(id ? [id] : undefined);

  const allMatches = useMemo(() => {
    const combined = [...upcomingMatches, ...liveMatches, ...finishedMatches];
    return applySmartScores(combined);
  }, [upcomingMatches, liveMatches, finishedMatches]);

  const match = useMemo(() => allMatches.find((m) => m.id === id), [allMatches, id]);

  const { data: bettingTrend, isLoading: trendLoading } = useMatchBettingTrend(
    id || "",
    match?.homeTeam?.name || "",
    match?.awayTeam?.name || "",
    (match?.league as League) || "NBA",
    !!match
  );

  const crossSectionData = useCrossSectionData(match || null);

  const matchData: MatchData | null = useMemo(() => {
    if (!match) return null;
    return {
      id: match.id,
      homeTeam: {
        id: match.homeTeam?.id || "home",
        name: match.homeTeam?.name || "Home",
        shortName: match.homeTeam?.shortName || "HME",
        record: match.homeTeam?.record,
        recentForm: match.homeTeam?.recentForm,
        logo: match.homeTeam?.logo,
      },
      awayTeam: {
        id: match.awayTeam?.id || "away",
        name: match.awayTeam?.name || "Away",
        shortName: match.awayTeam?.shortName || "AWY",
        record: match.awayTeam?.record,
        recentForm: match.awayTeam?.recentForm,
        logo: match.awayTeam?.logo,
      },
      league: (match.league as League) || "NBA",
      startTime: match.startTime,
      status: match.status || "scheduled",
      odds: match.odds,
    };
  }, [match]);

  const { predictions: algPredictions, consensus, isLoading: consensusLoading } = useAlgorithmComparison({ match: match || null, enabled: !!match });
  const localEnsemble = useLocalEnsemble(consensus, matchData);
  const { data: fullEnsemble, isLoading: metaLoading } = useFullEnsemble(consensus, matchData, !!consensus && !!matchData);

  const predictionsArray = useMemo(() => Array.from(algPredictions.values()), [algPredictions]);
  const debateWeights = useMemo(() => consensus?.weights ?? [], [consensus]);
  const { debate, isLoading: debateLoading, error: debateError } = useDebateAnalysis({
    match: match || null,
    predictions: predictionsArray,
    weights: debateWeights,
    enabled: !!match && predictionsArray.length > 0,
  });

  const mcConfig = getMCConfigForLeague(match?.league);
  const mcResult = useMonteCarloUncertainty(localEnsemble, mcConfig);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <NavBar />
        <div className="container max-w-4xl mx-auto py-6 px-4">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3" />
            <div className="h-48 bg-muted rounded" />
            <div className="h-32 bg-muted rounded" />
          </div>
        </div>
      </div>
    );
  }

  // Not found
  if (!match) {
    return (
      <div className="min-h-screen bg-background">
        <NavBar />
        <div className="container max-w-4xl mx-auto py-6 px-4">
          <AppBreadcrumb />
          <Card className="mt-6">
            <CardContent className="py-12 text-center">
              <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-xl font-semibold mb-2">Game Not Found</h2>
              <p className="text-muted-foreground mb-4">
                The game you're looking for doesn't exist or has been removed.
              </p>
              <Button onClick={() => navigate("/")}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const league = match.league as League;
  const isFinished = match.status === "finished";

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      <NavBar />
      <div className="container max-w-4xl mx-auto py-6 px-4 space-y-6">
        <AppBreadcrumb />

        {/* SECTION 1: Game Header */}
        <GameHeader match={match} league={league} />

        {/* SECTION 2: Team Snapshots */}
        <TeamSnapshots match={match} league={league} />

        {/* SECTION 3: AI Prediction Dashboard */}
        <AIPredictionDashboard match={match} league={league} />

        {/* SECTION 4: Ensemble Analysis (simplified) */}
        {localEnsemble && (
          <EnsembleSummary
            ensemble={localEnsemble}
            metaSynthesis={fullEnsemble?.metaSynthesis}
            isLoadingMeta={metaLoading}
            homeTeamName={match.homeTeam?.name || "Home"}
            awayTeamName={match.awayTeam?.name || "Away"}
          />
        )}

        {/* Place Bet Card */}
        <PlaceBetCard match={match} league={league} />

        {/* SECTION 5: Head-to-Head History */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <HeadToHeadHistory
            homeTeamId={match.homeTeam?.id || "home"}
            homeTeamName={match.homeTeam?.name || "Home Team"}
            homeTeamShortName={match.homeTeam?.shortName}
            homeTeamLogo={match.homeTeam?.logo}
            awayTeamId={match.awayTeam?.id || "away"}
            awayTeamName={match.awayTeam?.name || "Away Team"}
            awayTeamShortName={match.awayTeam?.shortName}
            awayTeamLogo={match.awayTeam?.logo}
            league={league}
          />
        </motion.div>

        {/* SECTION 6: Odds & Value */}
        <OddsValueSection
          match={match}
          league={league}
          bettingTrend={bettingTrend}
        />

        {/* SECTION 7: Betting Trends */}
        <BettingTrendsSection
          bettingTrend={bettingTrend}
          isLoading={trendLoading}
          match={match}
        />

        {/* Sharp Money Alert Banner */}
        {!isFinished && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <SharpMoneyAlertBanner trend={bettingTrend} isLoading={trendLoading} />
          </motion.div>
        )}

        {/* Cross-Section Intelligence */}
        {!isFinished && crossSectionData.hasData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.32 }}
          >
            <CrossSectionPanel match={match} crossSectionData={crossSectionData} />
          </motion.div>
        )}

        {/* AI Debate Analysis */}
        {(debate || debateLoading) && (
          <Suspense fallback={<Skeleton className="h-48 w-full rounded-lg" />}>
            <DebateAnalysisCard
              debate={debate}
              isLoading={debateLoading}
              error={debateError}
              homeTeam={match.homeTeam?.name || "Home"}
              awayTeam={match.awayTeam?.name || "Away"}
            />
          </Suspense>
        )}

        {/* Monte Carlo Uncertainty */}
        {mcResult && (
          <Suspense fallback={<Skeleton className="h-48 w-full rounded-lg" />}>
            <MonteCarloCard
              mc={mcResult}
              homeTeam={match.homeTeam?.name || "Home"}
              awayTeam={match.awayTeam?.name || "Away"}
            />
          </Suspense>
        )}

        {/* MLB World Model */}
        {league === "MLB" && (
          <Suspense fallback={<Skeleton className="h-48 w-full rounded-lg" />}>
            <MLBWorldModelCard />
          </Suspense>
        )}

        {/* Team News & Injuries */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <TeamNewsInjuries
            homeTeamName={match.homeTeam?.name || "Home Team"}
            awayTeamName={match.awayTeam?.name || "Away Team"}
            league={league}
          />
        </motion.div>
      </div>
    </div>
  );
};

export default GameDetailPage;
