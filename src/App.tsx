
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import { Toaster } from "sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AlgorithmsComparison from "./pages/AlgorithmsComparison";
import { TooltipProvider } from "@/components/ui/tooltip";
import Auth from "./pages/Auth";
import { AuthProvider, useAuth } from "./hooks/useAuth";

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

// Protected route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { session, loading } = useAuth();
  
  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  
  if (!session) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Router>
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route path="/" element={
                <ProtectedRoute>
                  <Index />
                </ProtectedRoute>
              } />
              <Route path="/algorithms" element={
                <ProtectedRoute>
                  <AlgorithmsComparison />
                </ProtectedRoute>
              } />
            </Routes>
          </Router>
          <Toaster richColors position="top-center" />
        </TooltipProvider>
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;
