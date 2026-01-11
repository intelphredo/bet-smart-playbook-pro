// src/components/match/GlobalRefreshBar.tsx

import React from "react";

interface Props {
  lastUpdated: string;
}

export const GlobalRefreshBar: React.FC<Props> = ({ lastUpdated }) => {
  return (
    <div className="w-full bg-muted py-1 text-center text-xs text-muted-foreground">
      Updated at {new Date(lastUpdated).toLocaleTimeString()}
    </div>
  );
};

export default GlobalRefreshBar;
