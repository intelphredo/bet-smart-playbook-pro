import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  TrendingUp, TrendingDown, AlertTriangle, Target, 
  Trophy, Skull, Calendar, BarChart3 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { UserBet } from '@/types/betting';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

interface SegmentedROIProps {
  bets: UserBet[];
}

interface SegmentStats {
  name: string;
  bets: number;
  wins: number;
  losses: number;
  staked: number;
  profit: number;
  roi: number;
  winRate: number;
}

function calculateSegmentStats(bets: UserBet[], groupBy: (bet: UserBet) => string): SegmentStats[] {
  const groups: Record<string, UserBet[]> = {};
  
  bets.forEach(bet => {
    const key = groupBy(bet) || 'Unknown';
    if (!groups[key]) groups[key] = [];
    groups[key].push(bet);
  });

  return Object.entries(groups).map(([name, groupBets]) => {
    const settledBets = groupBets.filter(b => b.status === 'won' || b.status === 'lost');
    const wins = settledBets.filter(b => b.status === 'won').length;
    const losses = settledBets.filter(b => b.status === 'lost').length;
    const staked = groupBets.reduce((sum, b) => sum + b.stake, 0);
    const profit = groupBets.reduce((sum, b) => sum + (b.result_profit || 0), 0);
    const roi = staked > 0 ? (profit / staked) * 100 : 0;
    const winRate = settledBets.length > 0 ? (wins / settledBets.length) * 100 : 0;

    return {
      name,
      bets: groupBets.length,
      wins,
      losses,
      staked,
      profit,
      roi,
      winRate,
    };
  }).sort((a, b) => b.roi - a.roi);
}

function getTimePeriod(bet: UserBet): string {
  const date = new Date(bet.placed_at);
  const now = new Date();
  const daysDiff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysDiff <= 7) return 'Last 7 Days';
  if (daysDiff <= 30) return 'Last 30 Days';
  if (daysDiff <= 90) return 'Last 90 Days';
  return '90+ Days Ago';
}

function getBetTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    'moneyline': 'Moneyline',
    'spread': 'Spread',
    'total': 'Over/Under',
  };
  return labels[type] || type;
}

