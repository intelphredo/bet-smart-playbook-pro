import { memo } from 'react';
import { Lock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface LockedBadgeProps {
  lockedAt?: string;
  compact?: boolean;
  className?: string;
}

/**
 * Visual indicator showing that a prediction is locked and immutable.
 * Once a pre-live prediction is made, it cannot be changed.
 */
const LockedBadge = memo(function LockedBadge({ 
  lockedAt, 
  compact = false,
  className 
}: LockedBadgeProps) {
  const formattedTime = lockedAt 
    ? format(new Date(lockedAt), 'MMM d, h:mm a')
    : null;

  if (compact) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant="outline" 
            className={cn(
              "text-[10px] h-5 px-1.5 cursor-help gap-1",
              "bg-amber-500/10 text-amber-600 border-amber-500/30",
              className
            )}
          >
            <Lock className="h-3 w-3" />
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          <div className="space-y-1">
            <p className="font-medium">Prediction Locked</p>
            {formattedTime && (
              <p className="text-muted-foreground">Locked at {formattedTime}</p>
            )}
            <p className="text-muted-foreground">This prediction is immutable</p>
          </div>
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge 
          variant="outline" 
          className={cn(
            "text-xs gap-1 cursor-help",
            "bg-amber-500/10 text-amber-600 border-amber-500/30",
            className
          )}
        >
          <Lock className="h-3 w-3" />
          Locked
        </Badge>
      </TooltipTrigger>
      <TooltipContent side="top" className="text-xs max-w-xs">
        <div className="space-y-1">
          <p className="font-medium">Prediction Locked</p>
          {formattedTime && (
            <p className="text-muted-foreground">Locked at {formattedTime}</p>
          )}
          <p className="text-muted-foreground">
            Pre-live predictions are locked once made and cannot be modified.
          </p>
        </div>
      </TooltipContent>
    </Tooltip>
  );
});

export { LockedBadge };
export default LockedBadge;
