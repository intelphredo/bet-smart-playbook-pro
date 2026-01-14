import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getLeagueLogoUrl, getLeagueDisplayName } from "@/utils/teamLogos";
import { League } from "@/types/sports";

// League icon component with fallback
function LeagueIcon({ league, size = 16 }: { league: string; size?: number }) {
  const logoUrl = getLeagueLogoUrl(league);
  
  return (
    <img 
      src={logoUrl} 
      alt={league}
      className="rounded-sm object-contain"
      style={{ width: size, height: size }}
      onError={(e) => {
        const target = e.target as HTMLImageElement;
        target.style.display = 'none';
      }}
    />
  );
}

// League categories for grouping
export const LEAGUE_CATEGORIES: Record<string, { label: string; icon: string; leagues: string[] }> = {
  basketball: {
    label: "Basketball",
    icon: "🏀",
    leagues: ["NBA", "NCAAB", "WNBA"],
  },
  football: {
    label: "Football",
    icon: "🏈",
    leagues: ["NFL", "NCAAF", "CFL", "XFL"],
  },
  baseball: {
    label: "Baseball",
    icon: "⚾",
    leagues: ["MLB"],
  },
  hockey: {
    label: "Hockey",
    icon: "🏒",
    leagues: ["NHL"],
  },
  soccer: {
    label: "Soccer",
    icon: "⚽",
    leagues: ["SOCCER", "EPL", "LA_LIGA", "SERIE_A", "BUNDESLIGA", "LIGUE_1", "MLS", "CHAMPIONS_LEAGUE"],
  },
  combat: {
    label: "Combat Sports",
    icon: "🥊",
    leagues: ["UFC"],
  },
  tennis: {
    label: "Tennis",
    icon: "🎾",
    leagues: ["ATP", "WTA"],
  },
  golf: {
    label: "Golf",
    icon: "⛳",
    leagues: ["PGA"],
  },
};

// Get category for a league
export function getLeagueCategory(league: string): string {
  for (const [category, data] of Object.entries(LEAGUE_CATEGORIES)) {
    if (data.leagues.includes(league)) {
      return category;
    }
  }
  return "other";
}

// Group leagues by category
export function groupLeaguesByCategory(leagues: string[]): Record<string, string[]> {
  const grouped: Record<string, string[]> = {};
  
  // Define category order
  const categoryOrder = ['basketball', 'football', 'baseball', 'hockey', 'soccer', 'combat', 'tennis', 'golf', 'other'];
  
  for (const league of leagues) {
    const category = getLeagueCategory(league);
    if (!grouped[category]) {
      grouped[category] = [];
    }
    grouped[category].push(league);
  }
  
  // Sort by category order
  const sorted: Record<string, string[]> = {};
  for (const cat of categoryOrder) {
    if (grouped[cat]) {
      sorted[cat] = grouped[cat];
    }
  }
  
  return sorted;
}

interface GroupedLeagueSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  leagues: string[];
  placeholder?: string;
  allLabel?: string;
  className?: string;
  showAllOption?: boolean;
}

export function GroupedLeagueSelect({
  value,
  onValueChange,
  leagues,
  placeholder = "Select League",
  allLabel = "All Leagues",
  className = "w-[180px]",
  showAllOption = true,
}: GroupedLeagueSelectProps) {
  const groupedLeagues = groupLeaguesByCategory(leagues);
  
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="max-h-[300px]">
        {showAllOption && (
          <>
            <SelectItem value="all">
              <span className="flex items-center gap-2">
                🌐 {allLabel}
              </span>
            </SelectItem>
            <SelectSeparator />
          </>
        )}
        {Object.entries(groupedLeagues).map(([category, categoryLeagues]) => {
          const categoryData = LEAGUE_CATEGORIES[category];
          if (!categoryData || categoryLeagues.length === 0) return null;
          
          return (
            <SelectGroup key={category}>
              <SelectLabel className="flex items-center gap-2 text-xs font-semibold text-muted-foreground px-2 py-1.5">
                <span>{categoryData.icon}</span>
                {categoryData.label}
              </SelectLabel>
              {categoryLeagues.map(league => (
                <SelectItem key={league} value={league}>
                  <span className="flex items-center gap-2">
                    <LeagueIcon league={league} size={16} />
                    {getLeagueDisplayName(league)}
                  </span>
                </SelectItem>
              ))}
            </SelectGroup>
          );
        })}
      </SelectContent>
    </Select>
  );
}

// Simpler tabs-based grouped league selector for horizontal display
interface GroupedLeagueTabsProps {
  value: string;
  onValueChange: (value: string) => void;
  availableLeagues?: string[];
}

export function GroupedLeagueTabs({
  value,
  onValueChange,
  availableLeagues,
}: GroupedLeagueTabsProps) {
  // Default leagues if none specified
  const defaultLeagues = ['NBA', 'NFL', 'MLB', 'NHL', 'NCAAB', 'NCAAF', 'EPL', 'UFC'];
  const leagues = availableLeagues || defaultLeagues;
  
  return (
    <div className="flex flex-wrap gap-1">
      {leagues.map(league => {
        const isActive = value === league;
        const category = getLeagueCategory(league);
        const categoryData = LEAGUE_CATEGORIES[category];
        
        return (
          <button
            key={league}
            onClick={() => onValueChange(league)}
            className={`
              flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium
              transition-colors
              ${isActive 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-muted hover:bg-muted/80 text-muted-foreground'
              }
            `}
          >
            <span className="text-xs">{categoryData?.icon || '🏆'}</span>
            <LeagueIcon league={league} size={14} />
            <span>{getLeagueDisplayName(league)}</span>
          </button>
        );
      })}
    </div>
  );
}

export default GroupedLeagueSelect;