export function SegmentedROI({ bets }: SegmentedROIProps) {
  const settledBets = useMemo(() => 
    bets.filter(b => b.status === 'won' || b.status === 'lost'),
    [bets]
  );

  const byLeague = useMemo(() => 
    calculateSegmentStats(settledBets, b => b.league?.toUpperCase() || 'Unknown'),
    [settledBets]
  );

  const byBetType = useMemo(() => 
    calculateSegmentStats(settledBets, b => getBetTypeLabel(b.bet_type)),
    [settledBets]
  );

  const byTimePeriod = useMemo(() => 
    calculateSegmentStats(settledBets, getTimePeriod),
    [settledBets]
  );

  const bySportsbook = useMemo(() => 
    calculateSegmentStats(settledBets, b => b.sportsbook || 'Unknown'),
    [settledBets]
  );

  // Find strengths and weaknesses
  const strengths = useMemo(() => 
    [...byLeague, ...byBetType].filter(s => s.roi > 5 && s.bets >= 3).slice(0, 3),
    [byLeague, byBetType]
  );

  const weaknesses = useMemo(() => 
    [...byLeague, ...byBetType].filter(s => s.roi < -5 && s.bets >= 3).slice(-3).reverse(),
    [byLeague, byBetType]
  );

  if (settledBets.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-12 text-center">
          <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
          <p className="text-muted-foreground">No settled bets to analyze.</p>
          <p className="text-sm text-muted-foreground mt-1">Place and settle some bets to see your segmented ROI.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Strengths & Weaknesses Summary */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="border-green-500/30 bg-green-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-green-600">
              <Trophy className="h-4 w-4" />
              Your Strengths
            </CardTitle>
          </CardHeader>
          <CardContent>
            {strengths.length > 0 ? (
              <div className="space-y-2">
                {strengths.map((s, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-sm font-medium">{s.name}</span>
                    <Badge variant="outline" className="text-green-600 border-green-500/30">
                      +{s.roi.toFixed(1)}% ROI
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No clear strengths identified yet. Need more data or positive ROI segments.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="border-red-500/30 bg-red-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-red-600">
              <Skull className="h-4 w-4" />
              Your Weaknesses
            </CardTitle>
          </CardHeader>
          <CardContent>
            {weaknesses.length > 0 ? (
              <div className="space-y-2">
                {weaknesses.map((s, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-sm font-medium">{s.name}</span>
                    <Badge variant="outline" className="text-red-600 border-red-500/30">
                      {s.roi.toFixed(1)}% ROI
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No major weaknesses identified. Keep analyzing as you place more bets.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detailed Breakdowns */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            ROI Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="league">
            <TabsList className="mb-4">
              <TabsTrigger value="league">By League</TabsTrigger>
              <TabsTrigger value="type">By Bet Type</TabsTrigger>
              <TabsTrigger value="time">By Time</TabsTrigger>
              <TabsTrigger value="book">By Sportsbook</TabsTrigger>
            </TabsList>

            <TabsContent value="league">
              <SegmentChart data={byLeague} />
              <SegmentTable data={byLeague} />
            </TabsContent>

            <TabsContent value="type">
              <SegmentChart data={byBetType} />
              <SegmentTable data={byBetType} />
            </TabsContent>

            <TabsContent value="time">
              <SegmentChart data={byTimePeriod} />
              <SegmentTable data={byTimePeriod} />
            </TabsContent>

            <TabsContent value="book">
              <SegmentChart data={bySportsbook} />
              <SegmentTable data={bySportsbook} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

function SegmentChart({ data }: { data: SegmentStats[] }) {
  return (
    <div className="h-[200px] mb-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis 
            type="number" 
            tickFormatter={(v) => `${v}%`}
            className="text-muted-foreground"
          />
          <YAxis 
            type="category" 
            dataKey="name" 
            width={80}
            tick={{ fontSize: 11 }}
            className="text-muted-foreground"
          />
          <Tooltip 
            formatter={(value: number) => [`${value.toFixed(1)}%`, 'ROI']}
            contentStyle={{ 
              backgroundColor: 'hsl(var(--card))', 
              border: '1px solid hsl(var(--border))' 
            }}
          />
          <Bar dataKey="roi" radius={[0, 4, 4, 0]}>
            {data.map((entry, index) => (
              <Cell 
                key={index} 
                fill={entry.roi >= 0 ? 'hsl(142 76% 36%)' : 'hsl(0 84% 60%)'} 
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function SegmentTable({ data }: { data: SegmentStats[] }) {
  return (
    <ScrollArea className="h-[200px]">
      <div className="space-y-2">
        {data.map((segment, i) => (
          <div 
            key={i} 
            className={cn(
              "flex items-center justify-between p-3 rounded-lg",
              segment.roi >= 0 ? "bg-green-500/5" : "bg-red-500/5"
            )}
          >
            <div className="flex items-center gap-3">
              {segment.roi >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
              <div>
                <p className="font-medium text-sm">{segment.name}</p>
                <p className="text-xs text-muted-foreground">
                  {segment.wins}W - {segment.losses}L ({segment.winRate.toFixed(0)}%)
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className={cn(
                "font-bold text-sm",
                segment.roi >= 0 ? "text-green-500" : "text-red-500"
              )}>
                {segment.roi >= 0 ? '+' : ''}{segment.roi.toFixed(1)}% ROI
              </p>
              <p className="text-xs text-muted-foreground">
                ${segment.profit >= 0 ? '+' : ''}{segment.profit.toFixed(0)} / ${segment.staked.toFixed(0)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}

export default SegmentedROI;
