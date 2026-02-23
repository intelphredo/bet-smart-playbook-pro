import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { lazy, Suspense } from "react";
import PageTransition from "./PageTransition";
import { RouteLoadingSkeleton } from "@/components/ui/route-loading-skeleton";

// Critical path - loaded eagerly
import Index from "@/pages/Index";

// Lazy-loaded routes (code-split per page)
const GameDetailPage = lazy(() => import("@/pages/GameDetailPage"));
const LiveGamesPage = lazy(() => import("@/pages/LiveGamesPage"));
const GamesPage = lazy(() => import("@/pages/GamesPage"));
const Standings = lazy(() => import("@/pages/Standings"));
const Injuries = lazy(() => import("@/pages/Injuries"));
const BettingTrends = lazy(() => import("@/pages/BettingTrends"));
const ROITracker = lazy(() => import("@/pages/ROITracker"));
const AIPredictions = lazy(() => import("@/pages/AIPredictions"));
const RecentResultsPage = lazy(() => import("@/pages/RecentResultsPage"));
const AlgorithmsComparison = lazy(() => import("@/pages/AlgorithmsComparison"));
const CompareAlgorithms = lazy(() => import("@/pages/CompareAlgorithms"));
const BacktestSimulator = lazy(() => import("@/pages/BacktestSimulator"));
const CreatorDashboard = lazy(() => import("@/pages/CreatorDashboard"));
const ScenarioGuide = lazy(() => import("@/pages/ScenarioGuide"));
const BankrollManager = lazy(() => import("@/pages/BankrollManager"));
const BetHistory = lazy(() => import("@/pages/BetHistory"));
const SavingsPage = lazy(() => import("@/pages/SavingsPage"));
const LearningCenter = lazy(() => import("@/pages/LearningCenter"));
const Settings = lazy(() => import("@/pages/Settings"));
const Billing = lazy(() => import("@/pages/settings/Billing"));
const Auth = lazy(() => import("@/pages/Auth"));
const Profile = lazy(() => import("@/pages/Profile"));
const NotFound = lazy(() => import("@/pages/NotFound"));
const TermsOfService = lazy(() => import("@/pages/legal/TermsOfService"));
const PrivacyPolicy = lazy(() => import("@/pages/legal/PrivacyPolicy"));
const ResponsibleGambling = lazy(() => import("@/pages/legal/ResponsibleGambling"));
const Rewards = lazy(() => import("@/pages/Rewards"));

function LazyPage({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<RouteLoadingSkeleton />}>
      <PageTransition>{children}</PageTransition>
    </Suspense>
  );
}

const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={location.pathname}>
        {/* Home - eagerly loaded for fastest FCP */}
        <Route
          path="/"
          element={
            <PageTransition>
              <Index />
            </PageTransition>
          }
        />

        {/* All other routes lazy-loaded */}
        <Route path="/game/:id" element={<LazyPage><GameDetailPage /></LazyPage>} />
        <Route path="/live" element={<LazyPage><LiveGamesPage /></LazyPage>} />
        <Route path="/games" element={<LazyPage><GamesPage /></LazyPage>} />
        <Route path="/standings" element={<LazyPage><Standings /></LazyPage>} />
        <Route path="/injuries" element={<LazyPage><Injuries /></LazyPage>} />
        <Route path="/betting-trends" element={<LazyPage><BettingTrends /></LazyPage>} />
        <Route path="/roi" element={<LazyPage><ROITracker /></LazyPage>} />
        <Route path="/ai-predictions" element={<LazyPage><AIPredictions /></LazyPage>} />
        <Route path="/recent-results" element={<LazyPage><RecentResultsPage /></LazyPage>} />
        <Route path="/algorithms" element={<LazyPage><AlgorithmsComparison /></LazyPage>} />
        <Route path="/compare-algorithms" element={<LazyPage><CompareAlgorithms /></LazyPage>} />
        <Route path="/backtest" element={<LazyPage><BacktestSimulator /></LazyPage>} />
        <Route path="/creator" element={<LazyPage><CreatorDashboard /></LazyPage>} />
        <Route path="/scenarios" element={<LazyPage><ScenarioGuide /></LazyPage>} />
        <Route path="/bankroll" element={<LazyPage><BankrollManager /></LazyPage>} />
        <Route path="/bet-history" element={<LazyPage><BetHistory /></LazyPage>} />
        <Route path="/savings" element={<LazyPage><SavingsPage /></LazyPage>} />
        <Route path="/learning" element={<LazyPage><LearningCenter /></LazyPage>} />
        <Route path="/settings" element={<LazyPage><Settings /></LazyPage>} />
        <Route path="/settings/billing" element={<LazyPage><Billing /></LazyPage>} />
        <Route path="/profile" element={<LazyPage><Profile /></LazyPage>} />
        <Route path="/auth" element={<LazyPage><Auth /></LazyPage>} />
        <Route path="/terms" element={<LazyPage><TermsOfService /></LazyPage>} />
        <Route path="/privacy" element={<LazyPage><PrivacyPolicy /></LazyPage>} />
        <Route path="/responsible-gambling" element={<LazyPage><ResponsibleGambling /></LazyPage>} />
        <Route path="/rewards" element={<LazyPage><Rewards /></LazyPage>} />

        {/* Legacy / invalid paths */}
        <Route path="/betslip" element={<Navigate to="/" replace />} />

        {/* Catch-all */}
        <Route path="*" element={<LazyPage><NotFound /></LazyPage>} />
      </Routes>
    </AnimatePresence>
  );
};

export default AnimatedRoutes;
