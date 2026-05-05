import React from "react";
import { Compass } from "@phosphor-icons/react";
import AgentChat from "@/components/AgentChat";
import RoomHeader, { RoomGrid, ChatCol, SideCol, InfoCard } from "@/components/RoomHeader";

export default function Briefing({ profile, sessionId }) {
  const intro = `Welcome to the **Briefing Room**, ${profile.business_name}. I'm your Research Agent. Tell me what's on your mind, or pick a starter below.`;
  return (
    <>
      <RoomHeader
        kicker="Briefing Room"
        title="Sharpen the idea"
        sub="Strategy, market scan, lean canvas. We pressure-test before building anything."
        accent="#38BDF8" icon={Compass}
      />
      <RoomGrid>
        <ChatCol>
          <AgentChat
            agentKey="research" agentName="Research Agent"
            profile={profile} sessionId={sessionId} intro={intro} accent="#38BDF8"
            vaultDefaultTitle="Lean Canvas"
            starters={[
              `Generate a Lean Canvas for ${profile.business_name}`,
              `Scan competitors in ${profile.industry} (${profile.country})`,
              `Find the biggest market gap I can attack first`,
              `What 3 customer interviews should I run this week?`,
            ]}
          />
        </ChatCol>
        <SideCol>
          <InfoCard title="Founder State" accent="#38BDF8">
            <Row k="Business" v={profile.business_name} />
            <Row k="Industry"  v={profile.industry} />
            <Row k="Country"   v={profile.country} />
            <Row k="Stage"     v={profile.stage} />
            {profile.idea && <Row k="Idea" v={profile.idea} />}
          </InfoCard>
          <InfoCard title="Why this room" accent="#38BDF8">
            <p>Most startups die because nobody wanted what they built. The Briefing Room kills that risk early — we map customers, channels and revenue before you spend a cent on the rest.</p>
          </InfoCard>
        </SideCol>
      </RoomGrid>
    </>
  );
}

const Row = ({ k, v }) => (
  <div className="flex gap-3 py-1">
    <div className="w-20 text-[11px] uppercase tracking-[0.2em] text-slate-500 mt-0.5">{k}</div>
    <div className="flex-1 text-white/90 text-sm">{v || "—"}</div>
  </div>
);
