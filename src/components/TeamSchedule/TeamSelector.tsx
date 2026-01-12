import React, { useMemo } from "react";
import { Match, League } from "@/types/sports";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Users } from "lucide-react";

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

  // Group teams by league
  const teamsByLeague = useMemo(() => {
    const grouped: Record<string, Team[]> = {};
    teams.forEach((team) => {
      if (!grouped[team.league]) {
        grouped[team.league] = [];
      }
      grouped[team.league].push(team);
    });
    return grouped;
  }, [teams]);

  const selectedTeam = teams.find((t) => t.id === selectedTeamId);

  return (
    <div className="flex items-center gap-2">
      <Users className="h-4 w-4 text-muted-foreground" />
      <Select
        value={selectedTeamId || "all"}
        onValueChange={(value) => onTeamSelect(value === "all" ? null : value)}
      >
        <SelectTrigger className="w-[280px] bg-background">
          <SelectValue placeholder="Select a team">
            {selectedTeam ? (
              <div className="flex items-center gap-2">
                <img
                  src={selectedTeam.logo}
                  alt={selectedTeam.name}
                  className="h-5 w-5 object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
                <span className="truncate">{selectedTeam.name}</span>
              </div>
            ) : (
              "All Teams"
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="max-h-[400px] bg-popover">
          <SelectItem value="all">
            <span className="font-medium">All Teams</span>
          </SelectItem>
          
          {Object.entries(teamsByLeague).map(([league, leagueTeams]) => (
            <React.Fragment key={league}>
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50 sticky top-0">
                {league}
              </div>
              {leagueTeams.map((team) => (
                <SelectItem key={team.id} value={team.id}>
                  <div className="flex items-center gap-2">
                    <img
                      src={team.logo}
                      alt={team.name}
                      className="h-5 w-5 object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                    <span>{team.name}</span>
                    <span className="text-muted-foreground text-xs">
                      ({team.shortName})
                    </span>
                  </div>
                </SelectItem>
              ))}
            </React.Fragment>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
