import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { useStore } from "@/lib/store";
import { Loader2 } from "lucide-react";

const Loading = () => (
  <div className="min-h-screen grid place-items-center" aria-label="Loading account">
    <Loader2 className="size-6 animate-spin text-primary" />
  </div>
);

export const RequireAuth = () => {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <Loading />;
  if (!user) return <Navigate to="/auth" replace state={{ from: location.pathname }} />;
  return <Outlet />;
};

export const RequireBusinessContext = () => {
  const { state, cloudReady } = useStore();
  if (!cloudReady) return <Loading />;
  const business = state.business;
  const complete = state.onboarded && business.idea.trim().length > 15 && business.customer.trim() && business.industry.trim() && business.country.trim() && business.city.trim();
  if (!complete) return <Navigate to="/onboarding" replace />;
  return <Outlet />;
};