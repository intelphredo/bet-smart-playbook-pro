// src/components/match/LeagueTabs.tsx

import React from "react";

interface Props {
  league: string;
  setLeague: (l: string) => void;
}

const leagues = ["all", "nfl", "nba", "mlb", "nhl"];

export const LeagueTabs: React.FC<Props> = ({ league, setLeague }) => {
  return (
    <div className="flex gap-2 mb-4">
      {leagues.map((l) => (
        <button
          key={l}
          onClick={() => setLeague(l)}
          className={`px-3 py-1 rounded text-sm border ${
            league === l ? "bg-primary text-white" : "bg-muted"
          }`}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
};

export default LeagueTabs;
