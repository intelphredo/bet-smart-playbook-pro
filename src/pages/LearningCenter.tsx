import { useLearningCenter } from "@/hooks/useLearningCenter";
import { SituationalPerformance } from "@/components/LearningCenter/SituationalPerformance";
import { LossPatternAnalysis } from "@/components/LearningCenter/LossPatternAnalysis";
import { ImprovementSuggestions } from "@/components/LearningCenter/ImprovementSuggestions";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import NavBar from "@/components/NavBar";
import { GraduationCap, TrendingUp, TrendingDown, Target, Loader2 } from "lucide-react";

export default function LearningCenter() {
  const { data, isLoading, isError } = useLearningCenter();

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <main className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <GraduationCap className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Learning Center</h1>
              <p className="text-sm text-muted-foreground">
                Understand how the model performs and where it can improve
              </p>
            </div>
          </div>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-3 text-muted-foreground">Analyzing prediction history…</span>
          </div>
        )}

        {isError && (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              Failed to load prediction data. Please try again later.
            </CardContent>
          </Card>
        )}

        {data && (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              <Card className="p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Target className="h-4 w-4 text-primary" />
                  <span className="text-xs text-muted-foreground">Overall Win Rate</span>
                </div>
                <p className="text-xl font-bold">{data.overallWinRate.toFixed(1)}%</p>
                <p className="text-[10px] text-muted-foreground">{data.totalSettled} settled</p>
              </Card>
              <Card className="p-3">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <span className="text-xs text-muted-foreground">Best Situation</span>
                </div>
                <p className="text-sm font-bold truncate">{data.bestSituation}</p>
                <Badge variant="outline" className="text-[10px] mt-1">strongest edge</Badge>
              </Card>
              <Card className="p-3">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingDown className="h-4 w-4 text-destructive" />
                  <span className="text-xs text-muted-foreground">Worst Situation</span>
                </div>
                <p className="text-sm font-bold truncate">{data.worstSituation}</p>
                <Badge variant="destructive" className="text-[10px] mt-1">needs work</Badge>
              </Card>
              <Card className="p-3">
                <div className="flex items-center gap-2 mb-1">
                  <GraduationCap className="h-4 w-4 text-primary" />
                  <span className="text-xs text-muted-foreground">Patterns Found</span>
                </div>
                <p className="text-xl font-bold">{data.lossPatterns.length}</p>
                <p className="text-[10px] text-muted-foreground">
                  {data.lossPatterns.filter(p => p.severity === 'high').length} high severity
                </p>
              </Card>
            </div>

            {/* Main content */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <SituationalPerformance
                homeVsAway={data.homeVsAway}
                favoriteVsUnderdog={data.favoriteVsUnderdog}
                byLeague={data.byLeague}
                byDayOfWeek={data.byDayOfWeek}
                byTimeOfDay={data.byTimeOfDay}
                byAlgorithm={data.byAlgorithm}
                overallWinRate={data.overallWinRate}
              />
              <div className="space-y-6">
                <LossPatternAnalysis patterns={data.lossPatterns} />
                <ImprovementSuggestions suggestions={data.suggestions} />
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
