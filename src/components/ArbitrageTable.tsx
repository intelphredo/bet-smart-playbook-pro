
import { ArbitrageOpportunity } from "@/types/sports";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Info } from "lucide-react";

interface ArbitrageTableProps {
  opportunity: ArbitrageOpportunity;
}

const formatPercentage = (num: number) => `${num.toFixed(1)}%`;

const formatOdds = (odds: number) => {
  return odds >= 2 ? `+${Math.round((odds - 1) * 100)}` : `-${Math.round(100 / (odds - 1))}`;
};

const ArbitrageTable = ({ opportunity }: ArbitrageTableProps) => (
  <div className="rounded-xl border border-primary/20 overflow-hidden bg-gradient-to-br from-card via-card to-primary/5">
    <Table>
      <TableHeader>
        <TableRow className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-b border-primary/10">
          <TableHead>
            <div className="flex items-center gap-1.5 text-foreground font-semibold">
              Bookmaker
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info size={14} className="text-primary cursor-pointer" />
                </TooltipTrigger>
                <TooltipContent>
                  The betting site providing the odds for each bet.
                </TooltipContent>
              </Tooltip>
            </div>
          </TableHead>
          <TableHead>
            <div className="flex items-center gap-1.5 text-foreground font-semibold">
              Team
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info size={14} className="text-primary cursor-pointer" />
                </TooltipTrigger>
                <TooltipContent>
                  The side or draw to bet on for this leg of the arbitrage.
                </TooltipContent>
              </Tooltip>
            </div>
          </TableHead>
          <TableHead>
            <div className="flex items-center gap-1.5 text-foreground font-semibold">
              Stake&nbsp;%
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info size={14} className="text-primary cursor-pointer" />
                </TooltipTrigger>
                <TooltipContent>
                  Percentage of your total stake to place on this outcome.
                </TooltipContent>
              </Tooltip>
            </div>
          </TableHead>
          <TableHead>
            <div className="flex items-center gap-1.5 text-foreground font-semibold">
              Odds
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info size={14} className="text-primary cursor-pointer" />
                </TooltipTrigger>
                <TooltipContent>
                  Odds offered, shown in decimal (and American in parentheses).
                </TooltipContent>
              </Tooltip>
            </div>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {opportunity.bettingStrategy.map((strategy, idx) => (
          <TableRow key={idx} className="hover:bg-primary/5 transition-colors border-b border-border/30">
            <TableCell className="font-medium text-foreground">{strategy.bookmaker}</TableCell>
            <TableCell className="text-foreground">
              {strategy.team === "home"
                ? opportunity.match.homeTeam
                : strategy.team === "away"
                ? opportunity.match.awayTeam
                : "Draw"}
            </TableCell>
            <TableCell>
              <span className="px-2 py-1 rounded-md bg-primary/10 text-primary font-semibold text-sm">
                {formatPercentage(strategy.stakePercentage)}
              </span>
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <span className="font-mono font-semibold text-foreground">{strategy.odds}</span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="text-xs text-primary/70 underline cursor-help">
                      ({formatOdds(strategy.odds)})
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    American style odds: {formatOdds(strategy.odds)}
                  </TooltipContent>
                </Tooltip>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </div>
);

export default ArbitrageTable;

