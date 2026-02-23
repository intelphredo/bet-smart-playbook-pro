import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DailyChallenge } from "@/hooks/useEngagement";
import { CheckCircle2, Circle, Zap, Target } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Progress } from "@/components/ui/progress";

interface DailyChallengesProps {
  challenges: DailyChallenge[];
  compact?: boolean;
}

const DailyChallengesCard = ({ challenges, compact }: DailyChallengesProps) => {
  const completed = challenges.filter(c => c.completed).length;

  return (
    <Card variant="glass" className="overflow-hidden">
      <CardHeader className={cn("pb-2", compact && "p-3 pb-1")}>
        <div className="flex items-center justify-between">
          <CardTitle className={cn("flex items-center gap-2", compact ? "text-sm" : "text-base")}>
            <Target className="h-4 w-4 text-primary" />
            Daily Challenges
          </CardTitle>
          <span className="text-xs text-muted-foreground">
            {completed}/{challenges.length} done
          </span>
        </div>
      </CardHeader>
      <CardContent className={cn(compact && "p-3 pt-1")}>
        <div className="space-y-2.5">
          {challenges.map((challenge, i) => (
            <motion.div
              key={challenge.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className={cn(
                "flex items-center gap-3 rounded-lg p-2.5 border transition-colors",
                challenge.completed
                  ? "bg-emerald-500/5 border-emerald-500/20"
                  : "bg-card/50 border-border/30 hover:border-primary/20"
              )}
            >
              {challenge.completed ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
              ) : (
                <Circle className="h-4 w-4 text-muted-foreground shrink-0" />
              )}

              <div className="flex-1 min-w-0">
                <p className={cn(
                  "text-sm font-medium",
                  challenge.completed && "line-through text-muted-foreground"
                )}>
                  {challenge.title}
                </p>
                {!compact && (
                  <p className="text-xs text-muted-foreground">{challenge.description}</p>
                )}
                {!challenge.completed && (
                  <Progress 
                    value={(challenge.current / challenge.target) * 100} 
                    className="h-1 mt-1" 
                  />
                )}
              </div>

              <div className="flex items-center gap-1 text-xs shrink-0">
                <Zap className="h-3 w-3 text-primary" />
                <span className={cn(
                  "font-medium",
                  challenge.completed ? "text-emerald-500" : "text-primary"
                )}>
                  +{challenge.xpReward}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default DailyChallengesCard;
