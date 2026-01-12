import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Trophy, 
  Dribbble, 
  Target,
  Activity,
  Swords,
  LayoutGrid
} from "lucide-react";
import { SportCategory } from "@/types/LeagueRegistry";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface SportCategoryNavProps {
  selectedCategory: SportCategory | "ALL";
  onCategoryChange: (category: SportCategory | "ALL") => void;
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
  matchCounts,
}: SportCategoryNavProps) => {
  return (
    <div className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-16 z-40">
      <ScrollArea className="w-full">
        <div className="container px-4 mx-auto">
          <div className="flex items-center gap-1 py-2">
            {categories.map((category) => {
              const Icon = category.icon;
              const count = category.id === "ALL" 
                ? matchCounts.total 
                : matchCounts[category.id];
              const isActive = selectedCategory === category.id;

              return (
                <Button
                  key={category.id}
                  variant={isActive ? "default" : "ghost"}
                  size="sm"
                  className={cn(
                    "gap-2 shrink-0 transition-all",
                    isActive && "shadow-sm"
                  )}
                  onClick={() => onCategoryChange(category.id)}
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
                </Button>
              );
            })}
          </div>
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
};

export default SportCategoryNav;
