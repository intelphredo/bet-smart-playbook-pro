// src/components/match/MatchOdds.tsx

import React from "react";
import { UnifiedGame } from "@/hooks/useGames";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Props {
  game: UnifiedGame;
}

export const MatchOdds: React.FC<Props> = ({ game }) => {
  if (!game.odds) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Odds</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">No odds available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Odds</CardTitle>
      </CardHeader>
      <CardContent>
        <pre className="text-sm bg-muted/30 p-3 rounded overflow-auto">
          {typeof game.odds === "string"
            ? game.odds
            : JSON.stringify(game.odds, null, 2)}
        </pre>
      </CardContent>
    </Card>
  );
};

export default MatchOdds;
