// src/components/match/AutoRefreshIndicator.tsx

import React from "react";

interface Props {
  lastUpdated: string;
}

export const AutoRefreshIndicator: React.FC<Props> = ({ lastUpdated }) => {
  return (
    <p className="text-xs text-muted-foreground text-right">
      Auto‑refreshed at {new Date(lastUpdated).toLocaleTimeString()}
    </p>
  );
};

export default AutoRefreshIndicator;
