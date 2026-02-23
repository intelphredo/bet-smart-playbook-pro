import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Home, MapPin, Trophy, Calendar, Clock, Brain } from "lucide-react";
import type { SituationalStat } from "@/hooks/useLearningCenter";

interface Props {
  homeVsAway: SituationalStat[];
  favoriteVsUnderdog: SituationalStat[];
  byLeague: SituationalStat[];
  byDayOfWeek: SituationalStat[];
  byTimeOfDay: SituationalStat[];
  byAlgorithm: SituationalStat[];
  overallWinRate: number;
}

function StatRow({ stat, overallWinRate }: { stat: SituationalStat; overallWinRate: number }) {
  const diff = stat.winRate - overallWinRate;
  const isAbove = diff > 0;

  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-border/30 last:border-0">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium truncate">{stat.label}</span>
          {stat.total >= 5 && Math.abs(diff) > 3 && (
            <Badge variant={isAbove ? "default" : "destructive"} className="text-[10px] px-1.5 py-0">
              {isAbove ? '+' : ''}{diff.toFixed(1)}%
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2 mt-1">
          <Progress value={stat.winRate} className="h-1.5 flex-1" />
          <span className="text-xs text-muted-foreground w-10 text-right">{stat.winRate.toFixed(0)}%</span>
        </div>
      </div>
      <div className="text-right shrink-0">
        <span className="text-xs text-muted-foreground">{stat.won}W-{stat.lost}L</span>
        <div className="text-[10px] text-muted-foreground/70">{stat.total} games</div>
      </div>
    </div>
  );
}

function StatChart({ stats }: { stats: SituationalStat[] }) {
  const chartData = stats.filter(s => s.total >= 3).map(s => ({
    name: s.label.length > 12 ? s.label.slice(0, 12) + '…' : s.label,
    winRate: Number(s.winRate.toFixed(1)),
    total: s.total,
    fullName: s.label,
  }));

  return (
    <div className="h-[220px] mt-2">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} layout="vertical" margin={{ left: 0, right: 10 }}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
          <XAxis type="number" domain={[0, 100]} tickFormatter={v => `${v}%`} fontSize={11} />
          <YAxis type="category" dataKey="name" width={100} fontSize={11} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const d = payload[0].payload;
              return (
                <div className="bg-popover border rounded-lg p-2.5 shadow-lg text-sm">
                  <p className="font-medium">{d.fullName}</p>
                  <p>Win Rate: <span className="text-primary font-bold">{d.winRate}%</span></p>
                  <p className="text-muted-foreground text-xs">{d.total} games</p>
                </div>
              );
            }}
          />
          <Bar dataKey="winRate" radius={[0, 4, 4, 0]}>
            {chartData.map((entry, i) => (
              <Cell
                key={i}
                fill={entry.winRate >= 55 ? 'hsl(var(--primary))' : entry.winRate >= 48 ? 'hsl(var(--muted-foreground))' : 'hsl(var(--destructive))'}
                opacity={0.85}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

const tabs = [
  { value: 'homeaway', label: 'Home/Away', icon: Home },
  { value: 'favdog', label: 'Fav/Dog', icon: Trophy },
  { value: 'league', label: 'League', icon: MapPin },
  { value: 'day', label: 'Day', icon: Calendar },
  { value: 'time', label: 'Time', icon: Clock },
  { value: 'algo', label: 'Algorithm', icon: Brain },
];

export function SituationalPerformance({
  homeVsAway, favoriteVsUnderdog, byLeague, byDayOfWeek, byTimeOfDay, byAlgorithm, overallWinRate
}: Props) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" />
          Model Performance by Situation
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Discover where the model excels and where it struggles
        </p>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="homeaway">
          <TabsList className="flex flex-wrap h-auto gap-1 mb-4">
            {tabs.map(t => (
              <TabsTrigger key={t.value} value={t.value} className="gap-1 text-xs px-2.5 min-h-[36px]">
                <t.icon className="h-3.5 w-3.5" />
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="homeaway">
            <StatChart stats={homeVsAway} />
            {homeVsAway.map(s => <StatRow key={s.label} stat={s} overallWinRate={overallWinRate} />)}
          </TabsContent>

          <TabsContent value="favdog">
            <StatChart stats={favoriteVsUnderdog} />
            {favoriteVsUnderdog.map(s => <StatRow key={s.label} stat={s} overallWinRate={overallWinRate} />)}
          </TabsContent>

          <TabsContent value="league">
            <StatChart stats={byLeague} />
            {byLeague.map(s => <StatRow key={s.label} stat={s} overallWinRate={overallWinRate} />)}
          </TabsContent>

          <TabsContent value="day">
            <StatChart stats={byDayOfWeek} />
            {byDayOfWeek.map(s => <StatRow key={s.label} stat={s} overallWinRate={overallWinRate} />)}
          </TabsContent>

          <TabsContent value="time">
            <StatChart stats={byTimeOfDay} />
            {byTimeOfDay.map(s => <StatRow key={s.label} stat={s} overallWinRate={overallWinRate} />)}
          </TabsContent>

          <TabsContent value="algo">
            <StatChart stats={byAlgorithm} />
            {byAlgorithm.map(s => <StatRow key={s.label} stat={s} overallWinRate={overallWinRate} />)}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
