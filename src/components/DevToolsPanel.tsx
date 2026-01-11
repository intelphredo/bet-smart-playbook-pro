import { useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import AlgorithmDebugger from "./AlgorithmDebugger";
import AlgorithmSetupTool from "./AlgorithmSetupTool";
import NetworkMonitor from "./DevTools/NetworkMonitor";
import StateInspector from "./DevTools/StateInspector";
import PerformanceMetrics from "./DevTools/PerformanceMetrics";
import { X, Bug, Network, Database, Gauge, Wrench, ScrollText } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

const DevToolsPanel = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("network");
  
  return (
    <div className="fixed bottom-4 right-4 z-50">
      {isOpen ? (
        <Card className="w-[95vw] max-w-5xl h-[700px] overflow-hidden shadow-xl border-2">
          <div className="flex justify-between items-center p-3 border-b bg-muted/30">
            <div className="flex items-center gap-2">
              <Bug className="h-5 w-5 text-amber-500" />
              <h2 className="text-lg font-bold">Developer Tools</h2>
            </div>
            <div className="flex items-center space-x-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => console.log('Project State Snapshot', {
                      matches: {
                        upcoming: window.__BetSmart?.upcomingMatches?.length || 0,
                        live: window.__BetSmart?.liveMatches?.length || 0,
                        finished: window.__BetSmart?.finishedMatches?.length || 0
                      },
                      algorithmPerformance: window.__BetSmart?.algorithmPerformance || null
                    })}
                  >
                    <Bug className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Log Project State</TooltipContent>
              </Tooltip>
              <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <CardContent className="p-4 h-[calc(100%-60px)] overflow-auto">
            <Tabs 
              defaultValue="network" 
              value={activeTab} 
              onValueChange={setActiveTab}
            >
              <TabsList className="grid w-full grid-cols-6 mb-4">
                <TabsTrigger value="network" className="flex items-center gap-1.5">
                  <Network className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Network</span>
                </TabsTrigger>
                <TabsTrigger value="state" className="flex items-center gap-1.5">
                  <Database className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">State</span>
                </TabsTrigger>
                <TabsTrigger value="performance" className="flex items-center gap-1.5">
                  <Gauge className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Perf</span>
                </TabsTrigger>
                <TabsTrigger value="algorithms" className="flex items-center gap-1.5">
                  <Wrench className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Algo</span>
                </TabsTrigger>
                <TabsTrigger value="setup" className="flex items-center gap-1.5">
                  <Bug className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Setup</span>
                </TabsTrigger>
                <TabsTrigger value="logs" className="flex items-center gap-1.5">
                  <ScrollText className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Logs</span>
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="network">
                <NetworkMonitor />
              </TabsContent>
              
              <TabsContent value="state">
                <StateInspector />
              </TabsContent>
              
              <TabsContent value="performance">
                <PerformanceMetrics />
              </TabsContent>
              
              <TabsContent value="algorithms">
                <AlgorithmDebugger />
              </TabsContent>
              
              <TabsContent value="setup">
                <AlgorithmSetupTool />
              </TabsContent>

              <TabsContent value="logs">
                <Card>
                  <CardContent className="p-4">
                    <pre className="text-xs overflow-auto max-h-[450px] bg-muted p-3 rounded-lg font-mono">
                      {JSON.stringify(
                        window.__BetSmart?.logs || 
                        'No logs available. Ensure logging is set up.', 
                        null, 2
                      )}
                    </pre>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      ) : (
        <Button 
          onClick={() => setIsOpen(true)} 
          className="shadow-lg bg-amber-500 hover:bg-amber-600 text-white"
        >
          <Bug className="mr-2 h-4 w-4" /> Dev Tools
        </Button>
      )}
    </div>
  );
};

export default DevToolsPanel;
