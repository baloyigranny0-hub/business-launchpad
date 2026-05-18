import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { useEffect } from "react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import Roadmap from "./pages/Roadmap";
import Module from "./pages/Module";
import Settings from "./pages/Settings";
import Auth from "./pages/Auth";
import { AppShell } from "./components/AppShell";
import { AuthProvider, useAuth } from "./lib/auth";
import { bindCloud } from "./lib/store";

const queryClient = new QueryClient();

const CloudBinder = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  useEffect(() => {
    if (loading) return;
    bindCloud(user?.id ?? null);
  }, [user, loading]);
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <CloudBinder>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/onboarding" element={<Onboarding />} />
              <Route path="/app" element={<AppShell />}>
                <Route index element={<Dashboard />} />
                <Route path="roadmap" element={<Roadmap />} />
                <Route path="module/:id" element={<Module />} />
                <Route path="settings" element={<Settings />} />
              </Route>
              <Route path="/dashboard" element={<Navigate to="/app" replace />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </CloudBinder>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
