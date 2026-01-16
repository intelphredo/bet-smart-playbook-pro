// src/components/MatchCard/MatchCardFooter.tsx

import { memo } from "react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Brain, TrendingUp } from "lucide-react";
import { LockedBadge } from "@/components/ui/LockedBadge";

interface MatchCardFooterProps {
  match: any;
  getBadgeColor: (confidence: number) => string;
  getSmartScoreBadgeColor: () => string;
}

const MatchCardFooter = memo(function MatchCardFooter({
  match,
  getBadgeColor,
  getSmartScoreBadgeColor,
}: MatchCardFooterProps) {
  const confidence = match.prediction?.confidence || 0;
  const smartScore = match.smartScore?.overall || 0;
  const isLocked = match.prediction?.isLocked;
  const lockedAt = match.prediction?.lockedAt;

  return (
    <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/30">
      <div className="flex items-center gap-2">
        {match.prediction?.recommendedBet && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge className={`${getBadgeColor(confidence)} text-xs px-2 py-0.5`}>
                <TrendingUp className="h-3 w-3 mr-1" />
                {match.prediction.recommendedBet}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>Recommended bet with {confidence}% confidence</p>
            </TooltipContent>
          </Tooltip>
        )}
        {isLocked && (
          <LockedBadge lockedAt={lockedAt} compact />
        )}
      </div>

      {smartScore > 0 && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge className={`${getSmartScoreBadgeColor()} text-xs px-2 py-0.5`}>
              <Brain className="h-3 w-3 mr-1" />
              Smart: {smartScore}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>SmartScore based on multiple factors</p>
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
});

export default MatchCardFooter;
