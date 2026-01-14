
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Star } from 'lucide-react';
import { getTopTeamPicks } from '@/utils/topTeamPickRecommendation';
import ConfidentTeamPickList from './ConfidentTeamPickList';
import { useESPNData } from '@/hooks/useESPNData';
import { League } from "@/types/sports";
import { InfoExplainer } from '@/components/ui/InfoExplainer';

const ConfidentPicks = () => {
  // Show top confident team pick PER LEAGUE -- live and upcoming matches (like main page)
  const { upcomingMatches, liveMatches } = useESPNData({ league: "ALL" as League, refreshInterval: 60000 });
  // For all matches that have prediction
  const allMatchesWithPred = React.useMemo(
    () => [...(upcomingMatches || []), ...(liveMatches || [])].filter(m => !!m.prediction && typeof m.prediction.confidence === "number"),
    [upcomingMatches, liveMatches]
  );
  const confidentPicks = React.useMemo(() => getTopTeamPicks(allMatchesWithPred), [allMatchesWithPred]);
  if (!confidentPicks.length) {
    return null;
  }
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h2 className="text-2xl font-bold">Smart Algorithm Picks</h2>
        <InfoExplainer term="confidence" size="md" />
        <Badge className="bg-gold-500 text-navy-900">New</Badge>
      </div>
      <div className="flex items-center gap-1 mb-4">
        <Star className="h-4 w-4 text-gold-500" />
        <p className="text-sm text-muted-foreground">
          Our unique algorithm analyzes team matchups, strengths and past performance to identify high-confidence team picks for each league.
        </p>
      </div>
      <ConfidentTeamPickList picks={confidentPicks} />
    </div>
  );
};
export default ConfidentPicks;
