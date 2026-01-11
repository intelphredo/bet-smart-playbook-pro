import { Card, CardContent } from "@/components/ui/card";
import VirtualizedMatchGrid from "../VirtualizedMatchGrid";
import LoadingCardGrid from "../LoadingCardGrid";
import { Match } from "@/types/sports";

interface Props {
  isLoading: boolean;
  liveMatches: Match[];
}

const LiveMatchesTab = ({ isLoading, liveMatches }: Props) => {
  if (isLoading) return <LoadingCardGrid />;
  
  if (liveMatches.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <p className="text-muted-foreground">No live matches currently for this league.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <VirtualizedMatchGrid 
      matches={liveMatches}
      estimatedCardHeight={280}
    />
  );
};

export default LiveMatchesTab;
