import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { 
  Home, 
  Plane, 
  AlertTriangle, 
  TrendingUp, 
  Calendar,
  Users,
  Target,
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export interface SituationalFiltersState {
  homeAwayFilter: 'all' | 'home' | 'away';
  sharpMoneyAlignment: boolean;
  excludeBackToBack: boolean;
  conferenceGamesOnly: boolean;
  minAlgorithmsAgreeing: number;
}

interface SituationalFiltersProps {
  filters: SituationalFiltersState;
  onFiltersChange: (filters: SituationalFiltersState) => void;
}

export function SituationalFilters({ filters, onFiltersChange }: SituationalFiltersProps) {
  const updateFilter = <K extends keyof SituationalFiltersState>(
    key: K, 
    value: SituationalFiltersState[K]
  ) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const activeFiltersCount = [
    filters.homeAwayFilter !== 'all',
    filters.sharpMoneyAlignment,
    filters.excludeBackToBack,
    filters.conferenceGamesOnly,
    filters.minAlgorithmsAgreeing > 1,
  ].filter(Boolean).length;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            Situational Filters
          </CardTitle>
          {activeFiltersCount > 0 && (
            <Badge variant="secondary">{activeFiltersCount} active</Badge>
          )}
        </div>
        <CardDescription className="text-xs">
          Filter bets by game context and situational factors
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Home/Away Filter */}
        <div className="space-y-2">
          <Label className="text-sm flex items-center gap-1.5">
            <Home className="h-3.5 w-3.5" />
            Home/Away
          </Label>
          <Select 
            value={filters.homeAwayFilter} 
            onValueChange={(v) => updateFilter('homeAwayFilter', v as 'all' | 'home' | 'away')}
          >
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Games</SelectItem>
              <SelectItem value="home">Home Games Only</SelectItem>
              <SelectItem value="away">Away Games Only</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Min Algorithms Agreeing */}
        <div className="space-y-2">
          <Label className="text-sm flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5" />
            Min Algorithms Agreeing
          </Label>
          <Select 
            value={String(filters.minAlgorithmsAgreeing)} 
            onValueChange={(v) => updateFilter('minAlgorithmsAgreeing', Number(v))}
          >
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Any (1+)</SelectItem>
              <SelectItem value="2">At least 2</SelectItem>
              <SelectItem value="3">All 3 must agree</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Toggle Filters */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm flex items-center gap-1.5 cursor-pointer" htmlFor="sharp-money">
              <TrendingUp className="h-3.5 w-3.5 text-green-500" />
              Sharp Money Alignment
            </Label>
            <Switch
              id="sharp-money"
              checked={filters.sharpMoneyAlignment}
              onCheckedChange={(v) => updateFilter('sharpMoneyAlignment', v)}
            />
          </div>
          <p className="text-xs text-muted-foreground -mt-1 ml-5">
            Only bet when sharps agree with the prediction
          </p>

          <div className="flex items-center justify-between">
            <Label className="text-sm flex items-center gap-1.5 cursor-pointer" htmlFor="exclude-b2b">
              <Calendar className="h-3.5 w-3.5 text-orange-500" />
              Exclude Back-to-Back
            </Label>
            <Switch
              id="exclude-b2b"
              checked={filters.excludeBackToBack}
              onCheckedChange={(v) => updateFilter('excludeBackToBack', v)}
            />
          </div>
          <p className="text-xs text-muted-foreground -mt-1 ml-5">
            Skip games where team played yesterday
          </p>

          <div className="flex items-center justify-between">
            <Label className="text-sm flex items-center gap-1.5 cursor-pointer" htmlFor="conference">
              <Plane className="h-3.5 w-3.5 text-blue-500" />
              Conference Games Only
            </Label>
            <Switch
              id="conference"
              checked={filters.conferenceGamesOnly}
              onCheckedChange={(v) => updateFilter('conferenceGamesOnly', v)}
            />
          </div>
          <p className="text-xs text-muted-foreground -mt-1 ml-5">
            Only bet on divisional/conference matchups
          </p>
        </div>

        {/* Info */}
        <div className="pt-3 border-t">
          <div className="flex items-start gap-2 text-xs text-muted-foreground">
            <AlertTriangle className="h-3.5 w-3.5 text-yellow-500 mt-0.5 shrink-0" />
            <p>
              Situational filters require enhanced game context data. 
              Some filters may not apply to all historical predictions.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export const defaultSituationalFilters: SituationalFiltersState = {
  homeAwayFilter: 'all',
  sharpMoneyAlignment: false,
  excludeBackToBack: false,
  conferenceGamesOnly: false,
  minAlgorithmsAgreeing: 1,
};
