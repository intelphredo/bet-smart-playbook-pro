
import { ArbitrageOpportunity } from "@/types/sports";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ArrowUp, TrendingUp } from "lucide-react";

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
              <span>Arbitrage: {formatPercentage(100 - opportunity.arbitragePercentage)}</span>
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm">How it works</Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-4">
                <h4 className="font-medium mb-2">What is Arbitrage Betting?</h4>
                <p className="text-sm mb-2">
                  Arbitrage betting involves placing bets on all possible outcomes of an event across different bookmakers to guarantee a profit.
                </p>
                <p className="text-sm">
                  This opportunity has an arbitrage percentage of {opportunity.arbitragePercentage}%, meaning you'll make {formatPercentage(opportunity.potentialProfit)} profit on your total stake.
                </p>
              </PopoverContent>
            </Popover>
          </div>
          
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Bookmaker</TableHead>
                <TableHead>Team</TableHead>
                <TableHead>Stake %</TableHead>
                <TableHead>Odds</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {opportunity.bettingStrategy.map((strategy, idx) => (
                <TableRow key={idx}>
                  <TableCell className="font-medium">{strategy.bookmaker}</TableCell>
                  <TableCell>{strategy.team === 'home' ? opportunity.match.homeTeam : 
                             strategy.team === 'away' ? opportunity.match.awayTeam : 'Draw'}</TableCell>
                  <TableCell>{formatPercentage(strategy.stakePercentage)}</TableCell>
                  <TableCell>{strategy.odds} ({formatOdds(strategy.odds)})</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
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
