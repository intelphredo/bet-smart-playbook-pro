import { ArbitrageOpportunity } from "@/types";
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
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead>
          <div className="flex items-center gap-1">
            Bookmaker
            <Tooltip>
              <TooltipTrigger asChild>
                <Info size={14} className="text-accentblue-500 cursor-pointer" />
              </TooltipTrigger>
              <TooltipContent>
                The betting site providing the odds for each bet.
              </TooltipContent>
            </Tooltip>
          </div>
        </TableHead>
        <TableHead>
          <div className="flex items-center gap-1">
            Team
            <Tooltip>
              <TooltipTrigger asChild>
                <Info size={14} className="text-accentblue-500 cursor-pointer" />
              </TooltipTrigger>
              <TooltipContent>
                The side or draw to bet on for this leg of the arbitrage.
              </TooltipContent>
            </Tooltip>
          </div>
        </TableHead>
        <TableHead>
          <div className="flex items-center gap-1">
            Stake&nbsp;%
            <Tooltip>
              <TooltipTrigger asChild>
                <Info size={14} className="text-accentblue-500 cursor-pointer" />
              </TooltipTrigger>
              <TooltipContent>
                Percentage of your total stake to place on this outcome.
              </TooltipContent>
            </Tooltip>
          </div>
        </TableHead>
        <TableHead>
          <div className="flex items-center gap-1">
            Odds
            <Tooltip>
              <TooltipTrigger asChild>
                <Info size={14} className="text-accentblue-500 cursor-pointer" />
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
        <TableRow key={idx}>
          <TableCell className="font-medium">{strategy.bookmaker}</TableCell>
          <TableCell>
            {strategy.team === "home"
              ? opportunity.match.homeTeam
              : strategy.team === "away"
              ? opportunity.match.awayTeam
              : "Draw"}
          </TableCell>
          <TableCell>
            {formatPercentage(strategy.stakePercentage)}
          </TableCell>
          <TableCell>
            <div className="flex items-center gap-1">
              {strategy.odds}
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="text-xs underline cursor-help">( {formatOdds(strategy.odds)} )</span>
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
);

export default ArbitrageTable;
