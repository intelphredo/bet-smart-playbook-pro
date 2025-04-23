
import { useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import AlgorithmDebugger from "./AlgorithmDebugger";
import AlgorithmSetupTool from "./AlgorithmSetupTool";
import { X, Bug, Settings, Code } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

const DevToolsPanel = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("algorithms");
  
  return (
    <div className="fixed bottom-4 right-4 z-50">
      {isOpen ? (
        <Card className="w-full max-w-4xl h-[650px] overflow-auto shadow-xl dark:border-navy-700 dark:bg-navy-900/90 backdrop-blur-sm">
          <div className="flex justify-between items-center p-2 border-b dark:border-navy-700">
            <h2 className="text-lg font-bold px-2">Development Tools</h2>
            <div className="flex items-center space-x-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="dark:border-navy-700 dark:bg-navy-800"
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
              <TabsList className="mb-4 dark:bg-navy-800">
                <TabsTrigger value="algorithms" className="dark:data-[state=active]:bg-navy-700 dark:data-[state=active]:text-white">
                  <Code className="h-4 w-4 mr-1" />
                  Algorithm Tools
                </TabsTrigger>
                <TabsTrigger value="setup" className="dark:data-[state=active]:bg-navy-700 dark:data-[state=active]:text-white">
                  <Settings className="h-4 w-4 mr-1" />
                  Setup Tools
                </TabsTrigger>
                <TabsTrigger value="logs" className="dark:data-[state=active]:bg-navy-700 dark:data-[state=active]:text-white">
                  <Bug className="h-4 w-4 mr-1" />
                  System Logs
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="algorithms">
                <AlgorithmDebugger />
              </TabsContent>
              
              <TabsContent value="setup">
                <AlgorithmSetupTool />
              </TabsContent>

              <TabsContent value="logs">
                <Card className="dark:bg-navy-800/50 dark:border-navy-700">
                  <CardContent className="p-4">
                    <pre className="text-xs overflow-auto max-h-[400px] bg-gray-100 dark:bg-navy-900/80 p-2 rounded dark:text-gray-300">
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
        <Button onClick={() => setIsOpen(true)} className="dark:bg-navy-700 dark:hover:bg-navy-600">
          <Bug className="mr-2 h-4 w-4" /> Dev Tools
        </Button>
      )}
    </div>
  );
};

export default DevToolsPanel;
