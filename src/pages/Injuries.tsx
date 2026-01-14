import { useState } from 'react';
import { SportLeague } from '@/types/sportradar';
import { useSportradarInjuries, ExtendedSportLeague } from '@/hooks/useSportradarInjuries';
import NavBar from '@/components/NavBar';
import PageFooter from '@/components/PageFooter';
import AppBreadcrumb from '@/components/layout/AppBreadcrumb';
import InjuryReportCard from '@/components/Sportradar/InjuryReportCard';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertTriangle, RefreshCw, AlertCircle, Search } from 'lucide-react';
import { GroupedLeagueSelect, LEAGUE_CATEGORIES } from '@/components/filters/GroupedLeagueSelect';
import { getLeagueLogoUrl, getLeagueDisplayName } from '@/utils/teamLogos';

// Get all available leagues from categories
const ALL_LEAGUES = Object.values(LEAGUE_CATEGORIES).flatMap(cat => cat.leagues);

function LeagueInjuries({ league }: { league: ExtendedSportLeague }) {
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
  const [activeLeague, setActiveLeague] = useState<ExtendedSportLeague>('NBA');

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      
      <main className="container py-8">
        <AppBreadcrumb className="mb-4" />
        
        <div className="mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500/10">
                <AlertTriangle className="h-6 w-6 text-orange-500" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Injury Reports</h1>
                <p className="text-muted-foreground">
                  Track player injuries across all leagues with impact analysis
                </p>
              </div>
            </div>
            <GroupedLeagueSelect
              value={activeLeague}
              onValueChange={(val) => setActiveLeague(val as ExtendedSportLeague)}
              leagues={ALL_LEAGUES}
              showAllOption={false}
              className="w-[200px]"
            />
          </div>
        </div>

        {/* Current League Header */}
        <Card className="mb-6 border-primary/20">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <img 
                src={getLeagueLogoUrl(activeLeague)} 
                alt={activeLeague}
                className="w-8 h-8 object-contain"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
              <div>
                <h2 className="text-xl font-semibold">{getLeagueDisplayName(activeLeague)} Injuries</h2>
                <p className="text-sm text-muted-foreground">Current injury reports and expected return dates</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <LeagueInjuries league={activeLeague} />
      </main>

      <PageFooter />
    </div>
  );
}
