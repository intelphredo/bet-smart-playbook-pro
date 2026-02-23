import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import TeamLogo from "@/components/match/TeamLogo";
import { League, Match } from "@/types/sports";
import { Home, Plane, Zap, TrendingUp, Calendar, Users } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useHeadToHead } from "@/hooks/useHeadToHead";

interface TeamSnapshotsProps {
  match: Match;
  league: League;
}

interface TeamStatProps {
  icon: React.ReactNode;
  label: string;
  value: string | number | undefined | null;
  colorize?: boolean;
}

const TeamStat: React.FC<TeamStatProps> = ({ icon, label, value, colorize }) => {
  const displayValue = value ?? "—";
  const isPositive = typeof displayValue === "string" && displayValue.startsWith("+");
  const isNegative = typeof displayValue === "string" && displayValue.startsWith("-");

  return (
    <div className="flex items-center gap-1.5 p-2 bg-background/50 rounded text-xs">
      {icon}
      <span className="text-muted-foreground">{label}:</span>
      <span
        className={cn(
          "font-medium",
          colorize && isPositive && "text-green-500",
          colorize && isNegative && "text-red-500"
        )}
      >
        {displayValue}
      </span>
    </div>
  );
};

const TeamSnapshots: React.FC<TeamSnapshotsProps> = ({ match, league }) => {
  // Fetch season records via H2H hook (it includes season records)
  const homeTeamInfo = {
    id: match.homeTeam?.id || "home",
    name: match.homeTeam?.name || "Home",
    shortName: match.homeTeam?.shortName || "HME",
    logo: match.homeTeam?.logo || "",
    league,
  };
  const awayTeamInfo = {
    id: match.awayTeam?.id || "away",
    name: match.awayTeam?.name || "Away",
    shortName: match.awayTeam?.shortName || "AWY",
    logo: match.awayTeam?.logo || "",
    league,
  };

  const { data: h2hData } = useHeadToHead(homeTeamInfo, awayTeamInfo);

  const homeRecord = h2hData?.team1SeasonRecord;
  const awayRecord = h2hData?.team2SeasonRecord;

  const getStreakColor = (streak: string | number | undefined | null) => {
    if (!streak) return "";
    const s = String(streak);
    if (s.startsWith("W")) return "text-green-500";
    if (s.startsWith("L")) return "text-red-500";
    return "";
  };

  const formatDiff = (diff: number | undefined) => {
    if (diff === undefined || diff === null || isNaN(diff) || !isFinite(diff)) return "—";
    return `${diff > 0 ? "+" : ""}${diff} pt diff`;
  };

  const renderTeamCard = (
    team: any,
    record: any,
    side: "home" | "away"
  ) => (
    <motion.div
      initial={{ opacity: 0, x: side === "home" ? -20 : 20 }}
      animate={{ opacity: 1, x: 0 }}
      className={cn(
        "p-4 rounded-xl border",
        record &&
          ((side === "home" &&
            (homeRecord?.winPercentage || 0) > (awayRecord?.winPercentage || 0)) ||
          (side === "away" &&
            (awayRecord?.winPercentage || 0) > (homeRecord?.winPercentage || 0)))
          ? "bg-primary/5 border-primary/20"
          : "bg-muted/30 border-border"
      )}
    >
      <div className="flex items-center gap-2 mb-3">
        <TeamLogo teamName={team?.name || ""} league={league} size="sm" />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate">{team?.name || "Unknown"}</p>
          <p className="text-[10px] text-muted-foreground">
            {side === "home" ? "Home" : "Away"}
          </p>
        </div>
      </div>

      {/* Main record */}
      <div className="text-center mb-3 p-2 bg-background rounded-lg">
        <span className="text-xl font-bold">
          {record ? `${record.wins}-${record.losses}${record.ties > 0 ? `-${record.ties}` : ""}` : team?.record || "—"}
        </span>
        {record && !isNaN(record.winPercentage) && isFinite(record.winPercentage) && (
          <span className="text-xs text-muted-foreground ml-2">
            ({Math.min(100, Math.max(0, record.winPercentage)).toFixed(1)}%)
          </span>
        )}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-1.5">
        <TeamStat
          icon={<Home className="h-3 w-3 text-primary" />}
          label="Home"
          value={record?.homeRecord}
        />
        <TeamStat
          icon={<Plane className="h-3 w-3 text-muted-foreground" />}
          label="Away"
          value={record?.awayRecord}
        />
        <TeamStat
          icon={<Zap className={cn("h-3 w-3", getStreakColor(record?.streak))} />}
          label="Streak"
          value={record?.streak}
        />
        <TeamStat
          icon={
            <TrendingUp
              className={cn(
                "h-3 w-3",
                (record?.pointDifferential || 0) > 0
                  ? "text-green-500"
                  : (record?.pointDifferential || 0) < 0
                  ? "text-red-500"
                  : "text-muted-foreground"
              )}
            />
          }
          label="Pt Diff"
          value={formatDiff(record?.pointDifferential)}
          colorize
        />
        <TeamStat
          icon={<Calendar className="h-3 w-3 text-blue-500" />}
          label="Last 10"
          value={record?.last10}
        />
        {record?.conferenceRecord && (
          <TeamStat
            icon={<Users className="h-3 w-3 text-amber-500" />}
            label="Conf"
            value={record.conferenceRecord}
          />
        )}
      </div>
    </motion.div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Team Snapshots
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {renderTeamCard(match.homeTeam, homeRecord, "home")}
            {renderTeamCard(match.awayTeam, awayRecord, "away")}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default TeamSnapshots;
