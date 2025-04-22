
import { Card, CardContent } from "@/components/ui/card";
import MatchCard from "@/components/MatchCard";
import LoadingCardGrid from "../LoadingCardGrid";
import { Match } from "@/types/sports";
import { format, isToday, isTomorrow, startOfDay, addDays, parseISO } from "date-fns";

interface Props {
  isLoading: boolean;
  matches: Match[];
}

interface GroupedMatches {
  today: Match[];
  tomorrow: Match[];
  thisWeek: Match[];
  later: Match[];
}

const UpcomingGamesTab = ({ isLoading, matches }: Props) => {
  if (isLoading) return <LoadingCardGrid />;
  
  const groupMatches = (matches: Match[]): GroupedMatches => {
    const today = startOfDay(new Date());
    const tomorrow = addDays(today, 1);
    const weekEnd = addDays(today, 7);
    
    return matches.reduce((acc: GroupedMatches, match) => {
      const matchDate = parseISO(match.startTime);
      
      if (isToday(matchDate)) {
        acc.today.push(match);
      } else if (isTomorrow(matchDate)) {
        acc.tomorrow.push(match);
      } else if (matchDate < weekEnd) {
        acc.thisWeek.push(match);
      } else {
        acc.later.push(match);
      }
      
      return acc;
    }, { today: [], tomorrow: [], thisWeek: [], later: [] });
  };

  const grouped = groupMatches(matches);

  if (Object.values(grouped).every(group => group.length === 0)) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <p>No upcoming games scheduled.</p>
        </CardContent>
      </Card>
    );
  }

  const renderSection = (title: string, matches: Match[]) => {
    if (matches.length === 0) return null;
    
    return (
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">{title}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {matches.map((match) => (
            <MatchCard key={match.id} match={match} />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {renderSection("Today's Games", grouped.today)}
      {renderSection("Tomorrow's Games", grouped.tomorrow)}
      {renderSection("This Week", grouped.thisWeek)}
      {renderSection("Upcoming Games", grouped.later)}
    </div>
  );
};

export default UpcomingGamesTab;
