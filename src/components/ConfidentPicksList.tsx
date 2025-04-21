
import React from "react";
import ConfidentPicksCard from "./ConfidentPicksCard";
import { PlayerTrendAnalysis } from "@/types/playerAnalytics";

interface ConfidentPicksListProps {
  picks: PlayerTrendAnalysis[];
}

/** Grid for showing 1 pick per league, matching the performance chart */
const ConfidentPicksList = ({ picks }: ConfidentPicksListProps) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {picks.map((analysis) => (
      <ConfidentPicksCard
        key={`${analysis.playerId}-${analysis.propType}`}
        analysis={analysis}
      />
    ))}
  </div>
);

export default ConfidentPicksList;
