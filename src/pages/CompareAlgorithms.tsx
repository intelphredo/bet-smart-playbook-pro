import { useState } from "react";
import NavBar from "@/components/NavBar";
import PageFooter from "@/components/PageFooter";
import AppBreadcrumb from "@/components/layout/AppBreadcrumb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  GitCompare, 
  RefreshCw, 
  Calendar, 
  Trophy, 
  Users, 
  TrendingUp,
  BarChart2,
  Filter
} from "lucide-react";
import { useAlgorithmComparison } from "@/hooks/useAlgorithmComparison";
import { 
  ComparisonCard, 
  HeadToHeadMatrix, 
  ConsensusChart, 
  PerformanceByContext,
  PredictionComparisonTable 
} from "@/components/CompareAlgorithms";
import { InfoExplainer, EXPLAINERS } from "@/components/ui/InfoExplainer";
import DateRangeFilter from "@/components/DateRangeFilter";
import { subDays, differenceInDays } from "date-fns";

const TIME_RANGES = [
  { value: '7', label: 'Last 7 days' },
  { value: '14', label: 'Last 14 days' },
  { value: '30', label: 'Last 30 days' },
  { value: '60', label: 'Last 60 days' },
  { value: '90', label: 'Last 90 days' },
];

const LEAGUES = [
  { value: 'all', label: 'All Leagues' },
  { value: 'NBA', label: 'NBA' },
  { value: 'NFL', label: 'NFL' },
  { value: 'NHL', label: 'NHL' },
  { value: 'MLB', label: 'MLB' },
  { value: 'NCAAB', label: 'NCAAB' },
];

export default function CompareAlgorithms() {
  const [days, setDays] = useState(30);
  const [league, setLeague] = useState('all');
  const [dateRange, setDateRange] = useState<{ start?: Date; end?: Date }>({});

  const effectiveDays = dateRange.start && dateRange.end 
    ? differenceInDays(dateRange.end, dateRange.start) 
    : days;

  const { data, isLoading, refetch, isFetching } = useAlgorithmComparison({
    days: effectiveDays,
    league: league === 'all' ? undefined : league,
  });

  const handleDateRangeChange = (range: { start?: Date; end?: Date }) => {
    setDateRange(range);
  };

  const handleResetDateRange = () => {
    setDateRange({});
  };

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      
      <main id="main-content" className="container py-6 space-y-6">
        <AppBreadcrumb />

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <GitCompare className="h-6 w-6 text-primary" />
              Compare Algorithms
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Side-by-side performance analysis of AI prediction models
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Select value={String(days)} onValueChange={(v) => setDays(Number(v))}>
              <SelectTrigger className="w-[140px]">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIME_RANGES.map(range => (
                  <SelectItem key={range.value} value={range.value}>
                    {range.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={league} onValueChange={setLeague}>
              <SelectTrigger className="w-[130px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LEAGUES.map(l => (
                  <SelectItem key={l.value} value={l.value}>
                    {l.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <DateRangeFilter
              dateRange={dateRange}
              onDateRangeChange={handleDateRangeChange}
              onReset={handleResetDateRange}
            />

            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => refetch()}
              disabled={isFetching}
            >
              <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-[300px]" />
              ))}
            </div>
            <Skeleton className="h-[200px]" />
            <Skeleton className="h-[300px]" />
          </div>
        ) : !data || data.algorithms.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <GitCompare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Comparison Data</h3>
              <p className="text-muted-foreground text-sm">
                There aren't enough algorithm predictions in the selected time range to compare.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2">
                    <BarChart2 className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-2xl font-bold">
                        {data.algorithms.reduce((sum, a) => sum + a.totalPredictions, 0)}
                      </p>
                      <p className="text-xs text-muted-foreground">Total Predictions</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="text-2xl font-bold">
                        {((data.agreementStats.fullAgreement / 
                          (data.agreementStats.fullAgreement + data.agreementStats.partialAgreement + data.agreementStats.noAgreement)) * 100 || 0).toFixed(0)}%
                      </p>
                      <p className="text-xs text-muted-foreground">Full Agreement Rate</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-yellow-500" />
                    <div>
                      <p className="text-2xl font-bold">
                        {data.algorithms[0]?.algorithmName.split(' ')[0] || '-'}
                      </p>
                      <p className="text-xs text-muted-foreground">Top Performer</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="text-2xl font-bold">
                        {data.agreementStats.fullAgreementWinRate.toFixed(1)}%
                      </p>
                      <p className="text-xs text-muted-foreground">Consensus Win Rate</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Algorithm Cards */}
            <section>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Algorithm Rankings
                <InfoExplainer term="confidence" size="sm" />
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {data.algorithms.map((algo, idx) => (
                  <ComparisonCard 
                    key={algo.algorithmId}
                    algorithm={algo}
                    rank={idx + 1}
                    isLeader={idx === 0}
                  />
                ))}
              </div>
            </section>

            {/* Head to Head */}
            <HeadToHeadMatrix headToHead={data.headToHead} />

            {/* Consensus Analysis */}
            <ConsensusChart agreementStats={data.agreementStats} />

            {/* Performance by Context */}
            <PerformanceByContext performanceByContext={data.performanceByContext} />

            {/* Prediction Comparison Table */}
            <PredictionComparisonTable consensusPicks={data.consensusPicks} />
          </div>
        )}
      </main>

      <PageFooter />
    </div>
  );
}
