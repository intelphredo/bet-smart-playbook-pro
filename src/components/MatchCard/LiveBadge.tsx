// src/components/match/LiveBadge.tsx

import React from "react";
import { Badge } from "@/components/ui/badge";

interface Props {
  isLive: boolean;
}

export const LiveBadge: React.FC<Props> = ({ isLive }) => {
  if (!isLive) return null;

  return (
    <Badge className="bg-red-600 text-white animate-pulse">
      LIVE
    </Badge>
  );
};

export default LiveBadge;
