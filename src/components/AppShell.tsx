import { NavLink, Outlet, Link, useNavigate } from "react-router-dom";
import { LayoutDashboard, Map, FileText, Cog, TrendingUp, Settings, Compass, LogIn, LogOut } from "lucide-react";
import { APP_NAME } from "@/lib/roadmap";
import { useStore } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";

const nav = [
  { to: "/app", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/app/roadmap", label: "Roadmap", icon: Map },
  { to: "/app/module/documents", label: "Documents", icon: FileText },
  { to: "/app/module/operations", label: "Operations", icon: Cog },
  { to: "/app/module/growth", label: "Growth", icon: TrendingUp },
  { to: "/app/settings", label: "Settings", icon: Settings },
];

export const AppShell = () => {
  const { state } = useStore();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex">
      <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-border bg-surface/60 backdrop-blur-xl">
        <Link to="/app" className="px-6 py-6 flex items-center gap-2">
          <div className="size-9 rounded-xl bg-gradient-primary grid place-items-center shadow-glow">
            <Compass className="size-5 text-primary-foreground" />
          </div>
          <div>
            <div className="font-display text-xl leading-none">{APP_NAME}</div>
            <div className="text-xs text-muted-foreground mt-1">Founder OS</div>
          </div>
        </Link>
        <nav className="px-3 flex flex-col gap-1">
          {nav.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-surface-elevated"
                }`
              }
            >
              <n.icon className="size-4" />
              {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto p-4 space-y-3">
          <div className="rounded-xl bg-gradient-card border border-border p-4">
            <div className="text-xs text-muted-foreground">Business</div>
            <div className="font-medium truncate">{state.business.name || "Untitled"}</div>
            {user && <div className="text-xs text-muted-foreground mt-2 truncate">{user.email}</div>}
          </div>
          {user ? (
            <Button variant="outline" size="sm" className="w-full" onClick={async () => { await signOut(); navigate("/"); }}>
              <LogOut className="size-4 mr-2" /> Sign out
            </Button>
          ) : (
            <Button variant="outline" size="sm" className="w-full" onClick={() => navigate("/auth")}>
              <LogIn className="size-4 mr-2" /> Sign in to sync
            </Button>
          )}
        </div>
      </aside>
      <main className="flex-1 min-w-0">
        <Outlet />
      </main>
    </div>
  );
};
