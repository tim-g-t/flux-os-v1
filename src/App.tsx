import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import { patientApiService } from "@/services/patientApiService";
import Index from "./pages/Index";
import PatientDetail from "./pages/PatientDetail";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  // Initialize patient data service and polling ONCE on app mount
  useEffect(() => {
    const initializeService = async () => {
      console.log('🚀 App initializing patient data service...');

      // Fetch initial data
      await patientApiService.fetchPatients();

      // Start polling for real-time updates
      // This is the ONLY place where polling should start
      patientApiService.startSnapshotPolling();
    };

    initializeService();

    // Cleanup on app unmount
    return () => {
      console.log('🛑 App unmounting, stopping polling...');
      patientApiService.stopSnapshotPolling();
    };
  }, []); // Empty dependency array - runs once on mount

  return (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/patient/:patientId" element={<PatientDetail />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  );
};

export default App;
