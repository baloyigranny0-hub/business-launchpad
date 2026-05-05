import React from "react";
import { Barbell } from "@phosphor-icons/react";
import AgentChat from "@/components/AgentChat";
import RoomHeader, { RoomGrid, ChatCol, SideCol, InfoCard } from "@/components/RoomHeader";

export default function SalesGym({ profile, sessionId }) {
  const intro = `Welcome to the **Sales Gym**. I'll roleplay a *skeptical* prospect for **${profile.business_name}**. Pitch me. Type "**coach me**" anytime to step out and get feedback.`;
  return (
    <>
      <RoomHeader
        kicker="Sales Gym"
        title="Practice before the real call"
        sub="A skeptical AI prospect. Pressure-tests your pitch so you walk into the real meeting calm."
        accent="#FB7185" icon={Barbell}
      />
      <RoomGrid>
        <ChatCol>
          <AgentChat
            agentKey="sales_gym" agentName="Sales Gym Coach"
            profile={profile} sessionId={sessionId} accent="#FB7185" intro={intro}
            vaultDefaultTitle="Sales Practice Notes"
            starters={[
              `Roleplay as a busy buyer at a major retailer`,
              `Roleplay a price-objection prospect`,
              `Roleplay a skeptical first-time customer`,
              `Coach me on my last reply`,
            ]}
          />
        </ChatCol>
        <SideCol>
          <InfoCard title="How to use" accent="#FB7185">
            <p>1. Pick a roleplay starter or describe a real prospect.</p>
            <p>2. Pitch your product. The coach pushes back like a real buyer.</p>
            <p>3. Type <b>coach me</b> to step out and get a 3-bullet review.</p>
          </InfoCard>
          <InfoCard title="Why this matters" accent="#FB7185">
            <p>Most founders lose deals in the first 30 seconds. Reps in the gym = reps in the real world. Build muscle here so you don't bleed money out there.</p>
          </InfoCard>
        </SideCol>
      </RoomGrid>
    </>
  );
}
