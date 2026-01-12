import React from "react";
import VirtualizedMatchList from "@/components/match/VirtualizedMatchList";
import { useGames } from "@/hooks/useGames";

const GamesPage: React.FC = () => {
  const { games, isLoading, isError } = useGames();

  if (isLoading) {
    return <div className="py-10 text-center text-muted-foreground">Loading games...</div>;
  }

  if (isError) {
    return <div className="py-10 text-center text-destructive">Failed to load games</div>;
  }

  if (games.length === 0) {
    return <div className="py-10 text-center text-muted-foreground">No games available</div>;
  }

  return <VirtualizedMatchList games={games} />;
};

export default GamesPage;
