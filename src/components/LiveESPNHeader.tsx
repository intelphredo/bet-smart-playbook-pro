
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import LeagueSelector from "@/components/LeagueSelector";
import DataSourceBadge, { DataSourceInfo } from "./DataSourceBadge";

interface Props {
  selectedLeague: any;
  setSelectedLeague: (v: any) => void;
  isLoading: boolean;
  handleRefreshData: () => void;
  dataSource?: DataSourceInfo;
}

const LiveESPNHeader = ({
  selectedLeague,
  setSelectedLeague,
  isLoading,
  handleRefreshData,
  dataSource,
}: Props) => (
  <div className="flex flex-col gap-4">
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
      <div className="flex items-center gap-3 flex-wrap">
        <h2 className="text-2xl font-bold">Live Sports Data</h2>
        {dataSource && (
          <DataSourceBadge 
            dataSource={dataSource} 
            compact 
          />
        )}
      </div>
      <div className="flex items-center gap-2">
        <LeagueSelector
          selectedLeague={selectedLeague}
          onSelectLeague={setSelectedLeague}
        />
        <Button
          size="sm"
          variant="outline"
          onClick={handleRefreshData}
          disabled={isLoading}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          {isLoading ? "Refreshing..." : "Refresh"}
        </Button>
      </div>
    </div>
    
    {dataSource && !dataSource.source && (
      <DataSourceBadge 
        dataSource={dataSource} 
        onRefresh={handleRefreshData}
        isRefreshing={isLoading}
      />
    )}
  </div>
);

export default LiveESPNHeader;
