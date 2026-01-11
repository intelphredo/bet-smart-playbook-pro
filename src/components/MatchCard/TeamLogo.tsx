// src/components/match/TeamLogo.tsx

import React from "react";

interface Props {
  team: string;
}

export const TeamLogo: React.FC<Props> = ({ team }) => {
  const url = `/logos/${team.toLowerCase().replace(/\s+/g, "-")}.png`;

  return (
    <img
      src={url}
      alt={team}
      className="w-8 h-8 object-contain"
      onError={(e) => {
        (e.target as HTMLImageElement).style.display = "none";
      }}
    />
  );
};

export default TeamLogo;
