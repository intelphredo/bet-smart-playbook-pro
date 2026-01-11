import React, { useState, useMemo, memo } from "react";
import { Match } from "@/types/sports";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import { Tabs, TabsList, TabsTrigger } from "./ui/tabs";
import { useSavePrediction } from "@/hooks/useSavePrediction";
import VirtualizedTable, { Column } from "./VirtualizedTable";
import { Save, Loader2 } from "lucide-react";

interface AlgorithmPredictionsTableProps {
  matches: Match[];
  algorithmsData: {
    mlPowerIndex: Match[];
    valuePickFinder: Match[];
    statisticalEdge: Match[];
  };
}

// Memoized confidence badge
const ConfidenceBadge = memo(function ConfidenceBadge({ confidence }: { confidence: number }) {
  const colorClass = useMemo(() => {
    if (confidence >= 70) return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
    if (confidence >= 60) return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
    return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
  }, [confidence]);

  return <Badge className={colorClass}>{confidence}%</Badge>;
});

// Memoized save button
const SaveButton = memo(function SaveButton({ 
  match, 
  onSave,
  isPending 
}: { 
  match: Match; 
  onSave: (match: Match) => void;
  isPending: boolean;
}) {
  return (
    <Button
      size="sm"
      variant="outline"
      onClick={() => onSave(match)}
      disabled={isPending}
      className="gap-1.5"
    >
      {isPending ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : (
        <Save className="h-3 w-3" />
      )}
      Save
    </Button>
  );
});

export default function AlgorithmPredictionsTable({
  matches,
  algorithmsData,
}: AlgorithmPredictionsTableProps) {
  const [selectedTab, setSelectedTab] = useState("mlPowerIndex");
  const savePrediction = useSavePrediction();

  const tabMatches = useMemo(() => {
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
  }, [selectedTab, algorithmsData]);

  const algorithmInfo = useMemo(() => {
    switch (selectedTab) {
      case "mlPowerIndex":
        return {
          name: "ML Power Index",
          description: "Machine learning algorithm that analyzes historical data, player stats, and team performance trends."
        };
      case "valuePickFinder":
        return {
          name: "Value Pick Finder",
          description: "Specialized algorithm that focuses on finding betting value through odds analysis and line movements."
        };
      case "statisticalEdge":
        return {
          name: "Statistical Edge",
          description: "Pure statistics-based algorithm that considers situational spots, weather, and injuries."
        };
      default:
        return { name: "Unknown", description: "" };
    }
  }, [selectedTab]);

  const handleSavePrediction = (match: Match) => {
    savePrediction.mutate(match);
  };

  // Define table columns
  const columns: Column<Match>[] = useMemo(() => [
    {
      key: "match",
      header: "Match",
      width: "200px",
      render: (match) => (
        <span className="font-medium">
          {match.homeTeam.shortName} vs {match.awayTeam.shortName}
        </span>
      ),
    },
    {
      key: "league",
      header: "League",
      width: "100px",
      render: (match) => <Badge variant="outline">{match.league}</Badge>,
    },
    {
      key: "prediction",
      header: "Prediction",
      width: "120px",
      render: (match) => (
        <span className="font-medium">
          {match.prediction?.recommended === "home"
            ? match.homeTeam.shortName
            : match.prediction?.recommended === "away"
            ? match.awayTeam.shortName
            : "Draw"}
        </span>
      ),
    },
    {
      key: "confidence",
      header: "Confidence",
      width: "100px",
      render: (match) => <ConfidenceBadge confidence={match.prediction?.confidence || 0} />,
    },
    {
      key: "projectedScore",
      header: "Projected Score",
      width: "120px",
      className: "font-mono",
      render: (match) => (
        <span>
          {match.prediction?.projectedScore.home} - {match.prediction?.projectedScore.away}
        </span>
      ),
    },
    {
      key: "action",
      header: "Action",
      width: "100px",
      render: (match) => (
        <SaveButton
          match={match}
          onSave={handleSavePrediction}
          isPending={savePrediction.isPending}
        />
      ),
    },
  ], [savePrediction.isPending]);

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

          <div className="mb-4 p-3 bg-muted/50 rounded-lg border border-border/50">
            <h3 className="font-semibold">{algorithmInfo.name}</h3>
            <p className="text-sm text-muted-foreground">{algorithmInfo.description}</p>
          </div>

          <VirtualizedTable
            items={tabMatches}
            columns={columns}
            getRowKey={(match) => `${match.id}-${selectedTab}`}
            estimatedRowHeight={52}
            maxHeight={500}
            emptyMessage="No predictions available for this algorithm."
          />
        </Tabs>
      </CardContent>
    </Card>
  );
}
