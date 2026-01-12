import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, Settings, Bell } from "lucide-react";
import { format } from "date-fns";

interface DashboardHeaderProps {
  onRefresh: () => void;
  isLoading: boolean;
  lastUpdated: Date;
  liveCount: number;
}

const DashboardHeader = ({ 
  onRefresh, 
  isLoading, 
  lastUpdated,
  liveCount 
}: DashboardHeaderProps) => {
  return (
    <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm">
      <div className="container px-4 py-4 mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* Title & Status */}
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Sports Dashboard
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Real-time betting intelligence and analytics
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {liveCount > 0 && (
              <Badge className="bg-red-500/90 text-white animate-pulse">
                <span className="w-2 h-2 bg-white rounded-full mr-2 animate-ping" />
                {liveCount} Live
              </Badge>
            )}
            
            <span className="text-xs text-muted-foreground hidden sm:block">
              Updated {format(lastUpdated, "h:mm a")}
            </span>

            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={isLoading}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>

            <Button variant="ghost" size="icon" className="h-9 w-9">
              <Bell className="h-4 w-4" />
            </Button>

            <Button variant="ghost" size="icon" className="h-9 w-9">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
