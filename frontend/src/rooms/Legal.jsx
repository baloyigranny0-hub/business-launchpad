import React, { useEffect, useState, useCallback } from "react";
import { Scales, ArrowSquareOut, Info } from "@phosphor-icons/react";
import AgentChat from "@/components/AgentChat";
import RoomHeader, { RoomGrid, ChatCol, SideCol, InfoCard } from "@/components/RoomHeader";
import { api } from "@/lib/api";
import log from "@/lib/log";

export default function Legal({ profile, sessionId }) {
  const [resources, setResources] = useState([]);
  const [leaving, setLeaving] = useState(null); // {name, url, purpose}
  useEffect(() => {
    api.get(`/resources`, { params: { country: profile.country } })
      .then(r => setResources(r.data || []))
      .catch((e) => { log.error("Resources load failed:", e); setResources([]); });
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
              {resources.map((r) => (
                <button key={r.url} type="button"
                   onClick={() => setLeaving(r)}
                   data-testid={`resource-link-${r.name.replace(/\s+/g, '-').toLowerCase()}`}
                   className="w-full text-left flex items-start gap-2 p-2.5 rounded-lg border border-white/5 hover:border-[#D4AF37]/40 hover:bg-white/5 transition group">
                  <ArrowSquareOut size={14} className="text-[#D4AF37] mt-1 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-sm text-white truncate">{r.name}</div>
                    <div className="text-[11px] text-slate-500 truncate">{r.purpose}</div>
                  </div>
                </button>
              ))}
            </div>
          </InfoCard>
          <InfoCard title="Data stays on you" accent="#D4AF37">
            <p>We never touch your IDs or government credentials. We prep what you need, then hand you off to the official portal.</p>
          </InfoCard>
        </SideCol>
      </RoomGrid>

      {/* Leaving Foundry modal — gives the user context before a browser may show its own warning. */}
      {leaving && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm grid place-items-center p-4" onClick={() => setLeaving(null)}>
          <div className="card max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2 mb-3">
              <Info size={20} weight="duotone" className="text-[#D4AF37]" />
              <div className="font-display text-lg">You're leaving Foundry</div>
            </div>
            <div className="text-slate-300 text-sm space-y-2">
              <p>You're about to open <b>{leaving.name}</b> in a new tab.</p>
              <p className="text-slate-400 text-xs">{leaving.purpose}</p>
              <div className="mt-3 p-3 rounded-lg border border-white/10 bg-[#0A0F1A]/60">
                <p className="text-xs text-slate-300">
                  <b>Heads up:</b> Some government portals (like CIPC BizPortal) load their assets in ways that
                  can trigger your browser's privacy warning. This is a known quirk on their side — the site is safe.
                  If you see a warning, click <b>"Continue to site"</b> or <b>"Advanced → Proceed"</b>.
                </p>
              </div>
              <p className="font-mono text-[10px] text-slate-500 break-all mt-2">{leaving.url}</p>
            </div>
            <div className="flex gap-2 mt-5 justify-end">
              <button data-testid="leaving-cancel-btn" onClick={() => setLeaving(null)}
                className="px-4 py-2 rounded-full text-sm text-slate-400 hover:text-white">
                Cancel
              </button>
              <a data-testid="leaving-continue-btn" href={leaving.url} target="_blank" rel="noreferrer noopener"
                 onClick={() => setLeaving(null)}
                 className="px-4 py-2 rounded-full text-sm bg-[#D4AF37] text-[#0A0F1A] font-semibold flex items-center gap-2 hover:brightness-110">
                <ArrowSquareOut size={14} weight="bold" /> Open in new tab
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
