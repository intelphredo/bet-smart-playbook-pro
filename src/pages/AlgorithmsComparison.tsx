
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  applyAllAlgorithmPredictions, 
  ALGORITHM_IDS,
  getAlgorithmNameFromId, 
  getAlgorithmDescriptionFromId 
} from "@/utils/predictions/algorithms";
import { useSportsData } from "@/hooks/useSportsData";
import NavBar from "@/components/NavBar";
import AlgorithmPredictionsTable from "@/components/AlgorithmPredictionsTable";
import StatsOverview from "@/components/StatsOverview";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import AlgorithmCard from "@/components/AlgorithmCard";
import AlgorithmDebugger from "@/components/AlgorithmDebugger";
import AlgorithmSetupTool from "@/components/AlgorithmSetupTool";

export default function AlgorithmsComparison() {
  const [activeTab, setActiveTab] = useState("predictions");
  
  // Fetch sports data
  const { 
    upcomingMatches, 
    liveMatches, 
    finishedMatches, 
    isLoading: isLoadingSports 
  } = useSportsData({ 
    league: "ALL", 
    refreshInterval: 60000,
    useExternalApis: true,
  });
  
  // Apply algorithm predictions when data is available
  const { data: algorithmPredictions, isLoading: isLoadingPredictions } = useQuery({
    queryKey: ["algorithmPredictions", upcomingMatches?.length, liveMatches?.length],
    queryFn: () => {
      // Apply all algorithm predictions to upcoming and live matches
      const matches = [...(upcomingMatches || []), ...(liveMatches || [])];
      return applyAllAlgorithmPredictions(matches);
    },
    enabled: !!(upcomingMatches && liveMatches)
  });
  
  const isLoading = isLoadingSports || isLoadingPredictions;
  
  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <div className="container px-4 py-6">
        <h1 className="text-3xl font-bold mb-6">Sports Analytics Algorithms</h1>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="predictions">Predictions</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="setup">Setup</TabsTrigger>
          </TabsList>
          
          <TabsContent value="predictions" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {Object.values(ALGORITHM_IDS).map((id) => (
                <Card key={id} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <CardTitle>{getAlgorithmNameFromId(id)}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-3">
                      {getAlgorithmDescriptionFromId(id)}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {id === ALGORITHM_IDS.ML_POWER_INDEX && (
                        <>
                          <Badge variant="outline">Historical Data</Badge>
                          <Badge variant="outline">Player Stats</Badge>
                          <Badge variant="outline">Team Trends</Badge>
                        </>
                      )}
                      {id === ALGORITHM_IDS.VALUE_PICK_FINDER && (
                        <>
                          <Badge variant="outline">Odds Analysis</Badge>
                          <Badge variant="outline">Line Movements</Badge>
                          <Badge variant="outline">Market Value</Badge>
                        </>
                      )}
                      {id === ALGORITHM_IDS.STATISTICAL_EDGE && (
                        <>
                          <Badge variant="outline">Weather Impacts</Badge>
                          <Badge variant="outline">Injury Analysis</Badge>
                          <Badge variant="outline">Situational Spots</Badge>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            {isLoading ? (
              <Skeleton className="h-[500px] w-full" />
            ) : algorithmPredictions ? (
              <AlgorithmPredictionsTable
                matches={[...(upcomingMatches || []), ...(liveMatches || [])]}
                algorithmsData={algorithmPredictions}
              />
            ) : (
              <div className="p-12 text-center">
                <p className="text-muted-foreground">No data available. Please refresh the page.</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="performance" className="space-y-6">
            <StatsOverview />
            <AlgorithmDebugger />
          </TabsContent>
          
          <TabsContent value="setup" className="space-y-6">
            <AlgorithmSetupTool />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
