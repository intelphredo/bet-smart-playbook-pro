// src/components/match/MatchList.tsx

import React from "react";
import MatchCard from "./MatchCard";
import { useGames } from "@/hooks/useGames";
import { Skeleton } from "@/components/ui/skeleton";

export const MatchList: React.FC = () => {
  const { games, isLoading, isError, refetch } = useGames();

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-32 w-full rounded-md" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-10">
        <p className="text-destructive font-medium mb-2">
          Failed to load games.
        </p>
        <button
          onClick={() => refetch()}
          className="text-primary underline text-sm"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!games || games.length === 0) {
    return (
      <div className="text-center py-10 text-muted-foreground">
        No games available.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {games.map((game) => (
        <MatchCard key={game.id} game={game} />
      ))}
    </div>
  );
};

export default MatchList;
