
import { CalendarIcon, SlidersHorizontal, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { League, DataSource } from "@/types/sports";

interface SchedulesHeaderProps {
  selectedLeague: "ALL" | League;
  onLeagueChange: (league: "ALL" | League) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  view: "schedule" | "standings";
  onViewChange: (view: "schedule" | "standings") => void;
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  onPreviousDay: () => void;
  onNextDay: () => void;
  onToday: () => void;
  dataSource: DataSource;
  onDataSourceChange: (source: DataSource) => void;
}

const SchedulesHeader = ({
  selectedLeague,
  onLeagueChange,
  searchQuery,
  onSearchChange,
  view,
  onViewChange,
  selectedDate,
  onDateChange,
  dataSource,
  onDataSourceChange
}: SchedulesHeaderProps) => {
  const handleLeagueChange = (value: string) => {
    onLeagueChange(value as "ALL" | League);
  };

  const handleDataSourceChange = (value: string) => {
    onDataSourceChange(value as DataSource);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex flex-row items-center gap-3">
          <Users className="h-5 w-5" />
          <h1 className="text-2xl font-bold tracking-tight">Schedules</h1>
          <Badge variant="outline" className={view === "schedule" ? "bg-primary/10" : "bg-secondary/10"}>
            {view === "schedule" ? "Games" : "Standings"}
          </Badge>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-[240px] justify-start">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  <span>
                    {selectedDate ? (
                      new Date(selectedDate).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })
                    ) : (
                      "Pick a date"
                    )}
                  </span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && onDateChange(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            <Select value={selectedLeague} onValueChange={handleLeagueChange}>
              <SelectTrigger className="w-[110px]">
                <SelectValue placeholder="League" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Leagues</SelectItem>
                <SelectItem value="NBA">NBA</SelectItem>
                <SelectItem value="NFL">NFL</SelectItem>
                <SelectItem value="MLB">MLB</SelectItem>
                <SelectItem value="NHL">NHL</SelectItem>
                <SelectItem value="SOCCER">SOCCER</SelectItem>
              </SelectContent>
            </Select>

            <Select value={dataSource} onValueChange={handleDataSourceChange}>
              <SelectTrigger className="w-[110px]">
                <SelectValue placeholder="Data Source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ESPN">ESPN API</SelectItem>
                <SelectItem value="MLB">MLB API</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Input
            placeholder="Search teams..."
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            className="pl-8"
          />
          <SlidersHorizontal className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        </div>

        <div className="flex md:hidden">
          <Select value={view} onValueChange={(v) => onViewChange(v as "schedule" | "standings")}>
            <SelectTrigger className="w-[110px]">
              <SelectValue placeholder="View" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="schedule">Schedule</SelectItem>
              <SelectItem value="standings">Standings</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};

export default SchedulesHeader;
