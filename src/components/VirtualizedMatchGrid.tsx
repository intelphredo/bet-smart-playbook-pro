import { useRef, useMemo } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import MatchCard from "./MatchCard";
import { Match } from "@/types/sports";
import { cn } from "@/lib/utils";

interface VirtualizedMatchGridProps {
  matches: Match[];
  columns?: number;
  estimatedCardHeight?: number;
  className?: string;
}

// Simplified MatchCard for initial render (reduces DOM nodes significantly)
const CompactMatchCard = ({ match }: { match: Match }) => {
  return (
    <div className="p-4 rounded-xl border bg-card text-card-foreground shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded">
          {match.league}
        </span>
        {match.status === "live" && (
          <span className="text-xs text-destructive font-medium">● LIVE</span>
        )}
      </div>
      <div className="flex items-center justify-between gap-2">
        <div className="flex-1 text-center">
          <div className="w-8 h-8 bg-muted rounded-full mx-auto mb-1 flex items-center justify-center text-xs font-medium">
            {match.homeTeam?.shortName?.substring(0, 2) || "H"}
          </div>
          <p className="text-sm font-medium truncate">{match.homeTeam?.shortName}</p>
        </div>
        <div className="text-muted-foreground text-sm">vs</div>
        <div className="flex-1 text-center">
          <div className="w-8 h-8 bg-muted rounded-full mx-auto mb-1 flex items-center justify-center text-xs font-medium">
            {match.awayTeam?.shortName?.substring(0, 2) || "A"}
          </div>
          <p className="text-sm font-medium truncate">{match.awayTeam?.shortName}</p>
        </div>
      </div>
      {match.prediction?.confidence && (
        <div className="mt-3 text-center">
          <span className="text-xs text-muted-foreground">
            Confidence: {match.prediction.confidence}%
          </span>
        </div>
      )}
    </div>
  );
};

export default function VirtualizedMatchGrid({
  matches,
  columns = 3,
  estimatedCardHeight = 320,
  className,
}: VirtualizedMatchGridProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  // Group matches into rows
  const rows = useMemo(() => {
    const result: Match[][] = [];
    for (let i = 0; i < matches.length; i += columns) {
      result.push(matches.slice(i, i + columns));
    }
    return result;
  }, [matches, columns]);

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimatedCardHeight,
    overscan: 2, // Render 2 extra rows above and below viewport
  });

  if (matches.length === 0) {
    return null;
  }

  // For small lists, don't virtualize
  if (matches.length <= 9) {
    return (
      <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4", className)}>
        {matches.map((match) => (
          <MatchCard key={match.id} match={match} />
        ))}
      </div>
    );
  }

  return (
    <div
      ref={parentRef}
      className={cn("h-[600px] overflow-auto", className)}
      style={{ contain: "strict" }}
    >
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: "100%",
          position: "relative",
        }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const rowMatches = rows[virtualRow.index];
          return (
            <div
              key={virtualRow.key}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-1">
                {rowMatches.map((match) => (
                  <MatchCard key={match.id} match={match} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
