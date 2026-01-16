import React, { memo, useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

type BadgeVariant = 'live' | 'gold' | 'success' | 'default';

interface AnimatedBadgeProps {
  count: number;
  variant?: BadgeVariant;
  className?: string;
  showZero?: boolean;
  pulse?: boolean;
}

// Animated number that counts up/down when value changes
const AnimatedNumber = memo(function AnimatedNumber({ value }: { value: number }) {
  const [displayValue, setDisplayValue] = useState(value);
  const prevValue = useRef(value);

  useEffect(() => {
    if (value === prevValue.current) return;
    
    const start = prevValue.current;
    const end = value;
    const duration = 300;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease out cubic
      
      setDisplayValue(Math.round(start + (end - start) * eased));
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
    prevValue.current = value;
  }, [value]);

  return <span>{displayValue}</span>;
});

export const AnimatedBadge = memo(function AnimatedBadge({
  count,
  variant = 'default',
  className,
  showZero = false,
  pulse = false,
}: AnimatedBadgeProps) {
  if (count === 0 && !showZero) return null;

  const variantClasses: Record<BadgeVariant, string> = {
    live: 'bg-cyan-500 text-white shadow-[0_0_10px_rgba(0,212,255,0.5)]',
    gold: 'bg-gradient-to-r from-primary to-cyan-400 text-primary-foreground shadow-[0_0_10px_hsl(var(--primary)/0.5)]',
    success: 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/30',
    default: 'bg-muted text-muted-foreground',
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={count}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className={cn(
          'h-5 min-w-[20px] px-1.5 rounded-full text-[10px] font-bold flex items-center justify-center',
          variantClasses[variant],
          pulse && variant === 'live' && 'animate-pulse',
          className
        )}
        role="status"
        aria-live="polite"
        aria-label={`${count} ${variant === 'live' ? 'live items' : 'items'}`}
      >
        <AnimatedNumber value={count} />
      </motion.div>
    </AnimatePresence>
  );
});

export default AnimatedBadge;
