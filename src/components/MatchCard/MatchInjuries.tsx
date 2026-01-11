// src/components/match/MatchInjuries.tsx

import React from "react";
import { UnifiedGame } from "@/hooks/useGames";

interface Props {
  game: UnifiedGame;
}

export const MatchInjuries: React.FC<Props> = ({ game }) => {
  if (!game.injuries) return null;

  return (
    <div className="flex flex-col">
      <span className="text-sm font-medium mb-1">Injuries:</span>
      <pre className="text-xs bg-muted/30 p-2 rounded">
        {JSON.stringify(game.injuries, null, 2)}
      </pre>
    </div>
  );
};

export default MatchInjuries;
