import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Trophy, 
  Dribbble, 
  Target,
  Activity,
  Swords,
  LayoutGrid,
  ChevronDown,
  Check
} from "lucide-react";
import { SportCategory } from "@/types/LeagueRegistry";
import LeagueRegistry from "@/types/LeagueRegistry";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface SportCategoryNavProps {
  selectedCategory: SportCategory | "ALL";
  onCategoryChange: (category: SportCategory | "ALL") => void;
  selectedLeague: string;
  onLeagueChange: (league: string) => void;
  matchCounts: Record<string, number>;
}

const categories = [
  { id: "ALL" as const, label: "All Sports", icon: LayoutGrid },
  { id: "football" as SportCategory, label: "Football", icon: Trophy },
  { id: "basketball" as SportCategory, label: "Basketball", icon: Dribbble },
  { id: "baseball" as SportCategory, label: "Baseball", icon: Target },
  { id: "hockey" as SportCategory, label: "Hockey", icon: Activity },
  { id: "soccer" as SportCategory, label: "Soccer", icon: Swords },
];

const SportCategoryNav = ({
  selectedCategory,
  onCategoryChange,
  selectedLeague,
  onLeagueChange,
  matchCounts,
}: SportCategoryNavProps) => {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const handleCategoryClick = (categoryId: SportCategory | "ALL") => {
    if (categoryId === "ALL") {
      onCategoryChange("ALL");
      onLeagueChange("ALL");
      setExpandedCategory(null);
    } else {
      onCategoryChange(categoryId);
      // Toggle expansion
      if (expandedCategory === categoryId) {
        setExpandedCategory(null);
      } else {
        setExpandedCategory(categoryId);
      }
      // Reset to all leagues in this category
      onLeagueChange("ALL");
    }
  };

  const handleLeagueClick = (leagueId: string) => {
    onLeagueChange(leagueId);
  };

  const getLeaguesForCategory = (categoryId: SportCategory) => {
    return LeagueRegistry.getLeaguesByCategory(categoryId);
  };

  return (
    <div className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-16 z-40">
      <div className="container px-4 mx-auto">
        {/* Main Category Row */}
        <ScrollArea className="w-full">
          <div className="flex items-center gap-1 py-2">
            {categories.map((category) => {
              const Icon = category.icon;
              const count = category.id === "ALL" 
                ? matchCounts.total 
                : matchCounts[category.id];
              const isActive = selectedCategory === category.id;
              const isExpanded = expandedCategory === category.id;
              const hasLeagues = category.id !== "ALL" && getLeaguesForCategory(category.id as SportCategory).length > 0;

              return (
                <Button
                  key={category.id}
                  variant={isActive ? "default" : "ghost"}
                  size="sm"
                  className={cn(
                    "gap-2 shrink-0 transition-all",
                    isActive && "shadow-sm"
                  )}
                  onClick={() => handleCategoryClick(category.id)}
                >
                  <Icon className="h-4 w-4" />
                  <span>{category.label}</span>
                  {count > 0 && (
                    <Badge 
                      variant={isActive ? "secondary" : "outline"} 
                      className="h-5 px-1.5 text-[10px] ml-1"
                    >
                      {count}
                    </Badge>
                  )}
                  {hasLeagues && (
                    <ChevronDown 
                      className={cn(
                        "h-3 w-3 transition-transform ml-1",
                        isExpanded && "rotate-180"
                      )} 
                    />
                  )}
                </Button>
              );
            })}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        {/* Collapsible League Filters */}
        {expandedCategory && expandedCategory !== "ALL" && (
          <Collapsible open={true} className="pb-2">
            <CollapsibleContent className="animate-accordion-down">
              <div className="flex items-center gap-2 pt-1 pb-1 border-t border-border/30">
                <span className="text-xs text-muted-foreground pl-1 shrink-0">
                  Filter by league:
                </span>
                <ScrollArea className="flex-1">
                  <div className="flex items-center gap-1.5">
                    {/* All Leagues Option */}
                    <Button
                      variant={selectedLeague === "ALL" ? "secondary" : "ghost"}
                      size="sm"
                      className={cn(
                        "h-7 px-3 text-xs gap-1.5 shrink-0",
                        selectedLeague === "ALL" && "bg-primary/10 text-primary"
                      )}
                      onClick={() => handleLeagueClick("ALL")}
                    >
                      {selectedLeague === "ALL" && <Check className="h-3 w-3" />}
                      All {categories.find(c => c.id === expandedCategory)?.label}
                    </Button>

                    {/* Individual Leagues */}
                    {getLeaguesForCategory(expandedCategory as SportCategory).map((league) => (
                      <Button
                        key={league.id}
                        variant={selectedLeague === league.id ? "secondary" : "ghost"}
                        size="sm"
                        className={cn(
                          "h-7 px-3 text-xs gap-1.5 shrink-0",
                          selectedLeague === league.id && "bg-primary/10 text-primary"
                        )}
                        onClick={() => handleLeagueClick(league.id)}
                      >
                        {selectedLeague === league.id && <Check className="h-3 w-3" />}
                        {league.shortName || league.name}
                        {league.level === "college" && (
                          <Badge variant="outline" className="h-4 px-1 text-[8px] ml-1">
                            College
                          </Badge>
                        )}
                      </Button>
                    ))}
                  </div>
                  <ScrollBar orientation="horizontal" />
                </ScrollArea>
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}
      </div>
    </div>
  );
};

export default SportCategoryNav;
