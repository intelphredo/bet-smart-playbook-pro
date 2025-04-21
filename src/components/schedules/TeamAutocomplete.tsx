
import React from "react";
import { Match } from "@/types/sports";

interface TeamAutocompleteProps {
  matches: Match[];
  query: string;
  onSelect: (team: string) => void;
}

export const TeamAutocomplete: React.FC<TeamAutocompleteProps> = ({ matches, query, onSelect }) => {
  // Extract all unique teams from the matches
  const teamsSet = new Set<string>();
  matches.forEach(match => {
    if (match.homeTeam.name) teamsSet.add(match.homeTeam.name);
    if (match.awayTeam.name) teamsSet.add(match.awayTeam.name);
  });
  const allTeams = Array.from(teamsSet);

  // Filter teams by the search query
  const filteredTeams = query.length > 0
    ? allTeams.filter(team =>
        team.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  if (!query || filteredTeams.length === 0) {
    return null;
  }

  return (
    <ul className="absolute left-0 right-0 z-50 bg-white border rounded-md shadow-lg mt-1 max-h-52 overflow-y-auto">
      {filteredTeams.map(team => (
        <li
          key={team}
          className="px-4 py-2 cursor-pointer hover:bg-primary/10 transition"
          onMouseDown={() => onSelect(team)} // use onMouseDown to avoid input blur before click
        >
          {team}
        </li>
      ))}
    </ul>
  );
};
