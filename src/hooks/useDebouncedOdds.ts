/**
 * Hook to debounce rapid odds updates to prevent UI flicker.
 * Shows the latest odds after a settling period.
 */

import { useState, useEffect, useRef } from 'react';
import { LiveOdds } from '@/types/sports';

const DEBOUNCE_MS = 500; // 500ms settle time for odds updates

export function useDebouncedOdds(odds: LiveOdds[] | undefined): LiveOdds[] {
  const [debouncedOdds, setDebouncedOdds] = useState<LiveOdds[]>(odds ?? []);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (!odds) return;

    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Debounce the update
    timeoutRef.current = setTimeout(() => {
      setDebouncedOdds(odds);
    }, DEBOUNCE_MS);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [odds]);

  return debouncedOdds;
}

/**
 * Hook to debounce any rapidly changing value with a configurable delay.
 */
export function useDebouncedValue<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [value, delay]);

  return debouncedValue;
}

export default useDebouncedOdds;
