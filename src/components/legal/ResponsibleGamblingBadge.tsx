import { motion } from "framer-motion";
import { Heart } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface ResponsibleGamblingBadgeProps {
  className?: string;
}

export function ResponsibleGamblingBadge({ className }: ResponsibleGamblingBadgeProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 2, duration: 0.5 }}
      className={cn(
        "fixed bottom-20 right-4 z-[80]",
        className
      )}
    >
      <Link
        to="/responsible-gambling"
        className="group flex items-center gap-2 px-3 py-2 rounded-full bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 hover:border-green-500/50 backdrop-blur-sm transition-all duration-300 shadow-lg hover:shadow-green-500/20"
      >
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <Heart className="h-4 w-4 text-green-500 fill-green-500/30" />
        </motion.div>
        <span className="text-xs font-medium text-green-500 group-hover:text-green-400 transition-colors">
          Gamble Responsibly
        </span>
      </Link>
    </motion.div>
  );
}
