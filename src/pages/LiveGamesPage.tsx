// src/pages/LiveGamesPage.tsx

import React from "react";
import MatchCard from "@/components/match/MatchCard";
import AutoRefreshIndicator from "@/components/match/AutoRefreshIndicator";
import { useLiveGames } from "@/hooks/useLiveGames";

const LiveGamesPage: React.FC = () => {
  const { liveGames, isLoading, isError, refetch } = useLiveGames();

  if (isLoading) return <p>Loading live games…</p>;
  if (isError) return <p>Error loading live games.</p>;

  return (
    <div className="max-w-3xl mx-auto py-6 px-4">
      <h1 className="text-2xl font-bold mb-4">Live Games</h1>

      {liveGames.length > 0 && (
        <AutoRefreshIndicator lastUpdated={liveGames[0].lastUpdated} />
      )}

      <div className="flex flex-col gap-4">
        {liveGames.map((game) => (
          <MatchCard key={game.id} game={game} />
        ))}
      </div>

      {liveGames.length === 0 && (
        <p className="text-muted-foreground mt-6 text-center">
          No games are live right now.
        </p>
      )}
    </div>
  );
};

export default LiveGamesPage;
