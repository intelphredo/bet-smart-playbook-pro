// src/components/match/MatchHeader.tsx

import React from "react";
import { UnifiedGame } from "@/hooks/useGames";
import { Badge } from "@/components/ui/badge";

interface Props {
  game: UnifiedGame;
}

export const MatchHeader: React.FC<Props> = ({ game }) => {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">
          {game.homeTeam} vs {game.awayTeam}
        </h1>
        <Badge variant="outline">{game.league || "Unknown"}</Badge>
      </div>
      <p className="text-muted-foreground">
        {new Date(game.startTime).toLocaleString()}
      </p>
    </div>
  );
};

export default MatchHeader;
