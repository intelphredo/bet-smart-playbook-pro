import { Match } from "@/types/sports";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format, parseISO } from "date-fns";

interface ScheduleCardProps {
  match: Match;
}

const ScheduleCard = ({ match }: ScheduleCardProps) => {
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
        return <Badge className="bg-red-500 animate-pulse">LIVE</Badge>;
      case 'finished':
        return <Badge variant="outline">Final</Badge>;
      default:
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Scheduled</Badge>;
    }
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <Badge variant="outline">{match.league}</Badge>
          {getStatusBadge(match.status)}
        </div>
        <div className="text-sm text-muted-foreground mb-3">
          {formatDate(match.startTime)}
        </div>
        
        <div className="grid grid-cols-5 gap-2 items-center">
          <div className="col-span-2 flex flex-col items-center text-center">
            <div className="w-10 h-10 bg-navy-50 dark:bg-navy-700 rounded-full flex items-center justify-center mb-1">
              {match.homeTeam.logo ? (
                <img 
                  src={match.homeTeam.logo} 
                  alt={match.homeTeam.name} 
                  className="w-8 h-8 object-contain rounded-full"
                />
              ) : (
                match.homeTeam.shortName.substring(0, 2)
              )}
            </div>
            <div className="text-sm font-medium truncate">{match.homeTeam.shortName}</div>
            <div className="text-xs text-muted-foreground">{match.homeTeam.record}</div>
          </div>
          
          <div className="col-span-1 flex flex-col items-center justify-center">
            {match.status === 'live' || match.status === 'finished' ? (
              <div className="text-lg font-bold">
                {match.score?.home} - {match.score?.away}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">vs</div>
            )}
          </div>
          
          <div className="col-span-2 flex flex-col items-center text-center">
            <div className="w-10 h-10 bg-navy-50 dark:bg-navy-700 rounded-full flex items-center justify-center mb-1">
              {match.awayTeam.logo ? (
                <img 
                  src={match.awayTeam.logo} 
                  alt={match.awayTeam.name} 
                  className="w-8 h-8 object-contain rounded-full"
                />
              ) : (
                match.awayTeam.shortName.substring(0, 2)
              )}
            </div>
            <div className="text-sm font-medium truncate">{match.awayTeam.shortName}</div>
            <div className="text-xs text-muted-foreground">{match.awayTeam.record}</div>
          </div>
        </div>
        
        <div className="mt-3 pt-3 border-t text-xs text-muted-foreground">
          <div className="flex justify-between">
            <div>Venue: {match.homeTeam.name} venue</div>
            <div>
              {match.league === "NBA" ? "ESPN" :
               match.league === "NFL" ? "FOX" :
               match.league === "MLB" ? "MLB" :
               match.league === "NHL" ? "NHL" : "TV"}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ScheduleCard;
