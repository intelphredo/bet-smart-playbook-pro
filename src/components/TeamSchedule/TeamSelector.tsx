import React, { useMemo, useState } from "react";
import { Match, League } from "@/types/sports";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, ChevronDown, X, Check, Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface Team {
  id: string;
  name: string;
  shortName: string;
  logo: string;
  league: League;
  gamesCount: number;
}

interface TeamSelectorProps {
  matches: Match[];
  selectedTeamId: string | null;
  onTeamSelect: (teamId: string | null) => void;
  selectedLeague?: League | "ALL";
}

const LEAGUE_ORDER: (League | "ALL")[] = ["ALL", "NBA", "NFL", "NHL", "MLB", "SOCCER", "NCAAF", "NCAAB"];

export const TeamSelector: React.FC<TeamSelectorProps> = ({
  matches,
  selectedTeamId,
  onTeamSelect,
  selectedLeague = "ALL",
}) => {
  const [open, setOpen] = useState(false);
  const [filterLeague, setFilterLeague] = useState<League | "ALL">(selectedLeague);

  // Extract unique teams from matches with game counts
  const teams = useMemo(() => {
    const teamMap = new Map<string, Team>();

    matches.forEach((match) => {
      // Add home team
      const homeKey = match.homeTeam.id;
      if (teamMap.has(homeKey)) {
        teamMap.get(homeKey)!.gamesCount++;
      } else {
        teamMap.set(homeKey, {
          id: match.homeTeam.id,
          name: match.homeTeam.name,
          shortName: match.homeTeam.shortName,
          logo: match.homeTeam.logo,
          league: match.league,
          gamesCount: 1,
        });
      }

      // Add away team
      const awayKey = match.awayTeam.id;
      if (teamMap.has(awayKey)) {
        teamMap.get(awayKey)!.gamesCount++;
      } else {
        teamMap.set(awayKey, {
          id: match.awayTeam.id,
          name: match.awayTeam.name,
          shortName: match.awayTeam.shortName,
          logo: match.awayTeam.logo,
          league: match.league,
          gamesCount: 1,
        });
      }
    });

    // Sort teams alphabetically by name
    return Array.from(teamMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }, [matches]);

  // Filter teams by selected league tab
  const filteredTeams = useMemo(() => {
    if (filterLeague === "ALL") return teams;
    return teams.filter(team => team.league === filterLeague);
  }, [teams, filterLeague]);

  // Get available leagues
  const availableLeagues = useMemo(() => {
    const leagues = new Set(teams.map(t => t.league));
    return LEAGUE_ORDER.filter(l => l === "ALL" || leagues.has(l as League));
  }, [teams]);

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
  };

  return (
    <div className="flex items-center gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full sm:w-[320px] justify-between h-11"
          >
            {selectedTeam ? (
              <div className="flex items-center gap-2 truncate">
                <img
                  src={selectedTeam.logo}
                  alt={selectedTeam.name}
                  className="h-6 w-6 object-contain shrink-0"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
                <span className="truncate font-medium">{selectedTeam.name}</span>
                <Badge variant="secondary" className="text-[10px] ml-auto">
                  {selectedTeam.league}
                </Badge>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>Select a team to view schedule...</span>
              </div>
            )}
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[360px] p-0" align="start">
          {/* League Filter Tabs */}
          <div className="p-2 border-b bg-muted/30">
            <Tabs value={filterLeague} onValueChange={(v) => setFilterLeague(v as League | "ALL")}>
              <TabsList className="h-8 w-full grid" style={{ gridTemplateColumns: `repeat(${Math.min(availableLeagues.length, 5)}, 1fr)` }}>
                {availableLeagues.slice(0, 5).map(league => (
                  <TabsTrigger key={league} value={league} className="text-xs px-2">
                    {league}
                  </TabsTrigger>
                ))}
              </TabsList>
              {availableLeagues.length > 5 && (
                <TabsList className="h-8 w-full grid mt-1" style={{ gridTemplateColumns: `repeat(${availableLeagues.length - 5}, 1fr)` }}>
                  {availableLeagues.slice(5).map(league => (
                    <TabsTrigger key={league} value={league} className="text-xs px-2">
                      {league}
                    </TabsTrigger>
                  ))}
                </TabsList>
              )}
            </Tabs>
          </div>

          <Command>
            <CommandInput placeholder="Search teams..." />
            <CommandList className="max-h-[300px]">
              <CommandEmpty>No teams found.</CommandEmpty>
              
              {/* Popular/Recent Option */}
              <CommandGroup heading="Quick Actions">
                <CommandItem
                  onSelect={() => handleTeamSelect(null)}
                  className="flex items-center gap-2"
                >
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>Clear Selection</span>
                  {!selectedTeamId && <Check className="ml-auto h-4 w-4" />}
                </CommandItem>
              </CommandGroup>

              <CommandSeparator />

              {/* Teams grouped by league */}
              {Object.entries(teamsByLeague).map(([league, leagueTeams]) => (
                <CommandGroup key={league} heading={`${league} (${leagueTeams.length} teams)`}>
                  {leagueTeams.map((team) => (
                    <CommandItem
                      key={team.id}
                      value={`${team.name} ${team.shortName} ${team.league}`}
                      onSelect={() => handleTeamSelect(team.id)}
                      className="flex items-center gap-2 py-2"
                    >
                      <img
                        src={team.logo}
                        alt={team.name}
                        className="h-6 w-6 object-contain shrink-0"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{team.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {team.gamesCount} upcoming game{team.gamesCount !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-[10px] shrink-0">
                        {team.shortName}
                      </Badge>
                      {selectedTeamId === team.id && (
                        <Check className="h-4 w-4 text-primary shrink-0" />
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              ))}
            </CommandList>
          </Command>

          {/* Footer with count */}
          <div className="border-t px-3 py-2 text-xs text-muted-foreground flex items-center justify-between bg-muted/30">
            <span>{filteredTeams.length} teams available</span>
            {filterLeague !== "ALL" && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 text-xs"
                onClick={() => setFilterLeague("ALL")}
              >
                Show all leagues
              </Button>
            )}
          </div>
        </PopoverContent>
      </Popover>

      {/* Clear button when team is selected */}
      {selectedTeam && (
        <Button
          variant="ghost"
          size="icon"
          className="h-11 w-11 shrink-0"
          onClick={() => onTeamSelect(null)}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};
