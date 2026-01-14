/**
 * Live Score Monitor Panel
 * 
 * Real-time visualization of live score system performance
 * for the DevTools panel.
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Activity, 
  Wifi, 
  WifiOff, 
  Clock, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Download,
  Zap,
  Timer,
  BarChart3
} from 'lucide-react';
import { liveScoreMonitor, LiveScoreMonitoringStats } from '@/services/live-score-monitoring';
import { cn } from '@/lib/utils';

const formatMs = (ms: number): string => {
  if (ms < 1000) return `${ms.toFixed(0)}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
};

const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)}MB`;
};

const formatUptime = (ms: number): string => {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
};

interface TierCardProps {
  tier: 1 | 2 | 3;
  data: LiveScoreMonitoringStats['polling']['tier1'];
  color: string;
}

function TierCard({ tier, data, color }: TierCardProps) {
  const tierNames = { 1: 'High Priority', 2: 'Medium Priority', 3: 'Low Priority' };
  const tierIntervals = { 1: '10s', 2: '30s', 3: '2min' };

  return (
    <Card className={cn('border-l-4', color)}>
      <CardHeader className="py-2 px-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">
            Tier {tier}: {tierNames[tier]}
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            {tierIntervals[tier]}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="py-2 px-3 space-y-2">
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div>
            <p className="text-muted-foreground">Active</p>
            <p className="font-semibold">{data.activeMatches}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Req/min</p>
            <p className="font-semibold">{data.requestsPerMinute}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Avg Latency</p>
            <p className="font-semibold">{formatMs(data.metrics.avgLatency)}</p>
          </div>
        </div>
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-muted-foreground">Success Rate</span>
            <span className={cn(
              data.metrics.successRate >= 95 ? 'text-green-500' :
              data.metrics.successRate >= 80 ? 'text-yellow-500' : 'text-red-500'
            )}>
              {data.metrics.successRate.toFixed(1)}%
            </span>
          </div>
          <Progress 
            value={data.metrics.successRate} 
            className="h-1.5"
          />
        </div>
        {data.leagues.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {data.leagues.slice(0, 4).map(league => (
              <Badge key={league} variant="secondary" className="text-xs px-1.5 py-0">
                {league}
              </Badge>
            ))}
            {data.leagues.length > 4 && (
              <Badge variant="secondary" className="text-xs px-1.5 py-0">
                +{data.leagues.length - 4}
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function WebSocketStatus({ data }: { data: LiveScoreMonitoringStats['websocket'] }) {
  return (
    <Card>
      <CardHeader className="py-2 px-3">
        <div className="flex items-center gap-2">
          {data.activeConnections > 0 ? (
            <Wifi className="h-4 w-4 text-green-500" />
          ) : (
            <WifiOff className="h-4 w-4 text-muted-foreground" />
          )}
          <CardTitle className="text-sm font-medium">WebSocket Status</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="py-2 px-3">
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <p className="text-muted-foreground">Connections</p>
            <p className="font-semibold">
              {data.activeConnections}/{data.maxConnections}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Messages</p>
            <p className="font-semibold">{data.messagesReceived}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Reconnects</p>
            <p className={cn(
              'font-semibold',
              data.reconnectAttempts > 5 && 'text-yellow-500'
            )}>
              {data.reconnectAttempts}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Fallbacks</p>
            <p className={cn(
              'font-semibold',
              data.fallbacksToPolling > 3 && 'text-yellow-500'
            )}>
              {data.fallbacksToPolling}
            </p>
          </div>
        </div>
        {data.lastMessage && (
          <p className="text-xs text-muted-foreground mt-2">
            Last message: {new Date(data.lastMessage).toLocaleTimeString()}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function StaleDataCard({ data }: { data: LiveScoreMonitoringStats['staleData'] }) {
  const isHealthy = data.staleRate < 10;
  const isWarning = data.staleRate >= 10 && data.staleRate < 25;

  return (
    <Card className={cn(
      'border-l-4',
      isHealthy ? 'border-l-green-500' :
      isWarning ? 'border-l-yellow-500' : 'border-l-red-500'
    )}>
      <CardHeader className="py-2 px-3">
        <div className="flex items-center gap-2">
          <Timer className="h-4 w-4" />
          <CardTitle className="text-sm font-medium">Data Freshness</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="py-2 px-3">
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div>
            <p className="text-muted-foreground">Stale</p>
            <p className={cn(
              'font-semibold',
              !isHealthy && 'text-yellow-500'
            )}>
              {data.staleCount}/{data.totalMatches}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Rate</p>
            <p className={cn(
              'font-semibold',
              isHealthy ? 'text-green-500' :
              isWarning ? 'text-yellow-500' : 'text-red-500'
            )}>
              {data.staleRate.toFixed(1)}%
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Avg Age</p>
            <p className="font-semibold">{formatMs(data.avgDataAge)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function LiveScoreMonitor() {
  const [stats, setStats] = useState<LiveScoreMonitoringStats | null>(null);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    // Start monitoring
    liveScoreMonitor.start();

    // Subscribe to updates
    const unsubscribe = liveScoreMonitor.subscribe((newStats) => {
      if (isActive) {
        setStats(newStats);
      }
    });

    // Initial stats
    setStats(liveScoreMonitor.getStats());

    return () => {
      unsubscribe();
    };
  }, [isActive]);

  const handleExport = () => {
    const data = liveScoreMonitor.exportMetrics();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `live-score-metrics-${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    liveScoreMonitor.reset();
    setStats(liveScoreMonitor.getStats());
  };

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-48">
        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header Stats */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Activity className={cn(
              'h-5 w-5',
              isActive ? 'text-green-500 animate-pulse' : 'text-muted-foreground'
            )} />
            <span className="font-semibold">Live Score Monitor</span>
          </div>
          <Badge variant="outline" className="text-xs">
            <Clock className="h-3 w-3 mr-1" />
            {formatUptime(stats.uptime)}
          </Badge>
          <Badge variant="secondary" className="text-xs">
            <Zap className="h-3 w-3 mr-1" />
            {stats.requestsPerMinute} req/min
          </Badge>
          <Badge variant="secondary" className="text-xs">
            <TrendingUp className="h-3 w-3 mr-1" />
            {formatBytes(stats.bandwidthSaved)} saved
          </Badge>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setIsActive(!isActive)}
          >
            {isActive ? 'Pause' : 'Resume'}
          </Button>
          <Button variant="outline" size="sm" onClick={handleReset}>
            <RefreshCw className="h-3 w-3 mr-1" />
            Reset
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-3 w-3 mr-1" />
            Export
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview" className="flex items-center gap-1.5">
            <BarChart3 className="h-3.5 w-3.5" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="tiers" className="flex items-center gap-1.5">
            <Activity className="h-3.5 w-3.5" />
            Polling Tiers
          </TabsTrigger>
          <TabsTrigger value="recommendations" className="flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5" />
            Health
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <WebSocketStatus data={stats.websocket} />
            <StaleDataCard data={stats.staleData} />
          </div>

          {/* Overall Metrics */}
          <Card>
            <CardHeader className="py-2 px-3">
              <CardTitle className="text-sm font-medium">Overall Performance</CardTitle>
            </CardHeader>
            <CardContent className="py-2 px-3">
              <div className="grid grid-cols-5 gap-4 text-xs">
                <div className="text-center">
                  <p className="text-2xl font-bold">{stats.polling.total.requestCount}</p>
                  <p className="text-muted-foreground">Total Requests</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-500">{stats.polling.total.successCount}</p>
                  <p className="text-muted-foreground">Successful</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-500">{stats.polling.total.errorCount}</p>
                  <p className="text-muted-foreground">Errors</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{formatMs(stats.polling.total.avgLatency)}</p>
                  <p className="text-muted-foreground">Avg Latency</p>
                </div>
                <div className="text-center">
                  <p className={cn(
                    'text-2xl font-bold',
                    stats.polling.total.successRate >= 95 ? 'text-green-500' :
                    stats.polling.total.successRate >= 80 ? 'text-yellow-500' : 'text-red-500'
                  )}>
                    {stats.polling.total.successRate.toFixed(1)}%
                  </p>
                  <p className="text-muted-foreground">Success Rate</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tiers" className="mt-4 space-y-3">
          <TierCard 
            tier={1} 
            data={stats.polling.tier1} 
            color="border-l-red-500"
          />
          <TierCard 
            tier={2} 
            data={stats.polling.tier2} 
            color="border-l-yellow-500"
          />
          <TierCard 
            tier={3} 
            data={stats.polling.tier3} 
            color="border-l-blue-500"
          />
        </TabsContent>

        <TabsContent value="recommendations" className="mt-4">
          <Card>
            <CardHeader className="py-2 px-3">
              <CardTitle className="text-sm font-medium">System Health</CardTitle>
            </CardHeader>
            <CardContent className="py-2 px-3">
              <ScrollArea className="h-48">
                <div className="space-y-2">
                  {stats.recommendations.map((rec, i) => (
                    <div 
                      key={i}
                      className={cn(
                        'flex items-start gap-2 p-2 rounded-md text-sm',
                        rec.startsWith('✅') ? 'bg-green-500/10' :
                        rec.startsWith('⚠️') ? 'bg-yellow-500/10' : 'bg-muted'
                      )}
                    >
                      {rec.startsWith('✅') ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      ) : rec.startsWith('⚠️') ? (
                        <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                      ) : null}
                      <span>{rec.replace(/^[✅⚠️]\s*/, '')}</span>
                    </div>
                  ))}
                  {stats.recommendations.length === 0 && (
                    <div className="text-center text-muted-foreground py-8">
                      <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>Collecting data...</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
