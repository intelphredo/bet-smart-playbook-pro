
import { BettingAlgorithm } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, ChartLine } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface AlgorithmCardProps {
  algorithm: BettingAlgorithm;
}

const AlgorithmCard = ({ algorithm }: AlgorithmCardProps) => {
  return (
    <Card className="overflow-hidden hover:shadow-md transition-all duration-200">
      <CardHeader className="p-4 bg-navy-50 dark:bg-navy-700">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg flex items-center gap-2">
            <ChartLine className="h-5 w-5 text-accent" />
            {algorithm.name}
          </CardTitle>
          <Badge
            variant="outline"
            className="bg-navy-500 text-white border-none"
          >
            {algorithm.winRate}% Win
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <p className="text-sm text-muted-foreground mb-4">
          {algorithm.description}
        </p>
        
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-1">
            <span>Win rate</span>
            <span className="font-medium">{algorithm.winRate}%</span>
          </div>
          <Progress value={algorithm.winRate} className="h-2" />
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
