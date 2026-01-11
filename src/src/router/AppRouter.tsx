import React, { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "@/components/layout/Layout";

const GamesPage = lazy(() => import("@/pages/GamesPage"));
const LiveGamesPage = lazy(() => import("@/pages/LiveGamesPage"));
const LeagueGamesPage = lazy(() => import("@/pages/LeagueGamesPage"));
const GameDetailPage = lazy(() => import("@/pages/GameDetailPage"));

const AppRouter = () => {
  return (
    <BrowserRouter>
      <Layout>
        <Suspense fallback={<p>Loading…</p>}>
          <Routes>
            <Route path="/" element={<GamesPage />} />
            <Route path="/live" element={<LiveGamesPage />} />
            <Route path="/league" element={<LeagueGamesPage />} />
            <Route path="/game/:id" element={<GameDetailPage />} />
          </Routes>
        </Suspense>
      </Layout>
    </BrowserRouter>
  );
};

export default AppRouter;
