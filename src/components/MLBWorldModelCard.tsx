import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Brain, Lightbulb, FlaskConical, Target, Zap, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

const researchMetrics = [
  {
    label: "Next Pitch Prediction",
    value: "64%",
    description: "Single LLM backbone outperforms neural baselines",
    icon: Target,
    color: "text-emerald-500",
  },
  {
    label: "Swing Decision Accuracy",
    value: "78%",
    description: "Trained on 7M+ pitch sequences (3B tokens)",
    icon: Zap,
    color: "text-primary",
  },
  {
    label: "Data Depth",
    value: "10+ yrs",
    description: "Continuous pretraining on MLB tracking data",
    icon: TrendingUp,
    color: "text-amber-500",
  },
];

const MLBWorldModelCard: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Brain className="h-5 w-5 text-primary" />
          LLM as World Model
          <Badge variant="outline" className="ml-auto text-xs font-normal text-amber-500 bg-amber-500/10 border-amber-500/20">
            <FlaskConical className="h-3 w-3 mr-1" />
            Research Feb 2026
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Key Insight */}
        <div className="flex gap-2.5 p-3 bg-primary/5 border border-primary/10 rounded-lg">
          <Lightbulb className="h-4 w-4 text-primary mt-0.5 shrink-0" />
          <p className="text-sm text-muted-foreground leading-relaxed">
            Breakthrough research shows LLMs trained on pitch sequences create{" "}
            <span className="text-foreground font-medium">generative world models</span>{" "}
            of how baseball games unfold — unlike traditional sabermetrics which only analyze after the fact.
          </p>
        </div>

        <Separator />

        {/* Research Metrics */}
        <div className="grid grid-cols-3 gap-3">
          {researchMetrics.map((metric) => {
            const Icon = metric.icon;
            return (
              <Tooltip key={metric.label}>
                <TooltipTrigger asChild>
                  <div className="p-2.5 rounded-lg bg-muted/30 text-center cursor-default">
                    <Icon className={cn("h-4 w-4 mx-auto mb-1", metric.color)} />
                    <p className="text-lg font-bold">{metric.value}</p>
                    <p className="text-[10px] text-muted-foreground leading-tight">{metric.label}</p>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs max-w-[200px]">{metric.description}</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>

        <Separator />

        {/* Methodology Note */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            How This Applies
          </p>
          <ul className="space-y-1.5 text-sm text-muted-foreground">
            <li className="flex gap-2">
              <span className="text-primary font-bold">→</span>
              Current predictions use matchup-level statistical models
            </li>
            <li className="flex gap-2">
              <span className="text-primary font-bold">→</span>
              Pitch-sequence LLMs could improve in-game live predictions
            </li>
            <li className="flex gap-2">
              <span className="text-primary font-bold">→</span>
              Moneyline edges may exist where traditional models miss temporal patterns
            </li>
          </ul>
        </div>

        {/* Future Badge */}
        <div className="flex items-center justify-between p-2.5 bg-muted/30 rounded-lg">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              <Brain className="h-3 w-3 mr-1" />
              Pitch-Level Data
            </Badge>
            <span className="text-xs text-muted-foreground">Not yet integrated</span>
          </div>
          <Badge className="text-[10px] bg-amber-500/10 text-amber-500 border-amber-500/20 hover:bg-amber-500/20" variant="outline">
            Planned
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};

export default MLBWorldModelCard;
