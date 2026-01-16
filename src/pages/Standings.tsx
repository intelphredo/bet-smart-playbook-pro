import { useState, useMemo } from 'react';
import { SportLeague, SportradarStanding } from '@/types/sportradar';
import { useSportradarStandings, useAllLeagueStandings } from '@/hooks/useSportradarStandings';
import { clearESPNStandingsCache } from '@/services/espnStandingsService';
import NavBar from '@/components/NavBar';
import PageFooter from '@/components/PageFooter';
import AppBreadcrumb from '@/components/layout/AppBreadcrumb';
import StandingsTable from '@/components/Sportradar/StandingsTable';
import StandingsFilters, { StandingsView } from '@/components/Sportradar/StandingsFilters';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trophy, RefreshCw, AlertCircle } from 'lucide-react';
import { GroupedLeagueSelect, LEAGUE_CATEGORIES } from '@/components/filters/GroupedLeagueSelect';
import { getLeagueLogoUrl, getLeagueDisplayName } from '@/utils/teamLogos';
import { useQueryClient } from '@tanstack/react-query';

// Get all available leagues from categories (main leagues only for standings)
const STANDINGS_LEAGUES: SportLeague[] = ['NBA', 'NFL', 'MLB', 'NHL', 'SOCCER'];
const ALL_LEAGUES = Object.values(LEAGUE_CATEGORIES).flatMap(cat => cat.leagues);

function LeagueStandings({ league }: { league: SportLeague }) {
  const [view, setView] = useState<StandingsView>('overall');
  const [conference, setConference] = useState<string>('');
  const [division, setDivision] = useState<string>('');

  const { data: standings, isLoading, error, refetch, dataUpdatedAt } = useSportradarStandings(league);

  const filteredStandings = useMemo(() => {
    if (!standings) return [];
    
    let filtered = standings;

    if (view === 'conference' && conference) {
      filtered = filtered.filter(s => 
        s.conference?.toLowerCase() === conference.toLowerCase()
      );
    } else if (view === 'division' && division) {
      filtered = filtered.filter(s => 
        s.division?.toLowerCase().includes(division.toLowerCase())
      );
    }

    return filtered;
  }, [standings, view, conference, division]);

  if (error) {
    return (
      <Card className="border-destructive/50">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center gap-4 py-8 text-center">
            <AlertCircle className="h-12 w-12 text-destructive" />
            <div>
              <p className="font-medium text-destructive">Failed to load standings</p>
              <p className="text-sm text-muted-foreground mt-1">
                {error instanceof Error ? error.message : 'An error occurred'}
              </p>
            </div>
            <Button variant="outline" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <StandingsFilters
        league={league}
        view={view}
        onViewChange={setView}
        conference={conference}
        onConferenceChange={setConference}
        division={division}
        onDivisionChange={setDivision}
      />
      
      {dataUpdatedAt && (
        <p className="text-xs text-muted-foreground">
          Last updated: {new Date(dataUpdatedAt).toLocaleTimeString()}
        </p>
      )}

      <StandingsTable
        league={league}
        standings={filteredStandings}
        isLoading={isLoading}
        view={view}
      />
    </div>
  );
}

// Component for displaying all leagues at once
function AllLeaguesStandings() {
  const { data: allStandings, isLoading, error, refetch } = useAllLeagueStandings();
  const queryClient = useQueryClient();

  const handleRefreshAll = () => {
    clearESPNStandingsCache();
    queryClient.invalidateQueries({ queryKey: ['espn', 'standings'] });
    refetch();
  };

  if (error) {
    return (
      <Card className="border-destructive/50">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center gap-4 py-8 text-center">
            <AlertCircle className="h-12 w-12 text-destructive" />
            <div>
              <p className="font-medium text-destructive">Failed to load standings</p>
              <p className="text-sm text-muted-foreground mt-1">
                {error instanceof Error ? error.message : 'An error occurred'}
              </p>
            </div>
            <Button variant="outline" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={handleRefreshAll}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh All
        </Button>
      </div>
      
      {STANDINGS_LEAGUES.map((league) => (
        <Card key={league}>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3">
              <img 
                src={getLeagueLogoUrl(league)} 
                alt={league}
                className="w-8 h-8 object-contain"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
              {getLeagueDisplayName(league)} Standings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <StandingsTable
              league={league}
              standings={allStandings?.[league] || []}
              isLoading={isLoading}
              view="overall"
            />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function Standings() {
  const [activeLeague, setActiveLeague] = useState<SportLeague | 'ALL'>('NBA');

  const isAllLeagues = activeLeague === 'ALL';

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      
      <main className="container py-8">
        <AppBreadcrumb className="mb-4" />
        
        <div className="mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Trophy className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">League Standings</h1>
                <p className="text-muted-foreground">
                  Current standings with conference and division views
                </p>
              </div>
            </div>
            <GroupedLeagueSelect
              value={activeLeague}
              onValueChange={(val) => setActiveLeague(val as SportLeague | 'ALL')}
              leagues={STANDINGS_LEAGUES}
              showAllOption={true}
              allLabel="All Leagues"
              className="w-[200px]"
            />
          </div>
        </div>

        {isAllLeagues ? (
          <AllLeaguesStandings />
        ) : (
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3">
                <img 
                  src={getLeagueLogoUrl(activeLeague)} 
                  alt={activeLeague}
                  className="w-8 h-8 object-contain"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
                {getLeagueDisplayName(activeLeague)} Standings
              </CardTitle>
              <CardDescription>
                {activeLeague === 'SOCCER' 
                  ? 'Premier League table' 
                  : `${getLeagueDisplayName(activeLeague)} regular season standings`
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LeagueStandings league={activeLeague} />
            </CardContent>
          </Card>
        )}
      </main>

      <PageFooter />
    </div>
  );
}
