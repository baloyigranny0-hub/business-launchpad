import React, { useEffect, useState } from "react";
import { Scales, ArrowSquareOut } from "@phosphor-icons/react";
import AgentChat from "@/components/AgentChat";
import RoomHeader, { RoomGrid, ChatCol, SideCol, InfoCard } from "@/components/RoomHeader";
import { api } from "@/lib/api";

export default function Legal({ profile, sessionId }) {
  const [resources, setResources] = useState([]);
  useEffect(() => {
    api.get(`/resources`, { params: { country: profile.country } })
      .then(r => setResources(r.data || []))
      .catch((e) => { console.error("Resources load failed:", e); setResources([]); });
  }, [profile.country]);

  const intro = `Welcome to the **Legal Desk**. I'm the Compliance Scout. Ask me to map the full lifecycle for **${profile.industry}** in **${profile.country}** — from foundation to growth.`;

  return (
    <>
      <RoomHeader
        kicker="Legal Desk"
        title="Map the red tape"
        sub="The whole spectrum: foundation → identity → operations → sector permits → growth."
        accent="#D4AF37" icon={Scales}
      />
      <RoomGrid>
        <ChatCol>
          <AgentChat
            agentKey="compliance" agentName="Compliance Scout"
            profile={profile} sessionId={sessionId} intro={intro} accent="#D4AF37"
            vaultDefaultTitle="Compliance Roadmap"
            starters={[
              `Full compliance roadmap for ${profile.industry} in ${profile.country}`,
              `What documents do I need in the first 30 days?`,
              `Privacy & data law I must handle (POPIA / GDPR / CCPA)`,
              `Sector-specific permits for ${profile.industry}`,
            ]}
          />
        </ChatCol>
        <SideCol>
          <InfoCard title="Official Portals" accent="#D4AF37">
            <div className="space-y-2">
              {resources.length === 0 && <div className="text-slate-500 text-sm">Loading…</div>}
              {resources.map((r, i) => (
                <a key={i} href={r.url} target="_blank" rel="noreferrer"
                   data-testid={`resource-link-${i}`}
                   className="flex items-start gap-2 p-2.5 rounded-lg border border-white/5 hover:border-[#D4AF37]/40 hover:bg-white/5 transition group">
                  <ArrowSquareOut size={14} className="text-[#D4AF37] mt-1 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-sm text-white truncate">{r.name}</div>
                    <div className="text-[11px] text-slate-500 truncate">{r.purpose}</div>
                  </div>
                </a>
              ))}
            </div>
          </InfoCard>
          <InfoCard title="Data stays on you" accent="#D4AF37">
            <p>We never touch your IDs or government credentials. We prep what you need, then hand you off to the official portal.</p>
          </InfoCard>
        </SideCol>
      </RoomGrid>
    </>
  );
}
