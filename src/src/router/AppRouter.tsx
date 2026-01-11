import React, { lazy, Suspense } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import Layout from "@/components/layout/Layout";

// Lazy-loaded pages
const GamesPage = lazy(() => import("@/pages/GamesPage"));
const LiveGamesPage = lazy(() => import("@/pages/LiveGamesPage"));
const LeagueGamesPage = lazy(() => import("@/pages/LeagueGamesPage"));
const GameDetailPage = lazy(() => import("@/pages/GameDetailPage"));

// Loading fallback
const LoadingScreen = () => (
  <div className="py-10 text-center text-muted-foreground">Loading…</div>
);

const AppRouter = () => {
  const location = useLocation();

  return (
    <Layout>
      <Suspense fallback={<LoadingScreen />}>
        <Routes location={location}>
          <Route path="/" element={<GamesPage />} />
          <Route path="/live" element={<LiveGamesPage />} />
          <Route path="/league" element={<LeagueGamesPage />} />
          <Route path="/game/:id" element={<GameDetailPage />} />

          {/* 404 fallback */}
          <Route
            path="*"
            element={
              <div className="py-20 text-center">
                <h1 className="text-3xl font-bold">404</h1>
                <p className="text-muted-foreground">Page not found</p>
              </div>
            }
          />
        </Routes>
      </Suspense>
    </Layout>
  );
};

export default AppRouter;
