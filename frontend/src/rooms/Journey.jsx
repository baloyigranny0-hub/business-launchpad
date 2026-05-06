import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Compass, ArrowsClockwise, Lightning, ArrowRight, FloppyDisk } from "@phosphor-icons/react";
import RoomHeader, { InfoCard } from "@/components/RoomHeader";
import { api } from "@/lib/api";

const ROOM_BY_KEY = {
  briefing: { name: "Briefing Room", color: "#38BDF8" },
  legal: { name: "Legal Desk", color: "#D4AF37" },
  design: { name: "Design Studio", color: "#F472B6" },
  marketing: { name: "Marketing War Room", color: "#34D399" },
  ops: { name: "Operations Floor", color: "#FBBF24" },
  salesgym: { name: "Sales Gym", color: "#FB7185" },
  vault: { name: "Vault", color: "#A78BFA" },
};

const EFFORT_COLOR = { low: "#10B981", med: "#F59E0B", high: "#EF4444" };

export default function Journey({ profile, sessionId }) {
  const [plan, setPlan] = useState(null);
  const [model, setModel] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [savedFlash, setSavedFlash] = useState(false);
  const navigate = useNavigate();

  const generate = useCallback(async () => {
    setLoading(true);
    setErr("");
    try {
      const r = await api.post("/journey", { session_id: sessionId, profile });
      setPlan(r.data.plan);
      setModel(r.data.model || "");
    } catch (e) {
      console.error("Journey generation failed:", e);
      setErr(e?.response?.data?.detail || "AI is busy. Try again in a moment.");
    } finally {
      setLoading(false);
    }
  }, [sessionId, profile]);

  useEffect(() => { generate(); }, [generate]);

  const saveToVault = async () => {
    if (!plan) return;
    const md = planToMarkdown(plan, profile);
    await api.post("/vault", {
      session_id: sessionId,
      title: `${profile.business_name} — Your Journey`,
      agent: "journey",
      content: md,
    });
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 2000);
  };

  const addAsTask = async (item) => {
    await api.post("/tasks", { session_id: sessionId, title: item.title, room: item.room || "ops" });
    alert(`Added "${item.title}" to your Operations task list.`);
  };

  return (
    <>
      <RoomHeader
        kicker="Your Journey"
        title="Today, This Week, This Month, Next Quarter"
        sub={`Personalized for ${profile.business_name}. Built from your stage, knowledge level, and the biggest thing slowing you down.`}
        accent="#D4AF37" icon={Compass}
      />

      <div className="flex items-center gap-2 sm:gap-3 mb-5 flex-wrap">
        <button
          data-testid="journey-regenerate-btn"
          onClick={generate}
          disabled={loading}
          className="text-xs sm:text-sm px-4 py-2 rounded-full border border-white/15 hover:border-white/30 hover:bg-white/5 disabled:opacity-30 flex items-center gap-2"
        >
          <ArrowsClockwise size={14} className={loading ? "animate-spin" : ""} />
          {loading ? "Generating…" : "Regenerate"}
        </button>
        {plan && (
          <button
            data-testid="journey-save-btn"
            onClick={saveToVault}
            className="text-xs sm:text-sm px-4 py-2 rounded-full bg-[#D4AF37] text-[#0A0F1A] font-semibold flex items-center gap-2"
          >
            <FloppyDisk size={14} weight="fill" />
            {savedFlash ? "Saved!" : "Save to Vault"}
          </button>
        )}
        {model && (
          <span className="text-[10px] sm:text-[11px] font-mono text-slate-500 truncate max-w-full">
            powered by {model}
          </span>
        )}
      </div>

      {err && (
        <div className="card p-5 mb-5 border-[#EF4444]/40">
          <div className="text-[#EF4444] text-sm">⚠️ {err}</div>
          <div className="text-slate-400 text-xs mt-2">The free models are throttled right now. Hit Regenerate.</div>
        </div>
      )}

      {!plan && !err && (
        <div className="grid lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card p-5 animate-pulse">
              <div className="h-3 w-20 bg-white/5 rounded mb-4" />
              {[1, 2, 3].map((j) => (
                <div key={j} className="h-3 w-full bg-white/5 rounded mb-2.5" />
              ))}
            </div>
          ))}
        </div>
      )}

      {plan && (
        <>
          {plan.summary && (
            <div className="card p-5 mb-5 border-l-4" style={{ borderLeftColor: "#D4AF37" }}>
              <div className="text-[11px] uppercase tracking-[0.25em] text-[#D4AF37] mb-2">Overview</div>
              <p className="text-slate-200 text-sm sm:text-base leading-relaxed">{plan.summary}</p>
            </div>
          )}
          <div className="grid lg:grid-cols-4 gap-4 sm:gap-5">
            {(plan.buckets || []).map((bucket, bi) => (
              <Bucket key={`${bucket.label}-${bi}`} bucket={bucket} onOpen={navigate} onAdd={addAsTask} />
            ))}
          </div>
          <InfoCard title="Tip" accent="#D4AF37">
            <p className="mt-3 text-sm">
              Pick ONE thing from <b>Today</b> and finish it before lunch. Momentum compounds.
            </p>
          </InfoCard>
        </>
      )}
    </>
  );
}

