import { memo } from "react";
import { useNavigate } from "react-router-dom";
import { Match } from "@/types/sports";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { SharpMoneySection } from "@/components/SharpMoney";
import { Brain, ChevronRight, HelpCircle, Zap } from "lucide-react";

interface SharpMoneyPanelProps {
  matches: Match[];
  league: string;
}

export const SharpMoneyPanel = memo(function SharpMoneyPanel({ matches, league }: SharpMoneyPanelProps) {
  const navigate = useNavigate();

  return (
    <Card className="border-purple-500/20 h-full">
      <CardHeader className="py-3 px-4 bg-gradient-to-r from-purple-500/5 to-transparent">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-purple-500/10">
              <Brain className="h-4 w-4 text-purple-500" />
            </div>
            <CardTitle className="text-base">Sharp Money</CardTitle>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                  <p className="text-sm">Sharp money tracks where professional bettors place large wagers. When sharp money opposes public money, it often signals value.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Button variant="ghost" size="sm" className="text-xs h-7 text-purple-500" onClick={() => navigate('/betting-trends')}>
            View All <ChevronRight className="h-3 w-3 ml-0.5" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-3 px-4">
        <SharpMoneySection
          matches={matches}
          league={league as any}
          maxItems={3}
          showFilter={false}
          compact={true}
        />

        {/* Steam move alert placeholder */}
        <div className="mt-3 p-2.5 rounded-lg bg-orange-500/5 border border-orange-500/20">
          <div className="flex items-center gap-2 text-sm">
            <Zap className="h-3.5 w-3.5 text-orange-500" />
            <span className="font-medium text-orange-500">Steam Moves</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <HelpCircle className="h-3 w-3 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                  <p className="text-sm">A steam move is a sudden, sharp line movement caused by coordinated betting from professional syndicates.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Monitoring for rapid line swings across sportsbooks</p>
        </div>
      </CardContent>
    </Card>
  );
});
