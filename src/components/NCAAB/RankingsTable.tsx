import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, TrendingUp, TrendingDown, Sparkles, Loader2, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNCAABRankings, RankedTeam, RankingsData } from "@/hooks/useNCAABRankings";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

interface RankingsRowProps {
  team: RankedTeam;
  isHighlighted?: boolean;
}

const RankingsRow: React.FC<RankingsRowProps> = ({ team, isHighlighted }) => {
  const getTrendIcon = () => {
    switch (team.trend) {
      case "up":
        return (
          <div className="flex items-center gap-0.5 text-green-500">
            <TrendingUp size={14} />
            <span className="text-xs">+{team.trendAmount}</span>
          </div>
        );
      case "down":
        return (
          <div className="flex items-center gap-0.5 text-red-500">
            <TrendingDown size={14} />
            <span className="text-xs">-{team.trendAmount}</span>
          </div>
        );
      case "new":
        return (
          <div className="flex items-center gap-0.5 text-yellow-500">
            <Sparkles size={14} />
            <span className="text-xs">NEW</span>
          </div>
        );
      default:
        return <span className="text-muted-foreground text-xs">—</span>;
    }
  };

  const getRankBadgeColor = () => {
    if (team.rank === 1) return "bg-yellow-500 text-yellow-950";
    if (team.rank === 2) return "bg-gray-300 text-gray-800";
    if (team.rank === 3) return "bg-amber-600 text-white";
    if (team.rank <= 10) return "bg-primary text-primary-foreground";
    return "bg-muted text-muted-foreground";
  };

  return (
    <div
      className={cn(
        "flex items-center gap-3 py-2.5 px-3 rounded-lg transition-colors",
        isHighlighted 
          ? "bg-primary/10 border border-primary/20" 
          : "hover:bg-muted/50"
      )}
    >
      {/* Rank */}
      <Badge className={cn("w-8 h-8 rounded-full flex items-center justify-center p-0 text-sm font-bold", getRankBadgeColor())}>
        {team.rank}
      </Badge>

      {/* Team Logo & Name */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <img
          src={team.teamLogo}
          alt={team.teamName}
          className="w-8 h-8 object-contain"
          onError={(e) => {
            (e.target as HTMLImageElement).src = "/placeholder.svg";
          }}
        />
        <div className="flex flex-col min-w-0">
          <span className="font-medium text-sm truncate">{team.teamName}</span>
          <span className="text-xs text-muted-foreground">{team.record}</span>
        </div>
      </div>

      {/* Trend */}
      <div className="w-16 flex justify-center">
        {getTrendIcon()}
      </div>

      {/* Points */}
      <div className="w-16 text-right">
        <span className="text-sm font-medium">{team.points.toLocaleString()}</span>
        {team.firstPlaceVotes > 0 && (
          <span className="text-xs text-muted-foreground ml-1">
            ({team.firstPlaceVotes})
          </span>
        )}
      </div>
    </div>
  );
};

interface RankingsTableProps {
  highlightTeams?: string[];
  maxTeams?: number;
  compact?: boolean;
}

export const RankingsTable: React.FC<RankingsTableProps> = ({
  highlightTeams = [],
  maxTeams = 25,
  compact = false,
}) => {
  const { data: rankings, isLoading, error, refetch, isFetching } = useNCAABRankings();
  const [activeTab, setActiveTab] = useState("ap");

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Loading rankings...</span>
        </CardContent>
      </Card>
    );
  }

  if (error || !rankings || rankings.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 gap-3">
          <Trophy className="w-10 h-10 text-muted-foreground" />
          <p className="text-muted-foreground">Unable to load rankings</p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  const normalizedHighlights = highlightTeams.map(t => t.toLowerCase());
  const isHighlighted = (team: RankedTeam) => 
    normalizedHighlights.some(h => 
      team.teamName.toLowerCase().includes(h) ||
      team.teamAbbreviation.toLowerCase() === h
    );

  const renderPoll = (poll: RankingsData) => {
    const teamsToShow = poll.teams.slice(0, maxTeams);
    
    return (
      <div className="space-y-1">
        {/* Header */}
        {!compact && (
          <div className="flex items-center gap-3 py-2 px-3 text-xs text-muted-foreground font-medium border-b">
            <div className="w-8 text-center">#</div>
            <div className="flex-1">Team</div>
            <div className="w-16 text-center">Trend</div>
            <div className="w-16 text-right">Pts</div>
          </div>
        )}
        
        {/* Teams */}
        <div className="space-y-0.5">
          {teamsToShow.map((team) => (
            <RankingsRow
              key={`${poll.pollType}-${team.teamId}`}
              team={team}
              isHighlighted={isHighlighted(team)}
            />
          ))}
        </div>
      </div>
    );
  };

  const apPoll = rankings.find(r => r.pollType === "ap");
  const coachesPoll = rankings.find(r => r.pollType === "coaches");

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            <CardTitle className="text-lg">NCAAB Rankings</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {apPoll && (
              <span className="text-xs text-muted-foreground">
                Updated {format(new Date(apPoll.lastUpdated), "MMM d, yyyy")}
              </span>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => refetch()}
              disabled={isFetching}
            >
              <RefreshCw className={cn("w-4 h-4", isFetching && "animate-spin")} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {rankings.length > 1 ? (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 mb-3">
              <TabsTrigger value="ap">AP Top 25</TabsTrigger>
              <TabsTrigger value="coaches">Coaches Poll</TabsTrigger>
            </TabsList>
            <TabsContent value="ap" className="mt-0">
              {apPoll && renderPoll(apPoll)}
            </TabsContent>
            <TabsContent value="coaches" className="mt-0">
              {coachesPoll && renderPoll(coachesPoll)}
            </TabsContent>
          </Tabs>
        ) : (
          apPoll && renderPoll(apPoll)
        )}
      </CardContent>
    </Card>
  );
};
