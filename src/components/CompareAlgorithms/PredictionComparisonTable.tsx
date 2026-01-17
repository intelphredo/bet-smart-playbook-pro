import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CheckCircle, XCircle, Clock, Search, Filter, TableIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ConsensusPick } from "@/hooks/useAlgorithmComparison";

const algorithmDescriptions: Record<string, string> = {
  'ML Power Index': 'Machine learning algorithm that analyzes historical data, player stats, and team performance trends.',
  'Value Pick Finder': 'Specialized algorithm finding betting value through odds analysis and market inefficiencies.',
  'Statistical Edge': 'Pure statistics-based algorithm using situational spots, weather, and matchup data.',
  'Sharp Money': 'Tracks professional bettor activity and line movements.',
};

const algorithmBadgeColors: Record<string, string> = {
  'ML Power Index': 'bg-blue-500/15 text-blue-600 border-blue-500/30',
  'Value Pick Finder': 'bg-green-500/15 text-green-600 border-green-500/30',
  'Statistical Edge': 'bg-purple-500/15 text-purple-600 border-purple-500/30',
  'Sharp Money': 'bg-amber-500/15 text-amber-600 border-amber-500/30',
};

interface PredictionComparisonTableProps {
  consensusPicks: ConsensusPick[];
}

export function PredictionComparisonTable({ consensusPicks }: PredictionComparisonTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAgreement, setFilterAgreement] = useState<string>('all');
  const [filterResult, setFilterResult] = useState<string>('all');

  const filteredPicks = consensusPicks.filter(pick => {
    const matchesSearch = pick.matchTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          pick.league.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAgreement = filterAgreement === 'all' || pick.agreementLevel === filterAgreement;
    const matchesResult = filterResult === 'all' || pick.result === filterResult;
    return matchesSearch && matchesAgreement && matchesResult;
  });

  const getResultIcon = (result: 'won' | 'lost' | 'pending') => {
    switch (result) {
      case 'won':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'lost':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getAgreementBadge = (level: 'full' | 'partial' | 'split') => {
    switch (level) {
      case 'full':
        return <Badge className="bg-green-500/20 text-green-600 border-green-500/30">Full</Badge>;
      case 'partial':
        return <Badge className="bg-yellow-500/20 text-yellow-600 border-yellow-500/30">Partial</Badge>;
      case 'split':
        return <Badge className="bg-red-500/20 text-red-600 border-red-500/30">Split</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <TableIcon className="h-5 w-5" />
          Same-Match Predictions
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Compare what each algorithm predicted for the same matches
        </p>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search matches..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={filterAgreement} onValueChange={setFilterAgreement}>
            <SelectTrigger className="w-[150px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Agreement" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Agreement</SelectItem>
              <SelectItem value="full">Full Agreement</SelectItem>
              <SelectItem value="partial">Partial</SelectItem>
              <SelectItem value="split">Split</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterResult} onValueChange={setFilterResult}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Result" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Results</SelectItem>
              <SelectItem value="won">Won</SelectItem>
              <SelectItem value="lost">Lost</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="rounded-md border overflow-auto max-h-[400px]">
          <Table>
            <TableHeader className="sticky top-0 bg-background z-10">
              <TableRow>
                <TableHead className="min-w-[150px]">Match</TableHead>
                <TableHead>League</TableHead>
                <TableHead>Agreement</TableHead>
                <TableHead>Consensus</TableHead>
                <TableHead>Algorithms</TableHead>
                <TableHead>Result</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPicks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No matching predictions found
                  </TableCell>
                </TableRow>
              ) : (
                filteredPicks.slice(0, 30).map((pick, idx) => (
                  <TableRow key={pick.matchId + idx}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm truncate max-w-[200px]" title={pick.matchTitle}>
                          {pick.matchTitle}
                        </p>
                        <p className="text-xs text-muted-foreground">{pick.date}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">{pick.league}</Badge>
                    </TableCell>
                    <TableCell>{getAgreementBadge(pick.agreementLevel)}</TableCell>
                    <TableCell>
                      <span className="font-medium text-sm">{pick.consensusPrediction}</span>
                      <span className="text-xs text-muted-foreground ml-1">
                        ({pick.consensusConfidence.toFixed(0)}%)
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {pick.algorithms.map((alg, i) => {
                          const isConsensus = alg.prediction === pick.consensusPrediction;
                          const description = algorithmDescriptions[alg.algorithmName] || 'Algorithm for sports predictions.';
                          return (
                            <Tooltip key={i}>
                              <TooltipTrigger asChild>
                                <Badge 
                                  variant="outline" 
                                  className={cn(
                                    "text-xs cursor-help border",
                                    algorithmBadgeColors[alg.algorithmName] || (isConsensus ? "bg-primary/10" : "bg-muted")
                                  )}
                                >
                                  {alg.algorithmName.split(' ')[0].charAt(0)}: {alg.prediction.substring(0, 15)}
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="max-w-xs">
                                <p className="font-medium">{alg.algorithmName}: {alg.prediction}</p>
                                <p className="text-xs text-muted-foreground">{alg.confidence}% confidence</p>
                                <p className="text-xs text-muted-foreground mt-1">{description}</p>
                              </TooltipContent>
                            </Tooltip>
                          );
                        })}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {getResultIcon(pick.result)}
                        <span className={cn(
                          "text-sm font-medium capitalize",
                          pick.result === 'won' ? 'text-green-500' :
                          pick.result === 'lost' ? 'text-red-500' : 'text-yellow-500'
                        )}>
                          {pick.result}
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {filteredPicks.length > 30 && (
          <p className="text-xs text-muted-foreground text-center mt-2">
            Showing 30 of {filteredPicks.length} matches
          </p>
        )}
      </CardContent>
    </Card>
  );
}
