// src/components/match/AutoRefreshIndicator.tsx

import React from "react";
import { RefreshCw } from "lucide-react";

interface Props {
  lastUpdated?: string;
}

export const AutoRefreshIndicator: React.FC<Props> = ({ lastUpdated }) => {
  const formattedTime = lastUpdated
    ? new Date(lastUpdated).toLocaleTimeString()
    : "N/A";

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
      <RefreshCw className="h-4 w-4 animate-spin-slow" />
      <span>Auto-refreshing • Last updated: {formattedTime}</span>
    </div>
  );
};

export default AutoRefreshIndicator;
