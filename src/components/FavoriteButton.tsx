import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { usePreferences } from "@/hooks/usePreferences";
import { toast } from "sonner";

interface FavoriteButtonProps {
  type: "match" | "team";
  id: string;
  name?: string;
  size?: "sm" | "md";
  className?: string;
}

const FavoriteButton = ({ type, id, name, size = "sm", className }: FavoriteButtonProps) => {
  const { preferences, isFavoriteTeam, toggleFavoriteTeam, updatePreference } = usePreferences();

  const isFavorite = type === "team" 
    ? isFavoriteTeam(id)
    : preferences.favorites.matches.includes(id);

  const handleToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    if (type === "team") {
      await toggleFavoriteTeam(id);
      toast(isFavorite ? "Removed from favorites" : "Added to favorites", {
        description: name ? `${name} ${isFavorite ? "removed from" : "added to"} your favorites` : undefined,
      });
    } else {
      const matches = preferences.favorites.matches.includes(id)
        ? preferences.favorites.matches.filter(m => m !== id)
        : [...preferences.favorites.matches, id];
      
      await updatePreference("favorites", "matches", matches);
      toast(isFavorite ? "Match unfavorited" : "Match favorited", {
        description: isFavorite ? "Match removed from favorites" : "Match added to favorites",
      });
    }
  };

  const sizeClasses = size === "sm" 
    ? "h-7 w-7" 
    : "h-9 w-9";

  const iconSize = size === "sm" ? 14 : 18;

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleToggle}
      className={cn(
        sizeClasses,
        "rounded-full transition-all duration-200",
        isFavorite 
          ? "text-yellow-500 hover:text-yellow-600 bg-yellow-500/10 hover:bg-yellow-500/20" 
          : "text-muted-foreground hover:text-yellow-500 hover:bg-yellow-500/10",
        className
      )}
      aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
    >
      <Star 
        size={iconSize} 
        className={cn(
          "transition-all duration-200",
          isFavorite && "fill-current"
        )} 
      />
    </Button>
  );
};

export default FavoriteButton;
