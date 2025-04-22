
import React from "react";
import ConfidentTeamPickCard from "./ConfidentTeamPickCard";
import { Match } from "@/types";

interface ConfidentTeamPickListProps {
  picks: Match[];
}

/** Grid for showing 1 team pick per league */
const ConfidentTeamPickList = ({ picks }: ConfidentTeamPickListProps) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {picks.map((match) => (
      <ConfidentTeamPickCard
        key={match.id}
        match={match}
      />
    ))}
  </div>
);

export default ConfidentTeamPickList;
