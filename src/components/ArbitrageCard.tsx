import { ArbitrageOpportunity } from "@/types/sports";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ArrowUp, TrendingUp } from "lucide-react";
import ArbitrageTable from "./ArbitrageTable";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Info } from "lucide-react";

interface ArbitrageCardProps {
  opportunity: ArbitrageOpportunity;
}

const ArbitrageCard = ({ opportunity }: ArbitrageCardProps) => {
  const formatPercentage = (num: number) => {
    return `${num.toFixed(1)}%`;
  };
  
  const formatOdds = (odds: number) => {
    return odds >= 2 ? `+${Math.round((odds - 1) * 100)}` : `-${Math.round(100 / (odds - 1))}`;
  };
  
  const timeUntilStart = () => {
    const now = new Date();
    const start = new Date(opportunity.match.startTime);
    const diff = start.getTime() - now.getTime();
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) {
      return `${days}d ${hours}h`;
    }
    return `${hours}h`;
  };

  return (
    <Card className="overflow-hidden border-gold-200 dark:border-gold-800">
      <CardHeader className="p-3 bg-navy-50 dark:bg-navy-700">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-bold">{opportunity.match.homeTeam} vs {opportunity.match.awayTeam}</span>
              <Badge variant="outline" className="text-xs font-normal bg-white dark:bg-navy-600">
                {opportunity.match.league}
              </Badge>
            </div>
            <span className="text-sm text-muted-foreground">Starts in: {timeUntilStart()}</span>
          </div>
          <Badge className="bg-gold-500 text-navy-900">
            {formatPercentage(opportunity.potentialProfit)} Profit
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <div className="mb-4">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center text-sm">
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              <span>
                Arbitrage:&nbsp;
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="underline cursor-help">{formatPercentage(100 - opportunity.arbitragePercentage)}</span>
                  </TooltipTrigger>
                  <TooltipContent>
                    The lower this number, the higher your profit opportunity. Below 100% is positive.
                  </TooltipContent>
                </Tooltip>
              </span>
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm">
                  <Info size={16} className="mr-1" />
                  How it works
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-4">
                <h4 className="font-medium mb-2">What is Arbitrage Betting?</h4>
                <ul className="text-sm mb-2 list-disc list-inside space-y-1">
                  <li>
                    Arbitrage betting means betting on <b>each outcome at different sportsbooks</b> to guarantee profit.
                  </li>
                  <li>
                    Our algorithm calculates exactly <b>how much to bet on each side</b> so you always win.
                  </li>
                  <li>
                    The profit shown is your <b>guaranteed ROI</b> on total stake.
                  </li>
                </ul>
                <div className="text-xs">
                  Arbitrage %: <span className="font-bold">{opportunity.arbitragePercentage}%</span>. <br />
                  Profit: <span className="font-bold">{formatPercentage(opportunity.potentialProfit)}</span>
                </div>
              </PopoverContent>
            </Popover>
          </div>
          <ArbitrageTable opportunity={opportunity} />
        </div>
        <div className="flex justify-between">
          <Button variant="outline" size="sm" className="w-1/2 mr-1">
            View Details
          </Button>
          <Button size="sm" className="w-1/2 ml-1 bg-gold-500 hover:bg-gold-600 text-navy-900">
            Place Bets
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ArbitrageCard;
