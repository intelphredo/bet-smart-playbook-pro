// src/components/match/MatchHeader.tsx

import React from "react";
import { Badge } from "@/components/ui/badge";
import { UnifiedGame } from "@/hooks/useGames";

interface Props {
  game: UnifiedGame;
}

export const MatchHeader: React.FC<Props> = ({ game }) => {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h3 className="text-lg font-semibold">
          {game.homeTeam} vs {game.awayTeam}
        </h3>
        <p className="text-sm text-muted-foreground">
          {new Date(game.startTime).toLocaleString()}
        </p>
      </div>

      <Badge variant="outline" className="text-xs">
        {game.source}
      </Badge>
    </div>
  );
};

export default MatchHeader;
