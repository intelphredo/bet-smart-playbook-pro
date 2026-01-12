// src/components/match/MatchStatus.tsx

import React from "react";
import { UnifiedGame } from "@/hooks/useGames";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Props {
  game: UnifiedGame;
}

export const MatchStatus: React.FC<Props> = ({ game }) => {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "live":
        return "bg-green-500";
      case "finished":
        return "bg-muted";
      case "scheduled":
      default:
        return "bg-primary";
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Game Status</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2">
          <Badge className={getStatusColor(game.status)}>
            {game.status.toUpperCase()}
          </Badge>
          <span className="text-sm text-muted-foreground">
            Source: {game.source}
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

export default MatchStatus;
