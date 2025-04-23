
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import { Toaster } from "sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AlgorithmsComparison from "./pages/AlgorithmsComparison";

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
      upcomingMatches: any[];
      liveMatches: any[];
      finishedMatches: any[];
    };
  }
}

if (typeof window !== "undefined") {
  window.__BetSmart = {
    upcomingMatches: [],
    liveMatches: [],
    finishedMatches: [],
  };
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/algorithms" element={<AlgorithmsComparison />} />
        </Routes>
      </Router>
      <Toaster richColors position="top-center" />
    </QueryClientProvider>
  );
}

export default App;
