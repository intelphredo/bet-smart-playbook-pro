import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Brain, TrendingUp, TrendingDown, Target, BarChart3, Trophy, CheckCircle2, XCircle, Eye } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricInfoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  metric: "total" | "settled" | "winRate" | "record" | "pl" | "roi" | null;
  stats: {
    total: number;
    won: number;
    lost: number;
    pending: number;
    settled: number;
    winRate: number;
    totalPL: number;
    roi: number;
    avgConfidence: number;
    breakEvenWinRate: number;
    totalUnitsStaked: number;
  } | null;
  leagueBreakdown?: { league: string; won: number; lost: number; pl: number }[];
  onViewPredictions?: (status?: "won" | "lost") => void;
}

const PAYOUT_FACTOR = 0.9091;
const UNIT_SIZE = 10;

const MetricInfoModal = ({ open, onOpenChange, metric, stats, leagueBreakdown, onViewPredictions }: MetricInfoModalProps) => {
  if (!stats || !metric) return null;

  const content = getContent(metric, stats, leagueBreakdown);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <content.icon className={cn("h-5 w-5", content.iconColor)} />
            {content.title}
          </DialogTitle>
          <DialogDescription>{content.description}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          {content.rows.map((row, i) => (
            <div key={i} className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{row.label}</span>
              <span className={cn("font-medium", row.color)}>{row.value}</span>
            </div>
          ))}
        </div>
        {/* Action buttons */}
        {onViewPredictions && content.actions && content.actions.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2 border-t border-border/50">
            {content.actions.map((action, i) => (
              <Button
                key={i}
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs"
                onClick={() => {
                  onViewPredictions(action.filter);
                  onOpenChange(false);
                }}
              >
                <action.icon className="h-3.5 w-3.5" />
                {action.label}
              </Button>
            ))}
          </div>
        )}
        {/* League P/L breakdown for pl/roi */}
        {leagueBreakdown && leagueBreakdown.length > 0 && (metric === "pl" || metric === "roi") && (
          <div className="pt-2 border-t border-border/50 space-y-2">
            <p className="text-xs font-medium text-muted-foreground">By League</p>
            {leagueBreakdown.slice(0, 6).map((l, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <span>{l.league}</span>
                <div className="flex items-center gap-3">
                  <span className="text-muted-foreground">{l.won}W-{l.lost}L</span>
                  <span className={cn("font-bold", l.pl >= 0 ? "text-green-500" : "text-red-500")}>
                    {l.pl >= 0 ? "+" : ""}{l.pl.toFixed(2)}u
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

interface ActionDef {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  filter?: "won" | "lost";
}

function getContent(metric: string, s: NonNullable<MetricInfoModalProps["stats"]>, leagueBreakdown?: MetricInfoModalProps["leagueBreakdown"]) {
  const actions: ActionDef[] = [];

  switch (metric) {
    case "total":
      actions.push({ label: "View All Wins", icon: CheckCircle2, filter: "won" });
      actions.push({ label: "View All Losses", icon: XCircle, filter: "lost" });
      return {
        icon: Brain,
        iconColor: "text-primary",
        title: "Total Predictions",
        description: "Breakdown of all predictions by status",
        rows: [
          { label: "Won", value: `${s.won}`, color: "text-green-500" },
          { label: "Lost", value: `${s.lost}`, color: "text-red-500" },
          { label: "Pending", value: `${s.pending}`, color: "text-yellow-500" },
          { label: "Settled", value: `${s.settled}`, color: "" },
          { label: "Total", value: `${s.total}`, color: "font-bold" },
        ],
        actions,
      };
    case "settled":
      actions.push({ label: "View Wins", icon: CheckCircle2, filter: "won" });
      actions.push({ label: "View Losses", icon: XCircle, filter: "lost" });
      return {
        icon: Target,
        iconColor: "text-primary",
        title: "Settled Predictions",
        description: "Games that have a final result",
        rows: [
          { label: "Won", value: `${s.won}`, color: "text-green-500" },
          { label: "Lost", value: `${s.lost}`, color: "text-red-500" },
          { label: "Settled Total", value: `${s.settled}`, color: "font-bold" },
          { label: "Still Pending", value: `${s.pending}`, color: "text-yellow-500" },
        ],
        actions,
      };
    case "winRate":
      actions.push({ label: "View Winning Predictions", icon: CheckCircle2, filter: "won" });
      return {
        icon: s.winRate >= s.breakEvenWinRate ? TrendingUp : TrendingDown,
        iconColor: s.winRate >= s.breakEvenWinRate ? "text-green-500" : "text-red-500",
        title: "Win Rate Breakdown",
        description: `Formula: ${s.won} wins ÷ ${s.settled} settled = ${s.winRate.toFixed(1)}%`,
        rows: [
          { label: "Current Win Rate", value: `${s.winRate.toFixed(1)}%`, color: s.winRate >= s.breakEvenWinRate ? "text-green-500" : "text-red-500" },
          { label: "Break-Even (-110)", value: `${s.breakEvenWinRate.toFixed(1)}%`, color: "" },
          { label: "Edge", value: `${(s.winRate - s.breakEvenWinRate) >= 0 ? '+' : ''}${(s.winRate - s.breakEvenWinRate).toFixed(1)}%`, color: s.winRate >= s.breakEvenWinRate ? "text-green-500" : "text-red-500" },
          { label: "Avg Confidence", value: `${s.avgConfidence.toFixed(1)}%`, color: "" },
          { label: "Based on", value: `${s.settled} settled`, color: "text-muted-foreground" },
        ],
        actions,
      };
    case "record":
      actions.push({ label: `View ${s.won} Wins`, icon: CheckCircle2, filter: "won" });
      actions.push({ label: `View ${s.lost} Losses`, icon: XCircle, filter: "lost" });
      return {
        icon: Trophy,
        iconColor: "text-yellow-500",
        title: "Record Details",
        description: "Win/Loss record with pending count",
        rows: [
          { label: "Wins", value: `${s.won}`, color: "text-green-500" },
          { label: "Losses", value: `${s.lost}`, color: "text-red-500" },
          { label: "Pending", value: `${s.pending}`, color: "text-yellow-500" },
          { label: "Record", value: `${s.won}W-${s.lost}L`, color: "font-bold" },
        ],
        actions,
      };
    case "pl":
      actions.push({ label: "View All Wins", icon: CheckCircle2, filter: "won" });
      actions.push({ label: "View All Losses", icon: XCircle, filter: "lost" });
      return {
        icon: s.totalPL >= 0 ? TrendingUp : TrendingDown,
        iconColor: s.totalPL >= 0 ? "text-green-500" : "text-red-500",
        title: "Profit & Loss",
        description: "Unit-based P/L at standard -110 odds",
        rows: [
          { label: "Win Profit", value: `+${(s.won * PAYOUT_FACTOR).toFixed(2)}u`, color: "text-green-500" },
          { label: "Loss Cost", value: `-${s.lost.toFixed(2)}u`, color: "text-red-500" },
          { label: "Net P/L", value: `${s.totalPL >= 0 ? '+' : ''}${s.totalPL.toFixed(2)}u`, color: s.totalPL >= 0 ? "text-green-500" : "text-red-500" },
          { label: "Dollar P/L ($10/unit)", value: `$${(s.totalPL * UNIT_SIZE) >= 0 ? '+' : ''}${(s.totalPL * UNIT_SIZE).toFixed(0)}`, color: s.totalPL >= 0 ? "text-green-500" : "text-red-500" },
          { label: "Units Staked", value: `${s.totalUnitsStaked}u`, color: "" },
        ],
        actions,
      };
    case "roi":
      return {
        icon: BarChart3,
        iconColor: "text-primary",
        title: "Return on Investment",
        description: "ROI = Net P/L ÷ Units Staked",
        rows: [
          { label: "ROI", value: `${s.roi >= 0 ? '+' : ''}${s.roi.toFixed(1)}%`, color: s.roi >= 0 ? "text-green-500" : "text-red-500" },
          { label: "Net P/L", value: `${s.totalPL >= 0 ? '+' : ''}${s.totalPL.toFixed(2)}u`, color: "" },
          { label: "Units Staked", value: `${s.totalUnitsStaked}u`, color: "" },
          { label: "Settled Games", value: `${s.settled}`, color: "" },
        ],
        actions: [],
      };
    default:
      return { icon: Brain, iconColor: "", title: "", description: "", rows: [], actions: [] };
  }
}

export default MetricInfoModal;
