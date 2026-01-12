import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import NavBar from "@/components/NavBar";
import AppBreadcrumb from "@/components/layout/AppBreadcrumb";
import CreatorPanel from "@/components/CreatorPanel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, Activity, Database, Terminal, Settings, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function CreatorDashboard() {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const [isCreator, setIsCreator] = useState(false);

  useEffect(() => {
    // For development, allow access or check for creator role
    // In production, you'd check profile.role === 'creator' or similar
    if (!loading) {
      // Allow access if user is logged in OR for development
      const hasAccess = user !== null || import.meta.env.DEV;
      setIsCreator(hasAccess);
      
      if (!hasAccess && !loading) {
        navigate('/');
      }
    }
  }, [user, profile, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-accent/10">
        <NavBar />
        <div className="container px-4 py-6">
          <div className="space-y-6">
            <Skeleton className="h-12 w-64" />
            <Skeleton className="h-[400px] w-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-accent/10">
      <NavBar />
      <div className="container px-4 py-6">
        <AppBreadcrumb className="mb-4" />
        
        <div className="flex items-center gap-3 mb-6">
          <Shield className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Creator Dashboard</h1>
          <Badge variant="secondary" className="ml-2">
            {user ? 'Authenticated' : 'Dev Mode'}
          </Badge>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full max-w-2xl grid-cols-5">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="data" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Data
            </TabsTrigger>
            <TabsTrigger value="logs" className="flex items-center gap-2">
              <Terminal className="h-4 w-4" />
              Logs
            </TabsTrigger>
            <TabsTrigger value="algorithms" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Algorithms
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <CreatorPanel />
          </TabsContent>

          <TabsContent value="data">
            <Card>
              <CardHeader>
                <CardTitle>Data Source Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  {['ESPN', 'MLB API', 'Sportradar', 'Odds API'].map((source) => (
                    <Card key={source} className="p-4">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{source}</span>
                        <Badge variant={source === 'ESPN' || source === 'MLB API' || source === 'Sportradar' ? 'default' : 'secondary'}>
                          {source === 'ESPN' || source === 'MLB API' ? 'Active' : source === 'Sportradar' ? 'Premium' : 'Configure'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">
                        {source === 'ESPN' && 'Free tier - Live scores and schedules'}
                        {source === 'MLB API' && 'Official MLB data feed'}
                        {source === 'Sportradar' && 'Premium injuries, stats & analytics'}
                        {source === 'Odds API' && 'Multi-book odds comparison'}
                      </p>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="logs">
            <Card>
              <CardHeader>
                <CardTitle>Application Logs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-muted/50 rounded-lg p-4 font-mono text-sm max-h-[500px] overflow-auto">
                  {typeof window !== 'undefined' && window.__BetSmart?.logs ? (
                    window.__BetSmart.logs.length > 0 ? (
                      window.__BetSmart.logs.map((log, i) => (
                        <div key={i} className="py-1 border-b border-border/30 last:border-0">
                          {log}
                        </div>
                      ))
                    ) : (
                      <p className="text-muted-foreground">No logs yet. Interact with the app to generate logs.</p>
                    )
                  ) : (
                    <p className="text-muted-foreground">Log system initializing...</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="algorithms">
            <Card>
              <CardHeader>
                <CardTitle>Algorithm Performance Tracker</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {[
                    { name: 'ML Power Index', winRate: 62, picks: 156 },
                    { name: 'Statistical Edge', winRate: 58, picks: 203 },
                    { name: 'Value Pick Finder', winRate: 55, picks: 178 },
                  ].map((algo) => (
                    <Card key={algo.name} className="p-4">
                      <h3 className="font-semibold">{algo.name}</h3>
                      <div className="mt-2 space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Win Rate</span>
                          <span className="font-medium">{algo.winRate}%</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Total Picks</span>
                          <span className="font-medium">{algo.picks}</span>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Creator Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <Card className="p-4">
                    <h3 className="font-semibold mb-2">API Configuration</h3>
                    <p className="text-sm text-muted-foreground">
                      Configure API keys and endpoints for external data sources.
                      Add secrets through the Cloud dashboard.
                    </p>
                  </Card>
                  <Card className="p-4">
                    <h3 className="font-semibold mb-2">Feature Flags</h3>
                    <p className="text-sm text-muted-foreground">
                      Toggle experimental features and beta functionality.
                    </p>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
