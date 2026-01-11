// src/components/match/LiveGameHighlight.tsx

import React from "react";

interface Props {
  isLive: boolean;
  children: React.ReactNode;
}

export const LiveGameHighlight: React.FC<Props> = ({ isLive, children }) => {
  return (
    <div
      className={
        isLive
          ? "border-2 border-red-500 animate-pulse rounded-md"
          : "border border-muted rounded-md"
      }
    >
      {children}
    </div>
  );
};

export default LiveGameHighlight;
