
import { Button } from '@/components/ui/button';
import { League } from '@/types/sports';
import LeagueRegistry from '@/types/LeagueRegistry';
import { useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface LeagueSelectorProps {
  selectedLeague: League | string | 'ALL';
  onSelectLeague: (league: League | string | 'ALL') => void;
  showAllOption?: boolean;
  maxDisplayedLeagues?: number;
  compact?: boolean;
}

const LeagueSelector = ({ 
  selectedLeague, 
  onSelectLeague,
  showAllOption = true,
  maxDisplayedLeagues = 6,
  compact = false
}: LeagueSelectorProps) => {
  const [showMore, setShowMore] = useState(false);
  
  // Get leagues from registry
  const registeredLeagues = LeagueRegistry.getActiveLeagues();
  
  // Determine which leagues to display
  const visibleLeagues = showMore ? registeredLeagues : registeredLeagues.slice(0, maxDisplayedLeagues);
  
  return (
    <div className="flex flex-col gap-2 animate-fade-in">
      <ScrollArea className={compact ? "max-h-[200px]" : undefined}>
        <div className="flex flex-wrap items-center gap-2 py-2">
          {showAllOption && (
            <Button
              key="all"
              size="sm"
              variant={selectedLeague === 'ALL' ? "default" : "outline"}
              className={`rounded-full transition-all ${
                selectedLeague === 'ALL'
                  ? "bg-navy-500 text-white"
                  : "hover:bg-navy-50"
              } ${compact ? "px-2 py-1 text-xs" : ""}`}
              onClick={() => onSelectLeague('ALL')}
            >
              All Sports
            </Button>
          )}
          
          {visibleLeagues.map((league) => (
            <Button
              key={league.id}
              size="sm"
              variant={selectedLeague === league.id ? "default" : "outline"}
              className={`rounded-full transition-all ${
                selectedLeague === league.id
                  ? "bg-navy-500 text-white"
                  : "hover:bg-navy-50"
              } ${compact ? "px-2 py-1 text-xs" : ""}`}
              onClick={() => onSelectLeague(league.id)}
            >
              {league.shortName || league.name}
            </Button>
          ))}
        </div>
      </ScrollArea>
      
      {registeredLeagues.length > maxDisplayedLeagues && !showMore && !compact && (
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setShowMore(true)}
          className="self-start text-xs"
        >
          + Show more leagues
        </Button>
      )}
    </div>
  );
};

export default LeagueSelector;
