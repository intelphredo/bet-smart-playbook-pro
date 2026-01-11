// src/pages/LeagueGamesPage.tsx

import React from "react";
import MatchCard from "@/components/match/MatchCard";
import { useGames } from "@/hooks/useGames";
import { useLeagueFilter } from "@/hooks/useLeagueFilter";

const leagues = ["all", "nfl", "nba", "mlb", "nhl"];

const LeagueGamesPage: React.FC = () => {
  const { games } = useGames();
  const { league, setLeague, filteredGames } = useLeagueFilter(games);

  return (
    <div className="max-w-3xl mx-auto py-6 px-4">
      <h1 className="text-2xl font-bold mb-4">Games by League</h1>

      <div className="flex gap-2 mb-4">
        {leagues.map((l) => (
          <button
            key={l}
            onClick={() => setLeague(l)}
            className={`px-3 py-1 rounded text-sm border ${
              league === l ? "bg-primary text-white" : "bg-muted"
            }`}
          >
            {l.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-4">
        {filteredGames.map((game) => (
          <MatchCard key={game.id} game={game} />
        ))}
      </div>

      {filteredGames.length === 0 && (
        <p className="text-muted-foreground mt-6 text-center">
          No games available for this league.
        </p>
      )}
    </div>
  );
};

export default LeagueGamesPage;
