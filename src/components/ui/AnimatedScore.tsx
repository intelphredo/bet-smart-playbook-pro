import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface AnimatedScoreProps {
  score: number;
  matchId: string;
  teamKey: 'home' | 'away';
  isLive?: boolean;
  className?: string;
}

export function AnimatedScore({
  score,
  matchId,
  teamKey,
  isLive = false,
  className,
}: AnimatedScoreProps) {
  const [isFlashing, setIsFlashing] = useState(false);
  const [showDelta, setShowDelta] = useState(false);
  const [delta, setDelta] = useState(0);
  const prevScoreRef = useRef<number | null>(null);
  const isFirstRender = useRef(true);

  useEffect(() => {
    // Skip flash on first render
    if (isFirstRender.current) {
      isFirstRender.current = false;
      prevScoreRef.current = score;
      return;
    }

    const prevScore = prevScoreRef.current ?? 0;
    const scoreDelta = score - prevScore;

    // Only flash if score increased (points scored)
    if (scoreDelta > 0 && isLive) {
      setDelta(scoreDelta);
      setIsFlashing(true);
      setShowDelta(true);

      // Hide delta badge after 3 seconds
      const deltaTimeout = setTimeout(() => {
        setShowDelta(false);
      }, 3000);

      // Stop flash animation after 2 seconds
      const flashTimeout = setTimeout(() => {
        setIsFlashing(false);
      }, 2000);

      prevScoreRef.current = score;

      return () => {
        clearTimeout(deltaTimeout);
        clearTimeout(flashTimeout);
      };
    }

    prevScoreRef.current = score;
  }, [score, isLive]);

  return (
    <div className="relative inline-flex items-center">
      <motion.span
        key={`${matchId}-${teamKey}-${score}`}
        initial={isFlashing ? { scale: 1.3, color: 'hsl(var(--destructive))' } : false}
        animate={{
          scale: isFlashing ? [1.3, 1.1, 1.2, 1] : 1,
          color: isFlashing ? ['hsl(var(--destructive))', 'hsl(var(--primary))', 'hsl(var(--destructive))', undefined] : undefined,
        }}
        transition={{
          duration: 1.5,
          ease: 'easeOut',
        }}
        className={cn(
          'tabular-nums font-bold transition-colors',
          isFlashing && 'text-destructive',
          className
        )}
      >
        {score}
      </motion.span>

      {/* Delta badge */}
      <AnimatePresence>
        {showDelta && delta > 0 && (
          <motion.span
            initial={{ opacity: 0, scale: 0.5, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: -10 }}
            transition={{ type: 'spring', stiffness: 500, damping: 25 }}
            className="absolute -top-3 -right-4 bg-green-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-lg"
          >
            +{delta}
          </motion.span>
        )}
      </AnimatePresence>

      {/* Flash ring effect */}
      <AnimatePresence>
        {isFlashing && (
          <motion.span
            initial={{ opacity: 0.8, scale: 1 }}
            animate={{ opacity: 0, scale: 2.5 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="absolute inset-0 rounded-full bg-green-500/30 pointer-events-none"
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default AnimatedScore;
