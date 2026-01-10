import { createContext, useContext, ReactNode } from 'react';
import { useBetTracking } from '@/hooks/useBetTracking';

type BetTrackingContextType = ReturnType<typeof useBetTracking>;

const BetSlipContext = createContext<BetTrackingContextType | null>(null);

export function BetSlipProvider({ children }: { children: ReactNode }) {
  const betTracking = useBetTracking();

  return (
    <BetSlipContext.Provider value={betTracking}>
      {children}
    </BetSlipContext.Provider>
  );
}

export function useBetSlip() {
  const context = useContext(BetSlipContext);
  if (!context) {
    throw new Error('useBetSlip must be used within a BetSlipProvider');
  }
  return context;
}
