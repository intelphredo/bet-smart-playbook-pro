// Command Center Home Page - 3-column dashboard showing everything at a glance
import { useState, useMemo, useCallback, useDeferredValue, startTransition, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Match } from "@/types/sports";
import NavBar from "@/components/NavBar";
import PageFooter from "@/components/PageFooter";
import { useSportsData } from "@/hooks/useSportsData";
import { useArbitrageCalculator } from "@/hooks/useArbitrageCalculator";
import { applySmartScores } from "@/utils/smartScoreCalculator";
import { useLockedPredictions } from "@/hooks/useLockedPredictions";
import { toast } from "sonner";
import { usePreferences } from "@/hooks/usePreferences";

// Layout
import { ScoreboardStrip } from "@/components/layout/ScoreboardStrip";
import TopLoader from "@/components/ui/TopLoader";
import { LiveScoresProvider } from "@/providers/LiveScoresProvider";

// Command Center Panels
import {
  CommandCenterTopBar,
  SharpMoneyPanel,
  TopValuePanel,
  AIPredictionsPanel,
  RecentGamesStrip,
} from "@/components/CommandCenter";

// Existing components still used
import { PredictionDisclaimer } from "@/components/legal";
import { useSmartNotifications } from "@/hooks/useSmartNotifications";
import { useHighValueAlerts } from "@/hooks/useHighValueAlerts";
import { GroupedLeagueSelect, LEAGUE_CATEGORIES } from "@/components/filters/GroupedLeagueSelect";

const ALL_LEAGUES = Object.values(LEAGUE_CATEGORIES).flatMap(cat => cat.leagues);

