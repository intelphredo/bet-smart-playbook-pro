import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface LineMovement {
  id: string;
  match_id: string;
  match_title: string;
  league: string;
  sportsbook_id: string;
  market_type: string;
  previous_odds: {
    home?: number;
    away?: number;
    spread_home?: number;
    total?: number;
  };
  current_odds: {
    home?: number;
    away?: number;
    spread_home?: number;
    total?: number;
  };
  movement_percentage: number;
  movement_direction: 'steam' | 'reverse' | 'stable';
  detected_at: string;
}

export function useLineMovements() {
  const [movements, setMovements] = useState<LineMovement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchMovements = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch movements from the last 24 hours
      const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      
      const response = await fetch(
        `${supabaseUrl}/rest/v1/line_movement_tracking?select=*&detected_at=gte.${cutoff}&order=detected_at.desc&limit=20`,
        {
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`
          }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        // Filter out demo entries
        const realMovements = (data || []).filter(
          (m: LineMovement) => !m.match_id?.startsWith('demo-')
        );
        setMovements(realMovements);
        setLastUpdated(new Date());
      } else {
        console.log('Line movements query error:', response.status);
        setError('Unable to fetch line movements');
        setMovements([]);
      }
    } catch (err) {
      console.error('Error fetching line movements:', err);
      setError('Network error fetching line movements');
      setMovements([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMovements();
  }, [fetchMovements]);

  return {
    movements,
    isLoading,
    error,
    lastUpdated,
    refetch: fetchMovements
  };
}
