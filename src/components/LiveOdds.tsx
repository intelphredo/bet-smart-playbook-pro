import { LiveOdds as LiveOddsType } from "@/types/sports";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDistanceToNow, parseISO } from "date-fns";
import { Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SPORTSBOOK_LOGOS } from "@/utils/sportsbook";

interface LiveOddsProps {
  odds: LiveOddsType[];
}

const LiveOdds = ({ odds }: LiveOddsProps) => {
  const formatOdds = (odds: number) => {
    return odds >= 2 ? `+${Math.round((odds - 1) * 100)}` : `-${Math.round(100 / (odds - 1))}`;
  };

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

  const bestOdds = getBestOdds();

  if (!odds || odds.length === 0) {
    return null;
  }

  return (
    <Card className="mt-4">
      <CardContent className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Live Odds</h3>
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
            {odds.map((odd) => (
              <TableRow key={odd.sportsbook.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 flex items-center justify-center rounded-md bg-white dark:bg-gray-800 p-1">
                      <img 
                        src={odd.sportsbook.logo || SPORTSBOOK_LOGOS[odd.sportsbook.id as keyof typeof SPORTSBOOK_LOGOS]} 
                        alt={odd.sportsbook.name}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <span className="font-medium">{odd.sportsbook.name}</span>
                  </div>
                </TableCell>
                <TableCell className={odd.homeWin === bestOdds.home ? "font-bold text-green-600" : ""}>
                  {formatOdds(odd.homeWin)}
                </TableCell>
                {odd.draw !== undefined && (
                  <TableCell className={odd.draw === bestOdds.draw ? "font-bold text-green-600" : ""}>
                    {formatOdds(odd.draw)}
                  </TableCell>
                )}
                <TableCell className={odd.awayWin === bestOdds.away ? "font-bold text-green-600" : ""}>
                  {formatOdds(odd.awayWin)}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {formatTime(odd.updatedAt)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default LiveOdds;
