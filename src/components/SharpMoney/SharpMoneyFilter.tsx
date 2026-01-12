// Sharp Money Filter Component
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Slider } from '@/components/ui/slider';
import { Brain, Filter, Zap, TrendingDown, Activity, X } from 'lucide-react';
import { SharpSignal } from '@/types/bettingTrends';
import { cn } from '@/lib/utils';

export type SharpFilterType = 'all' | 'rlm' | 'steam' | 'strong';

interface SharpMoneyFilterProps {
  activeFilter: SharpFilterType;
  onFilterChange: (filter: SharpFilterType) => void;
  signalTypes: SharpSignal['type'][];
  onSignalTypesChange: (types: SharpSignal['type'][]) => void;
  minConfidence: number;
  onMinConfidenceChange: (value: number) => void;
  sharpCount: number;
  rlmCount: number;
  steamCount: number;
  className?: string;
}

const SIGNAL_OPTIONS: { type: SharpSignal['type']; label: string; icon: React.ReactNode }[] = [
  { type: 'reverse_line', label: 'Reverse Line Movement', icon: <TrendingDown className="h-4 w-4" /> },
  { type: 'steam_move', label: 'Steam Move', icon: <Zap className="h-4 w-4" /> },
  { type: 'line_freeze', label: 'Line Freeze', icon: <Activity className="h-4 w-4" /> },
  { type: 'whale_bet', label: 'Whale Bet', icon: <Brain className="h-4 w-4" /> },
  { type: 'syndicate_play', label: 'Syndicate Play', icon: <Brain className="h-4 w-4" /> },
];

export function SharpMoneyFilter({
  activeFilter,
  onFilterChange,
  signalTypes,
  onSignalTypesChange,
  minConfidence,
  onMinConfidenceChange,
  sharpCount,
  rlmCount,
  steamCount,
  className,
}: SharpMoneyFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  const hasActiveFilters = activeFilter !== 'all' || signalTypes.length > 0 || minConfidence > 0;
  
  const handleSignalToggle = (type: SharpSignal['type']) => {
    if (signalTypes.includes(type)) {
      onSignalTypesChange(signalTypes.filter(t => t !== type));
    } else {
      onSignalTypesChange([...signalTypes, type]);
    }
  };
  
  const clearFilters = () => {
    onFilterChange('all');
    onSignalTypesChange([]);
    onMinConfidenceChange(0);
  };

  return (
    <div className={cn('flex items-center gap-2 flex-wrap', className)}>
      {/* Quick Filter Buttons */}
      <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
        <Button
          variant={activeFilter === 'all' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onFilterChange('all')}
          className="h-7 px-3"
        >
          All
          <Badge variant="secondary" className="ml-1.5 h-5 px-1.5 text-[10px]">
            {sharpCount}
          </Badge>
        </Button>
        
        <Button
          variant={activeFilter === 'rlm' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onFilterChange('rlm')}
          className="h-7 px-3"
        >
          <TrendingDown className="h-3.5 w-3.5 mr-1" />
          RLM
          {rlmCount > 0 && (
            <Badge variant="secondary" className="ml-1.5 h-5 px-1.5 text-[10px]">
              {rlmCount}
            </Badge>
          )}
        </Button>
        
        <Button
          variant={activeFilter === 'steam' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onFilterChange('steam')}
          className="h-7 px-3"
        >
          <Zap className="h-3.5 w-3.5 mr-1" />
          Steam
          {steamCount > 0 && (
            <Badge variant="secondary" className="ml-1.5 h-5 px-1.5 text-[10px]">
              {steamCount}
            </Badge>
          )}
        </Button>
        
        <Button
          variant={activeFilter === 'strong' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onFilterChange('strong')}
          className="h-7 px-3"
        >
          <Brain className="h-3.5 w-3.5 mr-1" />
          Strong
        </Button>
      </div>
      
      {/* Advanced Filter Dropdown */}
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-7 px-3">
            <Filter className="h-3.5 w-3.5 mr-1" />
            Filters
            {hasActiveFilters && (
              <Badge variant="destructive" className="ml-1.5 h-4 w-4 p-0 flex items-center justify-center text-[10px]">
                !
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-72">
          <DropdownMenuLabel className="flex items-center justify-between">
            <span>Filter Sharp Signals</span>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={clearFilters}>
                Clear all
              </Button>
            )}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {/* Signal Types */}
          <DropdownMenuLabel className="text-xs text-muted-foreground">Signal Types</DropdownMenuLabel>
          {SIGNAL_OPTIONS.map((option) => (
            <DropdownMenuCheckboxItem
              key={option.type}
              checked={signalTypes.includes(option.type)}
              onCheckedChange={() => handleSignalToggle(option.type)}
            >
              <span className="flex items-center gap-2">
                {option.icon}
                {option.label}
              </span>
            </DropdownMenuCheckboxItem>
          ))}
          
          <DropdownMenuSeparator />
          
          {/* Confidence Slider */}
          <div className="p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Min Confidence</span>
              <span className="text-sm text-muted-foreground">{minConfidence}%</span>
            </div>
            <Slider
              value={[minConfidence]}
              onValueChange={([value]) => onMinConfidenceChange(value)}
              max={100}
              step={5}
              className="mt-2"
            />
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
      
      {/* Active Filter Tags */}
      {signalTypes.length > 0 && (
        <div className="flex items-center gap-1">
          {signalTypes.map(type => (
            <Badge 
              key={type} 
              variant="secondary" 
              className="text-xs cursor-pointer hover:bg-destructive/20"
              onClick={() => handleSignalToggle(type)}
            >
              {type.replace(/_/g, ' ')}
              <X className="h-3 w-3 ml-1" />
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

export default SharpMoneyFilter;
