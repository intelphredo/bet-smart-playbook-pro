import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronRight, ChevronDown, RefreshCw, Copy } from "lucide-react";
import { toast } from "sonner";

interface StateNode {
  key: string;
  value: any;
  type: string;
  expanded?: boolean;
}

const StateInspector = () => {
  const [globalState, setGlobalState] = useState<Record<string, any>>({});
  const [localStorageData, setLocalStorageData] = useState<Record<string, any>>({});
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());

  const refreshState = () => {
    // Get EdgeIQ global state
    const edgeIQState = window.__EdgeIQ;
    setGlobalState({
      upcomingMatches: edgeIQState?.upcomingMatches || [],
      liveMatches: edgeIQState?.liveMatches || [],
      finishedMatches: edgeIQState?.finishedMatches || [],
      algorithmPerformance: edgeIQState?.algorithmPerformance || null,
      logsCount: edgeIQState?.logs?.length || 0,
    });

    // Get localStorage data
    const lsData: Record<string, any> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        try {
          lsData[key] = JSON.parse(localStorage.getItem(key) || "");
        } catch {
          lsData[key] = localStorage.getItem(key);
        }
      }
    }
    setLocalStorageData(lsData);
  };

  useEffect(() => {
    refreshState();
  }, []);

  const toggleExpand = (key: string) => {
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const copyToClipboard = (value: any) => {
    navigator.clipboard.writeText(JSON.stringify(value, null, 2));
    toast.success("Copied to clipboard");
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "string":
        return "text-green-500";
      case "number":
        return "text-blue-500";
      case "boolean":
        return "text-yellow-500";
      case "object":
        return "text-purple-500";
      case "array":
        return "text-orange-500";
      case "null":
        return "text-muted-foreground";
      default:
        return "text-foreground";
    }
  };

  const getValueType = (value: any): string => {
    if (value === null) return "null";
    if (Array.isArray(value)) return "array";
    return typeof value;
  };

  const renderValue = (key: string, value: any, depth: number = 0): JSX.Element => {
    const type = getValueType(value);
    const fullKey = `${depth}-${key}`;
    const isExpanded = expandedKeys.has(fullKey);
    const isExpandable = type === "object" || type === "array";
    const indent = depth * 16;

    return (
      <div key={fullKey} style={{ marginLeft: indent }}>
        <div
          className={`flex items-center gap-1 py-1 ${isExpandable ? "cursor-pointer hover:bg-muted/50" : ""}`}
          onClick={() => isExpandable && toggleExpand(fullKey)}
        >
          {isExpandable && (
            isExpanded ? (
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-3 w-3 text-muted-foreground" />
            )
          )}
          {!isExpandable && <span className="w-3" />}
          <span className="text-xs font-medium">{key}:</span>
          {!isExpandable && (
            <span className={`text-xs font-mono ${getTypeColor(type)}`}>
              {type === "string" ? `"${value}"` : String(value)}
            </span>
          )}
          {isExpandable && (
            <Badge variant="outline" className="text-[10px] ml-1">
              {type === "array" ? `Array(${value.length})` : `Object(${Object.keys(value).length})`}
            </Badge>
          )}
        </div>
        {isExpandable && isExpanded && (
          <div className="border-l border-muted ml-1.5">
            {type === "array"
              ? value.map((item: any, index: number) => renderValue(String(index), item, depth + 1))
              : Object.entries(value).map(([k, v]) => renderValue(k, v, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const StateSection = ({ title, data }: { title: string; data: Record<string, any> }) => (
    <Card>
      <CardHeader className="py-3 flex flex-row items-center justify-between">
        <CardTitle className="text-sm">{title}</CardTitle>
        <Button variant="ghost" size="sm" onClick={() => copyToClipboard(data)}>
          <Copy className="h-3 w-3" />
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[280px] px-4 pb-4">
          {Object.keys(data).length > 0 ? (
            Object.entries(data).map(([key, value]) => renderValue(key, value, 0))
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">No data</p>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Inspect application state and storage
        </p>
        <Button variant="outline" size="sm" onClick={refreshState}>
          <RefreshCw className="h-4 w-4 mr-1" />
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="global" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="global">Global State</TabsTrigger>
          <TabsTrigger value="localStorage">LocalStorage</TabsTrigger>
          <TabsTrigger value="context">React Context</TabsTrigger>
        </TabsList>

        <TabsContent value="global" className="mt-4">
          <StateSection title="EdgeIQ Global State" data={globalState} />
        </TabsContent>

        <TabsContent value="localStorage" className="mt-4">
          <StateSection title="LocalStorage Data" data={localStorageData} />
        </TabsContent>

        <TabsContent value="context" className="mt-4">
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm">React Context Values</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                  <span className="text-sm">OddsFormatContext</span>
                  <Badge variant="outline">Active</Badge>
                </div>
                <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                  <span className="text-sm">BetSlipContext</span>
                  <Badge variant="outline">Active</Badge>
                </div>
                <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                  <span className="text-sm">AuthContext</span>
                  <Badge variant="outline">Active (Dev Mode)</Badge>
                </div>
                <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                  <span className="text-sm">PreferencesContext</span>
                  <Badge variant="outline">Active</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StateInspector;
