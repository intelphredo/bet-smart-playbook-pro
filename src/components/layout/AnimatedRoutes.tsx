import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import PageTransition from "./PageTransition";

// Page imports
import Index from "@/pages/Index";
import GameDetailPage from "@/pages/GameDetailPage";
import LiveGamesPage from "@/pages/LiveGamesPage";
import GamesPage from "@/pages/GamesPage";
import Standings from "@/pages/Standings";
import Injuries from "@/pages/Injuries";
import BettingTrends from "@/pages/BettingTrends";
import ROITracker from "@/pages/ROITracker";
import AIPredictions from "@/pages/AIPredictions";
import RecentResultsPage from "@/pages/RecentResultsPage";
import AlgorithmsComparison from "@/pages/AlgorithmsComparison";
import CompareAlgorithms from "@/pages/CompareAlgorithms";
import BacktestSimulator from "@/pages/BacktestSimulator";
import CreatorDashboard from "@/pages/CreatorDashboard";
import ScenarioGuide from "@/pages/ScenarioGuide";
import BankrollManager from "@/pages/BankrollManager";
import BetHistory from "@/pages/BetHistory";
import Settings from "@/pages/Settings";
import Billing from "@/pages/settings/Billing";
import Auth from "@/pages/Auth";

// Legal pages
import TermsOfService from "@/pages/legal/TermsOfService";
import PrivacyPolicy from "@/pages/legal/PrivacyPolicy";
import ResponsibleGambling from "@/pages/legal/ResponsibleGambling";

const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={location.pathname}>
        <Route
          path="/"
          element={
            <PageTransition>
              <Index />
            </PageTransition>
          }
        />
        <Route
          path="/game/:id"
          element={
            <PageTransition>
              <GameDetailPage />
            </PageTransition>
          }
        />
        <Route
          path="/live"
          element={
            <PageTransition>
              <LiveGamesPage />
            </PageTransition>
          }
        />
        <Route
          path="/games"
          element={
            <PageTransition>
              <GamesPage />
            </PageTransition>
          }
        />
        <Route
          path="/standings"
          element={
            <PageTransition>
              <Standings />
            </PageTransition>
          }
        />
        <Route
          path="/injuries"
          element={
            <PageTransition>
              <Injuries />
            </PageTransition>
          }
        />
        <Route
          path="/betting-trends"
          element={
            <PageTransition>
              <BettingTrends />
            </PageTransition>
          }
        />
        <Route
          path="/roi"
          element={
            <PageTransition>
              <ROITracker />
            </PageTransition>
          }
        />
        <Route
          path="/ai-predictions"
          element={
            <PageTransition>
              <AIPredictions />
            </PageTransition>
          }
        />
        <Route
          path="/recent-results"
          element={
            <PageTransition>
              <RecentResultsPage />
            </PageTransition>
          }
        />
        <Route
          path="/algorithms"
          element={
            <PageTransition>
              <AlgorithmsComparison />
            </PageTransition>
          }
        />
        <Route
          path="/compare-algorithms"
          element={
            <PageTransition>
              <CompareAlgorithms />
            </PageTransition>
          }
        />
        <Route
          path="/backtest"
          element={
            <PageTransition>
              <BacktestSimulator />
            </PageTransition>
          }
        />
        <Route
          path="/creator"
          element={
            <PageTransition>
              <CreatorDashboard />
            </PageTransition>
          }
        />
        <Route
          path="/scenarios"
          element={
            <PageTransition>
              <ScenarioGuide />
            </PageTransition>
          }
        />
        <Route
          path="/bankroll"
          element={
            <PageTransition>
              <BankrollManager />
            </PageTransition>
          }
        />
        <Route
          path="/bet-history"
          element={
            <PageTransition>
              <BetHistory />
            </PageTransition>
          }
        />
        <Route
          path="/settings"
          element={
            <PageTransition>
              <Settings />
            </PageTransition>
          }
        />
        <Route
          path="/settings/billing"
          element={
            <PageTransition>
              <Billing />
            </PageTransition>
          }
        />
        <Route
          path="/auth"
          element={
            <PageTransition>
              <Auth />
            </PageTransition>
          }
        />
        <Route
          path="/terms"
          element={
            <PageTransition>
              <TermsOfService />
            </PageTransition>
          }
        />
        <Route
          path="/privacy"
          element={
            <PageTransition>
              <PrivacyPolicy />
            </PageTransition>
          }
        />
        <Route
          path="/responsible-gambling"
          element={
            <PageTransition>
              <ResponsibleGambling />
            </PageTransition>
          }
        />
      </Routes>
    </AnimatePresence>
  );
};

export default AnimatedRoutes;
