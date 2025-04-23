
import { useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import AlgorithmDebugger from "./AlgorithmDebugger";
import AlgorithmSetupTool from "./AlgorithmSetupTool";
import { X, Bug, Settings } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

const DevToolsPanel = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("algorithms");
  
  return (
    <div className="fixed bottom-4 right-4 z-50">
      {isOpen ? (
        <Card className="w-full max-w-4xl h-[650px] overflow-auto shadow-xl">
          <div className="flex justify-between items-center p-2 border-b">
            <h2 className="text-lg font-bold px-2">Development Tools</h2>
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
          <CardContent className="p-4">
            <Tabs 
              defaultValue="algorithms" 
              value={activeTab} 
              onValueChange={setActiveTab}
            >
              <TabsList className="mb-4">
                <TabsTrigger value="algorithms">Algorithm Tools</TabsTrigger>
                <TabsTrigger value="setup">Setup Tools</TabsTrigger>
                <TabsTrigger value="logs">System Logs</TabsTrigger>
              </TabsList>
              
              <TabsContent value="algorithms">
                <AlgorithmDebugger />
              </TabsContent>
              
              <TabsContent value="setup">
                <AlgorithmSetupTool />
              </TabsContent>

              <TabsContent value="logs">
                <Card>
                  <CardContent className="p-4">
                    <pre className="text-xs overflow-auto max-h-[400px] bg-gray-100 p-2 rounded">
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
        <Button onClick={() => setIsOpen(true)}>
          <Bug className="mr-2 h-4 w-4" /> Dev Tools
        </Button>
      )}
    </div>
  );
};

export default DevToolsPanel;
