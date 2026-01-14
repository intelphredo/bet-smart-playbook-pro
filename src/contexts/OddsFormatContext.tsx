import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export type OddsFormat = 'american' | 'decimal' | 'fractional';

interface OddsFormatContextType {
  format: OddsFormat;
  setFormat: (format: OddsFormat) => void;
  formatOdds: (decimalOdds: number | undefined) => string;
}

const OddsFormatContext = createContext<OddsFormatContextType | undefined>(undefined);

const STORAGE_KEY = 'odds-format-preference';

// GCD for fractional odds simplification
function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

// Convert odds to American format (handles both decimal and already-American input)
function toAmerican(odds: number): string {
  // Already in American format (>= 100 or <= -100)
  if (odds >= 100) {
    return `+${Math.round(odds)}`;
  }
  if (odds <= -100) {
    return `${Math.round(odds)}`;
  }
  
  // Decimal odds format (typically 1.01 to ~50)
  if (odds > 1 && odds < 100) {
    if (odds >= 2) {
      return `+${Math.round((odds - 1) * 100)}`;
    } else {
      return `${Math.round(-100 / (odds - 1))}`;
    }
  }
  
  // Fallback
  return odds > 0 ? `+${Math.round(odds)}` : `${Math.round(odds)}`;
}

// Convert decimal odds to fractional format
function decimalToFractional(decimal: number): string {
  // Convert to fraction of profit per unit staked
  const profit = decimal - 1;
  
  // Handle common betting fractions with precision
  const commonFractions: [number, string][] = [
    [0.1, '1/10'],
    [0.2, '1/5'],
    [0.25, '1/4'],
    [0.333, '1/3'],
    [0.4, '2/5'],
    [0.5, '1/2'],
    [0.6, '3/5'],
    [0.666, '2/3'],
    [0.75, '3/4'],
    [0.8, '4/5'],
    [0.9, '9/10'],
    [1, '1/1'],
    [1.1, '11/10'],
    [1.2, '6/5'],
    [1.25, '5/4'],
    [1.333, '4/3'],
    [1.4, '7/5'],
    [1.5, '3/2'],
    [1.666, '5/3'],
    [1.75, '7/4'],
    [1.8, '9/5'],
    [2, '2/1'],
    [2.25, '9/4'],
    [2.5, '5/2'],
    [2.75, '11/4'],
    [3, '3/1'],
    [3.5, '7/2'],
    [4, '4/1'],
    [4.5, '9/2'],
    [5, '5/1'],
    [6, '6/1'],
    [7, '7/1'],
    [8, '8/1'],
    [9, '9/1'],
    [10, '10/1'],
  ];

  // Find closest common fraction
  for (const [value, fraction] of commonFractions) {
    if (Math.abs(profit - value) < 0.05) {
      return fraction;
    }
  }

  // Calculate using GCD
  const numerator = Math.round(profit * 100);
  const denominator = 100;
  const divisor = gcd(numerator, denominator);
  
  return `${numerator / divisor}/${denominator / divisor}`;
}

// Format decimal odds (just show 2 decimal places)
function formatDecimal(decimal: number): string {
  return decimal.toFixed(2);
}

export function OddsFormatProvider({ children }: { children: React.ReactNode }) {
  const [format, setFormatState] = useState<OddsFormat>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'american' || stored === 'decimal' || stored === 'fractional') {
        return stored;
      }
    }
    return 'american';
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, format);
  }, [format]);

  const setFormat = useCallback((newFormat: OddsFormat) => {
    setFormatState(newFormat);
  }, []);

  const formatOdds = useCallback((odds: number | undefined): string => {
    if (!odds || odds === 0) return '-';
    
    // For non-american formats, we need to convert to decimal first if it's already American
    const getDecimalValue = (val: number): number => {
      if (val >= 100) {
        // Positive American to decimal
        return 1 + (val / 100);
      } else if (val <= -100) {
        // Negative American to decimal
        return 1 + (100 / Math.abs(val));
      }
      // Already decimal
      return val;
    };
    
    switch (format) {
      case 'american':
        return toAmerican(odds);
      case 'decimal':
        return formatDecimal(getDecimalValue(odds));
      case 'fractional':
        return decimalToFractional(getDecimalValue(odds));
      default:
        return toAmerican(odds);
    }
  }, [format]);

  return (
    <OddsFormatContext.Provider value={{ format, setFormat, formatOdds }}>
      {children}
    </OddsFormatContext.Provider>
  );
}

export function useOddsFormat() {
  const context = useContext(OddsFormatContext);
  if (context === undefined) {
    throw new Error('useOddsFormat must be used within an OddsFormatProvider');
  }
  return context;
}
