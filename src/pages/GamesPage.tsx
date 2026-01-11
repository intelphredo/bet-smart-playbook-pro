// src/pages/GamesPage.tsx

import React from "react";
import MatchList from "@/components/match/MatchList";
import AutoRefreshIndicator from "@/components/match/AutoRefreshIndicator";
import { useGames } from "@/hooks/useGames";

const GamesPage: React.FC = () => {
  const { games } = useGames();

  return (
    <div className="max-w-3xl mx-auto py-6 px-4">
      <h1 className="text-2xl font-bold mb-4">All Games</h1>

      {games.length > 0 && (
        <AutoRefreshIndicator lastUpdated={games[0].lastUpdated} />
      )}

      <MatchList />
    </div>
  );
};

export default GamesPage;
