import React, { useState } from "react";
import { PaintBrush, Article, Sparkle } from "@phosphor-icons/react";
import AgentChat from "@/components/AgentChat";
import RoomHeader, { RoomGrid, ChatCol, SideCol, InfoCard } from "@/components/RoomHeader";
import { api } from "@/lib/api";
import Markdown from "@/components/Markdown";

export default function Design({ profile, sessionId }) {
  const [tab, setTab] = useState("brand"); // brand | profile
  const [profileDoc, setProfileDoc] = useState("");
  const [generating, setGenerating] = useState(false);

  const generateProfile = async () => {
    setGenerating(true);
    try {
      const r = await api.post("/agents/generate", {
        session_id: sessionId,
        agent: "profile",
        prompt: `Generate a contract-ready company profile for ${profile.business_name} (${profile.industry}, ${profile.country}). Idea: ${profile.idea}. Target: ${profile.target_customer || "general"}.`,
        profile,
      });
      setProfileDoc(r.data.reply);
    } catch (e) {
      setProfileDoc(`⚠️ ${e?.response?.data?.detail || "Could not generate. Try again."}`);
    } finally { setGenerating(false); }
  };

  const saveProfile = async () => {
    if (!profileDoc) return;
    await api.post("/vault", {
      session_id: sessionId, title: `${profile.business_name} — Company Profile`,
      agent: "profile", content: profileDoc,
    });
    alert("Saved to Vault");
  };

  return (
    <>
      <RoomHeader
        kicker="Design Studio"
        title="Build the face"
        sub="Brand identity, voice, and a contract-ready company profile."
        accent="#F472B6" icon={PaintBrush}
      />

      <div className="mb-5 inline-flex p-1 rounded-full border border-white/10 bg-[#131B2B]">
        <Tab v="brand"   t="Brand Agent"    active={tab} setActive={setTab} />
        <Tab v="profile" t="Profile Builder" active={tab} setActive={setTab} />
      </div>

      {tab === "brand" && (
        <RoomGrid>
          <ChatCol>
            <AgentChat
              agentKey="brand" agentName="Brand Agent"
              profile={profile} sessionId={sessionId} accent="#F472B6"
              intro={`I'll craft your **brand identity kit** — names, palette, voice. What vibe do you want?`}
              vaultDefaultTitle="Brand Kit"
              starters={[
                `3 name options + tagline for ${profile.business_name}`,
                `Color palette and font pairing`,
                `One-paragraph brand voice and tone`,
                `Logo concept directions (described in words)`,
              ]}
            />
          </ChatCol>
          <SideCol>
            <InfoCard title="Brand brief" accent="#F472B6">
              <p><b>{profile.business_name}</b> — {profile.industry}</p>
              <p className="text-slate-400">{profile.idea}</p>
            </InfoCard>
            <InfoCard title="Tip" accent="#F472B6">
              <p>Don't ship a logo. Ship a <b>system</b>: name, color, voice, and one promise the customer can repeat.</p>
            </InfoCard>
          </SideCol>
        </RoomGrid>
      )}

      {tab === "profile" && (
        <div className="grid lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3 card p-6">
            <div className="flex items-center gap-3 mb-4">
              <Article size={22} weight="duotone" style={{ color: "#F472B6" }} />
              <div className="font-display text-lg">Company Profile Builder</div>
              <div className="ml-auto flex gap-2">
                <button data-testid="generate-profile-btn" onClick={generateProfile} disabled={generating}
                  className="text-xs px-4 py-2 rounded-full bg-[#F472B6] text-[#0A0F1A] font-semibold disabled:opacity-30 hover:brightness-110">
                  {generating ? "Drafting…" : (<><Sparkle size={12} weight="fill" /> Generate</>)}
                </button>
                {profileDoc && (
                  <button data-testid="save-profile-btn" onClick={saveProfile}
                    className="text-xs px-4 py-2 rounded-full border border-white/15 hover:border-white/30">
                    Save to Vault
                  </button>
                )}
              </div>
            </div>
            <div className="min-h-[480px] rounded-lg p-4 bg-[#0A0F1A]/60 border border-white/5">
              {profileDoc
                ? <Markdown>{profileDoc}</Markdown>
                : <div className="text-slate-500 text-sm">Click <b>Generate</b> to draft a contract-ready profile based on your founder state.</div>}
            </div>
          </div>
          <div className="lg:col-span-2 space-y-5">
            <InfoCard title="What goes inside" accent="#F472B6">
              <ul className="list-disc pl-5 space-y-1">
                <li>About Us</li>
                <li>Value Proposition</li>
                <li>Core Competencies</li>
                <li>Track Record / Vision</li>
                <li>Why Choose Us</li>
                <li>Contact</li>
              </ul>
            </InfoCard>
            <InfoCard title="Use it for" accent="#F472B6">
              <p>Pitching to retailers, supplier vetting (ESD), grant applications, and your "About" page.</p>
            </InfoCard>
          </div>
        </div>
      )}
    </>
  );
}

function Tab({ v, t, active, setActive }) {
  return (
    <button data-testid={`design-tab-${v}`}
      onClick={() => setActive(v)}
      className={`px-4 py-1.5 rounded-full text-sm transition ${active === v ? "bg-[#F472B6] text-[#0A0F1A] font-semibold" : "text-slate-400 hover:text-white"}`}>
      {t}
    </button>
  );
}
