// src/components/match/MatchList.tsx

import React from "react";
import MatchCard from "./MatchCard";
import { useGames } from "@/hooks/useGames";
import { Skeleton } from "@/components/ui/skeleton";

export const MatchList: React.FC = () => {
  const { games, isLoading, isError, refetch } = useGames();

  // -----------------------------
  // Loading State
  // -----------------------------
  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-32 w-full rounded-md" />
        ))}
      </div>
    );
  }

  // -----------------------------
  // Error State
  // -----------------------------
  if (isError) {
    return (
      <div className="text-center py-10">
        <p className="text-red-500 font-medium mb-2">
          Failed to load games.
        </p>
        <button
          onClick={() => refetch()}
          className="text-blue-600 underline text-sm"
        >
          Try again
        </button>
      </div>
    );
  }

  // -----------------------------
  // Empty State
  // -----------------------------
  if (!games || games.length === 0) {
    return (
      <div className="text-center py-10 text-muted-foreground">
        No games available.
      </div>
    );
  }

  // -----------------------------
  // Game List
  // -----------------------------
  return (
    <div className="flex flex-col gap-4">
      {games.map((game) => (
        <MatchCard key={game.id} game={game} />
      ))}
    </div>
  );
};

export default MatchList;
