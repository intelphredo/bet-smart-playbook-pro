import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Swords } from "lucide-react";
import { cn } from "@/lib/utils";
import type { HeadToHeadResult } from "@/hooks/useAlgorithmComparison";
import { InfoExplainer } from "@/components/ui/InfoExplainer";

interface HeadToHeadMatrixProps {
  headToHead: HeadToHeadResult[];
}

export function HeadToHeadMatrix({ headToHead }: HeadToHeadMatrixProps) {
  if (headToHead.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Swords className="h-5 w-5" />
            Head-to-Head Comparison
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Not enough disagreements between algorithms to show head-to-head stats.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Swords className="h-5 w-5" />
          Head-to-Head Comparison
          <InfoExplainer term="sharp_action" size="sm" />
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          When algorithms disagreed, who was right more often?
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {headToHead.map((h2h, idx) => {
          const winner = h2h.winRate1 > h2h.winRate2 ? 1 : h2h.winRate2 > h2h.winRate1 ? 2 : 0;
          
          return (
            <div key={idx} className="p-4 rounded-lg border bg-muted/20">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Badge variant={winner === 1 ? "default" : "outline"} className="text-xs">
                    {h2h.algorithm1Name}
                  </Badge>
                  <span className="text-muted-foreground">vs</span>
                  <Badge variant={winner === 2 ? "default" : "outline"} className="text-xs">
                    {h2h.algorithm2Name}
                  </Badge>
                </div>
                <span className="text-xs text-muted-foreground">
                  {h2h.disagreements} disagreements
                </span>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium w-20 truncate" title={h2h.algorithm1Name}>
                    {h2h.algorithm1Name.split(' ')[0]}
                  </span>
                  <Progress value={h2h.winRate1} className="flex-1 h-3" />
                  <span className={cn(
                    "text-sm font-bold min-w-[60px] text-right",
                    winner === 1 ? "text-green-500" : "text-muted-foreground"
                  )}>
                    {h2h.algorithm1Wins}W ({h2h.winRate1.toFixed(0)}%)
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium w-20 truncate" title={h2h.algorithm2Name}>
                    {h2h.algorithm2Name.split(' ')[0]}
                  </span>
                  <Progress value={h2h.winRate2} className="flex-1 h-3" />
                  <span className={cn(
                    "text-sm font-bold min-w-[60px] text-right",
                    winner === 2 ? "text-green-500" : "text-muted-foreground"
                  )}>
                    {h2h.algorithm2Wins}W ({h2h.winRate2.toFixed(0)}%)
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
