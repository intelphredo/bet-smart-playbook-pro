
import { Match } from "@/types/sports";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format, parseISO } from "date-fns";

interface ScheduleTableProps {
  matches: Match[];
}

const ScheduleTable = ({ matches }: ScheduleTableProps) => {
  const formatDate = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      return format(date, 'EEE, MMM d • h:mm a');
    } catch (e) {
      return dateString;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'live':
        return <Badge className="bg-red-500">LIVE</Badge>;
      case 'finished':
        return <Badge variant="outline">Final</Badge>;
      default:
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Scheduled</Badge>;
    }
  };

  const formatOdds = (odds: number) => {
    return odds >= 2 ? `+${Math.round((odds - 1) * 100)}` : `-${Math.round(100 / (odds - 1))}`;
  };

  const getFanDuelOdds = (match: Match) => {
    if (!match.liveOdds) return null;
    
    const fanDuelOdds = match.liveOdds.find(odd => 
      odd.sportsbook.name.toLowerCase() === "fanduel"
    );
    
    if (!fanDuelOdds) return null;
    
    return (
      <div className="text-xs mt-2 border-t pt-1">
        <div className="font-semibold text-green-600">FanDuel Odds</div>
        <div className="flex justify-between">
          <span>{formatOdds(fanDuelOdds.homeWin)}</span>
          {fanDuelOdds.draw !== undefined && (
            <span>{formatOdds(fanDuelOdds.draw)}</span>
          )}
          <span>{formatOdds(fanDuelOdds.awayWin)}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[120px]">Date & Time</TableHead>
            <TableHead>League</TableHead>
            <TableHead>Teams</TableHead>
            <TableHead className="w-[100px]">Status</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Broadcast</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {matches.map((match) => (
            <TableRow key={match.id}>
              <TableCell className="font-medium">
                {formatDate(match.startTime)}
              </TableCell>
              <TableCell>
                <Badge variant="outline">{match.league}</Badge>
              </TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    {match.homeTeam.logo && (
                      <img 
                        src={match.homeTeam.logo} 
                        alt={match.homeTeam.name} 
                        className="w-5 h-5 object-contain"
                      />
                    )}
                    <span>{match.homeTeam.name} {match.homeTeam.record ? `(${match.homeTeam.record})` : ''}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    {match.awayTeam.logo && (
                      <img 
                        src={match.awayTeam.logo} 
                        alt={match.awayTeam.name} 
                        className="w-5 h-5 object-contain"
                      />
                    )}
                    <span>{match.awayTeam.name} {match.awayTeam.record ? `(${match.awayTeam.record})` : ''}</span>
                  </div>
                  {match.status === 'live' || match.status === 'finished' ? (
                    <div className="mt-1 text-sm font-medium">
                      {match.score?.home} - {match.score?.away}
                      {match.score?.period && <span className="text-xs text-muted-foreground ml-2">({match.score.period})</span>}
                    </div>
                  ) : null}
                  {getFanDuelOdds(match)}
                </div>
              </TableCell>
              <TableCell>{getStatusBadge(match.status)}</TableCell>
              <TableCell>
                {/* ESPN API doesn't provide location, adding placeholder */}
                {match.homeTeam.name} venue
              </TableCell>
              <TableCell>
                {/* ESPN API doesn't provide broadcast info, adding placeholder */}
                {match.league === "NBA" ? "ESPN, NBA TV" :
                 match.league === "NFL" ? "FOX, CBS" :
                 match.league === "MLB" ? "MLB Network" :
                 match.league === "NHL" ? "NHL Network" : "Various Networks"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default ScheduleTable;
