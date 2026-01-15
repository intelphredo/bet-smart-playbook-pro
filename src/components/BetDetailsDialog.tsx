import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  MinusCircle,
  DollarSign,
  Target,
  TrendingUp,
  TrendingDown,
  Calendar,
  BarChart3,
  Zap,
  Info
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { UserBet, BetStatus } from "@/types/betting";

interface BetDetailsDialogProps {
  bet: UserBet | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const statusConfig: Record<BetStatus, { 
  icon: React.ElementType; 
  color: string; 
  bg: string;
  label: string;
}> = {
  pending: { icon: Clock, color: "text-yellow-500", bg: "bg-yellow-500/10", label: "Pending" },
  won: { icon: CheckCircle, color: "text-green-500", bg: "bg-green-500/10", label: "Won" },
  lost: { icon: XCircle, color: "text-red-500", bg: "bg-red-500/10", label: "Lost" },
  push: { icon: MinusCircle, color: "text-muted-foreground", bg: "bg-muted", label: "Push" },
  cancelled: { icon: XCircle, color: "text-muted-foreground", bg: "bg-muted", label: "Cancelled" },
};

export default function BetDetailsDialog({ 
  bet, 
  open, 
  onOpenChange 
}: BetDetailsDialogProps) {
  if (!bet) return null;

  const status = statusConfig[bet.status];
  const StatusIcon = status.icon;
  
  // Calculate potential profit
  const potentialProfit = bet.potential_payout - bet.stake;
  
  // Calculate implied probability from odds
  const impliedProbability = bet.odds_at_placement > 0 
    ? 100 / (bet.odds_at_placement / 100 + 1)
    : 100 / (100 / Math.abs(bet.odds_at_placement) + 1);

  // Calculate CLV if we have closing odds
  const clv = bet.clv_percentage || null;

  // Generate betting analysis
  const generateAnalysis = () => {
    const factors: Array<{
      name: string;
      icon: React.ElementType;
      value: string;
      description: string;
    }> = [];

    // Odds Analysis
    factors.push({
      name: "Odds at Placement",
      icon: BarChart3,
      value: bet.odds_at_placement > 0 ? `+${bet.odds_at_placement}` : `${bet.odds_at_placement}`,
      description: `Implied probability of ${impliedProbability.toFixed(1)}% based on American odds.`
    });

    // Stake Analysis
    factors.push({
      name: "Stake",
      icon: DollarSign,
      value: `$${bet.stake.toFixed(2)}`,
      description: `Risking $${bet.stake.toFixed(2)} for potential return of $${bet.potential_payout.toFixed(2)}.`
    });

    // Model Confidence
    if (bet.model_confidence) {
      factors.push({
        name: "Model Confidence",
        icon: Target,
        value: `${bet.model_confidence}%`,
        description: `Our model had ${bet.model_confidence}% confidence in this selection.`
      });
    }

    // Expected Value
    if (bet.model_ev_percentage) {
      factors.push({
        name: "Expected Value",
        icon: TrendingUp,
        value: `${bet.model_ev_percentage > 0 ? '+' : ''}${bet.model_ev_percentage.toFixed(1)}%`,
        description: bet.model_ev_percentage > 0 
          ? `Positive EV bet - long-term profitable play.`
          : `Below expected value threshold.`
      });
    }

    // CLV Analysis
    if (clv !== null) {
      factors.push({
        name: "Closing Line Value",
        icon: clv > 0 ? TrendingUp : TrendingDown,
        value: `${clv > 0 ? '+' : ''}${clv.toFixed(1)}%`,
        description: clv > 0 
          ? `Beat the closing line by ${clv.toFixed(1)}% - indicator of sharp betting.`
          : `Closing line moved against this position by ${Math.abs(clv).toFixed(1)}%.`
      });
    }

    // Kelly Stake Recommendation
    if (bet.kelly_stake_recommended) {
      factors.push({
        name: "Kelly Recommendation",
        icon: Zap,
        value: `${bet.kelly_stake_recommended.toFixed(1)}%`,
        description: `Kelly criterion suggested ${bet.kelly_stake_recommended.toFixed(1)}% of bankroll for optimal growth.`
      });
    }

    return factors;
  };

  const factors = generateAnalysis();

  // Generate summary based on bet outcome
  const getSummary = () => {
    if (bet.status === "won") {
      return `This bet was successful! You profited $${(bet.result_profit || potentialProfit).toFixed(2)} on a $${bet.stake.toFixed(2)} stake, representing a ${((bet.result_profit || potentialProfit) / bet.stake * 100).toFixed(1)}% return.`;
    } else if (bet.status === "lost") {
      return `This bet did not win. You lost your $${bet.stake.toFixed(2)} stake. ${clv && clv > 0 ? "However, you beat the closing line which indicates solid process - variance happens." : "Review the factors that led to this selection."}`;
    } else if (bet.status === "push") {
      return `This bet resulted in a push. Your $${bet.stake.toFixed(2)} stake was returned with no profit or loss.`;
    } else {
      return `This bet is pending. You stand to win $${potentialProfit.toFixed(2)} on a $${bet.stake.toFixed(2)} stake if successful.`;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-3">
            {bet.league && (
              <Badge variant="outline" className="text-xs">
                {bet.league}
              </Badge>
            )}
            <Badge variant="outline" className="text-xs">
              {bet.bet_type}
            </Badge>
            <Badge className={cn("text-xs", status.color, status.bg)}>
              <StatusIcon className="h-3 w-3 mr-1" />
              {status.label}
            </Badge>
          </div>
          <DialogTitle className="text-xl mt-2">
            {bet.match_title}
          </DialogTitle>
          <DialogDescription className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4" />
            Placed: {format(new Date(bet.placed_at), "MMMM d, yyyy 'at' h:mm a")}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-6 pb-4">
            {/* Selection */}
            <div className="p-4 bg-muted/30 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Selection</p>
                  <p className="text-lg font-bold">{bet.selection}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Odds</p>
                  <p className="text-lg font-bold">
                    {bet.odds_at_placement > 0 ? '+' : ''}{Math.round(bet.odds_at_placement)}
                  </p>
                </div>
              </div>
            </div>

            {/* Financial Summary */}
            <div className="grid grid-cols-3 gap-4">
              <div className="p-3 border rounded-lg text-center">
                <p className="text-xs text-muted-foreground">Stake</p>
                <p className="text-lg font-bold">${bet.stake.toFixed(2)}</p>
              </div>
              <div className="p-3 border rounded-lg text-center">
                <p className="text-xs text-muted-foreground">To Win</p>
                <p className="text-lg font-bold text-primary">${potentialProfit.toFixed(2)}</p>
              </div>
              <div className="p-3 border rounded-lg text-center">
                <p className="text-xs text-muted-foreground">Result</p>
                {bet.result_profit !== undefined && bet.result_profit !== null ? (
                  <p className={cn(
                    "text-lg font-bold",
                    bet.result_profit >= 0 ? "text-green-500" : "text-red-500"
                  )}>
                    {bet.result_profit >= 0 ? '+' : ''}{bet.result_profit.toFixed(2)}
                  </p>
                ) : (
                  <p className="text-lg font-bold text-muted-foreground">—</p>
                )}
              </div>
            </div>

            {/* Summary */}
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Info className="h-4 w-4 text-primary" />
                Summary
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {getSummary()}
              </p>
            </div>

            <Separator />

            {/* Betting Analysis */}
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" />
                Bet Analysis
              </h3>
              <div className="grid gap-3">
                {factors.map((factor, index) => (
                  <div 
                    key={index}
                    className="flex items-start gap-3 p-3 border rounded-lg"
                  >
                    <div className="p-2 rounded-full shrink-0 bg-primary/10 text-primary">
                      <factor.icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-sm">{factor.name}</p>
                        <span className="font-bold text-sm">{factor.value}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {factor.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Notes */}
            {bet.notes && (
              <>
                <Separator />
                <div className="space-y-3">
                  <h3 className="font-semibold">Notes</h3>
                  <p className="text-sm text-muted-foreground p-3 bg-muted/30 rounded-lg">
                    {bet.notes}
                  </p>
                </div>
              </>
            )}

            {/* Sportsbook */}
            {bet.sportsbook && (
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <span className="text-sm text-muted-foreground">Sportsbook</span>
                <Badge variant="outline">{bet.sportsbook}</Badge>
              </div>
            )}

            {/* Settlement Info */}
            {bet.settled_at && (
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <span className="text-sm text-muted-foreground">Settled</span>
                <span className="text-sm">
                  {format(new Date(bet.settled_at), "MMM d, yyyy 'at' h:mm a")}
                </span>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
