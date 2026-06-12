import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { AuthGate } from "@/context/AuthContext";
import { ThemeProvider } from "next-themes";
import Dashboard from "./pages/Dashboard";
import Cars from "./pages/Cars";
import Drivers from "./pages/Drivers";
import Types from "./pages/Types";
import Departments from "./pages/Departments";
import Positions from "./pages/Positions";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AuthGate>
        <BrowserRouter basename="/admin">
          <SidebarProvider>
            <div className="min-h-screen flex w-full bg-background">
              <AppSidebar />
              <main className="flex-1 flex flex-col">
                <div className="h-12 flex items-center border-b border-border px-4 bg-card">
                  <SidebarTrigger />
                </div>
                <div className="flex-1 overflow-hidden">
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/cars" element={<Cars />} />
                    <Route path="/drivers" element={<Drivers />} />
                    <Route path="/types" element={<Types />} />
                    <Route path="/departments" element={<Departments />} />
                    <Route path="/positions" element={<Positions />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </div>
              </main>
            </div>
          </SidebarProvider>
        </BrowserRouter>
        </AuthGate>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
