
import { Button } from "@/components/ui/button";
import { Check, ChevronsUpDown } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { League } from "@/types/sports";
import LeagueRegistry from "@/types/LeagueRegistry";

interface LeagueFilterProps {
  selectedLeague: League | string | "ALL";
  onLeagueChange: (league: League | string | "ALL") => void;
  sportCategoryFilter: string;
}

const LeagueFilter = ({
  selectedLeague,
  onLeagueChange,
  sportCategoryFilter,
}: LeagueFilterProps) => {
  const leagues = LeagueRegistry.getActiveLeagues();
  const filteredLeagues = sportCategoryFilter === "ALL" 
    ? leagues 
    : leagues.filter(league => league.category === sportCategoryFilter);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          className="justify-between w-[200px]"
        >
          {selectedLeague === "ALL"
            ? "All Leagues"
            : leagues.find(l => l.id === selectedLeague)?.name || "Select League"}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput placeholder="Search league..." />
          <CommandEmpty>No league found.</CommandEmpty>
          <CommandList>
            <CommandItem
              key="all-leagues"
              value="ALL"
              onSelect={() => onLeagueChange("ALL")}
            >
              <Check
                className={`mr-2 h-4 w-4 ${
                  selectedLeague === "ALL" ? "opacity-100" : "opacity-0"
                }`}
              />
              All Leagues
            </CommandItem>
            
            {filteredLeagues.map((league) => (
              <CommandItem
                key={league.id}
                value={league.id}
                onSelect={() => onLeagueChange(league.id)}
              >
                <Check
                  className={`mr-2 h-4 w-4 ${
                    selectedLeague === league.id ? "opacity-100" : "opacity-0"
                  }`}
                />
                {league.name}
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default LeagueFilter;
