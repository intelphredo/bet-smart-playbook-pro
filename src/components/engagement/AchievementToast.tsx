import { AchievementDef } from "@/hooks/useEngagement";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, X } from "lucide-react";

interface AchievementToastProps {
  achievement: AchievementDef | null;
  onDismiss: () => void;
}

const AchievementToast = ({ achievement, onDismiss }: AchievementToastProps) => {
  if (!achievement) return null;

  return (
    <AnimatePresence>
      <motion.div
        key={achievement.id}
        initial={{ opacity: 0, y: 50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50"
      >
        <div className="flex items-center gap-3 px-5 py-3 rounded-xl border border-primary/30 bg-card/95 backdrop-blur-md shadow-xl">
          <span className="text-3xl">{achievement.icon}</span>
          <div>
            <p className="text-xs text-primary font-semibold uppercase tracking-wide">Achievement Unlocked!</p>
            <p className="font-bold text-foreground">{achievement.name}</p>
            <p className="text-xs text-muted-foreground">{achievement.description}</p>
          </div>
          <div className="flex items-center gap-1 text-primary font-bold text-sm">
            <Zap className="h-4 w-4" />
            +{achievement.xpReward}
          </div>
          <button onClick={onDismiss} className="ml-2 text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AchievementToast;
