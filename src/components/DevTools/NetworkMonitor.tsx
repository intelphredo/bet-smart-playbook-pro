import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Trash2, Search, RefreshCw } from "lucide-react";

interface NetworkRequest {
  id: string;
  url: string;
  method: string;
  status: number;
  duration: number;
  timestamp: Date;
  type: string;
  size?: string;
}

const NetworkMonitor = () => {
  const [requests, setRequests] = useState<NetworkRequest[]>([]);
  const [filter, setFilter] = useState("");
  const [selectedRequest, setSelectedRequest] = useState<NetworkRequest | null>(null);

  useEffect(() => {
    // Mock network requests for demo - in production, you'd intercept actual fetch/XHR
    const mockRequests: NetworkRequest[] = [
      {
        id: "1",
        url: "https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard",
        method: "GET",
        status: 200,
        duration: 245,
        timestamp: new Date(Date.now() - 5000),
        type: "fetch",
        size: "12.4 KB"
      },
      {
        id: "2",
        url: "https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard",
        method: "GET",
        status: 200,
        duration: 189,
        timestamp: new Date(Date.now() - 10000),
        type: "fetch",
        size: "8.2 KB"
      },
      {
        id: "3",
        url: "https://api.sportradar.com/nba/trial/v8/en/league/injuries.json",
        method: "GET",
        status: 200,
        duration: 156,
        timestamp: new Date(Date.now() - 15000),
        type: "fetch",
        size: "15.3 KB"
      },
      {
        id: "4",
        url: "https://pyknizknsygpmodoioae.supabase.co/rest/v1/algorithms",
        method: "GET",
        status: 200,
        duration: 312,
        timestamp: new Date(Date.now() - 20000),
        type: "fetch",
        size: "2.8 KB"
      },
      {
        id: "5",
        url: "https://pyknizknsygpmodoioae.supabase.co/functions/v1/fetch-odds",
        method: "GET",
        status: 200,
        duration: 523,
        timestamp: new Date(Date.now() - 25000),
        type: "fetch",
        size: "45.2 KB"
      },
    ];
    setRequests(mockRequests);
  }, []);

  const filteredRequests = requests.filter(req =>
    req.url.toLowerCase().includes(filter.toLowerCase()) ||
    req.method.toLowerCase().includes(filter.toLowerCase())
  );

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return "bg-green-500";
    if (status >= 300 && status < 400) return "bg-yellow-500";
    if (status >= 400 && status < 500) return "bg-orange-500";
    if (status >= 500) return "bg-red-500";
    return "bg-muted";
  };

  const clearRequests = () => {
    setRequests([]);
    setSelectedRequest(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Filter requests..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="pl-8"
          />
        </div>
        <Button variant="outline" size="sm" onClick={clearRequests}>
          <Trash2 className="h-4 w-4 mr-1" />
          Clear
        </Button>
        <Button variant="outline" size="sm">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm">Requests ({filteredRequests.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[350px]">
              <div className="divide-y">
                {filteredRequests.map((req) => (
                  <div
                    key={req.id}
                    className={`p-2 cursor-pointer hover:bg-muted/50 transition-colors ${
                      selectedRequest?.id === req.id ? "bg-muted" : ""
                    }`}
                    onClick={() => setSelectedRequest(req)}
                  >
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px] font-mono">
                        {req.method}
                      </Badge>
                      <span className={`w-2 h-2 rounded-full ${getStatusColor(req.status)}`} />
                      <span className="text-xs text-muted-foreground">{req.status}</span>
                    </div>
                    <p className="text-xs font-mono truncate mt-1">{req.url}</p>
                    <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground">
                      <span>{req.duration}ms</span>
                      <span>{req.size}</span>
                      <span>{req.timestamp.toLocaleTimeString()}</span>
                    </div>
                  </div>
                ))}
                {filteredRequests.length === 0 && (
                  <p className="p-4 text-center text-sm text-muted-foreground">
                    No requests captured
                  </p>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm">Request Details</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedRequest ? (
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground">URL</p>
                  <p className="text-xs font-mono break-all">{selectedRequest.url}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Method</p>
                    <Badge variant="outline">{selectedRequest.method}</Badge>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Status</p>
                    <Badge className={getStatusColor(selectedRequest.status)}>
                      {selectedRequest.status}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Duration</p>
                    <p className="text-sm font-mono">{selectedRequest.duration}ms</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Size</p>
                    <p className="text-sm font-mono">{selectedRequest.size}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Timestamp</p>
                  <p className="text-sm font-mono">{selectedRequest.timestamp.toISOString()}</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                Select a request to view details
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default NetworkMonitor;
