// src/components/match/MatchOdds.tsx

import React from "react";
import { UnifiedGame } from "@/hooks/useGames";

interface Props {
  game: UnifiedGame;
}

export const MatchOdds: React.FC<Props> = ({ game }) => {
  if (!game.odds) return null;

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium">Odds:</span>
      <span className="text-sm">
        {typeof game.odds === "string"
          ? game.odds
          : JSON.stringify(game.odds)}
      </span>
    </div>
  );
};

export default MatchOdds;
