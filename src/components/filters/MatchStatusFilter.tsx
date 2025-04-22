
import { Button } from "@/components/ui/button";

interface MatchStatusFilterProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const MatchStatusFilter = ({ activeTab, onTabChange }: MatchStatusFilterProps) => {
  return (
    <div className="flex gap-1 flex-wrap">
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
  );
};

export default MatchStatusFilter;
