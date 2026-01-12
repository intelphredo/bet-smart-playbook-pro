import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RefreshCw, Settings, Bell, Download } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuickActionsProps {
  onRefresh: () => void;
  isLoading?: boolean;
  lastUpdated?: Date;
}

const QuickActions = ({ onRefresh, isLoading, lastUpdated }: QuickActionsProps) => {
  const formatTime = (date?: Date) => {
    if (!date) return "Never";
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <Card className="p-3 bg-card/50 border-border/50">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isLoading}
            className="h-8 gap-2"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", isLoading && "animate-spin")} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
          
          {lastUpdated && (
            <span className="text-xs text-muted-foreground">
              Updated {formatTime(lastUpdated)}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Bell className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default QuickActions;
