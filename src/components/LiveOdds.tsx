
import { LiveOdds as LiveOddsType } from "@/types/sports";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDistanceToNow, parseISO } from "date-fns";

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

  return (
    <Card className="mt-4">
      <CardContent className="p-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Sportsbook</TableHead>
              <TableHead>Home</TableHead>
              {odds[0]?.draw !== undefined && <TableHead>Draw</TableHead>}
              <TableHead>Away</TableHead>
              <TableHead>Last Update</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {odds.map((odd) => (
              <TableRow key={odd.sportsbook.id}>
                <TableCell className="font-medium">{odd.sportsbook.name}</TableCell>
                <TableCell>{formatOdds(odd.homeWin)}</TableCell>
                {odd.draw !== undefined && (
                  <TableCell>{formatOdds(odd.draw)}</TableCell>
                )}
                <TableCell>{formatOdds(odd.awayWin)}</TableCell>
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
