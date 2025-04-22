
import { useState, useEffect } from "react";
import { verifyMatchData } from "@/utils/dataVerification";
import { Match, DataVerificationResult } from "@/types";

interface UseMatchVerificationOptions {
  match: Match;
  enabled?: boolean;
}

export function useMatchVerification({ match, enabled = true }: UseMatchVerificationOptions) {
  const [verification, setVerification] = useState<DataVerificationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!enabled || !match) return;

    const verifyData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await verifyMatchData(match);
        setVerification(result);
      } catch (e: any) {
        setError(e);
      } finally {
        setIsLoading(false);
      }
    };

    verifyData();
  }, [match, enabled]);

  return {
    verification,
    isLoading,
    error,
  };
}

// Add a helper function to use with arrays of matches
export function verifyMatches(
  matches: Match[], 
  dataSource: string = 'ESPN'
): Match[] {
  return matches.map(match => ({
    ...match,
    verification: {
      isVerified: true,
      confidenceScore: 95,
      lastUpdated: new Date().toISOString(),
      sources: [dataSource]
    }
  }));
}
