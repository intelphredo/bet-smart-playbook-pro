
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "./ui/badge";

const AlgorithmDebugger = () => {
  const [algorithmId, setAlgorithmId] = useState("85c48bbe-5b1a-4c1e-a0d5-e284e9e952f1");
  const [showRawData, setShowRawData] = useState(false);
  
  const { data: predictions, isLoading } = useQuery({
    queryKey: ["algorithmPredictions", algorithmId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("algorithm_predictions")
        .select("*")
        .order("predicted_at", { ascending: false })
        .limit(50);
        
      if (error) throw error;
      return data;
    },
    refetchInterval: 60000, // Refetch every 60 seconds (debug tool, no need for aggressive polling)
    staleTime: 30000,
  });
  
  const { data: algorithms } = useQuery({
    queryKey: ["algorithms"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("algorithms")
        .select("*");
        
      if (error) throw error;
      return data;
    }
  });
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Algorithm Performance Debugger</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4 space-y-2">
          <div>
            <label htmlFor="algo-id" className="text-sm mb-1 block">Algorithm ID</label>
            <Input
              id="algo-id"
              value={algorithmId}
              onChange={(e) => setAlgorithmId(e.target.value)}
              placeholder="Enter algorithm ID"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={() => setAlgorithmId("85c48bbe-5b1a-4c1e-a0d5-e284e9e952f1")}>
              Use Statistical Edge
            </Button>
            <Button size="sm" onClick={() => setShowRawData(!showRawData)}>
              {showRawData ? "Hide Raw Data" : "Show Raw Data"}
            </Button>
          </div>
        </div>
        
        <div className="mb-4">
          <h3 className="text-lg font-medium mb-2">Available Algorithms</h3>
          <div className="flex gap-2 flex-wrap">
            {algorithms?.map((algo) => (
              <Badge 
                key={algo.id}
                className="cursor-pointer" 
                variant="outline"
                onClick={() => setAlgorithmId(algo.id)}
              >
                {algo.name} ({algo.id})
              </Badge>
            ))}
          </div>
        </div>
        
        <div>
          <h3 className="text-lg font-medium mb-2">Recent Predictions</h3>
          {isLoading ? (
            <div>Loading...</div>
          ) : !predictions || predictions.length === 0 ? (
            <div className="text-amber-600 dark:text-amber-400">
              No predictions found. Try adding some predictions first by clicking "Save Prediction" 
              on match cards, then update the results for finished matches.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Match ID</TableHead>
                    <TableHead>League</TableHead>
                    <TableHead>Prediction</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Confidence</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {predictions.map((pred) => (
                    <TableRow key={pred.id}>
                      <TableCell>{pred.match_id}</TableCell>
                      <TableCell>{pred.league}</TableCell>
                      <TableCell>{pred.prediction}</TableCell>
                      <TableCell>
                        <Badge 
                          className={pred.status === 'win' 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                            : pred.status === 'loss'
                            ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                            : ''}
                        >
                          {pred.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{pred.confidence}%</TableCell>
                      <TableCell>{new Date(pred.predicted_at).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          
          {showRawData && predictions && (
            <div className="mt-4">
              <h3 className="text-lg font-medium mb-2">Raw Data</h3>
              <pre className="bg-slate-100 dark:bg-slate-800 p-4 rounded text-xs overflow-auto max-h-[400px]">
                {JSON.stringify(predictions, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AlgorithmDebugger;
