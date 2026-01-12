import React, { useMemo, useState } from "react";
import { Match, League } from "@/types/sports";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Users, Search, ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Team {
  id: string;
  name: string;
  shortName: string;
  logo: string;
  league: League;
}

interface TeamSelectorProps {
  matches: Match[];
  selectedTeamId: string | null;
  onTeamSelect: (teamId: string | null) => void;
  selectedLeague?: League | "ALL";
}

export const TeamSelector: React.FC<TeamSelectorProps> = ({
  matches,
  selectedTeamId,
  onTeamSelect,
  selectedLeague = "ALL",
}) => {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Extract unique teams from matches
  const teams = useMemo(() => {
    const teamMap = new Map<string, Team>();

    matches.forEach((match) => {
      // Filter by league if specified
      if (selectedLeague !== "ALL" && match.league !== selectedLeague) {
        return;
      }

      // Add home team
      if (!teamMap.has(match.homeTeam.id)) {
        teamMap.set(match.homeTeam.id, {
          id: match.homeTeam.id,
          name: match.homeTeam.name,
          shortName: match.homeTeam.shortName,
          logo: match.homeTeam.logo,
          league: match.league,
        });
      }

      // Add away team
      if (!teamMap.has(match.awayTeam.id)) {
        teamMap.set(match.awayTeam.id, {
          id: match.awayTeam.id,
          name: match.awayTeam.name,
          shortName: match.awayTeam.shortName,
          logo: match.awayTeam.logo,
          league: match.league,
        });
      }
    });

    // Sort teams alphabetically by name
    return Array.from(teamMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }, [matches, selectedLeague]);

  // Filter teams by search query
  const filteredTeams = useMemo(() => {
    if (!searchQuery.trim()) return teams;
    const query = searchQuery.toLowerCase();
    return teams.filter(
      (team) =>
        team.name.toLowerCase().includes(query) ||
        team.shortName.toLowerCase().includes(query) ||
        team.league.toLowerCase().includes(query)
    );
  }, [teams, searchQuery]);

  // Group filtered teams by league
  const teamsByLeague = useMemo(() => {
    const grouped: Record<string, Team[]> = {};
    filteredTeams.forEach((team) => {
      if (!grouped[team.league]) {
        grouped[team.league] = [];
      }
      grouped[team.league].push(team);
    });
    return grouped;
  }, [filteredTeams]);

  const selectedTeam = teams.find((t) => t.id === selectedTeamId);

  const handleTeamSelect = (teamId: string | null) => {
    onTeamSelect(teamId);
    setOpen(false);
    setSearchQuery("");
  };

  return (
    <div className="flex items-center gap-2">
      <Users className="h-4 w-4 text-muted-foreground" />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-[280px] justify-between"
          >
            {selectedTeam ? (
              <div className="flex items-center gap-2 truncate">
                <img
                  src={selectedTeam.logo}
                  alt={selectedTeam.name}
                  className="h-5 w-5 object-contain shrink-0"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
                <span className="truncate">{selectedTeam.name}</span>
              </div>
            ) : (
              <span className="text-muted-foreground">Select a team...</span>
            )}
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[320px] p-0" align="start">
          {/* Search Input */}
          <div className="flex items-center border-b px-3 py-2">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <Input
              placeholder="Search teams..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 border-0 p-0 focus-visible:ring-0 focus-visible:ring-offset-0"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => setSearchQuery("")}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>

          <ScrollArea className="h-[300px]">
            {/* All Teams Option */}
            <div
              className={cn(
                "flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-accent",
                !selectedTeamId && "bg-accent"
              )}
              onClick={() => handleTeamSelect(null)}
            >
              <Users className="h-5 w-5 text-muted-foreground" />
              <span className="font-medium">All Teams</span>
            </div>

            {/* Teams grouped by league */}
            {Object.entries(teamsByLeague).length > 0 ? (
              Object.entries(teamsByLeague).map(([league, leagueTeams]) => (
                <div key={league}>
                  <div className="px-3 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50 sticky top-0">
                    {league} ({leagueTeams.length})
                  </div>
                  {leagueTeams.map((team) => (
                    <div
                      key={team.id}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-accent",
                        selectedTeamId === team.id && "bg-accent"
                      )}
                      onClick={() => handleTeamSelect(team.id)}
                    >
                      <img
                        src={team.logo}
                        alt={team.name}
                        className="h-5 w-5 object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                      <span className="flex-1 truncate">{team.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {team.shortName}
                      </span>
                    </div>
                  ))}
                </div>
              ))
            ) : (
              <div className="px-3 py-8 text-center text-muted-foreground">
                <Search className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No teams found</p>
                <p className="text-xs">Try a different search term</p>
              </div>
            )}
          </ScrollArea>

          {/* Footer with count */}
          <div className="border-t px-3 py-2 text-xs text-muted-foreground">
            {filteredTeams.length} of {teams.length} teams
          </div>
        </PopoverContent>
      </Popover>

      {/* Clear button when team is selected */}
      {selectedTeam && (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => onTeamSelect(null)}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};
