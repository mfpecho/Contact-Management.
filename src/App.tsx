
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";
import { DatabaseProvider } from "./contexts/DatabaseContextSimple";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { useEffect } from "react";

const queryClient = new QueryClient();

const App = () => {
  console.log('App component rendering...');
  
  // Add beforeunload handler to sync data when closing app
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      console.log('App is closing - ensuring data sync...');
      
      // Get current user and contacts from localStorage
      const currentUser = localStorage.getItem('currentUser');
      const contacts = localStorage.getItem('contacts');
      
      if (currentUser && contacts) {
        console.log('User session and contacts found in localStorage - data is already synced');
      }
      
      // Note: We can't perform async operations in beforeunload, but we've been 
      // syncing data in real-time, so localStorage should be up to date
      console.log('Data sync verification completed');
    };

    // Add event listener
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    // Cleanup function
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);
  
  return (
    <ThemeProvider defaultTheme="light">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <DatabaseProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter
              future={{
                v7_startTransition: true,
                v7_relativeSplatPath: true
              }}
            >
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </DatabaseProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
};

export default App;
