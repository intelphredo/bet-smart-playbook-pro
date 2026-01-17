import { useState, useCallback, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  Target,
  BarChart3,
  Trophy,
  AlertCircle,
  AlertTriangle,
  Zap,
  Calendar,
  Radio,
  Info,
  Database,
  PlayCircle,
  Sparkles,
  Download,
  RefreshCw,
  Loader2,
  Filter,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Keyboard,
  FileText,
  ExternalLink,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { 
  useHistoricalPredictions, 
  HistoricalPrediction, 
  TimeRange, 
  PredictionType 
} from "@/hooks/useHistoricalPredictions";
import PredictionCharts from "./PredictionCharts";
import PredictionDetailsDialog from "./PredictionDetailsDialog";
import { getTeamLogoUrl, getTeamInitials } from "@/utils/teamLogos";
import { League } from "@/types/sports";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const TIME_RANGE_OPTIONS: { value: TimeRange; label: string }[] = [
  { value: "1d", label: "24 Hours" },
  { value: "7d", label: "1 Week" },
  { value: "14d", label: "2 Weeks" },
  { value: "1m", label: "1 Month" },
  { value: "3m", label: "3 Months" },
  { value: "all", label: "All Time" },
];

const ITEMS_PER_PAGE_OPTIONS = [10, 25, 50, 100];

const ALGORITHM_IDS = {
  ML_POWER_INDEX: "f4ce9fdc-c41a-4a5c-9f18-5d732674c5b8",
  VALUE_PICK_FINDER: "3a7e2d9b-8c5f-4b1f-9e17-7b31a4dce6c2",
  STATISTICAL_EDGE: "85c48bbe-5b1a-4c1e-a0d5-e284e9e952f1",
};

const ALGORITHM_DISPLAY: Record<string, { name: string; icon: string; color: string; description: string; primary?: boolean }> = {
  [ALGORITHM_IDS.ML_POWER_INDEX]: { 
    name: "ML Power Index", 
    icon: "🤖", 
    color: "text-blue-500 bg-blue-500/10 border-blue-500/30",
    description: "Machine learning algorithm that analyzes historical data, player stats, and team performance trends."
  },
  [ALGORITHM_IDS.VALUE_PICK_FINDER]: { 
    name: "Value Pick Finder", 
    icon: "💎", 
    color: "text-green-500 bg-green-500/10 border-green-500/30",
    description: "Specialized algorithm finding betting value through odds analysis and market inefficiencies."
  },
  [ALGORITHM_IDS.STATISTICAL_EDGE]: { 
    name: "Statistical Edge", 
    icon: "📊", 
    color: "text-purple-500 bg-purple-500/10 border-purple-500/30", 
    description: "Pure statistics-based algorithm using situational spots, weather, and matchup data.",
    primary: true 
  },
};

const HistoricalPredictionsSection = () => {
  const [leagueFilter, setLeagueFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [algorithmFilter, setAlgorithmFilter] = useState<string>("all");
  const [teamFilter, setTeamFilter] = useState<string>("all");
  const [timeRange, setTimeRange] = useState<TimeRange>("14d");
  const [predictionType, setPredictionType] = useState<PredictionType>("all");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isFetchingPredictions, setIsFetchingPredictions] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [settledOnly, setSettledOnly] = useState(false);
  const [preLivePage, setPreLivePage] = useState(1);
  const [livePage, setLivePage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [selectedPrediction, setSelectedPrediction] = useState<HistoricalPrediction | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  
  const chartsRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  
  const { data, isLoading, error, refetch } = useHistoricalPredictions(timeRange, predictionType);

  const { predictions, stats } = data || { predictions: [], stats: null };

  const handlePredictionClick = useCallback((prediction: HistoricalPrediction) => {
    setSelectedPrediction(prediction);
    setDetailsDialogOpen(true);
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };

  const handleFetchNewPredictions = async () => {
    setIsFetchingPredictions(true);
    try {
      // Include all supported leagues for comprehensive prediction refresh
      const allLeagues = ['NBA', 'NFL', 'MLB', 'NHL', 'NCAAB', 'NCAAF', 'SOCCER'];
      
      const { data, error } = await supabase.functions.invoke('save-predictions', {
        body: { leagues: allLeagues, forceRefresh: true }
      });
      
      if (error) throw error;
      
      if (data?.success) {
        const savedCount = data.data.saved || 0;
        const skippedCount = data.data.skipped || 0;
        const leagueList = data.data.leagues?.join(', ') || allLeagues.join(', ');
        
        toast.success(`Fetched ${savedCount} new predictions`, {
          description: `From ${leagueList}. Skipped ${skippedCount} existing.`
        });
        await refetch();
      } else {
        throw new Error(data?.error || 'Failed to fetch predictions');
      }
    } catch (error) {
      console.error('Error fetching predictions:', error);
      toast.error('Failed to fetch new predictions', {
        description: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsFetchingPredictions(false);
    }
  };

  // predictions and stats already destructured above after useHistoricalPredictions

  // Get all algorithm predictions for the same match
  const getAllAlgorithmPredictionsForMatch = useCallback((matchId: string): HistoricalPrediction[] => {
    return predictions.filter(p => p.match_id === matchId);
  }, [predictions]);

  // Calculate data quality metrics
  const dataQualityMetrics = (() => {
    if (!predictions.length) return null;
    
    const missingTeamData = predictions.filter(p => !p.home_team || !p.away_team);
    const missingMatchTitle = predictions.filter(p => !p.match_title);
    const missingLeague = predictions.filter(p => !p.league);
    const missingConfidence = predictions.filter(p => p.confidence === null || p.confidence === undefined);
    const missingProjectedScores = predictions.filter(p => 
      p.projected_score_home === null || p.projected_score_away === null
    );
    
    const totalIssues = missingTeamData.length + missingMatchTitle.length + 
                        missingLeague.length + missingConfidence.length;
    const qualityScore = Math.round(((predictions.length * 4 - totalIssues) / (predictions.length * 4)) * 100);
    
    return {
      total: predictions.length,
      missingTeamData: missingTeamData.length,
      missingMatchTitle: missingMatchTitle.length,
      missingLeague: missingLeague.length,
      missingConfidence: missingConfidence.length,
      missingProjectedScores: missingProjectedScores.length,
      qualityScore,
      hasIssues: totalIssues > 0,
    };
  })();

  // Get unique leagues for filter
  const leagues = Array.from(new Set(predictions.map(p => p.league).filter(Boolean))) as string[];

  // Get unique teams for filter (from home_team and away_team)
  const teams = Array.from(new Set(
    predictions.flatMap(p => [p.home_team, p.away_team].filter(Boolean))
  )).sort() as string[];

  // Get unique algorithms for filter
  const algorithms = Array.from(new Set(predictions.map(p => p.algorithm_id).filter(Boolean))) as string[];

  // Filter predictions and reset pages when filters change
  const filteredPredictions = predictions.filter(p => {
    if (leagueFilter !== "all" && p.league !== leagueFilter) return false;
    if (statusFilter !== "all" && p.status !== statusFilter) return false;
    if (algorithmFilter !== "all" && p.algorithm_id !== algorithmFilter) return false;
    if (settledOnly && p.status !== "won" && p.status !== "lost") return false;
    if (teamFilter !== "all") {
      const matchesTeam = p.home_team === teamFilter || p.away_team === teamFilter;
      if (!matchesTeam) return false;
    }
    return true;
  });

  // Split predictions by type
  // For pre-live, only show primary algorithm (Statistical Edge) in the list
  // unless user has specifically filtered by a different algorithm
  const preLivePredictions = filteredPredictions.filter(p => {
    if (p.is_live_prediction) return false;
    // If algorithm filter is set to a specific algorithm, show that one
    if (algorithmFilter !== "all") return true;
    // Otherwise, only show the primary algorithm (Statistical Edge)
    return p.algorithm_id === ALGORITHM_IDS.STATISTICAL_EDGE;
  });
  const livePredictions = filteredPredictions.filter(p => p.is_live_prediction);

  // Pagination calculations
  const preLiveTotalPages = Math.ceil(preLivePredictions.length / itemsPerPage);
  const liveTotalPages = Math.ceil(livePredictions.length / itemsPerPage);
  
  const paginatedPreLive = preLivePredictions.slice(
    (preLivePage - 1) * itemsPerPage,
    preLivePage * itemsPerPage
  );
  const paginatedLive = livePredictions.slice(
    (livePage - 1) * itemsPerPage,
    livePage * itemsPerPage
  );

  // Reset pages when filters change
  const handleFilterChange = (setter: (val: string) => void, value: string) => {
    setter(value);
    setPreLivePage(1);
    setLivePage(1);
  };

  // Handle items per page change
  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(Number(value));
    setPreLivePage(1);
    setLivePage(1);
  };

  // Keyboard navigation for pagination
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle if not typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Left arrow - previous page
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setPreLivePage(p => Math.max(1, p - 1));
        setLivePage(p => Math.max(1, p - 1));
      }
      // Right arrow - next page
      else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setPreLivePage(p => Math.min(preLiveTotalPages, p + 1));
        setLivePage(p => Math.min(liveTotalPages, p + 1));
      }
      // Home - first page
      else if (e.key === 'Home') {
        e.preventDefault();
        setPreLivePage(1);
        setLivePage(1);
      }
      // End - last page
      else if (e.key === 'End') {
        e.preventDefault();
        setPreLivePage(preLiveTotalPages);
        setLivePage(liveTotalPages);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [preLiveTotalPages, liveTotalPages]);

  // CSV Export function
  const exportToCSV = () => {
    if (!filteredPredictions.length) {
      toast.error("No predictions to export");
      return;
    }

    const headers = [
      "Date",
      "Time",
      "League",
      "Match ID",
      "Prediction",
      "Confidence (%)",
      "Status",
      "Type",
      "Projected Home",
      "Projected Away",
      "Actual Home",
      "Actual Away",
      "Accuracy Rating"
    ];

    const rows = filteredPredictions.map(p => [
      format(new Date(p.predicted_at), "yyyy-MM-dd"),
      format(new Date(p.predicted_at), "HH:mm:ss"),
      p.league || "Unknown",
      p.match_id,
      p.prediction || "",
      p.confidence?.toString() || "",
      p.status,
      p.is_live_prediction ? "Live" : "Pre-Live",
      p.projected_score_home?.toString() || "",
      p.projected_score_away?.toString() || "",
      p.actual_score_home?.toString() || "",
      p.actual_score_away?.toString() || "",
      p.accuracy_rating?.toString() || ""
    ]);

    // Create CSV content
    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");

    // Create blob and download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `predictions_${timeRange}_${format(new Date(), "yyyy-MM-dd")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success(`Exported ${filteredPredictions.length} predictions to CSV`);
  };

  // PDF Export function
  const exportToPDF = async () => {
    if (!stats) {
      toast.error("No data to export");
      return;
    }

    setIsExportingPDF(true);
    toast.info("Generating PDF report...", { duration: 2000 });

    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;
      let yPos = margin;

      // Helper function to add text
      const addText = (text: string, x: number, y: number, options?: { fontSize?: number; fontStyle?: string; color?: [number, number, number] }) => {
        pdf.setFontSize(options?.fontSize || 10);
        if (options?.fontStyle) pdf.setFont('helvetica', options.fontStyle);
        if (options?.color) pdf.setTextColor(...options.color);
        else pdf.setTextColor(0, 0, 0);
        pdf.text(text, x, y);
        pdf.setFont('helvetica', 'normal');
      };

      // Title
      addText('Prediction Performance Report', margin, yPos, { fontSize: 20, fontStyle: 'bold' });
      yPos += 8;
      addText(`Generated: ${format(new Date(), 'PPpp')}`, margin, yPos, { fontSize: 10, color: [100, 100, 100] });
      yPos += 5;
      addText(`Time Range: ${TIME_RANGE_OPTIONS.find(o => o.value === timeRange)?.label || timeRange}`, margin, yPos, { fontSize: 10, color: [100, 100, 100] });
      yPos += 12;

      // Overall Statistics Section
      addText('Overall Statistics', margin, yPos, { fontSize: 14, fontStyle: 'bold' });
      yPos += 8;

      // Stats grid
      const statsData = [
        ['Total Predictions', predictions.length.toString()],
        ['Win Rate', `${stats.winRate.toFixed(1)}%`],
        ['Wins', stats.won.toString()],
        ['Losses', stats.lost.toString()],
        ['Pending', stats.pending.toString()],
        ['Avg Confidence', `${stats.avgConfidence.toFixed(1)}%`],
        ['Total P/L', `${stats.totalPL >= 0 ? '+' : ''}$${stats.totalPL.toFixed(2)}`],
        ['ROI', `${stats.roi >= 0 ? '+' : ''}${stats.roi.toFixed(1)}%`],
      ];

      const colWidth = (pageWidth - 2 * margin) / 4;
      statsData.forEach((stat, i) => {
        const col = i % 4;
        const row = Math.floor(i / 4);
        const x = margin + col * colWidth;
        const y = yPos + row * 12;
        
        addText(stat[0], x, y, { fontSize: 9, color: [100, 100, 100] });
        addText(stat[1], x, y + 5, { fontSize: 11, fontStyle: 'bold' });
      });
      yPos += 30;

      // Pre-Live vs Live Comparison
      addText('Pre-Live vs Live Performance', margin, yPos, { fontSize: 14, fontStyle: 'bold' });
      yPos += 8;

      const comparisonData = [
        ['', 'Pre-Live', 'Live'],
        ['Total', stats.preliveStats.total.toString(), stats.liveStats.total.toString()],
        ['Win Rate', `${stats.preliveStats.winRate.toFixed(1)}%`, `${stats.liveStats.winRate.toFixed(1)}%`],
        ['Wins', stats.preliveStats.won.toString(), stats.liveStats.won.toString()],
        ['Losses', stats.preliveStats.lost.toString(), stats.liveStats.lost.toString()],
      ];

      comparisonData.forEach((row, rowIdx) => {
        row.forEach((cell, colIdx) => {
          const x = margin + colIdx * 40;
          const y = yPos + rowIdx * 6;
          addText(cell, x, y, { 
            fontSize: rowIdx === 0 ? 10 : 9, 
            fontStyle: rowIdx === 0 ? 'bold' : 'normal',
            color: colIdx === 0 ? [100, 100, 100] : [0, 0, 0]
          });
        });
      });
      yPos += 38;

      // League Performance
      if (stats.leaguePerformance && stats.leaguePerformance.length > 0) {
        addText('Performance by League', margin, yPos, { fontSize: 14, fontStyle: 'bold' });
        yPos += 8;

        const leagueHeaders = ['League', 'Total', 'Win Rate', 'Wins', 'Losses'];
        leagueHeaders.forEach((header, i) => {
          addText(header, margin + i * 30, yPos, { fontSize: 9, fontStyle: 'bold', color: [100, 100, 100] });
        });
        yPos += 6;

        stats.leaguePerformance.slice(0, 8).forEach((league) => {
          const leagueRow = [
            league.league,
            league.total.toString(),
            `${league.winRate.toFixed(1)}%`,
            league.won.toString(),
            league.lost.toString(),
          ];
          leagueRow.forEach((cell, i) => {
            addText(cell, margin + i * 30, yPos, { fontSize: 9 });
          });
          yPos += 5;
        });
        yPos += 10;
      }

      // Capture charts if available
      if (chartsRef.current) {
        try {
          // Check if we need a new page
          if (yPos > pageHeight - 100) {
            pdf.addPage();
            yPos = margin;
          }

          addText('Performance Charts', margin, yPos, { fontSize: 14, fontStyle: 'bold' });
          yPos += 8;

          const canvas = await html2canvas(chartsRef.current, {
            scale: 2,
            backgroundColor: '#ffffff',
            logging: false,
          });
          
          const imgData = canvas.toDataURL('image/png');
          const imgWidth = pageWidth - 2 * margin;
          const imgHeight = (canvas.height * imgWidth) / canvas.width;
          
          // Check if image fits on current page
          if (yPos + imgHeight > pageHeight - margin) {
            pdf.addPage();
            yPos = margin;
          }
          
          pdf.addImage(imgData, 'PNG', margin, yPos, imgWidth, Math.min(imgHeight, pageHeight - yPos - margin));
          yPos += imgHeight + 10;
        } catch (chartError) {
          console.warn('Could not capture charts:', chartError);
        }
      }

      // Recent Predictions Table (new page)
      pdf.addPage();
      yPos = margin;
      addText('Recent Predictions', margin, yPos, { fontSize: 14, fontStyle: 'bold' });
      yPos += 8;

      const tableHeaders = ['Date', 'Match', 'Prediction', 'Conf.', 'Status'];
      const colWidths = [25, 55, 40, 20, 20];
      
      tableHeaders.forEach((header, i) => {
        let x = margin;
        for (let j = 0; j < i; j++) x += colWidths[j];
        addText(header, x, yPos, { fontSize: 9, fontStyle: 'bold', color: [100, 100, 100] });
      });
      yPos += 6;

      // Add predictions (limit to fit on pages)
      const recentPredictions = filteredPredictions.slice(0, 30);
      recentPredictions.forEach((p) => {
        if (yPos > pageHeight - 15) {
          pdf.addPage();
          yPos = margin;
        }

        const matchTitle = p.match_title || `${p.home_team || '?'} vs ${p.away_team || '?'}`;
        const row = [
          format(new Date(p.predicted_at), 'MM/dd'),
          matchTitle.length > 25 ? matchTitle.slice(0, 25) + '...' : matchTitle,
          (p.prediction || '').length > 18 ? (p.prediction || '').slice(0, 18) + '...' : (p.prediction || ''),
          `${p.confidence || 0}%`,
          p.status.toUpperCase(),
        ];

        let x = margin;
        row.forEach((cell, i) => {
          const color: [number, number, number] = 
            i === 4 && p.status === 'won' ? [22, 163, 74] :
            i === 4 && p.status === 'lost' ? [220, 38, 38] :
            [0, 0, 0];
          addText(cell, x, yPos, { fontSize: 8, color });
          x += colWidths[i];
        });
        yPos += 5;
      });

      // Footer
      const totalPages = pdf.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        addText(`Page ${i} of ${totalPages}`, pageWidth - margin - 20, pageHeight - 10, { fontSize: 8, color: [150, 150, 150] });
        addText('EdgeIQ - AI Predictions', margin, pageHeight - 10, { fontSize: 8, color: [150, 150, 150] });
      }

      // Save PDF
      pdf.save(`prediction_report_${timeRange}_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
      toast.success('PDF report generated successfully!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF report');
    } finally {
      setIsExportingPDF(false);
    }
  };

  if (isLoading) {
    return <HistoricalPredictionsSkeleton />;
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive opacity-50" />
          <p className="text-muted-foreground">Failed to load prediction history</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Time Range & Type Filters */}
      <Card className="bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Time Range Selector */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <Calendar className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Time Range</span>
                <Badge variant="secondary" className="text-xs font-medium">
                  {predictions.length} total
                </Badge>
                <Badge variant="outline" className="text-xs font-medium text-green-600 border-green-500/30 bg-green-500/10">
                  {stats?.won || 0} W
                </Badge>
                <Badge variant="outline" className="text-xs font-medium text-red-600 border-red-500/30 bg-red-500/10">
                  {stats?.lost || 0} L
                </Badge>
                <Badge variant="outline" className="text-xs font-medium text-yellow-600 border-yellow-500/30 bg-yellow-500/10">
                  {stats?.pending || 0} P
                </Badge>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {TIME_RANGE_OPTIONS.map(option => (
                  <Button
                    key={option.value}
                    variant={timeRange === option.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTimeRange(option.value)}
                    className={cn(
                      "text-xs h-8",
                      timeRange === option.value && "bg-primary text-primary-foreground"
                    )}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Prediction Type Selector */}
            <div className="sm:w-auto">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Prediction Type</span>
              </div>
              <Tabs value={predictionType} onValueChange={(v) => setPredictionType(v as PredictionType)}>
                <TabsList className="grid grid-cols-3 w-full sm:w-auto">
                  <TabsTrigger value="all" className="text-xs gap-1.5">
                    <BarChart3 className="h-3 w-3" />
                    All
                  </TabsTrigger>
                  <TabsTrigger value="prelive" className="text-xs gap-1.5">
                    <PlayCircle className="h-3 w-3" />
                    Pre-Live
                  </TabsTrigger>
                  <TabsTrigger value="live" className="text-xs gap-1.5">
                    <Radio className="h-3 w-3" />
                    Live
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* Team Filter */}
            <div className="sm:w-auto">
              <div className="flex items-center gap-2 mb-2">
                <Trophy className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Team</span>
              </div>
              <Select value={teamFilter} onValueChange={setTeamFilter}>
                <SelectTrigger className="w-full sm:w-[180px] h-8 text-xs">
                  <SelectValue placeholder="All Teams" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  <SelectItem value="all" className="text-xs">All Teams</SelectItem>
                  {teams.map(team => (
                    <SelectItem key={team} value={team} className="text-xs">
                      {team}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Settled Only Toggle */}
            <div className="sm:w-auto flex items-end">
              <div className="flex items-center gap-2 h-8 px-3 rounded-md border bg-background">
                <Switch
                  id="settled-only"
                  checked={settledOnly}
                  onCheckedChange={setSettledOnly}
                  className="data-[state=checked]:bg-primary"
                />
                <Label htmlFor="settled-only" className="text-xs font-medium cursor-pointer flex items-center gap-1.5">
                  <Filter className="h-3 w-3" />
                  Settled Only
                </Label>
              </div>
            </div>

            {/* Refresh & Export Buttons */}
            <div className="sm:w-auto flex items-end gap-2 flex-wrap">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleFetchNewPredictions}
                    className="gap-2 h-8"
                    disabled={isFetchingPredictions}
                  >
                    {isFetchingPredictions ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4" />
                    )}
                    Fetch New
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Fetch new predictions from ESPN for all leagues</p>
                </TooltipContent>
              </Tooltip>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                className="gap-2 h-8"
                disabled={isRefreshing || isLoading}
              >
                {isRefreshing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                Refresh
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 h-8"
                    disabled={!predictions.length || isExportingPDF}
                  >
                    {isExportingPDF ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                    Export
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={exportToCSV} className="gap-2">
                    <Download className="h-4 w-4" />
                    Export as CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={exportToPDF} className="gap-2">
                    <FileText className="h-4 w-4" />
                    Export as PDF Report
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Live vs Pre-Live Stats Comparison */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border-green-500/30 bg-green-500/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <PlayCircle className="h-4 w-4 text-green-500" />
                Pre-Live Predictions
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-green-500">{stats.preliveStats.total}</p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {stats.preliveStats.winRate.toFixed(1)}%
                  </p>
                  <p className="text-xs text-muted-foreground">Win Rate</p>
                </div>
                <div>
                  <p className="text-lg font-semibold">
                    <span className="text-green-500">{stats.preliveStats.won}W</span>
                    {" - "}
                    <span className="text-red-500">{stats.preliveStats.lost}L</span>
                  </p>
                  <p className="text-xs text-muted-foreground">Record</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-orange-500/30 bg-orange-500/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Radio className="h-4 w-4 text-orange-500 animate-pulse" />
                Live Predictions
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-orange-500">{stats.liveStats.total}</p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {stats.liveStats.winRate.toFixed(1)}%
                  </p>
                  <p className="text-xs text-muted-foreground">Win Rate</p>
                </div>
                <div>
                  <p className="text-lg font-semibold">
                    <span className="text-green-500">{stats.liveStats.won}W</span>
                    {" - "}
                    <span className="text-red-500">{stats.liveStats.lost}L</span>
                  </p>
                  <p className="text-xs text-muted-foreground">Record</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            label="Total Predictions"
            value={stats.total}
            icon={Target}
            color="text-primary"
          />
          <StatCard
            label="Win Rate"
            value={`${stats.winRate.toFixed(1)}%`}
            icon={stats.winRate >= 50 ? TrendingUp : TrendingDown}
            color={stats.winRate >= 50 ? "text-green-500" : "text-red-500"}
            subtitle={`${stats.won}W - ${stats.lost}L`}
          />
          <StatCard
            label="Avg Confidence"
            value={`${stats.avgConfidence.toFixed(0)}%`}
            icon={BarChart3}
            color="text-blue-500"
          />
          <StatCard
            label="Pending"
            value={stats.pending}
            icon={Clock}
            color="text-yellow-500"
          />
        </div>
      )}

      {/* Data Quality Summary */}
      <DataQualitySummary metrics={dataQualityMetrics} />

      {/* Charts Section */}
      {stats && stats.dailyStats.length > 0 && (
        <div ref={chartsRef}>
          <PredictionCharts
            dailyStats={stats.dailyStats}
            leaguePerformance={stats.leaguePerformance}
            confidenceVsAccuracy={stats.confidenceVsAccuracy}
            leagueDailyTrends={stats.leagueDailyTrends}
            overallWinRate={stats.winRate}
            totalPL={stats.totalPL}
            totalUnitsStaked={stats.totalUnitsStaked}
            roi={stats.roi}
          />
        </div>
      )}

      {/* League Breakdown */}
      {stats && Object.keys(stats.byLeague).length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              Performance by League
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Object.entries(stats.byLeague).map(([league, leagueStats]) => {
                const total = leagueStats.won + leagueStats.lost;
                const winRate = total > 0 ? (leagueStats.won / total) * 100 : 0;
                return (
                  <div
                    key={league}
                    className="p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline">{league}</Badge>
                      <span
                        className={cn(
                          "text-sm font-bold",
                          winRate >= 50 ? "text-green-500" : "text-red-500"
                        )}
                      >
                        {winRate.toFixed(0)}%
                      </span>
                    </div>
                    <Progress value={winRate} className="h-1.5" />
                    <p className="text-xs text-muted-foreground mt-1">
                      {leagueStats.won}W - {leagueStats.lost}L
                      {leagueStats.pending > 0 && ` (${leagueStats.pending} pending)`}
                    </p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Predictions List - Split by Pre-Live and Live */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Pre-Live Predictions Column */}
        <Card className="border-green-500/20">
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <CardTitle className="text-base flex items-center gap-2">
                <PlayCircle className="h-4 w-4 text-green-500" />
                Pre-Live Predictions
                <Badge variant="secondary" className="ml-2 bg-green-500/10 text-green-500">
                  {preLivePredictions.length}
                </Badge>
              </CardTitle>
              <div className="flex items-center gap-2 flex-wrap">
                <Select value={algorithmFilter} onValueChange={(v) => handleFilterChange(setAlgorithmFilter, v)}>
                  <SelectTrigger className="w-[130px] h-7 text-xs">
                    <SelectValue placeholder="Algorithm" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Algorithms</SelectItem>
                    {Object.entries(ALGORITHM_DISPLAY).map(([id, { name, icon }]) => (
                      <SelectItem key={id} value={id}>
                        <span className="flex items-center gap-1">
                          <span>{icon}</span>
                          <span>{name}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={leagueFilter} onValueChange={(v) => handleFilterChange(setLeagueFilter, v)}>
                  <SelectTrigger className="w-[100px] h-7 text-xs">
                    <SelectValue placeholder="League" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Leagues</SelectItem>
                    {leagues.map(league => (
                      <SelectItem key={league} value={league}>
                        {league}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={(v) => handleFilterChange(setStatusFilter, v)}>
                  <SelectTrigger className="w-[90px] h-7 text-xs">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="won">Won</SelectItem>
                    <SelectItem value="lost">Lost</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[calc(100vh-450px)] min-h-[300px] max-h-[600px]">
              <div className="divide-y divide-border">
                {paginatedPreLive.length > 0 ? (
                  paginatedPreLive.map(prediction => (
                    <PredictionRow 
                      key={prediction.id} 
                      prediction={prediction} 
                      showTypeTag={false}
                      onClick={() => handlePredictionClick(prediction)}
                    />
                  ))
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <PlayCircle className="h-12 w-12 mx-auto mb-4 opacity-30" />
                    <p>No pre-live predictions</p>
                  </div>
                )}
              </div>
            </ScrollArea>
            {/* Pre-Live Pagination */}
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Show</span>
                <Select value={String(itemsPerPage)} onValueChange={handleItemsPerPageChange}>
                  <SelectTrigger className="w-[70px] h-7 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ITEMS_PER_PAGE_OPTIONS.map(option => (
                      <SelectItem key={option} value={String(option)} className="text-xs">
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground">
                      <Keyboard className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs">
                    <div className="space-y-1">
                      <p className="font-medium">Keyboard Shortcuts</p>
                      <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-muted-foreground">
                        <span>← →</span><span>Prev / Next page</span>
                        <span>Home</span><span>First page</span>
                        <span>End</span><span>Last page</span>
                      </div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </div>
              {preLiveTotalPages > 1 && (
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => setPreLivePage(1)}
                    disabled={preLivePage === 1}
                    title="First page (Home)"
                  >
                    <ChevronsLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => setPreLivePage(p => Math.max(1, p - 1))}
                    disabled={preLivePage === 1}
                    title="Previous page (←)"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      min={1}
                      max={preLiveTotalPages}
                      value={preLivePage}
                      onChange={(e) => {
                        const page = parseInt(e.target.value);
                        if (page >= 1 && page <= preLiveTotalPages) {
                          setPreLivePage(page);
                        }
                      }}
                      className="w-12 h-7 text-xs text-center p-1"
                    />
                    <span className="text-xs text-muted-foreground">/ {preLiveTotalPages}</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => setPreLivePage(p => Math.min(preLiveTotalPages, p + 1))}
                    disabled={preLivePage === preLiveTotalPages}
                    title="Next page (→)"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => setPreLivePage(preLiveTotalPages)}
                    disabled={preLivePage === preLiveTotalPages}
                    title="Last page (End)"
                  >
                    <ChevronsRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Live Predictions Column */}
        <Card className="border-orange-500/20">
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Radio className="h-4 w-4 text-orange-500 animate-pulse" />
                Live Predictions
                <Badge variant="secondary" className="ml-2 bg-orange-500/10 text-orange-500">
                  {livePredictions.length}
                </Badge>
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[calc(100vh-450px)] min-h-[300px] max-h-[600px]">
              <div className="divide-y divide-border">
                {paginatedLive.length > 0 ? (
                  paginatedLive.map(prediction => (
                    <PredictionRow 
                      key={prediction.id} 
                      prediction={prediction} 
                      showTypeTag={false}
                      onClick={() => handlePredictionClick(prediction)}
                    />
                  ))
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Radio className="h-12 w-12 mx-auto mb-4 opacity-30" />
                    <p>No live predictions</p>
                  </div>
                )}
              </div>
            </ScrollArea>
            {/* Live Pagination */}
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Show</span>
                <Select value={String(itemsPerPage)} onValueChange={handleItemsPerPageChange}>
                  <SelectTrigger className="w-[70px] h-7 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ITEMS_PER_PAGE_OPTIONS.map(option => (
                      <SelectItem key={option} value={String(option)} className="text-xs">
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground">
                      <Keyboard className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs">
                    <div className="space-y-1">
                      <p className="font-medium">Keyboard Shortcuts</p>
                      <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-muted-foreground">
                        <span>← →</span><span>Prev / Next page</span>
                        <span>Home</span><span>First page</span>
                        <span>End</span><span>Last page</span>
                      </div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </div>
              {liveTotalPages > 1 && (
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => setLivePage(1)}
                    disabled={livePage === 1}
                    title="First page (Home)"
                  >
                    <ChevronsLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => setLivePage(p => Math.max(1, p - 1))}
                    disabled={livePage === 1}
                    title="Previous page (←)"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      min={1}
                      max={liveTotalPages}
                      value={livePage}
                      onChange={(e) => {
                        const page = parseInt(e.target.value);
                        if (page >= 1 && page <= liveTotalPages) {
                          setLivePage(page);
                        }
                      }}
                      className="w-12 h-7 text-xs text-center p-1"
                    />
                    <span className="text-xs text-muted-foreground">/ {liveTotalPages}</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => setLivePage(p => Math.min(liveTotalPages, p + 1))}
                    disabled={livePage === liveTotalPages}
                    title="Next page (→)"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => setLivePage(liveTotalPages)}
                    disabled={livePage === liveTotalPages}
                    title="Last page (End)"
                  >
                    <ChevronsRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Prediction Details Dialog */}
      <PredictionDetailsDialog
        prediction={selectedPrediction}
        allAlgorithmPredictions={selectedPrediction ? getAllAlgorithmPredictionsForMatch(selectedPrediction.match_id) : []}
        open={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
      />
    </div>
  );
};

const StatCard = ({
  label,
  value,
  icon: Icon,
  color,
  subtitle,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  subtitle?: string;
}) => (
  <Card className="bg-card/80">
    <CardContent className="p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-muted-foreground uppercase tracking-wider">{label}</span>
        <div className={cn("p-1.5 rounded-lg bg-muted", color)}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className={cn("text-2xl font-bold", color)}>{value}</p>
      {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
    </CardContent>
  </Card>
);

// Data Quality Badge Component
const DataQualityBadge = ({ prediction }: { prediction: HistoricalPrediction }) => {
  const issues: string[] = [];
  
  if (!prediction.home_team || !prediction.away_team) {
    issues.push("Missing team names");
  }
  if (!prediction.match_title) {
    issues.push("Missing match title");
  }
  if (!prediction.league) {
    issues.push("Missing league");
  }
  if (prediction.confidence === null || prediction.confidence === undefined) {
    issues.push("Missing confidence");
  }
  
  if (issues.length === 0) return null;
  
  return (
    <div 
      className="group/badge relative"
      onClick={(e) => e.stopPropagation()} // Prevent badge clicks from triggering row click
    >
      <Badge 
        variant="outline" 
        className="text-[9px] px-1 py-0 border-amber-500/50 text-amber-500 bg-amber-500/10 cursor-help"
      >
        <AlertTriangle className="h-2.5 w-2.5 mr-0.5" />
        {issues.length}
      </Badge>
      <div className="absolute bottom-full right-0 mb-1 hidden group-hover/badge:block z-50 pointer-events-none">
        <div className="bg-popover border rounded-md shadow-lg p-2 text-xs w-40">
          <p className="font-medium text-foreground mb-1">Data Issues:</p>
          <ul className="text-muted-foreground space-y-0.5">
            {issues.map((issue, i) => (
              <li key={i} className="flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-amber-500" />
                {issue}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

// Data Quality Summary Card
const DataQualitySummary = ({ metrics }: { 
  metrics: {
    total: number;
    missingTeamData: number;
    missingMatchTitle: number;
    missingLeague: number;
    missingConfidence: number;
    missingProjectedScores: number;
    qualityScore: number;
    hasIssues: boolean;
  } | null;
}) => {
  if (!metrics || !metrics.hasIssues) return null;
  
  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-500";
    if (score >= 70) return "text-yellow-500";
    return "text-red-500";
  };
  
  const getScoreBg = (score: number) => {
    if (score >= 90) return "bg-green-500";
    if (score >= 70) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <Card className="border-amber-500/30 bg-amber-500/5">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Database className="h-4 w-4 text-amber-500" />
          Data Quality Report
          <Badge 
            variant="outline" 
            className={cn("ml-auto", getScoreColor(metrics.qualityScore))}
          >
            {metrics.qualityScore}% Complete
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          {/* Quality Progress Bar */}
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className={cn("h-full transition-all", getScoreBg(metrics.qualityScore))}
              style={{ width: `${metrics.qualityScore}%` }}
            />
          </div>
          
          {/* Issue Breakdown */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            {metrics.missingTeamData > 0 && (
              <div className="flex items-center gap-1.5 p-2 rounded bg-muted/50">
                <AlertTriangle className="h-3 w-3 text-amber-500 shrink-0" />
                <span className="text-muted-foreground">
                  <span className="font-medium text-foreground">{metrics.missingTeamData}</span> missing teams
                </span>
              </div>
            )}
            {metrics.missingMatchTitle > 0 && (
              <div className="flex items-center gap-1.5 p-2 rounded bg-muted/50">
                <AlertTriangle className="h-3 w-3 text-amber-500 shrink-0" />
                <span className="text-muted-foreground">
                  <span className="font-medium text-foreground">{metrics.missingMatchTitle}</span> missing titles
                </span>
              </div>
            )}
            {metrics.missingLeague > 0 && (
              <div className="flex items-center gap-1.5 p-2 rounded bg-muted/50">
                <AlertTriangle className="h-3 w-3 text-amber-500 shrink-0" />
                <span className="text-muted-foreground">
                  <span className="font-medium text-foreground">{metrics.missingLeague}</span> missing leagues
                </span>
              </div>
            )}
            {metrics.missingConfidence > 0 && (
              <div className="flex items-center gap-1.5 p-2 rounded bg-muted/50">
                <Info className="h-3 w-3 text-blue-500 shrink-0" />
                <span className="text-muted-foreground">
                  <span className="font-medium text-foreground">{metrics.missingConfidence}</span> no confidence
                </span>
              </div>
            )}
          </div>
          
          <p className="text-[10px] text-muted-foreground">
            {metrics.total - metrics.missingTeamData} of {metrics.total} predictions have complete team data.
            Missing data is auto-extracted from match titles when possible.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

const PredictionRow = ({ prediction, showTypeTag = true, onClick }: { prediction: HistoricalPrediction; showTypeTag?: boolean; onClick?: () => void }) => {
  const statusConfig = {
    won: {
      icon: CheckCircle2,
      color: "text-green-500",
      bg: "bg-green-500/10",
      label: "Won",
    },
    lost: {
      icon: XCircle,
      color: "text-red-500",
      bg: "bg-red-500/10",
      label: "Lost",
    },
    pending: {
      icon: Clock,
      color: "text-yellow-500",
      bg: "bg-yellow-500/10",
      label: "Pending",
    },
  };

  const status = statusConfig[prediction.status as keyof typeof statusConfig] || statusConfig.pending;
  const StatusIcon = status.icon;
  
  // Check for data quality issues
  const hasDataIssues = !prediction.home_team || !prediction.away_team || 
                        !prediction.match_title || !prediction.league;

  // Parse team names from match_title or prediction
  const getTeamNames = () => {
    if (prediction.home_team && prediction.away_team) {
      return { home: prediction.home_team, away: prediction.away_team };
    }
    // Fallback: try to parse from match_title (format: "Away @ Home" or "Away vs Home")
    if (prediction.match_title) {
      const atParts = prediction.match_title.split(' @ ');
      if (atParts.length === 2) {
        return { away: atParts[0].trim(), home: atParts[1].trim() };
      }
      const vsParts = prediction.match_title.split(' vs ');
      if (vsParts.length === 2) {
        return { away: vsParts[0].trim(), home: vsParts[1].trim() };
      }
    }
    // Fallback: extract from prediction text (e.g., "Lakers Win" or "Lakers ML")
    if (prediction.prediction) {
      const teamName = prediction.prediction
        .replace(/ Win$| ML$| -[\d.]+$| \+[\d.]+$/i, '')
        .trim();
      // If we can identify the predicted team, show it
      if (teamName && teamName !== prediction.prediction) {
        return { home: teamName, away: 'Opponent' };
      }
    }
    // Last fallback: use match_id to show something
    return { home: `Match ${prediction.match_id?.slice(-6) || 'Unknown'}`, away: '' };
  };

  const teams = getTeamNames();
  const hasActualScores = prediction.actual_score_home !== null && prediction.actual_score_away !== null;
  const hasProjectedScores = prediction.projected_score_home !== null && prediction.projected_score_away !== null;
  
  // Get league for logo lookup
  const league = (prediction.league?.toUpperCase() || "NBA") as League;

  // Team Logo Component
  const TeamLogo = ({ teamName, size = "sm" }: { teamName: string; size?: "sm" | "md" }) => {
    const sizeClass = size === "sm" ? "h-5 w-5" : "h-6 w-6";
    return (
      <Avatar className={cn(sizeClass, "shrink-0")}>
        <AvatarImage 
          src={getTeamLogoUrl(teamName, league)} 
          alt={teamName}
          className="object-contain"
        />
        <AvatarFallback className="text-[8px] font-bold bg-muted">
          {getTeamInitials(teamName)}
        </AvatarFallback>
      </Avatar>
    );
  };

  // Calculate confidence level for styling
  const getConfidenceLevel = (conf: number | null) => {
    if (!conf) return 'low';
    if (conf >= 70) return 'high';
    if (conf >= 60) return 'medium';
    return 'low';
  };

  const confidenceLevel = getConfidenceLevel(prediction.confidence);
  const confidenceColors = {
    high: 'text-green-500 bg-green-500/10 border-green-500/30',
    medium: 'text-primary bg-primary/10 border-primary/30',
    low: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/30',
  };

  // Calculate accuracy rating display
  const accuracyDisplay = prediction.accuracy_rating !== null 
    ? `${Math.round(prediction.accuracy_rating)}%` 
    : null;

  return (
    <div 
      className="flex items-center gap-3 p-4 hover:bg-muted/30 transition-colors cursor-pointer group border-l-2 border-transparent hover:border-primary/50"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick?.()}
    >
      {/* Status Icon */}
      <div className={cn("p-2 rounded-full shrink-0", status.bg)}>
        <StatusIcon className={cn("h-4 w-4", status.color)} />
      </div>

      {/* Main Content */}
      <div className="flex-1 min-w-0 space-y-1.5">
        {/* Algorithm, League & Time Row */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Algorithm Badge with Tooltip */}
          {prediction.algorithm_id && ALGORITHM_DISPLAY[prediction.algorithm_id] && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge 
                  variant="outline" 
                  className={cn(
                    "text-[9px] shrink-0 px-1.5 py-0.5 cursor-help",
                    ALGORITHM_DISPLAY[prediction.algorithm_id].color
                  )}
                >
                  <span className="mr-0.5">{ALGORITHM_DISPLAY[prediction.algorithm_id].icon}</span>
                  {ALGORITHM_DISPLAY[prediction.algorithm_id].name}
                  {ALGORITHM_DISPLAY[prediction.algorithm_id].primary && (
                    <span className="ml-1 text-[8px] opacity-70">★</span>
                  )}
                </Badge>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs">
                <p className="font-medium">{ALGORITHM_DISPLAY[prediction.algorithm_id].name}</p>
                <p className="text-xs text-muted-foreground">{ALGORITHM_DISPLAY[prediction.algorithm_id].description}</p>
              </TooltipContent>
            </Tooltip>
          )}
          <Badge variant="outline" className="text-[10px] shrink-0 px-1.5 py-0.5">
            {prediction.league || "Unknown"}
          </Badge>
          <span className="text-[10px] text-muted-foreground">
            {format(new Date(prediction.predicted_at), "MMM d, h:mm a")}
          </span>
          {prediction.is_live_prediction && (
            <Badge variant="outline" className="text-[9px] border-orange-500/30 text-orange-500 px-1.5 py-0">
              <Radio className="h-2.5 w-2.5 mr-0.5 animate-pulse" />
              LIVE
            </Badge>
          )}
          {/* Read-only indicator - pointer-events-none to not block row clicks */}
          <Badge variant="outline" className="text-[8px] px-1 py-0 opacity-60 pointer-events-none" title="AI predictions are read-only and cannot be edited">
            🔒
          </Badge>
        </div>

        {/* Team Matchup with Logos and Scores */}
        <div className="flex items-center gap-2 text-sm">
          <div className="flex items-center gap-1.5 min-w-0">
            <TeamLogo teamName={teams.away} size="md" />
            <span className="font-semibold truncate max-w-[100px]">{teams.away}</span>
            {hasActualScores ? (
              <span className={cn(
                "font-bold tabular-nums text-base ml-1",
                prediction.actual_score_away! > prediction.actual_score_home! ? "text-green-500" : "text-muted-foreground"
              )}>
                {prediction.actual_score_away}
              </span>
            ) : hasProjectedScores && (
              <span className="text-muted-foreground/60 tabular-nums text-xs italic ml-1">
                ({prediction.projected_score_away})
              </span>
            )}
          </div>
          
          <span className="text-muted-foreground font-medium">@</span>
          
          <div className="flex items-center gap-1.5 min-w-0">
            <TeamLogo teamName={teams.home} size="md" />
            <span className="font-semibold truncate max-w-[100px]">{teams.home}</span>
            {hasActualScores ? (
              <span className={cn(
                "font-bold tabular-nums text-base ml-1",
                prediction.actual_score_home! > prediction.actual_score_away! ? "text-green-500" : "text-muted-foreground"
              )}>
                {prediction.actual_score_home}
              </span>
            ) : hasProjectedScores && (
              <span className="text-muted-foreground/60 tabular-nums text-xs italic ml-1">
                ({prediction.projected_score_home})
              </span>
            )}
          </div>
        </div>

        {/* Prediction & Confidence Row */}
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className="text-[10px] font-medium">
            <Zap className="h-3 w-3 mr-1 text-primary" />
            {prediction.prediction}
          </Badge>
          
          {prediction.confidence && (
            <Badge 
              variant="outline" 
              className={cn("text-[10px]", confidenceColors[confidenceLevel])}
            >
              <Target className="h-3 w-3 mr-1" />
              {prediction.confidence}% conf
            </Badge>
          )}
          
          {accuracyDisplay && (
            <Badge variant="outline" className="text-[10px] border-blue-500/30 text-blue-500">
              <BarChart3 className="h-3 w-3 mr-1" />
              {accuracyDisplay} accuracy
            </Badge>
          )}
        </div>
      </div>

      {/* Right Side - Status & Actions */}
      <div className="flex flex-col items-end gap-1.5 shrink-0">
        {hasDataIssues && <DataQualityBadge prediction={prediction} />}
        <Badge variant="secondary" className={cn("text-xs font-medium", status.color, status.bg)}>
          {status.label}
        </Badge>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="text-[9px] text-muted-foreground">View details</span>
          <ExternalLink className="h-3 w-3 text-muted-foreground" />
        </div>
      </div>
    </div>
  );
};

const HistoricalPredictionsSkeleton = () => (
  <div className="space-y-6">
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <Skeleton className="h-4 w-20 mb-2" />
            <Skeleton className="h-8 w-16" />
          </CardContent>
        </Card>
      ))}
    </div>
    <Card>
      <CardContent className="p-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 py-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1">
              <Skeleton className="h-4 w-32 mb-2" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-6 w-16" />
          </div>
        ))}
      </CardContent>
    </Card>
  </div>
);

export default HistoricalPredictionsSection;

export { PredictionDetailsDialog };
