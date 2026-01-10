import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Users, Calendar } from "lucide-react";
import { usePreferences } from "@/hooks/usePreferences";
import { Match } from "@/types/sports";
import MatchCard from "./MatchCard";
import FavoriteButton from "./FavoriteButton";
import { cn } from "@/lib/utils";

interface FavoritesTabProps {
  allMatches: Match[];
}

const FavoritesTab = ({ allMatches }: FavoritesTabProps) => {
  const { preferences, toggleFavoriteTeam } = usePreferences();

  const favoriteMatches = useMemo(() => {
    return allMatches.filter(match => 
      preferences.favorites.matches.includes(match.id)
    );
  }, [allMatches, preferences.favorites.matches]);

  const matchesWithFavoriteTeams = useMemo(() => {
    if (preferences.favorites.teams.length === 0) return [];
    
    return allMatches.filter(match => {
      const homeTeam = match.homeTeam?.shortName || match.homeTeam?.name || "";
      const awayTeam = match.awayTeam?.shortName || match.awayTeam?.name || "";
      
      return preferences.favorites.teams.some(team => 
        homeTeam.toLowerCase().includes(team.toLowerCase()) ||
        awayTeam.toLowerCase().includes(team.toLowerCase()) ||
        team.toLowerCase().includes(homeTeam.toLowerCase()) ||
        team.toLowerCase().includes(awayTeam.toLowerCase())
      );
    }).filter(match => !preferences.favorites.matches.includes(match.id)); // Exclude already favorited matches
  }, [allMatches, preferences.favorites.teams, preferences.favorites.matches]);

  const hasNoFavorites = favoriteMatches.length === 0 && 
    matchesWithFavoriteTeams.length === 0 && 
    preferences.favorites.teams.length === 0;

  if (hasNoFavorites) {
    return (
      <Card className="bg-card/80 backdrop-blur-sm border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="p-4 rounded-full bg-yellow-500/10 mb-4">
            <Star className="h-8 w-8 text-yellow-500" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No Favorites Yet</h3>
          <p className="text-muted-foreground max-w-md">
            Star matches and teams to track them here. Click the star icon on any match card or team to add them to your favorites.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Favorite Teams Section */}
      {preferences.favorites.teams.length > 0 && (
        <Card className="bg-card/80 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              Favorite Teams
              <Badge variant="secondary" className="ml-auto">
                {preferences.favorites.teams.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {preferences.favorites.teams.map((team) => (
                <Badge 
                  key={team} 
                  variant="outline" 
                  className="pl-3 pr-1 py-1.5 flex items-center gap-2 bg-background/50"
                >
                  <span>{team}</span>
                  <FavoriteButton type="team" id={team} name={team} size="sm" />
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Starred Matches Section */}
      {favoriteMatches.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
            <h3 className="font-semibold">Starred Matches</h3>
            <Badge variant="secondary">{favoriteMatches.length}</Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {favoriteMatches.map((match) => (
              <div key={match.id} className="relative">
                <MatchCard match={match} />
                <FavoriteButton 
                  type="match" 
                  id={match.id} 
                  className="absolute top-2 right-2 z-10" 
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Matches Featuring Favorite Teams */}
      {matchesWithFavoriteTeams.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="h-4 w-4 text-primary" />
            <h3 className="font-semibold">Games with Your Teams</h3>
            <Badge variant="secondary">{matchesWithFavoriteTeams.length}</Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {matchesWithFavoriteTeams.map((match) => (
              <div key={match.id} className="relative">
                <MatchCard match={match} />
                <FavoriteButton 
                  type="match" 
                  id={match.id} 
                  className="absolute top-2 right-2 z-10" 
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state when teams exist but no matching games */}
      {preferences.favorites.teams.length > 0 && 
       matchesWithFavoriteTeams.length === 0 && 
       favoriteMatches.length === 0 && (
        <Card className="bg-card/80 backdrop-blur-sm border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-8 text-center">
            <Calendar className="h-8 w-8 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">
              No upcoming games found for your favorite teams.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default FavoritesTab;
