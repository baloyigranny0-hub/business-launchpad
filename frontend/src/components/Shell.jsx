import React, { useEffect, useState } from "react";
import { Outlet, NavLink, useLocation, Link } from "react-router-dom";
import {
  Compass, Scales, PaintBrush, Megaphone, GearSix, Barbell, Vault,
  SignOut, ArrowsClockwise, List, X,
} from "@phosphor-icons/react";
import { ROOMS, SESSION_KEY } from "@/lib/api";
import Logo from "@/components/Logo";

const ICONS = { Compass, Scales, PaintBrush, Megaphone, GearSix, Barbell, Vault };

function SidebarContent({ variant, collapsed, setCollapsed, setDrawerOpen, profile, onReset }) {
  const isDesktop = variant === "desktop";
  const compactDesktop = isDesktop && collapsed;
  return (
    <>
      <div className="px-5 py-5 flex items-center gap-2 border-b border-white/5">
        {compactDesktop ? <Logo size={22} withWord={false} /> : <Logo size={22} />}
        {isDesktop && (
          <button
            data-testid="sidebar-toggle"
            onClick={() => setCollapsed(!collapsed)}
            className="ml-auto text-slate-500 hover:text-white"
            aria-label="Toggle sidebar"
          >
            <ArrowsClockwise size={16} />
          </button>
        )}
        {!isDesktop && (
          <button
            data-testid="drawer-close"
            onClick={() => setDrawerOpen(false)}
            className="ml-auto text-slate-400 hover:text-white"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        )}
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {ROOMS.map((r) => {
          const Icon = ICONS[r.icon] || Compass;
          return (
            <NavLink
              key={r.key}
              to={`/${r.key}`}
              data-testid={`nav-${r.key}-${variant}`}
              className={({ isActive }) =>
                `group flex items-center gap-3 px-3 py-2.5 rounded-lg transition relative ${
                  isActive ? "bg-white/5 text-white" : "text-slate-400 hover:text-white hover:bg-white/5"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span
                      className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r"
                      style={{ background: r.color }}
                    />
                  )}
                  <Icon
                    size={20}
                    weight={compactDesktop ? "regular" : "duotone"}
                    style={{ color: r.color }}
                  />
                  {!compactDesktop && (
                    <div className="leading-tight min-w-0">
                      <div className="text-sm font-medium truncate">{r.name}</div>
                      <div className="text-[11px] text-slate-500 truncate">{r.sub}</div>
                    </div>
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div
        className="p-3 border-t border-white/5"
        style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom, 0px))" }}
      >
        {!compactDesktop && (
          <div className="mb-2 text-[11px] uppercase tracking-[0.2em] text-slate-500">Founder</div>
        )}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#38BDF8] grid place-items-center text-[#0A0F1A] font-bold shrink-0">
            {profile?.business_name?.[0]?.toUpperCase() || "F"}
          </div>
          {!compactDesktop && (
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{profile?.business_name}</div>
              <div className="text-[11px] text-slate-500 truncate">{profile?.industry}</div>
            </div>
          )}
          {!compactDesktop && (
            <button
              data-testid={`reset-profile-${variant}-btn`}
              onClick={onReset}
              title="Reset profile"
              className="text-slate-500 hover:text-[#EF4444]"
            >
              <SignOut size={16} />
            </button>
          )}
        </div>
      </div>
    </>
  );
}

export default function Shell({ profile, setProfile, sessionId }) {
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const location = useLocation();

  useEffect(() => { setDrawerOpen(false); }, [location.pathname]);
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [drawerOpen]);

  const reset = () => {
    if (!window.confirm("This clears your local profile and starts onboarding again. Continue?")) return;
    localStorage.removeItem(SESSION_KEY);
    setProfile(null);
    window.location.reload();
  };

  const sidebarProps = { collapsed, setCollapsed, setDrawerOpen, profile, onReset: reset };

  return (
    <div className="min-h-screen lg:flex bg-[#0A0F1A] text-white">
      {/* Desktop sidebar */}
      <aside
        data-testid="sidebar"
        className={`hidden lg:flex shrink-0 border-r border-white/5 flex-col transition-all duration-300 ${collapsed ? "w-[72px]" : "w-[260px]"}`}
      >
        <SidebarContent variant="desktop" {...sidebarProps} />
      </aside>

      {/* Mobile scrim + drawer */}
      {drawerOpen && (
        <div
          data-testid="drawer-scrim"
          className="lg:hidden fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
          onClick={() => setDrawerOpen(false)}
        />
      )}
      <aside
        data-testid="mobile-drawer"
        className={`lg:hidden fixed top-0 left-0 bottom-0 w-[80%] max-w-[300px] z-50 bg-[#0A0F1A] border-r border-white/10 flex flex-col transition-transform duration-300 ${drawerOpen ? "translate-x-0" : "-translate-x-full"}`}
        style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
      >
        <SidebarContent variant="mobile" {...sidebarProps} />
      </aside>

      {/* Main */}
      <main className="flex-1 min-w-0 flex flex-col">
        <header
          className="sticky top-0 z-30 backdrop-blur-xl bg-[#0A0F1A]/80 border-b border-white/5"
          style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
        >
          <div className="px-4 sm:px-6 lg:px-10 py-3 sm:py-4 flex items-center gap-3">
            <button
              data-testid="hamburger"
              onClick={() => setDrawerOpen(true)}
              className="lg:hidden p-2 -ml-2 rounded-lg text-slate-300 hover:bg-white/5"
              aria-label="Open menu"
            >
              <List size={22} weight="bold" />
            </button>
            <Link to="/briefing" className="lg:hidden">
              <Logo size={20} withWord={false} />
            </Link>
            <div className="min-w-0">
              <div className="text-[10px] sm:text-[11px] uppercase tracking-[0.2em] sm:tracking-[0.25em] text-slate-500">
                Welcome back, founder
              </div>
              <div className="font-display text-base sm:text-xl truncate max-w-[55vw] sm:max-w-none">
                {profile?.business_name}
              </div>
            </div>
            <div className="ml-auto hidden md:flex items-center gap-3 text-xs text-slate-500">
              <span className="font-mono truncate max-w-[160px]">{profile?.industry}</span>
              <span>•</span>
              <span className="font-mono">{profile?.country}</span>
              <span>•</span>
              <span className="font-mono">stage: {profile?.stage}</span>
            </div>
          </div>
        </header>

        <div className="flex-1 px-4 sm:px-6 lg:px-10 py-6 sm:py-8 overflow-x-hidden">
          <Outlet />
          <div className="mt-10 sm:mt-12 pt-5 sm:pt-6 border-t border-white/5 flex flex-wrap items-center gap-3 sm:gap-4 text-[11px] sm:text-xs text-slate-600">
            <span>© {new Date().getFullYear()} Foundry</span>
            <Link to="/privacy" data-testid="footer-privacy-link" className="hover:text-white">Privacy</Link>
            <Link to="/terms" data-testid="footer-terms-link" className="hover:text-white">Terms</Link>
            <span className="w-full sm:w-auto sm:ml-auto sm:text-right">
              AI may make mistakes. Verify with a licensed professional.
            </span>
          </div>
          <div style={{ height: "env(safe-area-inset-bottom, 0px)" }} />
        </div>
      </main>
    </div>
  );
}
