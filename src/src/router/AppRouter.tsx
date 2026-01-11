import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import GamesPage from "@/pages/GamesPage";
import LiveGamesPage from "@/pages/LiveGamesPage";
import LeagueGamesPage from "@/pages/LeagueGamesPage";
import GameDetailPage from "@/pages/GameDetailPage";

import Layout from "@/components/layout/Layout";

const AppRouter = () => {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<GamesPage />} />
          <Route path="/live" element={<LiveGamesPage />} />
          <Route path="/league" element={<LeagueGamesPage />} />
          <Route path="/game/:id" element={<GameDetailPage />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
};

export default AppRouter;
