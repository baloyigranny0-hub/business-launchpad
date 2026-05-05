import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { api, getSessionId, ROOMS } from "@/lib/api";
import Onboarding from "@/components/Onboarding";
import Shell from "@/components/Shell";
import Briefing from "@/rooms/Briefing";
import Legal from "@/rooms/Legal";
import Design from "@/rooms/Design";
import Marketing from "@/rooms/Marketing";
import Ops from "@/rooms/Ops";
import SalesGym from "@/rooms/SalesGym";
import Vault from "@/rooms/Vault";
import "@/App.css";

export default function App() {
  const [profile, setProfile] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const sessionId = getSessionId();

  useEffect(() => {
    api.get(`/profiles/${sessionId}`).then(r => {
      setProfile(r.data || null);
      setLoaded(true);
    }).catch(() => setLoaded(true));
  }, [sessionId]);

  if (!loaded) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#0A0F1A]">
        <div className="font-display text-2xl shimmer-text">Vula Engine</div>
      </div>
    );
  }

  if (!profile) {
    return <Onboarding sessionId={sessionId} onDone={(p) => setProfile(p)} />;
  }

  return (
    <BrowserRouter>
      <Routes>
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
      </Routes>
    </BrowserRouter>
  );
}
