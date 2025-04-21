
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import LeagueSelector from "@/components/LeagueSelector";

interface Props {
  selectedLeague: any;
  setSelectedLeague: (v: any) => void;
  isLoading: boolean;
  handleRefreshData: () => void;
}

const LiveESPNHeader = ({
  selectedLeague,
  setSelectedLeague,
  isLoading,
  handleRefreshData,
}: Props) => (
  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
    <div className="flex items-center gap-2">
      <h2 className="text-2xl font-bold">Live ESPN Data</h2>
      <Button
        size="sm"
        variant="outline"
        onClick={handleRefreshData}
        disabled={isLoading}
      >
        {isLoading ? "Refreshing..." : "Refresh Data"}
      </Button>
      <Badge variant="outline" className="bg-navy-50 dark:bg-navy-700">
        Auto-updates every 60s
      </Badge>
    </div>
    <LeagueSelector
      selectedLeague={selectedLeague}
      onSelectLeague={setSelectedLeague}
    />
  </div>
);

export default LiveESPNHeader;
