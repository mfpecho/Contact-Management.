
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
      console.log('🔄 Page unloading - syncing data to localStorage...');
      
      // Sync current data to localStorage for backup
      const currentUser = sessionStorage.getItem('currentUser');
      const contacts = sessionStorage.getItem('contacts');
      
      if (currentUser && contacts) {
        console.log('💾 Backing up session data before page unload');
        localStorage.setItem('lastSessionData', JSON.stringify({
          timestamp: new Date().toISOString(),
          contactCount: JSON.parse(contacts).length,
          userEmail: JSON.parse(currentUser).email
        }));
      }
    };

    const handleUnload = () => {
      console.log('🚪 Browser/tab closing - session will expire');
      // Session data in sessionStorage will automatically be cleared
      // when the browser/tab is closed
    };

    // Listen for browser/tab close events
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('unload', handleUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('unload', handleUnload);
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
