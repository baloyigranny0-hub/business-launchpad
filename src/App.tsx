import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { useEffect, lazy, Suspense } from "react";
import { PageSkeleton } from "./components/PageSkeleton";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index";
const NotFound = lazy(() => import("./pages/NotFound"));
const Intake = lazy(() => import("./pages/Intake"));
const Canvas = lazy(() => import("./pages/Canvas"));
const Validation = lazy(() => import("./pages/Validation"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Roadmap = lazy(() => import("./pages/Roadmap"));
const Module = lazy(() => import("./pages/Module"));
const Settings = lazy(() => import("./pages/Settings"));
import Auth from "./pages/Auth";
const Compliance = lazy(() => import("./pages/Compliance"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
import { AppShell } from "./components/AppShell";
import { RequireAuth, RequireBusinessContext } from "./components/RouteGuards";
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
      <Sonner position="top-center" />
      <BrowserRouter>
        <AuthProvider>
          <CloudBinder>
            <Suspense fallback={<PageSkeleton />}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route element={<RequireAuth />}>
                <Route path="/onboarding" element={<Intake />} />
                <Route element={<RequireBusinessContext />}>
                  <Route path="/app" element={<AppShell />}>
                    <Route index element={<Dashboard />} />
                    <Route path="roadmap" element={<Roadmap />} />
                    <Route path="canvas" element={<Canvas />} />
                    <Route path="validation" element={<Validation />} />
                    <Route path="compliance" element={<Compliance />} />
                    <Route path="module/:id" element={<Module />} />
                    <Route path="settings" element={<Settings />} />
                  </Route>
                </Route>
              </Route>
              <Route path="/dashboard" element={<Navigate to="/app" replace />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
            </Suspense>
          </CloudBinder>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
