import React, { useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import {
  Compass, Scales, PaintBrush, Megaphone, GearSix, Barbell, Vault,
  Sparkle, SignOut, ArrowsClockwise,
} from "@phosphor-icons/react";
import { ROOMS, SESSION_KEY } from "@/lib/api";

const ICONS = { Compass, Scales, PaintBrush, Megaphone, GearSix, Barbell, Vault };

export default function Shell({ profile, setProfile, sessionId }) {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const reset = () => {
    if (!window.confirm("This clears your local profile and starts onboarding again. Continue?")) return;
    localStorage.removeItem(SESSION_KEY);
    setProfile(null);
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex bg-[#0A0F1A] text-white">
      {/* Sidebar */}
      <aside
        data-testid="sidebar"
        className={`shrink-0 border-r border-white/5 flex flex-col transition-all duration-300 ${collapsed ? "w-[72px]" : "w-[260px]"}`}
      >
        <div className="px-5 py-5 flex items-center gap-2 border-b border-white/5">
          <Sparkle weight="fill" className="text-[#D4AF37]" size={20} />
          {!collapsed && <span className="font-display text-lg tracking-tight">Vula Engine</span>}
          <button
            data-testid="sidebar-toggle"
            onClick={() => setCollapsed(!collapsed)}
            className="ml-auto text-slate-500 hover:text-white"
            aria-label="Toggle sidebar"
          >
            <ArrowsClockwise size={16} />
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {ROOMS.map((r) => {
            const Icon = ICONS[r.icon] || Compass;
            return (
              <NavLink
                key={r.key}
                to={`/${r.key}`}
                data-testid={`nav-${r.key}`}
                className={({ isActive }) =>
                  `group flex items-center gap-3 px-3 py-2.5 rounded-lg transition relative ${
                    isActive ? "bg-white/5 text-white" : "text-slate-400 hover:text-white hover:bg-white/5"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r" style={{ background: r.color }} />
                    )}
                    <Icon size={20} weight={collapsed ? "regular" : "duotone"} style={{ color: r.color }} />
                    {!collapsed && (
                      <div className="leading-tight">
                        <div className="text-sm font-medium">{r.name}</div>
                        <div className="text-[11px] text-slate-500">{r.sub}</div>
                      </div>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        <div className="p-3 border-t border-white/5">
          {!collapsed && (
            <div className="mb-2 text-[11px] uppercase tracking-[0.2em] text-slate-500">Founder</div>
          )}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#38BDF8] grid place-items-center text-[#0A0F1A] font-bold">
              {profile?.business_name?.[0]?.toUpperCase() || "V"}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{profile?.business_name}</div>
                <div className="text-[11px] text-slate-500 truncate">{profile?.industry}</div>
              </div>
            )}
            {!collapsed && (
              <button data-testid="reset-profile-btn" onClick={reset} title="Reset profile" className="text-slate-500 hover:text-[#EF4444]">
                <SignOut size={16} />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-30 backdrop-blur-xl bg-[#0A0F1A]/70 border-b border-white/5">
          <div className="px-6 md:px-10 py-4 flex items-center gap-4">
            <div>
              <div className="text-[11px] uppercase tracking-[0.25em] text-slate-500">Welcome back, founder</div>
              <div className="font-display text-xl">{profile?.business_name}</div>
            </div>
            <div className="ml-auto hidden md:flex items-center gap-3 text-xs text-slate-500">
              <span className="font-mono">{profile?.industry}</span>
              <span>•</span>
              <span className="font-mono">{profile?.country}</span>
              <span>•</span>
              <span className="font-mono">stage: {profile?.stage}</span>
            </div>
          </div>
        </header>

        <div className="flex-1 px-6 md:px-10 py-8 overflow-x-hidden">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
