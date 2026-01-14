import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Star, Users, Calendar, Plus, Search, X } from "lucide-react";
import { usePreferences } from "@/hooks/usePreferences";
import { Match } from "@/types/sports";
import MatchCard from "./MatchCard";
import FavoriteButton from "./FavoriteButton";
import { cn } from "@/lib/utils";

interface FavoritesTabProps {
  allMatches: Match[];
}

// Common team names for suggestions
const POPULAR_TEAMS = [
  'Lakers', 'Celtics', 'Warriors', 'Bulls', 'Heat', 'Nets', 'Knicks', 'Suns',
  'Chiefs', 'Eagles', 'Cowboys', 'Patriots', '49ers', 'Packers', 'Bills', 'Ravens',
  'Yankees', 'Dodgers', 'Red Sox', 'Cubs', 'Mets', 'Astros', 'Braves', 'Phillies',
  'Duke', 'Kentucky', 'Kansas', 'UNC', 'Gonzaga', 'UCLA', 'Michigan', 'Ohio State',
];

const FavoritesTab = ({ allMatches }: FavoritesTabProps) => {
  const { preferences, toggleFavoriteTeam } = usePreferences();
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddTeam, setShowAddTeam] = useState(false);

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
    }).filter(match => !preferences.favorites.matches.includes(match.id));
  }, [allMatches, preferences.favorites.teams, preferences.favorites.matches]);

  // Get team suggestions based on search
  const teamSuggestions = useMemo(() => {
    if (!searchQuery) return POPULAR_TEAMS.filter(t => !preferences.favorites.teams.includes(t)).slice(0, 8);
    
    const query = searchQuery.toLowerCase();
    return POPULAR_TEAMS
      .filter(t => t.toLowerCase().includes(query) && !preferences.favorites.teams.includes(t))
      .slice(0, 8);
  }, [searchQuery, preferences.favorites.teams]);

  const handleAddTeam = (team: string) => {
    toggleFavoriteTeam(team);
    setSearchQuery("");
  };

  const hasNoFavorites = favoriteMatches.length === 0 && 
    matchesWithFavoriteTeams.length === 0 && 
    preferences.favorites.teams.length === 0;

  if (hasNoFavorites && !showAddTeam) {
    return (
      <Card className="bg-card/80 backdrop-blur-sm border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="p-4 rounded-full bg-yellow-500/10 mb-4">
            <Star className="h-8 w-8 text-yellow-500" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No Favorites Yet</h3>
          <p className="text-muted-foreground max-w-md mb-4">
            Star matches and teams to track them here. Click the star icon on any match card or team to add them to your favorites.
          </p>
          <Button onClick={() => setShowAddTeam(true)} variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Add Favorite Team
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Add Team Section */}
      <Card className="bg-card/80 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Plus className="h-4 w-4 text-primary" />
              Add Favorite Team
            </CardTitle>
            {showAddTeam && (
              <Button variant="ghost" size="sm" onClick={() => setShowAddTeam(false)}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search for a team..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {teamSuggestions.map((team) => (
              <Button
                key={team}
                variant="outline"
                size="sm"
                onClick={() => handleAddTeam(team)}
                className="h-7 text-xs"
              >
                <Plus className="h-3 w-3 mr-1" />
                {team}
              </Button>
            ))}
            {searchQuery && teamSuggestions.length === 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAddTeam(searchQuery)}
                className="h-7 text-xs"
              >
                <Plus className="h-3 w-3 mr-1" />
                Add "{searchQuery}"
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

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
