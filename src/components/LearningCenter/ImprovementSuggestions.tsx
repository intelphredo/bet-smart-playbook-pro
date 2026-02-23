import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle, Sparkles, Database, Brain, Target } from "lucide-react";
import type { ImprovementSuggestion } from "@/hooks/useLearningCenter";

interface Props {
  suggestions: ImprovementSuggestion[];
}

const impactColors = {
  high: 'border-primary/40 bg-primary/5',
  medium: 'border-yellow-500/30 bg-yellow-500/5',
  low: 'border-muted-foreground/20 bg-muted/20',
};

const categoryIcons = {
  data: Database,
  model: Brain,
  strategy: Target,
};

const categoryLabels = {
  data: 'Data Enhancement',
  model: 'Model Improvement',
  strategy: 'Strategy',
};

export function ImprovementSuggestions({ suggestions }: Props) {
  const implemented = suggestions.filter(s => s.implemented);
  const pending = suggestions.filter(s => !s.implemented);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Improvement Suggestions
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Data-driven recommendations to boost accuracy
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Pending suggestions */}
        {pending.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Recommended
            </h4>
            {pending.map(suggestion => {
              const CategoryIcon = categoryIcons[suggestion.category];
              return (
                <div key={suggestion.id} className={`rounded-lg border p-3 ${impactColors[suggestion.impact]}`}>
                  <div className="flex items-start gap-2.5">
                    <Circle className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h5 className="font-medium text-sm">{suggestion.title}</h5>
                        <Badge variant="outline" className="text-[10px] px-1.5 gap-1">
                          <CategoryIcon className="h-2.5 w-2.5" />
                          {categoryLabels[suggestion.category]}
                        </Badge>
                        <Badge
                          variant={suggestion.impact === 'high' ? 'default' : 'secondary'}
                          className="text-[10px] px-1.5"
                        >
                          {suggestion.impact} impact
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{suggestion.description}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Implemented suggestions */}
        {implemented.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              ✅ Already Implemented
            </h4>
            {implemented.map(suggestion => {
              const CategoryIcon = categoryIcons[suggestion.category];
              return (
                <div key={suggestion.id} className="rounded-lg border border-green-500/20 bg-green-500/5 p-3">
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h5 className="font-medium text-sm text-green-700 dark:text-green-400">{suggestion.title}</h5>
                        <Badge variant="outline" className="text-[10px] px-1.5 gap-1 border-green-500/30">
                          <CategoryIcon className="h-2.5 w-2.5" />
                          {categoryLabels[suggestion.category]}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{suggestion.description}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
