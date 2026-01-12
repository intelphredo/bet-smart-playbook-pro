import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Trophy, 
  Dribbble, 
  Activity, 
  Bike, 
  Target,
  Swords,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { SportCategory } from "@/types/LeagueRegistry";
import LeagueRegistry from "@/types/LeagueRegistry";
import { Badge } from "@/components/ui/badge";

interface SportsSidebarProps {
  selectedCategory: SportCategory | "ALL";
  onCategoryChange: (category: SportCategory | "ALL") => void;
  selectedLeague: string;
  onLeagueChange: (league: string) => void;
  matchCounts?: Record<string, number>;
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
}

const sportIcons: Record<string, React.ElementType> = {
  football: Trophy,
  basketball: Dribbble,
  baseball: Target,
  hockey: Activity,
  soccer: Swords,
  other: Bike,
};

const categoryLabels: Record<string, string> = {
  ALL: "All Sports",
  football: "Football",
  basketball: "Basketball", 
  baseball: "Baseball",
  hockey: "Hockey",
  soccer: "Soccer",
};

const SportsSidebar = ({
  selectedCategory,
  onCategoryChange,
  selectedLeague,
  onLeagueChange,
  matchCounts = {},
  collapsed = false,
  onCollapsedChange,
}: SportsSidebarProps) => {
  const leagues = LeagueRegistry.getActiveLeagues();
  const categories = Array.from(new Set(leagues.map(l => l.category)));
  
  const filteredLeagues = selectedCategory === "ALL" 
    ? leagues 
    : leagues.filter(l => l.category === selectedCategory);

  return (
    <div className={cn(
      "flex flex-col h-[calc(100vh-4rem)] sticky top-16 bg-card/50 border-r border-border/50 transition-all duration-300",
      collapsed ? "w-16" : "w-56"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border/50">
        {!collapsed && (
          <span className="font-semibold text-sm text-foreground">Sports</span>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 ml-auto"
          onClick={() => onCollapsedChange?.(!collapsed)}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {/* All Sports */}
          <Button
            variant={selectedCategory === "ALL" ? "secondary" : "ghost"}
            size="sm"
            className={cn(
              "w-full justify-start gap-2 h-9",
              collapsed && "justify-center px-2"
            )}
            onClick={() => {
              onCategoryChange("ALL");
              onLeagueChange("ALL");
            }}
          >
            <Trophy className="h-4 w-4 shrink-0" />
            {!collapsed && (
              <>
                <span className="flex-1 text-left">All Sports</span>
                {matchCounts.total && (
                  <Badge variant="outline" className="h-5 px-1.5 text-[10px]">
                    {matchCounts.total}
                  </Badge>
                )}
              </>
            )}
          </Button>

          {/* Category separator */}
          {!collapsed && (
            <div className="pt-2 pb-1 px-2">
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                Categories
              </span>
            </div>
          )}

          {/* Sport Categories */}
          {categories.map((category) => {
            const Icon = sportIcons[category] || Activity;
            const count = matchCounts[category] || 0;
            
            return (
              <div key={category}>
                <Button
                  variant={selectedCategory === category ? "secondary" : "ghost"}
                  size="sm"
                  className={cn(
                    "w-full justify-start gap-2 h-9",
                    collapsed && "justify-center px-2"
                  )}
                  onClick={() => {
                    onCategoryChange(category as SportCategory);
                    onLeagueChange("ALL");
                  }}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {!collapsed && (
                    <>
                      <span className="flex-1 text-left">{categoryLabels[category] || category}</span>
                      {count > 0 && (
                        <Badge variant="outline" className="h-5 px-1.5 text-[10px]">
                          {count}
                        </Badge>
                      )}
                    </>
                  )}
                </Button>

                {/* Leagues under category */}
                {!collapsed && selectedCategory === category && (
                  <div className="ml-6 mt-1 space-y-0.5">
                    {leagues
                      .filter(l => l.category === category)
                      .map((league) => (
                        <Button
                          key={league.id}
                          variant={selectedLeague === league.id ? "default" : "ghost"}
                          size="sm"
                          className="w-full justify-start h-7 text-xs"
                          onClick={() => onLeagueChange(league.id)}
                        >
                          {league.shortName || league.name}
                        </Button>
                      ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
};

export default SportsSidebar;