function Bucket({ bucket, onOpen, onAdd }) {
  return (
    <div className="card p-4 sm:p-5 flex flex-col">
      <div className="text-[10px] sm:text-[11px] uppercase tracking-[0.25em] text-slate-500 mb-3">{bucket.label}</div>
      <div className="space-y-3 flex-1">
        {(bucket.items || []).map((item, i) => {
          const room = ROOM_BY_KEY[item.room] || ROOM_BY_KEY.ops;
          const effort = EFFORT_COLOR[item.effort] || "#94A3B8";
          return (
            <div key={`${item.title}-${i}`} className="border border-white/5 rounded-lg p-3 bg-[#0A0F1A]/40 hover:border-white/15 transition">
              <div className="flex items-start gap-2">
                <Lightning size={14} weight="fill" style={{ color: room.color }} className="mt-0.5 shrink-0" />
                <div className="font-medium text-white text-sm leading-snug flex-1">{item.title}</div>
              </div>
              {item.why && <div className="text-xs text-slate-400 mt-1.5 ml-6">{item.why}</div>}
              <div className="flex items-center gap-2 mt-3 ml-6 flex-wrap">
                <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: room.color + "22", color: room.color }}>
                  {room.name}
                </span>
                {item.effort && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: effort + "22", color: effort }}>
                    {item.effort} effort
                  </span>
                )}
                <button
                  onClick={() => onOpen(`/${item.room}`)}
                  data-testid={`journey-open-${item.room}-${i}`}
                  className="ml-auto text-[10px] text-slate-400 hover:text-white flex items-center gap-1"
                >
                  Open <ArrowRight size={10} />
                </button>
                <button
                  onClick={() => onAdd(item)}
                  data-testid={`journey-task-${i}`}
                  className="text-[10px] text-slate-400 hover:text-[#D4AF37]"
                >
                  + Task
                </button>
              </div>
            </div>
          );
        })}
        {(bucket.items || []).length === 0 && (
          <div className="text-slate-500 text-xs">Nothing here yet.</div>
        )}
      </div>
    </div>
  );
}

function planToMarkdown(plan, profile) {
  const lines = [`# ${profile.business_name} — Your Journey`, ""];
  if (plan.summary) lines.push(plan.summary, "");
  for (const b of plan.buckets || []) {
    lines.push(`## ${b.label}`, "");
    for (const item of b.items || []) {
      lines.push(`- **${item.title}** — ${item.why || ""} _(${item.room}, ${item.effort || "med"} effort)_`);
    }
    lines.push("");
  }
  return lines.join("\n");
}
