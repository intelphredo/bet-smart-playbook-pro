import { BrowserRouter as Router } from "react-router-dom";
import { Toaster } from "sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
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
// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 60 * 1000, // 1 minute
    },
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
        // Keep only last 100 logs
        if (this.logs.length > 100) {
          this.logs.shift();
        }
      }
    }
  };
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
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
    </QueryClientProvider>
  );
}

export default App;
