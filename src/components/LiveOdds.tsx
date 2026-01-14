import { LiveOdds as LiveOddsType } from "@/types/sports";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDistanceToNow, parseISO } from "date-fns";
import { Trophy, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SPORTSBOOK_LOGOS, sortOddsByPriority, PRIMARY_SPORTSBOOK, formatMoneylineOdds } from "@/utils/sportsbook";
import { cn } from "@/lib/utils";

interface LiveOddsProps {
  odds: LiveOddsType[];
}

const LiveOdds = ({ odds }: LiveOddsProps) => {

  const formatTime = (timeString: string) => {
    try {
      return formatDistanceToNow(parseISO(timeString), { addSuffix: true });
    } catch (e) {
      return timeString;
    }
  };

  const getBestOdds = () => {
    const bestOdds = {
      home: Math.max(...odds.map(o => o.homeWin)),
      away: Math.max(...odds.map(o => o.awayWin)),
      draw: odds[0]?.draw !== undefined ? Math.max(...odds.filter(o => o.draw !== undefined).map(o => o.draw!)) : undefined
    };
    return bestOdds;
  };

  const isPrimarySportsbook = (sportsbookId: string) => 
    sportsbookId.toLowerCase().includes(PRIMARY_SPORTSBOOK);

  const bestOdds = getBestOdds();
  
  // Sort odds with FanDuel first
  const sortedOdds = sortOddsByPriority(odds);

  if (!odds || odds.length === 0) {
    return null;
  }

  return (
    <Card className="mt-4">
      <CardContent className="p-4">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold">Live Odds</h3>
            <Badge variant="secondary" className="flex items-center gap-1">
              <Star className="h-3 w-3 fill-primary text-primary" />
              FanDuel Primary
            </Badge>
          </div>
          <Badge variant="outline" className="flex items-center gap-1">
            <Trophy className="h-3 w-3" />
            Best Value Available
          </Badge>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">Sportsbook</TableHead>
              <TableHead>Home</TableHead>
              {odds[0]?.draw !== undefined && <TableHead>Draw</TableHead>}
              <TableHead>Away</TableHead>
              <TableHead>Last Update</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedOdds.map((odd, index) => {
              const isPrimary = isPrimarySportsbook(odd.sportsbook.id);
              
              return (
                <TableRow 
                  key={`${odd.sportsbook.id}-${index}`}
                  className={cn(isPrimary && "bg-primary/5")}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-8 h-8 flex items-center justify-center rounded-md bg-white dark:bg-gray-800 p-1",
                        isPrimary && "ring-2 ring-primary"
                      )}>
                        <img 
                          src={odd.sportsbook.logo || SPORTSBOOK_LOGOS[odd.sportsbook.id as keyof typeof SPORTSBOOK_LOGOS]} 
                          alt={odd.sportsbook.name}
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <span className={cn("font-medium", isPrimary && "text-primary")}>
                        {odd.sportsbook.name}
                      </span>
                      {isPrimary && (
                        <Star className="w-4 h-4 text-primary fill-primary" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell className={odd.homeWin === bestOdds.home ? "font-bold text-green-600" : ""}>
                    {formatMoneylineOdds(odd.homeWin)}
                  </TableCell>
                  {odd.draw !== undefined && (
                    <TableCell className={odd.draw === bestOdds.draw ? "font-bold text-green-600" : ""}>
                      {formatMoneylineOdds(odd.draw)}
                    </TableCell>
                  )}
                  <TableCell className={odd.awayWin === bestOdds.away ? "font-bold text-green-600" : ""}>
                    {formatMoneylineOdds(odd.awayWin)}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {formatTime(odd.updatedAt)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default LiveOdds;
