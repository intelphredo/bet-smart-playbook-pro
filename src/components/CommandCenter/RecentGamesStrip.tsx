import { memo } from "react";
import { useNavigate } from "react-router-dom";
import { Match } from "@/types/sports";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { MemoizedScoreboardRow } from "@/components/layout/MemoizedScoreboardRow";
import { Radio, Clock, Trophy, ChevronRight, ShieldAlert } from "lucide-react";

interface RecentGamesStripProps {
  liveMatches: Match[];
  finishedMatches: Match[];
  upcomingMatches: Match[];
}

export const RecentGamesStrip = memo(function RecentGamesStrip({
  liveMatches,
  finishedMatches,
  upcomingMatches,
}: RecentGamesStripProps) {
  const navigate = useNavigate();

  return (
    <div className="space-y-4">
      {/* Live games */}
      {liveMatches.length > 0 && (
        <Card className="border-destructive/30">
          <CardHeader className="py-3 px-4 flex flex-row items-center justify-between bg-destructive/5">
            <div className="flex items-center gap-2">
              <Radio className="h-4 w-4 text-destructive animate-pulse" />
              <CardTitle className="text-sm">Live Now ({liveMatches.length})</CardTitle>
            </div>
            <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => navigate('/live')}>
              All Live <ChevronRight className="h-3 w-3 ml-0.5" />
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border/50">
              {liveMatches.slice(0, 4).map(match => (
                <MemoizedScoreboardRow key={match.id} match={match} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent results */}
      {finishedMatches.length > 0 && (
        <Card>
          <CardHeader className="py-3 px-4 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm">Recent Results</CardTitle>
            </div>
            <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => navigate('/recent-results')}>
              All Results <ChevronRight className="h-3 w-3 ml-0.5" />
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border/50">
              {finishedMatches.slice(0, 5).map(match => (
                <MemoizedScoreboardRow key={match.id} match={match} showOdds={false} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Responsible gambling footer */}
      <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border border-border/50">
        <ShieldAlert className="h-4 w-4 text-muted-foreground shrink-0" />
        <p className="text-xs text-muted-foreground">
          Gambling involves risk. Please bet responsibly and within your means. If you need help, visit{" "}
          <a href="https://www.ncpgambling.org" target="_blank" rel="noopener noreferrer" className="underline text-primary">
            ncpgambling.org
          </a>
        </p>
      </div>
    </div>
  );
});
