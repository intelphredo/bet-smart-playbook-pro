import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import ConfidentTeamPickCard from "./ConfidentTeamPickCard";
import { Match } from "@/types";

interface LeagueStatsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leagueName: string;
  matches: Match[];
  winRate?: number;
  picks?: number;
}

const LeagueStatsModal = ({
  open,
  onOpenChange,
  leagueName,
  matches,
  winRate,
  picks
}: LeagueStatsModalProps) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-lg">
      <DialogHeader>
        <DialogTitle>{leagueName} — Backing Data</DialogTitle>
        <DialogDescription>
          Win Rate: <span className="font-semibold">{winRate || "-"}%</span> | Picks: <span className="font-semibold">{picks ?? "-"}</span>
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-4">
        {matches.length === 0 ? (
          <div className="text-sm text-muted-foreground">No confident picks available for this league at the moment.</div>
        ) : (
          matches.map((match) => (
            <ConfidentTeamPickCard key={match.id} match={match} />
          ))
        )}
      </div>
    </DialogContent>
  </Dialog>
);

export default LeagueStatsModal;
