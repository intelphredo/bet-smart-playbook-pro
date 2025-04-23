
import { Match } from "@/types/sports";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { getAlgorithmNameFromId } from "@/utils/predictions/algorithms";
import { formatDistanceToNow, parseISO } from "date-fns";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Brain, Calculator, Zap } from "lucide-react";
import { Card } from "./ui/card";

interface AlgorithmPredictionsTableProps {
  matches: Match[];
  algorithmsData: {
    mlPowerIndex: Match[];
    valuePickFinder: Match[];
    statisticalEdge: Match[];
  };
}

const AlgorithmPredictionsTable = ({
  matches,
  algorithmsData,
}: AlgorithmPredictionsTableProps) => {
  // Find a match prediction by ID in an algorithm's dataset
  const findMatchPrediction = (matchId: string, data: Match[]) => {
    return data.find((m) => m.id === matchId)?.prediction;
  };

  // Format odds for display
  const formatOdds = (odds: number | undefined) => {
    if (!odds) return "-";
    return odds >= 2
      ? `+${Math.round((odds - 1) * 100)}`
      : `-${Math.round(100 / (odds - 1))}`;
  };

  // Format time for display
  const formatTime = (timeString: string) => {
    try {
      const date = parseISO(timeString);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (e) {
      return timeString;
    }
  };

  // Get background color for confidence cell based on value
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 70) return "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300";
    if (confidence >= 55) return "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300";
    return "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300";
  };

  // Get style for recommended bet
  const getRecommendedStyle = (recommended: string) => {
    switch (recommended) {
      case "home":
        return "text-blue-600 dark:text-blue-400 font-medium";
      case "away":
        return "text-purple-600 dark:text-purple-400 font-medium";
      case "draw":
        return "text-amber-600 dark:text-amber-400 font-medium";
      default:
        return "";
    }
  };

  // Get appropriate icon for algorithm
  const getAlgorithmIcon = (algorithmId: string) => {
    switch (algorithmId) {
      case "f4ce9fdc-c41a-4a5c-9f18-5d732674c5b8": // ML Power Index
        return <Brain className="h-4 w-4 inline-block algorithm-ml" />;
      case "3a7e2d9b-8c5f-4b1f-9e17-7b31a4dce6c2": // Value Pick Finder
        return <Calculator className="h-4 w-4 inline-block algorithm-value" />;
      case "85c48bbe-5b1a-4c1e-a0d5-e284e9e952f1": // Statistical Edge
        return <Zap className="h-4 w-4 inline-block algorithm-statistical" />;
      default:
        return null;
    }
  };

  return (
    <Card className="overflow-hidden shadow-sm dark:bg-navy-900/30">
      <div className="overflow-x-auto">
        <Table className="w-full">
          <TableHeader>
            <TableRow className="bg-slate-50 dark:bg-navy-900/50">
              <TableHead className="w-[180px]">Match</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Odds (H/A/D)</TableHead>
              <TableHead className="text-center">ML Power Index</TableHead>
              <TableHead className="text-center">Value Pick Finder</TableHead>
              <TableHead className="text-center">Statistical Edge</TableHead>
              <TableHead className="text-center">Consensus</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {matches.length > 0 ? (
              matches.map((match) => {
                const mlPrediction = findMatchPrediction(
                  match.id,
                  algorithmsData.mlPowerIndex
                );
                const valuePrediction = findMatchPrediction(
                  match.id,
                  algorithmsData.valuePickFinder
                );
                const statsPrediction = findMatchPrediction(
                  match.id,
                  algorithmsData.statisticalEdge
                );

                // Skip if no algorithm predictions
                if (!mlPrediction || !valuePrediction || !statsPrediction) return null;

                // Check for consensus
                const picks = [mlPrediction.recommended, valuePrediction.recommended, statsPrediction.recommended];
                const homeCount = picks.filter(p => p === 'home').length;
                const awayCount = picks.filter(p => p === 'away').length;
                const drawCount = picks.filter(p => p === 'draw').length;
                
                let consensusPick = '';
                let consensusStrength = 0;
                
                if (homeCount >= 2) {
                  consensusPick = 'HOME';
                  consensusStrength = homeCount;
                } else if (awayCount >= 2) {
                  consensusPick = 'AWAY';
                  consensusStrength = awayCount;
                } else if (drawCount >= 2) {
                  consensusPick = 'DRAW';
                  consensusStrength = drawCount;
                } else {
                  consensusPick = 'SPLIT';
                  consensusStrength = 0;
                }

                return (
                  <TableRow key={match.id} className="hover:bg-slate-50 dark:hover:bg-navy-800/30">
                    <TableCell>
                      <div className="font-medium">
                        {match.homeTeam.shortName} vs {match.awayTeam.shortName}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {match.league}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatTime(match.startTime)}
                    </TableCell>
                    <TableCell>
                      {match.odds && (
                        <div className="space-x-1 text-sm">
                          <span>{formatOdds(match.odds.homeWin)}</span>
                          <span>/</span>
                          <span>{formatOdds(match.odds.awayWin)}</span>
                          {match.odds.draw && (
                            <>
                              <span>/</span>
                              <span>{formatOdds(match.odds.draw)}</span>
                            </>
                          )}
                        </div>
                      )}
                    </TableCell>

                    {/* ML Power Index */}
                    <TableCell>
                      <div className="flex flex-col items-center">
                        <div className="flex items-center gap-1">
                          {getAlgorithmIcon("f4ce9fdc-c41a-4a5c-9f18-5d732674c5b8")}
                          <span className={getRecommendedStyle(mlPrediction.recommended)}>
                            {mlPrediction.recommended.toUpperCase()}
                          </span>
                        </div>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Badge
                              variant="outline"
                              className={`mt-1 ${getConfidenceColor(
                                mlPrediction.confidence
                              )}`}
                            >
                              {mlPrediction.confidence}%
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs">ML Power Index confidence</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </TableCell>

                    {/* Value Pick Finder */}
                    <TableCell>
                      <div className="flex flex-col items-center">
                        <div className="flex items-center gap-1">
                          {getAlgorithmIcon("3a7e2d9b-8c5f-4b1f-9e17-7b31a4dce6c2")}
                          <span className={getRecommendedStyle(valuePrediction.recommended)}>
                            {valuePrediction.recommended.toUpperCase()}
                          </span>
                        </div>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Badge
                              variant="outline"
                              className={`mt-1 ${getConfidenceColor(
                                valuePrediction.confidence
                              )}`}
                            >
                              {valuePrediction.confidence}%
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs">Value Pick Finder confidence</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </TableCell>

                    {/* Statistical Edge */}
                    <TableCell>
                      <div className="flex flex-col items-center">
                        <div className="flex items-center gap-1">
                          {getAlgorithmIcon("85c48bbe-5b1a-4c1e-a0d5-e284e9e952f1")}
                          <span className={getRecommendedStyle(statsPrediction.recommended)}>
                            {statsPrediction.recommended.toUpperCase()}
                          </span>
                        </div>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Badge
                              variant="outline"
                              className={`mt-1 ${getConfidenceColor(
                                statsPrediction.confidence
                              )}`}
                            >
                              {statsPrediction.confidence}%
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs">Statistical Edge confidence</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </TableCell>

                    {/* Consensus */}
                    <TableCell>
                      <div className="flex flex-col items-center">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Badge
                              variant={consensusStrength === 3 ? "default" : "outline"}
                              className={
                                consensusPick === 'SPLIT' 
                                  ? "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300" 
                                  : consensusStrength === 3 
                                    ? "bg-green-600 dark:bg-green-700 text-white" 
                                    : "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300"
                              }
                            >
                              {consensusPick}
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs">
                              {consensusStrength === 3 
                                ? "All algorithms agree" 
                                : consensusStrength === 2 
                                ? "2 of 3 algorithms agree" 
                                : "No consensus among algorithms"}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                        {consensusStrength > 0 && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {consensusStrength}/3 agree
                          </div>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  No predictions available
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
};

export default AlgorithmPredictionsTable;
