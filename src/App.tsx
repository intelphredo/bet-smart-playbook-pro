import { BrowserRouter as Router } from "react-router-dom";
import { Toaster } from "sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { OddsFormatProvider } from "@/contexts/OddsFormatContext";
import { BetSlipProvider } from "@/components/BetSlip/BetSlipContext";
import FloatingBetSlip from "@/components/BetSlip/FloatingBetSlip";
import { PreferencesProvider } from "@/hooks/usePreferences";
import SharpMoneyMonitor from "@/components/SharpMoneyMonitor";
import AnimatedRoutes from "@/components/layout/AnimatedRoutes";
import OnboardingModal from "@/components/onboarding/OnboardingModal";
import { CalibrationProvider } from "@/components/ModelCalibration";
import { CookieConsent, ResponsibleGamblingBadge } from "@/components/legal";
import BettingAssistant from "@/components/BettingAssistant";
import ErrorBoundary from "@/components/ErrorBoundary";

// Create a client with optimized defaults
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 2 * 60 * 1000, // 2 minutes — reduces redundant fetches
      gcTime: 30 * 60 * 1000, // 30 minutes — keep cache warm much longer
      retry: 2,
      refetchOnMount: 'always',
    },
  },
});

// Persist query cache to localStorage for instant load on return visits
const persister = createSyncStoragePersister({
  storage: window.localStorage,
  key: 'edgeiq-query-cache',
  // Only persist settled data (not loading/error states)
  throttleTime: 2000,
  serialize: (data) => {
    try {
      // Only keep queries that are successful and not too large
      const filtered = {
        ...data,
        clientState: {
          ...data.clientState,
          queries: data.clientState.queries.filter(q =>
            q.state.status === 'success' &&
            q.queryKey?.[0] !== 'match-weather' // Skip weather (changes fast)
          ).slice(0, 50), // Keep max 50 queries
        },
      };
      return JSON.stringify(filtered);
    } catch {
      return JSON.stringify(data);
    }
  },
});

// Add global variable for debugging
declare global {
  interface Window {
    __EdgeIQ?: {
      logs: string[];
      upcomingMatches: any[];
      liveMatches: any[];
      finishedMatches: any[];
      algorithmPerformance?: any;
      addLog: (message: string) => void;
    };
  }
}

// Initialize the EdgeIQ global object
if (typeof window !== "undefined") {
  window.__EdgeIQ = {
    logs: [],
    upcomingMatches: [],
    liveMatches: [],
    finishedMatches: [],
    algorithmPerformance: null,
    addLog: function(message: string) {
      if (this.logs) {
        this.logs.push(`[${new Date().toISOString()}] ${message}`);
        if (this.logs.length > 100) {
          this.logs.shift();
        }
      }
    }
  };
}

function App() {
  return (
    <ErrorBoundary>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{
          persister,
          maxAge: 24 * 60 * 60 * 1000, // 24 hours
          dehydrateOptions: {
            shouldDehydrateQuery: (query) => {
              // Only persist successful queries with data
              return query.state.status === 'success' && !!query.state.data;
            },
          },
        }}
      >
        <AuthProvider>
          <PreferencesProvider>
            <OddsFormatProvider>
              <BetSlipProvider>
                <TooltipProvider>
                  <CalibrationProvider>
                    <Router>
                      <AnimatedRoutes />
                      <FloatingBetSlip />
                      <SharpMoneyMonitor />
                      <OnboardingModal />
                      <BettingAssistant />
                      <CookieConsent />
                      <ResponsibleGamblingBadge />
                    </Router>
                  </CalibrationProvider>
                  <Toaster richColors position="top-center" />
                </TooltipProvider>
              </BetSlipProvider>
            </OddsFormatProvider>
          </PreferencesProvider>
        </AuthProvider>
      </PersistQueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
