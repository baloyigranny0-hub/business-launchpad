import React from "react";
import { Megaphone } from "@phosphor-icons/react";
import AgentChat from "@/components/AgentChat";
import RoomHeader, { RoomGrid, ChatCol, SideCol, InfoCard } from "@/components/RoomHeader";

export default function Marketing({ profile, sessionId }) {
  return (
    <>
      <RoomHeader
        kicker="Marketing War Room"
        title="If A doesn't work, B will"
        sub="Two strategies, one playbook. We pick a winner with the data, not the vibes."
        accent="#34D399" icon={Megaphone}
      />
      <RoomGrid>
        <ChatCol>
          <AgentChat
            agentKey="marketing" agentName="Marketing Strategist"
            profile={profile} sessionId={sessionId} accent="#34D399"
            intro={`I'll give you Strategy **A** (low-cost / organic) and Strategy **B** (paid / B2B). Tell me what success looks like in 90 days.`}
            vaultDefaultTitle="Marketing Plan"
            starters={[
              `30-day organic launch plan for ${profile.business_name}`,
              `B2B outreach: who to target and a sample message`,
              `Content calendar for the first 4 weeks`,
              `If Strategy A fails, what's the pivot?`,
            ]}
          />
        </ChatCol>
        <SideCol>
          <InfoCard title="Test, then scale" accent="#34D399">
            <p>Pick one channel for 30 days. Track 1 metric. If Strategy A doesn't move the needle, switch to Strategy B with what you learned.</p>
          </InfoCard>
          <InfoCard title="Your audience" accent="#34D399">
            <p>{profile.target_customer || "We'll use what we know about your industry to suggest a target. Add a target in your profile to sharpen this."}</p>
          </InfoCard>
        </SideCol>
      </RoomGrid>
    </>
  );
}
