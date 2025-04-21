
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Star } from 'lucide-react';
import { getTopLeaguePicks } from '@/utils/topLeaguePickRecommendation';
import ConfidentPicksList from './ConfidentPicksList';

const ConfidentPicks = () => {
  const confidentPicks = React.useMemo(() => getTopLeaguePicks(), []);
  if (!confidentPicks.length) {
    return null;
  }
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h2 className="text-2xl font-bold">Smart Algorithm Picks</h2>
        <Badge className="bg-gold-500 text-navy-900">New</Badge>
      </div>
      <div className="flex items-center gap-1 mb-4">
        <Star className="h-4 w-4 text-gold-500" />
        <p className="text-sm text-muted-foreground">
          Our unique algorithm analyzes player streaks, historical matchups and past performance to identify high-confidence picks for each league, matched to the Algorithm Performance stats.
        </p>
      </div>
      <ConfidentPicksList picks={confidentPicks} />
    </div>
  );
};
export default ConfidentPicks;
