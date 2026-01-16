// src/components/match/LiveBadge.tsx

import React from "react";
import { Badge } from "@/components/ui/badge";
import { Radio } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  isLive: boolean;
  variant?: "default" | "compact" | "dot";
}

export const LiveBadge: React.FC<Props> = ({ isLive, variant = "default" }) => {
  if (!isLive) return null;

  if (variant === "dot") {
    return (
      <span className="relative flex h-2.5 w-2.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-400" />
      </span>
    );
  }

  if (variant === "compact") {
    return (
      <Badge variant="live" className="h-5 px-1.5 gap-1">
        <span className="relative flex h-1.5 w-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75" />
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-current" />
        </span>
        <span className="text-[10px]">LIVE</span>
      </Badge>
    );
  }

  return (
    <Badge variant="live" className="gap-1.5">
      <Radio className="h-3 w-3" />
      LIVE
    </Badge>
  );
};

export default LiveBadge;
