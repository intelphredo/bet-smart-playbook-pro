// src/components/match/MatchCard.tsx

import React from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UnifiedGame } from "@/hooks/useGames";

interface MatchCardProps {
  game: UnifiedGame;
}

export const MatchCard: React.FC<MatchCardProps> = ({ game }) => {
  return (
    <Card className="w-full shadow-sm border border-muted/40">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex flex-col">
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
      </CardHeader>

      <CardContent className="pt-0">
        <div className="flex flex-col gap-2">
          {/* Game Status */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Status:</span>
            <span className="text-sm capitalize">{game.status}</span>
          </div>

          {/* Odds */}
          {game.odds && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Odds:</span>
              <span className="text-sm">
                {typeof game.odds === "string"
                  ? game.odds
                  : JSON.stringify(game.odds)}
              </span>
            </div>
          )}

          {/* Injuries */}
          {game.injuries && (
            <div className="flex flex-col">
              <span className="text-sm font-medium mb-1">Injuries:</span>
              <pre className="text-xs bg-muted/30 p-2 rounded">
                {JSON.stringify(game.injuries, null, 2)}
              </pre>
            </div>
          )}

          {/* Last Updated */}
          <p className="text-xs text-muted-foreground mt-2">
            Last updated: {new Date(game.lastUpdated).toLocaleTimeString()}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default MatchCard;
