
import { ArbitrageOpportunity } from "@/types/sports";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Info } from "lucide-react";

interface Props {
  opportunity: ArbitrageOpportunity;
}

const formatPercentage = (num: number) => `${num.toFixed(1)}%`;

const formatOdds = (odds: number) => odds >= 2 ? `+${Math.round((odds - 1) * 100)}` : `-${Math.round(100 / (odds - 1))}`;

const ArbitrageOpportunityCard = ({ opportunity }: Props) => {
  return (
    <Card className="hover:shadow-lg transition duration-200 flex flex-col">
      <CardHeader className="pb-2 flex flex-row justify-between items-start">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-navy-800 dark:text-navy-100">{opportunity.match.homeTeam} vs {opportunity.match.awayTeam}</span>
            {opportunity.isPremium && (
              <Badge className="bg-gold-500 text-navy-900">Premium</Badge>
            )}
            <Tooltip>
              <TooltipTrigger asChild>
                <Info size={16} className="text-accentblue-500 ml-2 cursor-pointer" />
              </TooltipTrigger>
              <TooltipContent>
                Arbitrage betting lets you guarantee profit by simultaneously betting on all possible outcomes at different sportsbooks where the odds allow. 
              </TooltipContent>
            </Tooltip>
          </div>
          <div className="text-sm text-muted-foreground">{opportunity.match.league} &bull; {new Date(opportunity.match.startTime).toLocaleString()}</div>
        </div>
        <div className="flex flex-col items-end">
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge className="bg-green-100 text-green-800 px-2 cursor-pointer">
                {formatPercentage(opportunity.arbitragePercentage)} ROI
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              Percentage return on investment from this arbitrage bet—guaranteed if all bets are placed correctly.
            </TooltipContent>
          </Tooltip>
          <div className="text-xs mt-1 text-green-700">${opportunity.potentialProfit.toFixed(2)} profit</div>
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <div className="flex items-center gap-1">
                  Bookmaker
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info size={13} className="text-accentblue-500 cursor-pointer" />
                    </TooltipTrigger>
                    <TooltipContent>
                      Where to make each bet for the best odds.
                    </TooltipContent>
                  </Tooltip>
                </div>
              </TableHead>
              <TableHead>
                <div className="flex items-center gap-1">
                  Team
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info size={13} className="text-accentblue-500 cursor-pointer" />
                    </TooltipTrigger>
                    <TooltipContent>
                      Which side/outcome to bet for this bookmaker.
                    </TooltipContent>
                  </Tooltip>
                </div>
              </TableHead>
              <TableHead>
                <div className="flex items-center gap-1">
                  Stake %
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info size={13} className="text-accentblue-500 cursor-pointer" />
                    </TooltipTrigger>
                    <TooltipContent>
                      Portion of your total stake to bet on this outcome.
                    </TooltipContent>
                  </Tooltip>
                </div>
              </TableHead>
              <TableHead>
                <div className="flex items-center gap-1">
                  Odds
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info size={13} className="text-accentblue-500 cursor-pointer" />
                    </TooltipTrigger>
                    <TooltipContent>
                      Decimal odds for this outcome; hover for American odds.
                    </TooltipContent>
                  </Tooltip>
                </div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {opportunity.bettingStrategy.map((leg, idx) => (
              <TableRow key={idx}>
                <TableCell className="font-semibold">{leg.bookmaker}</TableCell>
                <TableCell>
                  {leg.team === "home" ? opportunity.match.homeTeam : leg.team === "away" ? opportunity.match.awayTeam : "Draw"}
                </TableCell>
                <TableCell>{formatPercentage(leg.stakePercentage)}</TableCell>
                <TableCell>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="underline cursor-pointer">{leg.odds}</span>
                    </TooltipTrigger>
                    <TooltipContent>
                      American odds: <span className="font-mono">{formatOdds(leg.odds)}</span>
                    </TooltipContent>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default ArbitrageOpportunityCard;

