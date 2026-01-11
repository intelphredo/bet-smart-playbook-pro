import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { isDevMode } from '@/utils/devMode';

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

const DEV_MOVEMENTS: LineMovement[] = [
  {
    id: 'dev-1',
    match_id: 'demo-1',
    match_title: 'Chiefs vs Bills',
    league: 'NFL',
    sportsbook_id: 'draftkings',
    market_type: 'spread',
    previous_odds: { spread_home: -3.5 },
    current_odds: { spread_home: -4.5 },
    movement_percentage: -1,
    movement_direction: 'steam',
    detected_at: new Date(Date.now() - 30 * 60000).toISOString()
  },
  {
    id: 'dev-2',
    match_id: 'demo-2',
    match_title: 'Lakers vs Celtics',
    league: 'NBA',
    sportsbook_id: 'fanduel',
    market_type: 'total',
    previous_odds: { total: 218.5 },
    current_odds: { total: 221 },
    movement_percentage: 2.5,
    movement_direction: 'reverse',
    detected_at: new Date(Date.now() - 2 * 3600000).toISOString()
  },
  {
    id: 'dev-3',
    match_id: 'demo-3',
    match_title: 'Yankees vs Red Sox',
    league: 'MLB',
    sportsbook_id: 'betmgm',
    market_type: 'moneyline_home',
    previous_odds: { home: -145 },
    current_odds: { home: -165 },
    movement_percentage: -20,
    movement_direction: 'steam',
    detected_at: new Date(Date.now() - 5 * 3600000).toISOString()
  }
];

export function useLineMovements() {
  const [movements, setMovements] = useState<LineMovement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMovements = useCallback(async () => {
    if (isDevMode()) {
      setMovements(DEV_MOVEMENTS);
      setIsLoading(false);
      return;
    }

    try {
      // Use fetch API directly for tables not in generated types
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      
      const response = await fetch(
        `${supabaseUrl}/rest/v1/line_movement_tracking?select=*&order=detected_at.desc&limit=20`,
        {
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`
          }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        setMovements((data || []) as LineMovement[]);
      } else {
        console.log('Line movements query error:', response.status);
        setMovements([]);
      }
    } catch (err) {
      console.error('Error fetching line movements:', err);
      // Use dev data as fallback
      setMovements(DEV_MOVEMENTS);
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
    refetch: fetchMovements
  };
}
