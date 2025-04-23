
import { BettingAlgorithm } from "@/types/sports";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, ChartLine, Zap, Calculator, Brain } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";

interface AlgorithmCardProps {
  algorithm: BettingAlgorithm & { totalPicks: number; isFiltered: boolean };
}

const AlgorithmCard = ({ algorithm }: AlgorithmCardProps) => {
  // Determine algorithm type and set appropriate styles
  const getAlgorithmStyle = () => {
    switch (algorithm.name) {
      case "ML Power Index":
        return {
          icon: <Brain className="h-5 w-5 text-accent algorithm-ml" />,
          className: "algorithm-card-ml",
          description: "Enhanced machine learning model with time-series analysis and Bayesian adjustments"
        };
      case "Value Pick Finder":
        return {
          icon: <Calculator className="h-5 w-5 text-accent algorithm-value" />,
          className: "algorithm-card-value",
          description: "Market analysis with closing line value and reverse line movement detection"
        };
      case "Statistical Edge":
        return {
          icon: <Zap className="h-5 w-5 text-accent algorithm-statistical" />,
          className: "algorithm-card-statistical",
          description: "Statistical analysis with rest advantage and matchup-specific factors"
        };
      default:
        return {
          icon: <ChartLine className="h-5 w-5 text-accent" />,
          className: "",
          description: algorithm.description
        };
    }
  };

  const { icon, className, description } = getAlgorithmStyle();

  return (
    <Card className={`overflow-hidden hover:shadow-md transition-all duration-200 ${className} dark-mode-transition`}>
      <CardHeader className="p-4 bg-navy-50 dark:bg-navy-800/60 border-b border-slate-200 dark:border-navy-700/50">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg flex items-center gap-2">
            {icon}
            {algorithm.name}
          </CardTitle>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge
                  variant="outline"
                  className="bg-navy-500 text-white border-none dark:bg-navy-600 dark:text-navy-50"
                >
                  {algorithm.winRate}% Win
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">
                  Based on {algorithm.totalPicks || 0} predictions
                  {algorithm.isFiltered && " (filtered view)"}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>
      <CardContent className="p-4 bg-slate-50/50 dark:bg-navy-900/20">
        <p className="text-sm text-muted-foreground mb-4">
          {description}
        </p>
        
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-1">
            <span>Win rate</span>
            <span className="font-medium">{algorithm.winRate}%</span>
          </div>
          <Progress value={algorithm.winRate} className="h-2 dark:bg-navy-800" />
        </div>
        
        <div>
          <div className="text-sm mb-2">Recent picks:</div>
          <div className="flex gap-1">
            {algorithm.recentResults.map((result, index) => (
              <Badge
                key={index}
                variant="outline"
                className={`${
                  result === "W"
                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                    : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                } text-xs`}
              >
                {result}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AlgorithmCard;

