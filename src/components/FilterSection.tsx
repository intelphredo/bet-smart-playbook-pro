
import { Button } from "@/components/ui/button";
import { League } from "@/types/sports";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Filter } from "lucide-react";

interface FilterSectionProps {
  selectedLeague: League | "ALL";
  onLeagueChange: (league: League | "ALL") => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const FilterSection = ({
  selectedLeague,
  onLeagueChange,
  activeTab,
  onTabChange,
}: FilterSectionProps) => {
  return (
    <div className="flex flex-wrap gap-4 items-center p-4 bg-background border rounded-lg mb-4">
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4" />
        <span className="font-medium">Filters:</span>
      </div>
      
      <div className="flex gap-4 flex-wrap">
        <Select value={selectedLeague} onValueChange={(value) => onLeagueChange(value as League | "ALL")}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select league" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Leagues</SelectItem>
            <SelectItem value="NBA">NBA</SelectItem>
            <SelectItem value="NFL">NFL</SelectItem>
            <SelectItem value="MLB">MLB</SelectItem>
            <SelectItem value="NHL">NHL</SelectItem>
            <SelectItem value="SOCCER">Soccer</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex gap-2">
          <Button
            variant={activeTab === "future" ? "default" : "outline"}
            size="sm"
            onClick={() => onTabChange("future")}
          >
            Future
          </Button>
          <Button
            variant={activeTab === "upcoming" ? "default" : "outline"}
            size="sm"
            onClick={() => onTabChange("upcoming")}
          >
            Upcoming
          </Button>
          <Button
            variant={activeTab === "live" ? "default" : "outline"}
            size="sm"
            onClick={() => onTabChange("live")}
          >
            Live
          </Button>
          <Button
            variant={activeTab === "finished" ? "default" : "outline"}
            size="sm"
            onClick={() => onTabChange("finished")}
          >
            Finished
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FilterSection;
