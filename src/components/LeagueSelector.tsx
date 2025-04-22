
import { useState } from 'react';
import { League } from '@/types';
import { Button } from '@/components/ui/button';

interface LeagueSelectorProps {
  selectedLeague: League | 'ALL';
  onSelectLeague: (league: League | 'ALL') => void;
}

const leagues = [
  { id: 'ALL', name: 'All Sports' },
  { id: 'NBA', name: 'NBA' },
  { id: 'NFL', name: 'NFL' },
  { id: 'MLB', name: 'MLB' },
  { id: 'NHL', name: 'NHL' },
  { id: 'SOCCER', name: 'Soccer' }
] as const;

const LeagueSelector = ({ selectedLeague, onSelectLeague }: LeagueSelectorProps) => {
  return (
    <div className="flex flex-wrap items-center gap-2 py-2 animate-fade-in">
      {leagues.map((league) => (
        <Button
          key={league.id}
          size="sm"
          variant={selectedLeague === league.id ? "default" : "outline"}
          className={`rounded-full transition-all ${
            selectedLeague === league.id
              ? "bg-navy-500 text-white"
              : "hover:bg-navy-50"
          }`}
          onClick={() => onSelectLeague(league.id as League | 'ALL')}
        >
          {league.name}
        </Button>
      ))}
    </div>
  );
};

export default LeagueSelector;
