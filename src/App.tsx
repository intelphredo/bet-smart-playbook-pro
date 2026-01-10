
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import { Toaster } from "sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AlgorithmsComparison from "./pages/AlgorithmsComparison";
import CreatorDashboard from "./pages/CreatorDashboard";
import ScenarioGuide from "./pages/ScenarioGuide";
import BankrollManager from "./pages/BankrollManager";
import Standings from "./pages/Standings";
import Injuries from "./pages/Injuries";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { OddsFormatProvider } from "@/contexts/OddsFormatContext";

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
    __BetSmart?: {
      logs: string[];
      upcomingMatches: any[];
      liveMatches: any[];
      finishedMatches: any[];
      algorithmPerformance?: any;
      addLog: (message: string) => void;
    };
  }
}

// Initialize the BetSmart global object
if (typeof window !== "undefined") {
  window.__BetSmart = {
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
        <OddsFormatProvider>
          <TooltipProvider>
            <Router>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/standings" element={<Standings />} />
                <Route path="/injuries" element={<Injuries />} />
                <Route path="/algorithms" element={<AlgorithmsComparison />} />
                <Route path="/creator" element={<CreatorDashboard />} />
                <Route path="/scenarios" element={<ScenarioGuide />} />
                <Route path="/bankroll" element={<BankrollManager />} />
              </Routes>
            </Router>
            <Toaster richColors position="top-center" />
          </TooltipProvider>
        </OddsFormatProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
