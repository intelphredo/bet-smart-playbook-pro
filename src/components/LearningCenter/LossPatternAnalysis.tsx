import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, TrendingDown, Lightbulb } from "lucide-react";
import type { LossPattern } from "@/hooks/useLearningCenter";

interface Props {
  patterns: LossPattern[];
}

const severityConfig = {
  high: { color: 'bg-destructive/10 text-destructive border-destructive/30', icon: '🔴' },
  medium: { color: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30', icon: '🟡' },
  low: { color: 'bg-blue-500/10 text-blue-600 border-blue-500/30', icon: '🔵' },
};

export function LossPatternAnalysis({ patterns }: Props) {
  if (patterns.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-primary" />
            Loss Pattern Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">Not enough data to detect loss patterns yet.</p>
            <p className="text-xs mt-1">Need at least 10 settled predictions.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <TrendingDown className="h-5 w-5 text-primary" />
          Loss Pattern Analysis
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Identified weaknesses in the prediction model
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {patterns.map(pattern => {
          const config = severityConfig[pattern.severity];
          return (
            <div key={pattern.id} className={`rounded-lg border p-4 ${config.color}`}>
              <div className="flex items-start gap-3">
                <span className="text-lg mt-0.5">{config.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-medium text-sm">{pattern.title}</h4>
                    <Badge variant="outline" className="text-[10px] px-1.5">
                      {pattern.affectedGames} games
                    </Badge>
                  </div>
                  <p className="text-xs mt-1 opacity-90">{pattern.description}</p>
                  <div className="flex items-start gap-1.5 mt-2 bg-background/50 rounded-md p-2">
                    <Lightbulb className="h-3.5 w-3.5 mt-0.5 text-primary shrink-0" />
                    <p className="text-xs text-muted-foreground">{pattern.insight}</p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
