
import { useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import AlgorithmDebugger from "./AlgorithmDebugger";
import AlgorithmSetupTool from "./AlgorithmSetupTool";
import { X } from "lucide-react";

const DevToolsPanel = () => {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className="fixed bottom-4 right-4 z-50">
      {isOpen ? (
        <Card className="w-full max-w-3xl h-[600px] overflow-auto shadow-xl">
          <div className="flex justify-between items-center p-2 border-b">
            <h2 className="text-lg font-bold px-2">Development Tools</h2>
            <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <CardContent className="p-4">
            <Tabs defaultValue="algorithms">
              <TabsList className="mb-4">
                <TabsTrigger value="algorithms">Algorithm Tools</TabsTrigger>
                <TabsTrigger value="setup">Setup Tools</TabsTrigger>
              </TabsList>
              
              <TabsContent value="algorithms">
                <AlgorithmDebugger />
              </TabsContent>
              
              <TabsContent value="setup">
                <AlgorithmSetupTool />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      ) : (
        <Button onClick={() => setIsOpen(true)}>Dev Tools</Button>
      )}
    </div>
  );
};

export default DevToolsPanel;
