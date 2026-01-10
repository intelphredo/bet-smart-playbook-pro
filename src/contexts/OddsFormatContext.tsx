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

// Convert decimal odds to American format
function decimalToAmerican(decimal: number): string {
  if (decimal >= 2) {
    return `+${Math.round((decimal - 1) * 100)}`;
  } else {
    return `${Math.round(-100 / (decimal - 1))}`;
  }
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

  const formatOdds = useCallback((decimalOdds: number | undefined): string => {
    if (!decimalOdds || decimalOdds <= 1) return '-';
    
    switch (format) {
      case 'american':
        return decimalToAmerican(decimalOdds);
      case 'decimal':
        return formatDecimal(decimalOdds);
      case 'fractional':
        return decimalToFractional(decimalOdds);
      default:
        return decimalToAmerican(decimalOdds);
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
