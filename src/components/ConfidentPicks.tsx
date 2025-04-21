
import React, { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { playerProps } from '@/data/playerPropData';
import { PlayerTrendAnalysis } from '@/types/playerAnalytics';
import { getMostConfidentPicks } from '@/utils/playerAnalysisAlgorithm';
import ConfidentPicksCard from './ConfidentPicksCard';
import { Badge } from '@/components/ui/badge';
import { Star } from 'lucide-react';

const ConfidentPicks = () => {
  const confidentPicks: PlayerTrendAnalysis[] = useMemo(() => {
    return getMostConfidentPicks(playerProps, 65);
  }, [playerProps]);

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
          Our unique algorithm analyzes player streaks, historical matchups and past performance to identify high-confidence picks
        </p>
      </div>
      
      {confidentPicks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {confidentPicks.map(analysis => (
            <ConfidentPicksCard key={`${analysis.playerId}-${analysis.propType}`} analysis={analysis} />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6 text-center">
            <p>No high-confidence picks available right now.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ConfidentPicks;
