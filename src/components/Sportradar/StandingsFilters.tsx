import { SportLeague } from '@/types/sportradar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { cn } from '@/lib/utils';

export type StandingsView = 'overall' | 'conference' | 'division';

interface StandingsFiltersProps {
  league: SportLeague;
  view: StandingsView;
  onViewChange: (view: StandingsView) => void;
  conference: string;
  onConferenceChange: (conference: string) => void;
  division: string;
  onDivisionChange: (division: string) => void;
}

const LEAGUE_STRUCTURE: Record<string, {
  conferences: string[];
  divisions: Record<string, string[]>;
}> = {
  NBA: {
    conferences: ['Eastern', 'Western'],
    divisions: {
      Eastern: ['Atlantic', 'Central', 'Southeast'],
      Western: ['Northwest', 'Pacific', 'Southwest'],
    },
  },
  NFL: {
    conferences: ['AFC', 'NFC'],
    divisions: {
      AFC: ['East', 'North', 'South', 'West'],
      NFC: ['East', 'North', 'South', 'West'],
    },
  },
  MLB: {
    conferences: ['American', 'National'],
    divisions: {
      American: ['East', 'Central', 'West'],
      National: ['East', 'Central', 'West'],
    },
  },
  NHL: {
    conferences: ['Eastern', 'Western'],
    divisions: {
      Eastern: ['Atlantic', 'Metropolitan'],
      Western: ['Central', 'Pacific'],
    },
  },
  SOCCER: {
    conferences: [],
    divisions: {},
  },
};

export function StandingsFilters({
  league,
  view,
  onViewChange,
  conference,
  onConferenceChange,
  division,
  onDivisionChange,
}: StandingsFiltersProps) {
  const structure = LEAGUE_STRUCTURE[league] || { conferences: [], divisions: {} };
  const hasConferences = structure.conferences.length > 0;
  const hasDivisions = conference && structure.divisions[conference]?.length > 0;
  const availableDivisions = conference ? structure.divisions[conference] || [] : [];

  // Reset division when conference changes
  const handleConferenceChange = (newConference: string) => {
    onConferenceChange(newConference);
    onDivisionChange('');
  };

  // Soccer doesn't have conference/division views
  if (!hasConferences) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-3 p-4 bg-muted/30 rounded-lg border">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground">View:</span>
        <ToggleGroup 
          type="single" 
          value={view} 
          onValueChange={(v) => v && onViewChange(v as StandingsView)}
          className="bg-background rounded-md p-1"
        >
          <ToggleGroupItem 
            value="overall" 
            size="sm"
            className={cn(
              'text-xs px-3',
              view === 'overall' && 'bg-primary text-primary-foreground'
            )}
          >
            Overall
          </ToggleGroupItem>
          <ToggleGroupItem 
            value="conference" 
            size="sm"
            className={cn(
              'text-xs px-3',
              view === 'conference' && 'bg-primary text-primary-foreground'
            )}
          >
            Conference
          </ToggleGroupItem>
          <ToggleGroupItem 
            value="division" 
            size="sm"
            className={cn(
              'text-xs px-3',
              view === 'division' && 'bg-primary text-primary-foreground'
            )}
          >
            Division
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      {(view === 'conference' || view === 'division') && (
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">Conference:</span>
          <Select value={conference} onValueChange={handleConferenceChange}>
            <SelectTrigger className="w-[130px] h-8 text-sm">
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              {structure.conferences.map((conf) => (
                <SelectItem key={conf} value={conf}>
                  {conf}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {view === 'division' && hasDivisions && (
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">Division:</span>
          <Select value={division} onValueChange={onDivisionChange}>
            <SelectTrigger className="w-[130px] h-8 text-sm">
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              {availableDivisions.map((div) => (
                <SelectItem key={div} value={div}>
                  {div}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}

export default StandingsFilters;
