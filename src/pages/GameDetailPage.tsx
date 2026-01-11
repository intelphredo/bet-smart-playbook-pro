// src/pages/GameDetailPage.tsx

import React from "react";
import { useParams } from "react-router-dom";
import { useGames } from "@/hooks/useGames";
import MatchHeader from "@/components/match/MatchHeader";
import MatchStatus from "@/components/match/MatchStatus";
import MatchOdds from "@/components/match/MatchOdds";
import MatchInjuries from "@/components/match/MatchInjuries";

const GameDetailPage: React.FC = () => {
  const { id } = useParams();
  const { games } = useGames();

  const game = games.find((g) => g.id === id);

  if (!game) {
    return (
      <div className="max-w-3xl mx-auto py-6 px-4">
        <p className="text-muted-foreground">Game not found.</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-6 px-4">
      <MatchHeader game={game} />

      <div className="mt-6 flex flex-col gap-4">
        <MatchStatus game={game} />
        <MatchOdds game={game} />
        <MatchInjuries game={game} />
      </div>
    </div>
  );
};

export default GameDetailPage;
