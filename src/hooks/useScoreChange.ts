import { useState, useEffect, useRef } from 'react';

interface ScoreChangeResult {
  hasChanged: boolean;
  prevScore: number;
  delta: number;
  isFlashing: boolean;
}

export function useScoreChange(
  currentScore: number | undefined,
  matchId: string,
  teamKey: 'home' | 'away'
): ScoreChangeResult {
  const [isFlashing, setIsFlashing] = useState(false);
  const prevScoreRef = useRef<number | null>(null);
  const flashTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Create a stable key for this specific score
  const scoreKey = `${matchId}-${teamKey}`;
  
  useEffect(() => {
    const score = currentScore ?? 0;
    
    // Skip initial render or if score hasn't loaded yet
    if (prevScoreRef.current === null) {
      prevScoreRef.current = score;
      return;
    }
    
    // Detect score change
    if (score !== prevScoreRef.current && score > prevScoreRef.current) {
      setIsFlashing(true);
      
      // Clear any existing timeout
      if (flashTimeoutRef.current) {
        clearTimeout(flashTimeoutRef.current);
      }
      
      // Stop flashing after animation completes
      flashTimeoutRef.current = setTimeout(() => {
        setIsFlashing(false);
      }, 2000); // Flash for 2 seconds
    }
    
    prevScoreRef.current = score;
    
    return () => {
      if (flashTimeoutRef.current) {
        clearTimeout(flashTimeoutRef.current);
      }
    };
  }, [currentScore, scoreKey]);
  
  const prevScore = prevScoreRef.current ?? 0;
  const delta = (currentScore ?? 0) - prevScore;
  
  return {
    hasChanged: delta > 0,
    prevScore,
    delta,
    isFlashing,
  };
}
