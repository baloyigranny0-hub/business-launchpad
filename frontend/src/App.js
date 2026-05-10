import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { api, getSessionId, SESSION_KEY } from "@/lib/api";
import log from "@/lib/log";
import Onboarding from "@/components/Onboarding";
import Shell from "@/components/Shell";
import Journey from "@/rooms/Journey";
import Briefing from "@/rooms/Briefing";
import Legal from "@/rooms/Legal";
import Design from "@/rooms/Design";
import Marketing from "@/rooms/Marketing";
import Ops from "@/rooms/Ops";
import SalesGym from "@/rooms/SalesGym";
import Vault from "@/rooms/Vault";
import Settings from "@/pages/Settings";
import { Privacy, Terms } from "@/pages/Legal";
import "@/App.css";

function PathIs(path) {
  return typeof window !== "undefined" && window.location.pathname.startsWith(path);
}

// If URL has ?session=UUID, adopt it BEFORE we ask the API for the profile.
function adoptSessionFromUrl() {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  const s = url.searchParams.get("session");
  if (s && /^[0-9a-f-]{8,}$/i.test(s)) {
    localStorage.setItem(SESSION_KEY, s);
    url.searchParams.delete("session");
    window.history.replaceState({}, "", url.pathname + (url.search ? url.search : "") + url.hash);
  }
}

export default function App() {
  const [profile, setProfile] = useState(null);
  const [loaded, setLoaded] = useState(false);
  adoptSessionFromUrl();
  const sessionId = getSessionId();

  useEffect(() => {
    const ac = new AbortController();
    api.get(`/profiles/${sessionId}`, { signal: ac.signal })
      .then((r) => { setProfile(r.data || null); setLoaded(true); })
      .catch((err) => {
        if (err?.name !== "CanceledError") log.error("Profile load failed:", err);
        setLoaded(true);
      });
    return () => ac.abort();
  }, [sessionId]);

  const onLegal = PathIs("/privacy") || PathIs("/terms");

  if (!loaded && !onLegal) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#0A0F1A]">
        <div className="font-display text-2xl shimmer-text">Foundry</div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        {!profile ? (
          <Route path="*" element={<Onboarding sessionId={sessionId} onDone={(p) => setProfile(p)} />} />
        ) : (
          <Route element={<Shell profile={profile} setProfile={setProfile} sessionId={sessionId} />}>
            <Route path="/" element={<Navigate to="/journey" replace />} />
            <Route path="/journey"   element={<Journey   profile={profile} sessionId={sessionId} />} />
            <Route path="/briefing"  element={<Briefing  profile={profile} sessionId={sessionId} />} />
            <Route path="/legal"     element={<Legal     profile={profile} sessionId={sessionId} />} />
            <Route path="/design"    element={<Design    profile={profile} sessionId={sessionId} />} />
            <Route path="/marketing" element={<Marketing profile={profile} sessionId={sessionId} />} />
            <Route path="/ops"       element={<Ops       profile={profile} sessionId={sessionId} />} />
            <Route path="/salesgym"  element={<SalesGym  profile={profile} sessionId={sessionId} />} />
            <Route path="/vault"     element={<Vault     profile={profile} sessionId={sessionId} />} />
            <Route path="/settings"  element={<Settings  profile={profile} sessionId={sessionId} setProfile={setProfile} />} />
            <Route path="*" element={<Navigate to="/journey" replace />} />
          </Route>
        )}
      </Routes>
    </BrowserRouter>
  );
}
