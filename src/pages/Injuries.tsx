import { useState } from 'react';
import { SportLeague } from '@/types/sportradar';
import { useSportradarInjuries } from '@/hooks/useSportradarInjuries';
import NavBar from '@/components/NavBar';
import PageFooter from '@/components/PageFooter';
import AppBreadcrumb from '@/components/layout/AppBreadcrumb';
import InjuryReportCard from '@/components/Sportradar/InjuryReportCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertTriangle, RefreshCw, AlertCircle, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

type LeagueConfig = { id: SportLeague; label: string; icon: string };

const LEAGUES: LeagueConfig[] = [
  { id: 'NBA', label: 'NBA', icon: '🏀' },
  { id: 'NFL', label: 'NFL', icon: '🏈' },
  { id: 'MLB', label: 'MLB', icon: '⚾' },
  { id: 'NHL', label: 'NHL', icon: '🏒' },
  { id: 'SOCCER', label: 'Soccer', icon: '⚽' },
];

function LeagueInjuries({ league }: { league: SportLeague }) {
  const [searchQuery, setSearchQuery] = useState('');
  const { data: injuries, isLoading, error, refetch } = useSportradarInjuries(league);

  const filteredInjuries = injuries?.filter(injury => 
    injury.playerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    injury.team.toLowerCase().includes(searchQuery.toLowerCase()) ||
    injury.injuryType.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  // Group injuries by team
  const injuriesByTeam = filteredInjuries.reduce((acc, injury) => {
    const team = injury.team || 'Unknown Team';
    if (!acc[team]) acc[team] = [];
    acc[team].push(injury);
    return acc;
  }, {} as Record<string, typeof filteredInjuries>);

  if (error) {
    return (
      <Card className="border-destructive/50">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center gap-4 py-8 text-center">
            <AlertCircle className="h-12 w-12 text-destructive" />
            <div>
              <p className="font-medium text-destructive">Failed to load injuries</p>
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
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by player, team, or injury type..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Summary Card */}
      <InjuryReportCard
        injuries={filteredInjuries}
        league={league}
        isLoading={isLoading}
        showImpactScore={true}
        maxItems={5}
      />

      {/* Injuries by Team */}
      {Object.keys(injuriesByTeam).length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">By Team</h3>
          <div className="grid gap-4 md:grid-cols-2">
            {Object.entries(injuriesByTeam)
              .sort((a, b) => b[1].length - a[1].length)
              .map(([team, teamInjuries]) => (
                <InjuryReportCard
                  key={team}
                  injuries={teamInjuries}
                  teamName={team}
                  isLoading={isLoading}
                  compact={true}
                  showImpactScore={true}
                  maxItems={5}
                />
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Injuries() {
  const [activeLeague, setActiveLeague] = useState<string>('NBA');

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      
      <main className="container py-8">
        <AppBreadcrumb className="mb-4" />
        
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-orange-500/10">
              <AlertTriangle className="h-6 w-6 text-orange-500" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Injury Reports</h1>
          </div>
          <p className="text-muted-foreground">
            Track player injuries across all leagues with impact analysis and expected return dates
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
              <LeagueInjuries league={league.id} />
            </TabsContent>
          ))}
        </Tabs>
      </main>

      <PageFooter />
    </div>
  );
}
