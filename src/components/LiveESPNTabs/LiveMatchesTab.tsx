
import { Card, CardContent } from "@/components/ui/card";
import MatchCard from "@/components/MatchCard";
import LoadingCardGrid from "../LoadingCardGrid";

interface Props {
  isLoading: boolean;
  liveMatches: any[];
}

const LiveMatchesTab = ({ isLoading, liveMatches }: Props) => {
  if (isLoading) return <LoadingCardGrid />;
  if (liveMatches.length === 0)
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <p>No live matches currently for this league.</p>
        </CardContent>
      </Card>
    );
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {liveMatches.map((match) => (
        <MatchCard key={match.id} match={match} />
      ))}
    </div>
  );
};

export default LiveMatchesTab;
