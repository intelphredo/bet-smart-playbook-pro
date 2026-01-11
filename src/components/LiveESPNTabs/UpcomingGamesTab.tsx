import { Card, CardContent } from "@/components/ui/card";
import VirtualizedMatchGrid from "../VirtualizedMatchGrid";
import LoadingCardGrid from "../LoadingCardGrid";
import { Match } from "@/types/sports";
import { useMemo } from "react";
import { isToday, isTomorrow, startOfDay, addDays, parseISO } from "date-fns";

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
  
  const grouped = useMemo(() => {
    const today = startOfDay(new Date());
    const tomorrow = addDays(today, 1);
    const weekEnd = addDays(today, 7);
    
    return matches.reduce<GroupedMatches>((acc, match) => {
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
  }, [matches]);

  const totalMatches = grouped.today.length + grouped.tomorrow.length + grouped.thisWeek.length + grouped.later.length;

  if (totalMatches === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <p className="text-muted-foreground">No upcoming games scheduled.</p>
        </CardContent>
      </Card>
    );
  }

  // Combine all matches with section headers for virtualized display
  // For very large lists, show a max count with "show more"
  const MAX_PER_SECTION = 12;

  const renderSection = (title: string, sectionMatches: Match[]) => {
    if (sectionMatches.length === 0) return null;
    
    const displayMatches = sectionMatches.slice(0, MAX_PER_SECTION);
    const hasMore = sectionMatches.length > MAX_PER_SECTION;
    
    return (
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">{title}</h3>
          <span className="text-sm text-muted-foreground">
            {sectionMatches.length} game{sectionMatches.length !== 1 ? 's' : ''}
          </span>
        </div>
        <VirtualizedMatchGrid 
          matches={displayMatches}
          estimatedCardHeight={280}
        />
        {hasMore && (
          <p className="text-sm text-muted-foreground text-center mt-3">
            + {sectionMatches.length - MAX_PER_SECTION} more games
          </p>
        )}
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
