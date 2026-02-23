import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CheckCircle2, XCircle } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { getLeagueDisplayName } from "@/utils/teamLogos";

interface Prediction {
  id: string;
  match_title: string | null;
  home_team: string | null;
  away_team: string | null;
  league: string | null;
  confidence: number | null;
  predicted_at: string;
  status: string;
  prediction: string | null;
  actual_score_home: number | null;
  actual_score_away: number | null;
}

interface RecordDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  predictions: Prediction[];
  type: "won" | "lost";
}

const PAYOUT_FACTOR = 0.9091;

const RecordDetailModal = ({ open, onOpenChange, predictions, type }: RecordDetailModalProps) => {
  const icon = type === "won" ? CheckCircle2 : XCircle;
  const Icon = icon;
  const color = type === "won" ? "text-green-500" : "text-red-500";
  const label = type === "won" ? "Winning" : "Losing";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon className={cn("h-5 w-5", color)} />
            {predictions.length} {label} Predictions
          </DialogTitle>
          <DialogDescription>
            {type === "won"
              ? `Each win pays +${PAYOUT_FACTOR.toFixed(2)}u at -110 odds`
              : "Each loss costs -1.00u"}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[55vh]">
          <div className="space-y-2 pr-2">
            {predictions.map((p) => {
              const pl = type === "won" ? `+${PAYOUT_FACTOR.toFixed(2)}u` : "-1.00u";
              return (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-muted/50 border border-border/30"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">
                      {p.match_title || `${p.home_team} vs ${p.away_team}`}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap mt-0.5">
                      <span>{getLeagueDisplayName(p.league) || "Unknown"}</span>
                      <span>•</span>
                      <span>{format(new Date(p.predicted_at), "MMM d, h:mm a")}</span>
                      {p.confidence != null && (
                        <>
                          <span>•</span>
                          <span>{p.confidence}% conf</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <p className="text-sm font-medium">{p.prediction || "-"}</p>
                    <div className="flex items-center gap-1.5 justify-end">
                      {p.actual_score_home != null && (
                        <Badge variant="secondary" className="text-xs">
                          {p.actual_score_home}-{p.actual_score_away}
                        </Badge>
                      )}
                      <span className={cn("text-xs font-bold", color)}>{pl}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default RecordDetailModal;
