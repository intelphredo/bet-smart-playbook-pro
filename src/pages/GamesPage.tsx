import React, { useState, useMemo } from "react";
import VirtualizedMatchList from "@/components/match/VirtualizedMatchList";
import { useGames } from "@/hooks/useGames";
import { GroupedLeagueSelect, LEAGUE_CATEGORIES } from "@/components/filters/GroupedLeagueSelect";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Gamepad2 } from "lucide-react";

// Get all available leagues from categories
const ALL_LEAGUES = Object.values(LEAGUE_CATEGORIES).flatMap(cat => cat.leagues);

const GamesPage: React.FC = () => {
  const { games, isLoading, isError } = useGames();
  const [selectedLeague, setSelectedLeague] = useState<string>("all");

  // Filter games by selected league
  const filteredGames = useMemo(() => {
    if (selectedLeague === "all") return games;
    return games.filter(game => game.league?.toUpperCase() === selectedLeague.toUpperCase());
  }, [games, selectedLeague]);

  if (isLoading) {
    return <div className="py-10 text-center text-muted-foreground">Loading games...</div>;
  }

  if (isError) {
    return <div className="py-10 text-center text-destructive">Failed to load games</div>;
  }

  return (
    <div className="container px-4 py-6 space-y-6">
      {/* Header with League Filter */}
      <Card className="border-primary/20">
        <CardHeader className="py-4 px-6 flex flex-row items-center justify-between bg-gradient-to-r from-primary/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-primary/10">
              <Gamepad2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">All Games</CardTitle>
              <p className="text-sm text-muted-foreground">
                {filteredGames.length} {selectedLeague === "all" ? "total" : selectedLeague} games
              </p>
            </div>
          </div>
          <GroupedLeagueSelect
            value={selectedLeague}
            onValueChange={setSelectedLeague}
            leagues={ALL_LEAGUES}
            allLabel={`All Leagues (${games.length})`}
            className="w-[200px]"
          />
        </CardHeader>
      </Card>

      {/* Games List */}
      {filteredGames.length === 0 ? (
        <div className="py-10 text-center text-muted-foreground">
          No {selectedLeague === "all" ? "" : selectedLeague + " "}games available
        </div>
      ) : (
        <VirtualizedMatchList games={filteredGames} />
      )}
    </div>
  );
};

export default GamesPage;
