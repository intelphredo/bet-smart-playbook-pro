import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Clock, 
  Radio, 
  CheckCircle2, 
  Star, 
  TrendingUp,
  Zap,
  BarChart3
} from "lucide-react";
import { Match } from "@/types/sports";
import { Badge } from "@/components/ui/badge";

interface MainContentTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  upcomingCount: number;
  liveCount: number;
  finishedCount: number;
  favoritesCount: number;
  children: {
    upcoming: React.ReactNode;
    live: React.ReactNode;
    finished: React.ReactNode;
    favorites: React.ReactNode;
    insights: React.ReactNode;
    algorithms: React.ReactNode;
  };
}

const MainContentTabs = ({
  activeTab,
  onTabChange,
  upcomingCount,
  liveCount,
  finishedCount,
  favoritesCount,
  children,
}: MainContentTabsProps) => {
  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border/50 pb-2">
        <TabsList className="w-full justify-start gap-1 h-auto p-1 bg-muted/50">
          <TabsTrigger 
            value="upcoming" 
            className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            <Clock className="h-4 w-4" />
            <span className="hidden sm:inline">Upcoming</span>
            {upcomingCount > 0 && (
              <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
                {upcomingCount}
              </Badge>
            )}
          </TabsTrigger>
          
          <TabsTrigger 
            value="live" 
            className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            <Radio className="h-4 w-4" />
            <span className="hidden sm:inline">Live</span>
            {liveCount > 0 && (
              <Badge className="h-5 px-1.5 text-[10px] bg-red-500 text-white animate-pulse">
                {liveCount}
              </Badge>
            )}
          </TabsTrigger>
          
          <TabsTrigger 
            value="finished" 
            className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            <CheckCircle2 className="h-4 w-4" />
            <span className="hidden sm:inline">Finished</span>
            {finishedCount > 0 && (
              <Badge variant="outline" className="h-5 px-1.5 text-[10px]">
                {finishedCount}
              </Badge>
            )}
          </TabsTrigger>
          
          <TabsTrigger 
            value="favorites" 
            className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            <Star className="h-4 w-4" />
            <span className="hidden sm:inline">Favorites</span>
            {favoritesCount > 0 && (
              <Badge className="h-5 px-1.5 text-[10px] bg-yellow-500/20 text-yellow-600">
                {favoritesCount}
              </Badge>
            )}
          </TabsTrigger>

          <div className="hidden md:flex ml-auto gap-1">
            <TabsTrigger 
              value="insights" 
              className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <TrendingUp className="h-4 w-4" />
              <span>Insights</span>
            </TabsTrigger>
            
            <TabsTrigger 
              value="algorithms" 
              className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <BarChart3 className="h-4 w-4" />
              <span>Algorithms</span>
            </TabsTrigger>
          </div>
        </TabsList>
      </div>

      <div className="mt-4">
        <TabsContent value="upcoming" className="m-0 fade-in">
          {children.upcoming}
        </TabsContent>
        
        <TabsContent value="live" className="m-0 fade-in">
          {children.live}
        </TabsContent>
        
        <TabsContent value="finished" className="m-0 fade-in">
          {children.finished}
        </TabsContent>
        
        <TabsContent value="favorites" className="m-0 fade-in">
          {children.favorites}
        </TabsContent>
        
        <TabsContent value="insights" className="m-0 fade-in">
          {children.insights}
        </TabsContent>
        
        <TabsContent value="algorithms" className="m-0 fade-in">
          {children.algorithms}
        </TabsContent>
      </div>
    </Tabs>
  );
};

export default MainContentTabs;
