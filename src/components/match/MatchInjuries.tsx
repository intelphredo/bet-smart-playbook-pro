// src/components/match/MatchInjuries.tsx

import React from "react";
import { UnifiedGame } from "@/hooks/useGames";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

interface Props {
  game: UnifiedGame;
}

export const MatchInjuries: React.FC<Props> = ({ game }) => {
  if (!game.injuries || (Array.isArray(game.injuries) && game.injuries.length === 0)) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Injuries
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">No injuries reported</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-orange-500" />
          Injuries
        </CardTitle>
      </CardHeader>
      <CardContent>
        <pre className="text-sm bg-muted/30 p-3 rounded overflow-auto">
          {JSON.stringify(game.injuries, null, 2)}
        </pre>
      </CardContent>
    </Card>
  );
};

export default MatchInjuries;