const Index = () => {
  const navigate = useNavigate();
  const [selectedLeague, setSelectedLeague] = useState<string>("ALL");
  const { preferences } = usePreferences();

  const handleLeagueChange = useCallback((league: string) => {
    startTransition(() => {
      setSelectedLeague(league);
    });
  }, []);

  const {
    upcomingMatches: rawUpcoming,
    liveMatches: rawLive,
    finishedMatches: rawFinished,
    isLoading,
    isFetching,
    refetchWithTimestamp,
    hasLiveGames,
    lastRefresh: dataLastRefresh,
    secondsUntilRefresh,
    activeInterval,
  } = useSportsData({
    league: selectedLeague as any,
    refreshInterval: 30000, // 30 second auto-refresh
    useExternalApis: true,
  });

  // Hydrate locked predictions
  const allMatchIds = useMemo(() => [...rawUpcoming, ...rawLive].map(m => m.id), [rawUpcoming, rawLive]);
  useLockedPredictions(allMatchIds.length > 0 ? allMatchIds : undefined);

  // Apply smart scores
  const upcomingMatches = useMemo(() => applySmartScores(rawUpcoming), [rawUpcoming]);
  const liveMatches = useMemo(() => applySmartScores(rawLive), [rawLive]);
  const finishedMatches = useMemo(() => rawFinished, [rawFinished]);

  // Filter by league
  const filterByLeague = useCallback((matches: Match[]) => {
    if (selectedLeague === "ALL") return matches;
    return matches.filter(m => m.league?.toUpperCase() === selectedLeague);
  }, [selectedLeague]);

  const filteredUpcoming = useMemo(() => filterByLeague(upcomingMatches), [upcomingMatches, filterByLeague]);
  const filteredLive = useMemo(() => filterByLeague(liveMatches), [liveMatches, filterByLeague]);
  const filteredFinished = useMemo(() => filterByLeague(finishedMatches), [finishedMatches, filterByLeague]);

  // Active matches (upcoming + live)
  const allActiveMatches = useMemo(() => [...filteredUpcoming, ...filteredLive], [filteredUpcoming, filteredLive]);

  // Arbitrage for sharp signal count
  const allMatchesWithOdds = useMemo(() =>
    allActiveMatches.filter(m => m.liveOdds && Array.isArray(m.liveOdds) && m.liveOdds.length >= 2),
    [allActiveMatches]
  );
  const { opportunities } = useArbitrageCalculator(allMatchesWithOdds);

  // High-value alerts
  useHighValueAlerts({
    matches: allActiveMatches,
    confidenceThreshold: 75,
    smartScoreThreshold: 70,
    evThreshold: 5,
    enabled: true,
  });

  // Smart notifications
  useSmartNotifications({
    matches: allActiveMatches,
    enabled: true,
    valueThreshold: 5,
    confidenceThreshold: 70,
    maxAlertsPerDay: 2,
    enableInjuryMonitoring: true,
  });

  // Computed stats
  const hotPicksCount = useMemo(() =>
    allActiveMatches.filter(m => (m.prediction?.confidence || 0) >= 75).length,
    [allActiveMatches]
  );

  const sharpSignals = useMemo(() =>
    allActiveMatches.filter(m => m.smartScore && m.smartScore.overall >= 70).length,
    [allActiveMatches]
  );

  // All matches for live scores provider
  const allMatchesForLiveScores = useMemo(() =>
    [...filteredLive, ...filteredUpcoming, ...filteredFinished.slice(0, 20)],
    [filteredLive, filteredUpcoming, filteredFinished]
  );

  // Scores ticker
  const allScores = useMemo(() =>
    [...filteredLive, ...filteredFinished.slice(0, 10), ...filteredUpcoming.slice(0, 10)],
    [filteredLive, filteredFinished, filteredUpcoming]
  );

  const matchesWithBets = useMemo<string[]>(() => [], []);

  const handleRefresh = useCallback(() => {
    refetchWithTimestamp();
    toast("Data refreshed", { description: "Latest sports data loaded" });
  }, [refetchWithTimestamp]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <TopLoader isLoading={isLoading} />
      <NavBar />

      <LiveScoresProvider
        matches={allMatchesForLiveScores}
        matchesWithBets={matchesWithBets}
        enabled={true}
        onScoreChange={(matchId, score) => {
          console.log(`[LiveScores] Score update for ${matchId}:`, score);
        }}
      >
        {/* Scores Ticker */}
        <ScoreboardStrip matches={allScores.slice(0, 20)} />

        {/* Command Center Top Bar */}
        <CommandCenterTopBar
          liveCount={filteredLive.length}
          upcomingCount={filteredUpcoming.length}
          hotPicksCount={hotPicksCount}
          sharpSignals={sharpSignals}
          selectedLeague={selectedLeague}
          onLeagueChange={handleLeagueChange}
          hasLiveGames={hasLiveGames}
          secondsUntilRefresh={secondsUntilRefresh}
          isFetching={isFetching}
          lastRefresh={dataLastRefresh}
          activeInterval={activeInterval}
          onRefresh={handleRefresh}
          isLoading={isLoading}
          totalGames={(rawUpcoming?.length ?? 0) + (rawLive?.length ?? 0)}
        />

        {/* Main Content - 3 Column Command Center */}
        <main className="flex-1">
          <div className="container px-4 py-6">
            {/* Prediction Disclaimer */}
            <PredictionDisclaimer className="mb-4" />

            {/* 3-Column Grid - stacks on mobile */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
              {/* LEFT: Sharp Money Highlights */}
              <SharpMoneyPanel
                matches={allActiveMatches}
                league={selectedLeague}
              />

              {/* CENTER: Top Rated Value */}
              <TopValuePanel
                matches={filteredUpcoming}
              />

              {/* RIGHT: AI Picks & Learning */}
              <AIPredictionsPanel
                matches={allActiveMatches}
              />
            </div>

            {/* BOTTOM: Recent Games + Live Scores */}
            <RecentGamesStrip
              liveMatches={filteredLive}
              finishedMatches={filteredFinished}
              upcomingMatches={filteredUpcoming}
            />
          </div>
        </main>
      </LiveScoresProvider>

      <PageFooter />
    </div>
  );
};

export default Index;
