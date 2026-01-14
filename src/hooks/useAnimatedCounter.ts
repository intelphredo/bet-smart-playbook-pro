import { useState, useEffect, useRef } from "react";

interface UseAnimatedCounterOptions {
  duration?: number;
  delay?: number;
  easing?: "easeOut" | "easeInOut" | "linear";
  decimals?: number;
}

export function useAnimatedCounter(
  targetValue: number,
  options: UseAnimatedCounterOptions = {}
) {
  const { duration = 1000, delay = 0, easing = "easeOut", decimals = 0 } = options;
  const [displayValue, setDisplayValue] = useState(0);
  const startValueRef = useRef(0);
  const startTimeRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const easingFunctions = {
    linear: (t: number) => t,
    easeOut: (t: number) => 1 - Math.pow(1 - t, 3),
    easeInOut: (t: number) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
  };

  useEffect(() => {
    const animate = (timestamp: number) => {
      if (!startTimeRef.current) {
        startTimeRef.current = timestamp;
      }

      const elapsed = timestamp - startTimeRef.current;
      
      if (elapsed < delay) {
        animationFrameRef.current = requestAnimationFrame(animate);
        return;
      }

      const progress = Math.min((elapsed - delay) / duration, 1);
      const easedProgress = easingFunctions[easing](progress);
      const currentValue = startValueRef.current + (targetValue - startValueRef.current) * easedProgress;

      setDisplayValue(currentValue);

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      }
    };

    startValueRef.current = displayValue;
    startTimeRef.current = null;
    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [targetValue, duration, delay, easing]);

  return decimals > 0 ? displayValue.toFixed(decimals) : Math.round(displayValue);
}

export function useAnimatedPercentage(
  targetValue: number,
  options: UseAnimatedCounterOptions = {}
) {
  const value = useAnimatedCounter(targetValue, { ...options, decimals: 1 });
  return `${value}%`;
}

export function useAnimatedCurrency(
  targetValue: number,
  options: UseAnimatedCounterOptions = {}
) {
  const value = useAnimatedCounter(targetValue, { ...options, decimals: 2 });
  const prefix = targetValue >= 0 ? "+$" : "-$";
  return `${prefix}${Math.abs(Number(value)).toFixed(2)}`;
}

export default useAnimatedCounter;
