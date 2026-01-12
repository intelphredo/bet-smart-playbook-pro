// src/components/match/VirtualizedMatchList.tsx

import React from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import MatchCard from "./MatchCard";
import { UnifiedGame } from "@/hooks/useGames";

interface Props {
  games: UnifiedGame[];
}

export const VirtualizedMatchList: React.FC<Props> = ({ games }) => {
  const parentRef = React.useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: games.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 140,
    overscan: 5,
  });

  return (
    <div
      ref={parentRef}
      className="h-[80vh] overflow-auto border rounded-md"
    >
      <div
        style={{
          height: rowVirtualizer.getTotalSize(),
          position: "relative",
        }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const game = games[virtualRow.index];

          return (
            <div
              key={virtualRow.key}
              className="absolute top-0 left-0 w-full"
              style={{
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              <MatchCard game={game} />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default VirtualizedMatchList;
