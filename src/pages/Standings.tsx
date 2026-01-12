import { useState, useMemo } from 'react';
import { SportLeague, SportradarStanding } from '@/types/sportradar';
import { useSportradarStandings } from '@/hooks/useSportradarStandings';
import NavBar from '@/components/NavBar';
import PageFooter from '@/components/PageFooter';
import AppBreadcrumb from '@/components/layout/AppBreadcrumb';
import StandingsTable from '@/components/Sportradar/StandingsTable';
import StandingsFilters, { StandingsView } from '@/components/Sportradar/StandingsFilters';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trophy, RefreshCw, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

type LeagueConfig = { id: SportLeague; label: string; icon: string };

const LEAGUES: LeagueConfig[] = [
  { id: 'NBA', label: 'NBA', icon: '🏀' },
  { id: 'NFL', label: 'NFL', icon: '🏈' },
  { id: 'MLB', label: 'MLB', icon: '⚾' },
  { id: 'NHL', label: 'NHL', icon: '🏒' },
  { id: 'SOCCER', label: 'Soccer', icon: '⚽' },
];

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
      />
    </div>
  );
}

export default function Standings() {
  const [activeLeague, setActiveLeague] = useState<string>('NBA');

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      
      <main className="container py-8">
        <AppBreadcrumb className="mb-4" />
        
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Trophy className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">League Standings</h1>
          </div>
          <p className="text-muted-foreground">
            Current standings for all major sports leagues with conference and division views
          </p>
        </div>

        <Tabs value={activeLeague} onValueChange={setActiveLeague} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-flex">
            {LEAGUES.map((league) => (
              <TabsTrigger
                key={league.id}
                value={league.id}
                className={cn(
                  'flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground'
                )}
              >
                <span className="hidden sm:inline">{league.icon}</span>
                <span>{league.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {LEAGUES.map((league) => (
            <TabsContent key={league.id} value={league.id} className="mt-6">
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2">
                    <span>{league.icon}</span>
                    {league.label} Standings
                  </CardTitle>
                  <CardDescription>
                    {league.id === 'SOCCER' 
                      ? 'Premier League table' 
                      : `${league.label} regular season standings`
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <LeagueStandings league={league.id} />
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </main>

      <PageFooter />
    </div>
  );
}
