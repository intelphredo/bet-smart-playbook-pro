
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, CalendarIcon } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { SportCategory } from "@/types/LeagueRegistry";

interface AdvancedFiltersProps {
  tempFilters: {
    team: string;
    sportCategory: SportCategory | "ALL";
  };
  tempDateRange: {
    start?: Date;
    end?: Date;
  };
  setTempFilters: (filters: { team: string; sportCategory: SportCategory | "ALL" }) => void;
  setTempDateRange: (range: { start?: Date; end?: Date }) => void;
  onApplyFilters: () => void;
  sportCategories: string[];
  onDateRangeChange?: (range: { start?: Date; end?: Date }) => void;
}

const AdvancedFilters = ({
  tempFilters,
  tempDateRange,
  setTempFilters,
  setTempDateRange,
  onApplyFilters,
  sportCategories,
  onDateRangeChange,
}: AdvancedFiltersProps) => {
  return (
    <div className="mt-2 pt-2 border-t grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
      {/* Team Filter */}
      <div className="flex flex-col gap-1">
        <label htmlFor="team-filter" className="text-sm font-medium">
          Team
        </label>
        <div className="flex items-center gap-1">
          <Search className="h-4 w-4 opacity-70" />
          <Input 
            id="team-filter"
            placeholder="Filter by team name" 
            value={tempFilters.team}
            onChange={(e) => setTempFilters({...tempFilters, team: e.target.value})}
            className="h-8"
          />
        </div>
      </div>
      
      {/* Sport Category Filter */}
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium">
          Sport Category
        </label>
        <Select
          value={tempFilters.sportCategory}
          onValueChange={(value) => setTempFilters({...tempFilters, sportCategory: value as SportCategory | "ALL"})}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Categories</SelectItem>
            {sportCategories.map((category) => (
              <SelectItem key={category} value={category}>
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      {/* Date Range Filter */}
      {onDateRangeChange && (
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">
            Date Range
          </label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="date"
                variant="outline"
                className={`w-full justify-start text-left font-normal h-8 ${
                  !tempDateRange.start && !tempDateRange.end ? "text-muted-foreground" : ""
                }`}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {tempDateRange.start && tempDateRange.end ? (
                  <>
                    {format(tempDateRange.start, "PPP")} - {format(tempDateRange.end, "PPP")}
                  </>
                ) : (
                  <span>Pick a date range</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="range"
                selected={tempDateRange as any}
                onSelect={(range) => setTempDateRange(range as any)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      )}
      
      {/* Apply Filters Button */}
      <Button 
        className="mt-auto"
        onClick={onApplyFilters}
      >
        Apply Filters
      </Button>
    </div>
  );
};

export default AdvancedFilters;
