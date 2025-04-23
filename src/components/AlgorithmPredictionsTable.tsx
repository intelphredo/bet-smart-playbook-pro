
import React, { useState } from "react";
import { Match } from "@/types/sports";
import { 
  Table, 
  TableHeader, 
  TableBody, 
  TableRow, 
  TableHead, 
  TableCell 
} from "@/components/ui/table";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs";
import { ALGORITHM_IDS, getAlgorithmNameFromId } from "@/utils/predictions/algorithms";
import { useSavePrediction } from "@/hooks/useSavePrediction";

interface AlgorithmPredictionsTableProps {
  matches: Match[];
  algorithmsData: {
    mlPowerIndex: Match[];
    valuePickFinder: Match[];
    statisticalEdge: Match[];
  };
}

export default function AlgorithmPredictionsTable({ 
  matches, 
  algorithmsData 
}: AlgorithmPredictionsTableProps) {
  const [selectedTab, setSelectedTab] = useState("mlPowerIndex");
  const savePrediction = useSavePrediction();
  
  const getColorForConfidence = (confidence: number): string => {
    if (confidence >= 70) return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
    if (confidence >= 60) return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
    return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
  };

  const getMatchesForTab = () => {
    switch (selectedTab) {
      case "mlPowerIndex":
        return algorithmsData.mlPowerIndex;
      case "valuePickFinder":
        return algorithmsData.valuePickFinder;
      case "statisticalEdge":
        return algorithmsData.statisticalEdge;
      default:
        return [];
    }
  };

  const handleSavePrediction = (match: Match) => {
    savePrediction.mutate(match);
  };

  const getAlgorithmName = () => {
    switch (selectedTab) {
      case "mlPowerIndex":
        return "ML Power Index";
      case "valuePickFinder":
        return "Value Pick Finder";
      case "statisticalEdge":
        return "Statistical Edge";
      default:
        return "Unknown Algorithm";
    }
  };

  const getAlgorithmDescription = () => {
    switch (selectedTab) {
      case "mlPowerIndex":
        return "Machine learning algorithm that analyzes historical data, player stats, and team performance trends.";
      case "valuePickFinder":
        return "Specialized algorithm that focuses on finding betting value through odds analysis and line movements.";
      case "statisticalEdge":
        return "Pure statistics-based algorithm that considers situational spots, weather, and injuries.";
      default:
        return "";
    }
  };

  const tabMatches = getMatchesForTab();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Algorithm Predictions</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
          <TabsList className="mb-4 grid grid-cols-3">
            <TabsTrigger value="mlPowerIndex">ML Power Index</TabsTrigger>
            <TabsTrigger value="valuePickFinder">Value Pick Finder</TabsTrigger>
            <TabsTrigger value="statisticalEdge">Statistical Edge</TabsTrigger>
          </TabsList>
          
          <div className="mb-4 p-3 bg-slate-50 dark:bg-slate-900 rounded-md">
            <h3 className="font-semibold">{getAlgorithmName()}</h3>
            <p className="text-sm text-muted-foreground">{getAlgorithmDescription()}</p>
          </div>
          
          {tabMatches.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Match</TableHead>
                    <TableHead>League</TableHead>
                    <TableHead>Prediction</TableHead>
                    <TableHead>Confidence</TableHead>
                    <TableHead>Projected Score</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tabMatches.map((match) => (
                    <TableRow key={`${match.id}-${selectedTab}`}>
                      <TableCell>
                        {match.homeTeam.shortName} vs {match.awayTeam.shortName}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{match.league}</Badge>
                      </TableCell>
                      <TableCell>
                        {match.prediction?.recommended === "home"
                          ? match.homeTeam.shortName
                          : match.prediction?.recommended === "away"
                          ? match.awayTeam.shortName
                          : "Draw"}
                      </TableCell>
                      <TableCell>
                        <Badge className={getColorForConfidence(match.prediction?.confidence || 0)}>
                          {match.prediction?.confidence}%
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {match.prediction?.projectedScore.home} - {match.prediction?.projectedScore.away}
                      </TableCell>
                      <TableCell>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleSavePrediction(match)}
                          disabled={savePrediction.isPending}
                        >
                          Save Prediction
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="py-10 text-center">
              <p className="text-muted-foreground">No predictions available for this algorithm.</p>
            </div>
          )}
        </Tabs>
      </CardContent>
    </Card>
  );
}
