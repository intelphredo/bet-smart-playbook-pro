import React, { memo, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Star } from 'lucide-react';
import { getTopTeamPicks } from '@/utils/topTeamPickRecommendation';
import ConfidentTeamPickList from './ConfidentTeamPickList';
import { Match } from "@/types/sports";
import { InfoExplainer } from '@/components/ui/InfoExplainer';

interface ConfidentPicksProps {
  matches?: Match[];
}

// Memoized to prevent re-renders when parent state changes
const ConfidentPicks = memo(function ConfidentPicks({ matches = [] }: ConfidentPicksProps) {
  // Filter matches that have predictions - use passed matches instead of fetching independently
  const allMatchesWithPred = useMemo(
    () => matches.filter(m => !!m.prediction && typeof m.prediction.confidence === "number"),
    [matches]
  );
  
  const confidentPicks = useMemo(() => getTopTeamPicks(allMatchesWithPred), [allMatchesWithPred]);
  
  if (!confidentPicks.length) {
    return null;
  }
  
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h2 className="text-2xl font-bold">Smart Algorithm Picks</h2>
        <InfoExplainer term="confidence" size="md" />
        <Badge className="bg-primary text-primary-foreground">New</Badge>
      </div>
      <div className="flex items-center gap-1 mb-4">
        <Star className="h-4 w-4 text-primary" />
        <p className="text-sm text-muted-foreground">
          Our unique algorithm analyzes team matchups, strengths and past performance to identify high-confidence team picks for each league.
        </p>
      </div>
      <ConfidentTeamPickList picks={confidentPicks} />
    </div>
  );
});

export default ConfidentPicks;
