import { useState } from "react";
import { Match } from "@/types/sports";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Sparkles, 
  Loader2, 
  AlertCircle, 
  TrendingUp,
  Brain,
  Target,
  ShieldAlert,
  Lightbulb
} from "lucide-react";
import { toast } from "sonner";

interface AIBetAnalysisProps {
  match: Match;
  variant?: "button" | "icon";
  className?: string;
}

interface AnalysisResult {
  analysis: string;
  matchId: string;
  generatedAt: string;
}

export default function AIBetAnalysis({ match, variant = "button", className }: AIBetAnalysisProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalysis = async () => {
    if (analysis?.matchId === match.id) return; // Use cached analysis

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('analyze-bet', {
        body: {
          match: {
            id: match.id,
            homeTeam: match.homeTeam.name,
            awayTeam: match.awayTeam.name,
            league: match.league,
            startTime: match.startTime,
            odds: match.odds,
            prediction: {
              recommended: match.prediction.recommended,
              confidence: match.prediction.confidence,
              projectedScore: match.prediction.projectedScore,
              algorithmId: match.prediction.algorithmId,
              expectedValue: match.prediction.expectedValue,
              evPercentage: match.prediction.evPercentage,
              keyFactors: match.prediction.keyFactors,
            },
          },
        },
      });

      if (fnError) {
        throw new Error(fnError.message);
      }

      if (data?.error) {
        if (data.error.includes("Rate limit")) {
          toast.error("Too many requests. Please wait a moment.");
        } else if (data.error.includes("credits")) {
          toast.error("AI credits exhausted. Contact support to add more.");
        }
        throw new Error(data.error);
      }

      setAnalysis(data);
    } catch (err: any) {
      console.error("Failed to fetch analysis:", err);
      setError(err.message || "Failed to generate analysis");
      toast.error("Failed to generate AI analysis");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpen = (open: boolean) => {
    setIsOpen(open);
    if (open && !analysis) {
      fetchAnalysis();
    }
  };

  // Parse markdown sections from the analysis
  const parseAnalysis = (text: string) => {
    const sections: { title: string; content: string; icon: React.ReactNode }[] = [];
    
    const sectionPatterns = [
      { pattern: /\*\*Matchup Overview\*\*/i, title: "Matchup Overview", icon: <Target className="h-4 w-4" /> },
      { pattern: /\*\*Why This Pick\*\*/i, title: "Why This Pick", icon: <Brain className="h-4 w-4" /> },
      { pattern: /\*\*Key Factors\*\*/i, title: "Key Factors", icon: <TrendingUp className="h-4 w-4" /> },
      { pattern: /\*\*Risks to Consider\*\*/i, title: "Risks to Consider", icon: <ShieldAlert className="h-4 w-4" /> },
      { pattern: /\*\*Value Assessment\*\*/i, title: "Value Assessment", icon: <Lightbulb className="h-4 w-4" /> },
      { pattern: /\*\*Bottom Line\*\*/i, title: "Bottom Line", icon: <Sparkles className="h-4 w-4" /> },
    ];

    let remainingText = text;
    
    sectionPatterns.forEach((section, index) => {
      const match = remainingText.match(section.pattern);
      if (match) {
        const startIndex = remainingText.indexOf(match[0]);
        const nextSectionIndex = sectionPatterns
          .slice(index + 1)
          .reduce((minIndex, nextSection) => {
            const nextMatch = remainingText.match(nextSection.pattern);
            if (nextMatch) {
              const nextStart = remainingText.indexOf(nextMatch[0]);
              return nextStart < minIndex ? nextStart : minIndex;
            }
            return minIndex;
          }, remainingText.length);

        const content = remainingText
          .slice(startIndex + match[0].length, nextSectionIndex)
          .trim()
          .replace(/^\s*[-–]\s*/gm, '• ')
          .replace(/\*\*/g, '');

        if (content) {
          sections.push({
            title: section.title,
            content,
            icon: section.icon,
          });
        }
      }
    });

    return sections.length > 0 ? sections : null;
  };

  const triggerButton = variant === "icon" ? (
    <Button
      variant="ghost"
      size="icon"
      className={className}
      title="AI Analysis"
    >
      <Sparkles className="h-4 w-4 text-primary" />
    </Button>
  ) : (
    <Button
      variant="outline"
      size="sm"
      className={`gap-2 ${className}`}
    >
      <Sparkles className="h-4 w-4" />
      AI Analysis
    </Button>
  );

  const parsedSections = analysis?.analysis ? parseAnalysis(analysis.analysis) : null;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        {triggerButton}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Bet Analysis
          </DialogTitle>
          <DialogDescription>
            {match.homeTeam.name} vs {match.awayTeam.name} • {match.league}
          </DialogDescription>
        </DialogHeader>

        {/* Match Summary */}
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="text-center">
              <p className="font-semibold">{match.homeTeam.shortName}</p>
              <p className="text-xs text-muted-foreground">Home</p>
            </div>
            <span className="text-muted-foreground">vs</span>
            <div className="text-center">
              <p className="font-semibold">{match.awayTeam.shortName}</p>
              <p className="text-xs text-muted-foreground">Away</p>
            </div>
          </div>
          <div className="text-right">
            <Badge 
              variant={match.prediction.recommended === 'home' ? 'default' : 'secondary'}
              className="mb-1"
            >
              Pick: {match.prediction.recommended === 'home' ? match.homeTeam.shortName : 
                     match.prediction.recommended === 'away' ? match.awayTeam.shortName : 'Draw'}
            </Badge>
            <p className="text-xs text-muted-foreground">
              {match.prediction.confidence}% confidence
            </p>
          </div>
        </div>

        <Separator />

        {/* Analysis Content */}
        <ScrollArea className="h-[400px] pr-4">
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Generating AI analysis...</p>
            </div>
          )}

          {error && !isLoading && (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-destructive">
              <AlertCircle className="h-8 w-8" />
              <p className="text-sm">{error}</p>
              <Button variant="outline" size="sm" onClick={fetchAnalysis}>
                Try Again
              </Button>
            </div>
          )}

          {parsedSections && !isLoading && (
            <div className="space-y-4">
              {parsedSections.map((section, index) => (
                <Card key={index} className="border-border/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <span className="text-primary">{section.icon}</span>
                      {section.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground whitespace-pre-line">
                      {section.content}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Fallback for unparsed analysis */}
          {analysis?.analysis && !parsedSections && !isLoading && (
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <p className="whitespace-pre-line text-sm text-muted-foreground">
                {analysis.analysis}
              </p>
            </div>
          )}
        </ScrollArea>

        {analysis?.generatedAt && (
          <p className="text-xs text-muted-foreground text-center">
            Generated {new Date(analysis.generatedAt).toLocaleString()}
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}