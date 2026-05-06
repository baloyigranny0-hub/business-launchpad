import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { api, getSessionId } from "@/lib/api";
import Onboarding from "@/components/Onboarding";
import Shell from "@/components/Shell";
import Briefing from "@/rooms/Briefing";
import Legal from "@/rooms/Legal";
import Design from "@/rooms/Design";
import Marketing from "@/rooms/Marketing";
import Ops from "@/rooms/Ops";
import SalesGym from "@/rooms/SalesGym";
import Vault from "@/rooms/Vault";
import { Privacy, Terms } from "@/pages/Legal";
import "@/App.css";

function PathIs(path) {
  return typeof window !== "undefined" && window.location.pathname.startsWith(path);
}

export default function App() {
  const [profile, setProfile] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const sessionId = getSessionId();

  useEffect(() => {
    const ac = new AbortController();
    api.get(`/profiles/${sessionId}`, { signal: ac.signal })
      .then((r) => { setProfile(r.data || null); setLoaded(true); })
      .catch((err) => {
        if (err?.name !== "CanceledError") console.error("Profile load failed:", err);
        setLoaded(true);
      });
    return () => ac.abort();
  }, [sessionId]);

  // Always allow legal pages without onboarding
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
            <Route path="/" element={<Navigate to="/briefing" replace />} />
            <Route path="/briefing"  element={<Briefing  profile={profile} sessionId={sessionId} />} />
            <Route path="/legal"     element={<Legal     profile={profile} sessionId={sessionId} />} />
            <Route path="/design"    element={<Design    profile={profile} sessionId={sessionId} />} />
            <Route path="/marketing" element={<Marketing profile={profile} sessionId={sessionId} />} />
            <Route path="/ops"       element={<Ops       profile={profile} sessionId={sessionId} />} />
            <Route path="/salesgym"  element={<SalesGym  profile={profile} sessionId={sessionId} />} />
            <Route path="/vault"     element={<Vault     profile={profile} sessionId={sessionId} />} />
            <Route path="*" element={<Navigate to="/briefing" replace />} />
          </Route>
        )}
      </Routes>
    </BrowserRouter>
  );
}
