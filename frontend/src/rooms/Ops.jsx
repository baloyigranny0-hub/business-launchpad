import React, { useEffect, useState } from "react";
import { GearSix, Plus, Check, Trash } from "@phosphor-icons/react";
import AgentChat from "@/components/AgentChat";
import RoomHeader, { RoomGrid, ChatCol, SideCol, InfoCard } from "@/components/RoomHeader";
import { api } from "@/lib/api";

export default function Ops({ profile, sessionId }) {
  const [tab, setTab] = useState("systems"); // systems | sop
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState("");

  const load = () => api.get(`/tasks/${sessionId}`).then(r => setTasks(r.data || []));
  useEffect(() => { load(); }, [sessionId]);

  const add = async (e) => {
    e.preventDefault();
    if (!newTask.trim()) return;
    await api.post("/tasks", { session_id: sessionId, title: newTask.trim(), room: "ops" });
    setNewTask(""); load();
  };
  const toggle = async (t) => { await api.patch(`/tasks/${t.id}`, { done: !t.done }); load(); };
  const remove = async (t) => { await api.delete(`/tasks/${t.id}`); load(); };

  return (
    <>
      <RoomHeader
        kicker="Operations Floor"
        title="Run the day, win the week"
        sub="Tools, daily rhythm, SOPs. Turn the hustle into a system."
        accent="#FBBF24" icon={GearSix}
      />

      <div className="mb-5 inline-flex p-1 rounded-full border border-white/10 bg-[#131B2B]">
        <Tab v="systems" t="Systems Agent" active={tab} setActive={setTab} />
        <Tab v="sop"     t="SOP Generator" active={tab} setActive={setTab} />
      </div>

      <RoomGrid>
        <ChatCol>
          {tab === "systems" ? (
            <AgentChat
              agentKey="operations" agentName="Systems Agent"
              profile={profile} sessionId={sessionId} accent="#FBBF24"
              intro={`Tell me your team size and a daily reality. I'll wire up your operating stack.`}
              vaultDefaultTitle="Ops Stack"
              starters={[
                `Recommend a lean tech stack for a solo founder in ${profile.industry}`,
                `What's a good daily operating rhythm?`,
                `What 3 tools should I set up this week?`,
                `When I add my first hire, what changes?`,
              ]}
            />
          ) : (
            <AgentChat
              agentKey="sop" agentName="SOP Agent"
              profile={profile} sessionId={sessionId} accent="#FBBF24"
              intro={`Tell me a task I should systemize. I'll produce a one-page SOP.`}
              vaultDefaultTitle="SOP"
              starters={[
                `SOP for handling a customer inquiry`,
                `SOP for opening / closing the day`,
                `SOP for invoicing and follow-up`,
                `SOP for onboarding a new client`,
              ]}
            />
          )}
        </ChatCol>
        <SideCol>
          <div className="card p-5">
            <div className="text-[11px] uppercase tracking-[0.25em] mb-3 text-[#FBBF24]">Today's tasks</div>
            <form onSubmit={add} className="flex items-center gap-2 mb-3">
              <input data-testid="task-input" value={newTask} onChange={(e) => setNewTask(e.target.value)}
                placeholder="Add a task…" className="flex-1 bg-transparent border-b border-white/10 focus:border-[#FBBF24] outline-none py-1 text-sm" />
              <button data-testid="task-add-btn" type="submit" className="p-1.5 rounded-md bg-[#FBBF24] text-[#0A0F1A]"><Plus size={14} weight="bold" /></button>
            </form>
            <ul className="space-y-1.5 max-h-72 overflow-y-auto">
              {tasks.length === 0 && <li className="text-slate-500 text-xs">No tasks yet.</li>}
              {tasks.map((t) => (
                <li key={t.id} data-testid={`task-${t.id}`} className="flex items-center gap-2 group">
                  <button onClick={() => toggle(t)} data-testid={`task-toggle-${t.id}`}
                    className={`w-4 h-4 rounded border ${t.done ? "bg-[#FBBF24] border-[#FBBF24]" : "border-white/20"} grid place-items-center shrink-0`}>
                    {t.done && <Check size={10} weight="bold" className="text-[#0A0F1A]" />}
                  </button>
                  <span className={`text-sm flex-1 ${t.done ? "line-through text-slate-500" : "text-slate-200"}`}>{t.title}</span>
                  <button data-testid={`task-delete-${t.id}`} onClick={() => remove(t)} className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-[#EF4444]">
                    <Trash size={13} />
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <InfoCard title="Operating principle" accent="#FBBF24">
            <p>One system per pain. Don't build the whole factory on day one. Pick the one task you do daily and write its SOP first.</p>
          </InfoCard>
        </SideCol>
      </RoomGrid>
    </>
  );
}

function Tab({ v, t, active, setActive }) {
  return (
    <button data-testid={`ops-tab-${v}`} onClick={() => setActive(v)}
      className={`px-4 py-1.5 rounded-full text-sm transition ${active === v ? "bg-[#FBBF24] text-[#0A0F1A] font-semibold" : "text-slate-400 hover:text-white"}`}>
      {t}
    </button>
  );
}
