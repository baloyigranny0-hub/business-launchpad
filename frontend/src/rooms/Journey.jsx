import React, { useCallback, useEffect, useState } from "react";
import { ArrowClockwise, Compass, WarningCircle } from "@phosphor-icons/react";
import RoomHeader from "@/components/RoomHeader";
import TaskCard from "@/components/operator/TaskCard";
import OperatorCoachPanel from "@/components/operator/OperatorCoachPanel";
import ProgressSignals from "@/components/operator/ProgressSignals";
import TemplateDrawer from "@/components/operator/TemplateDrawer";
import { api } from "@/lib/api";
import { createDailyPlan, draftOperatorTemplate, getOperatorContext, saveOperatorTemplate, updateOperatorTask } from "@/lib/operatorApi";
import log from "@/lib/log";

export default function Journey({ profile, sessionId }) {
  const [context, setContext] = useState(null);
  const [plan, setPlan] = useState(null);
  const [legacyPlan, setLegacyPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionBusy, setActionBusy] = useState("");
  const [error, setError] = useState("");
  const [fallback, setFallback] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getOperatorContext(sessionId);
      setContext(data);
      if (data.today_tasks?.length) {
        setPlan({ message: "Your plan for today is already in progress.", bottleneck: data.context?.current_blocker, today_tasks: data.today_tasks, model: "existing_plan", status: "ready" });
      } else {
        setPlan(await createDailyPlan(sessionId, "Help me choose today's highest-leverage action."));
      }
      setFallback(false);
    } catch (err) {
      log.error("Foundry Operator load failed:", err);
      try {
        const response = await api.post("/journey", { session_id: sessionId, profile });
        setLegacyPlan(response.data.plan);
        setFallback(true);
        setError("The daily operator is unavailable, so the roadmap view is being shown.");
      } catch (legacyError) {
        log.error("Journey fallback failed:", legacyError);
        setError(err?.response?.data?.detail || "Foundry could not load your operating plan.");
      }
    } finally {
      setLoading(false);
    }
  }, [profile, sessionId]);

  useEffect(() => { load(); }, [load]);

  async function updateTask(taskId, status, details) {
    setActionBusy(taskId);
    setError("");
    try {
      const updated = await updateOperatorTask(sessionId, taskId, status, details);
      setPlan((current) => current ? { ...current, today_tasks: current.today_tasks.map((task) => task.id === updated.id ? updated : task) } : current);
      setContext((current) => current ? { ...current, today_tasks: current.today_tasks.map((task) => task.id === updated.id ? updated : task) } : current);
    } catch (err) {
      setError(err?.response?.data?.detail || "That task update was not saved.");
    } finally {
      setActionBusy("");
    }
  }

  async function askOperator(message) {
    setLoading(true);
    setError("");
    try { setPlan(await createDailyPlan(sessionId, message)); } catch (err) { setError(err?.response?.data?.detail || "The operator could not make a plan right now."); } finally { setLoading(false); }
  }

  async function saveTemplate(draft) {
    await saveOperatorTemplate(sessionId, draft);
    setContext(await getOperatorContext(sessionId));
  }

  if (loading && !plan && !legacyPlan) return <LoadingState />;
  if (fallback) return <LegacyRoadmap profile={profile} plan={legacyPlan} error={error} onRetry={load} />;
  const tasks = plan?.today_tasks || context?.today_tasks || [];

  return <>
    <RoomHeader kicker="Foundry Operator" title="Today is for execution" sub={`A focused operating plan for ${profile.business_name}. One clear next action, then evidence.`} accent="#D4AF37" icon={Compass} />
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><div className="text-xs text-slate-500">South African day boundary: {new Date().toLocaleDateString("en-ZA", { timeZone: "Africa/Johannesburg", dateStyle: "long" })}</div><div className="flex items-center gap-2"><TemplateDrawer trade={profile.industry} templates={context?.templates || []} onDraft={(type, trade, prompt) => draftOperatorTemplate(sessionId, type, trade, prompt)} onSave={saveTemplate} busy={loading} /><button type="button" onClick={load} disabled={loading} aria-label="Refresh daily plan" className="grid h-9 w-9 place-items-center border border-white/10 text-slate-400 hover:border-white/30 hover:text-white disabled:opacity-40"><ArrowClockwise size={15} className={loading ? "animate-spin" : ""} /></button></div></div>
    {error && <div className="mb-5 flex items-start gap-2 border border-[#EF4444]/30 bg-[#EF4444]/[0.06] p-4 text-sm text-[#FCA5A5]"><WarningCircle size={17} className="mt-0.5 shrink-0" />{error}</div>}
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(300px,0.8fr)]">
      <section className="min-w-0"><div className="mb-3 flex items-end justify-between gap-3"><div><div className="text-[10px] uppercase tracking-[0.24em] text-[#D4AF37]">Today's focus</div><h2 className="mt-1 text-xl font-semibold text-white">{tasks.length ? `${tasks.length} task${tasks.length === 1 ? "" : "s"} that move the business` : "Start with one real action"}</h2></div><div className="text-right text-xs text-slate-500">{tasks.filter((task) => task.status === "completed").length}/{tasks.length} complete</div></div><div className="space-y-3">{tasks.map((task) => <TaskCard key={task.id} task={task} onUpdate={updateTask} busy={actionBusy === task.id} />)}</div>{!tasks.length && <div className="border border-dashed border-white/15 p-8 text-center text-sm text-slate-400">Ask the operator to turn your current blocker into a small plan.</div>}</section>
      <div className="space-y-5"><OperatorCoachPanel bottleneck={plan?.bottleneck || context?.context?.current_blocker} message={plan?.message} model={plan?.model} onPlan={askOperator} loading={loading} /><section className="border border-white/10 bg-[#111A29] p-5"><div className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Active sprint</div><h2 className="mt-2 text-base font-semibold text-white">{context?.sprint?.title || "Build your operating base"}</h2><p className="mt-2 text-sm leading-relaxed text-slate-400">{context?.sprint?.objective || "Foundry will keep the next action grounded in your current stage and bottleneck."}</p><div className="mt-4 text-xs text-[#D4AF37]">Next: {plan?.next_action || context?.next_action || "Choose today's first task."}</div></section></div>
    </div>
    <div className="mt-5"><ProgressSignals progress={context?.progress} /></div>
  </>;
}

function LoadingState() { return <div className="space-y-5"><div className="h-24 animate-pulse border border-white/5 bg-white/[0.03]" /><div className="grid gap-3 lg:grid-cols-[1.4fr_0.8fr]"><div className="h-72 animate-pulse border border-white/5 bg-white/[0.03]" /><div className="h-72 animate-pulse border border-white/5 bg-white/[0.03]" /></div></div>; }

function LegacyRoadmap({ profile, plan, error, onRetry }) { return <><RoomHeader kicker="Your Journey" title="Your founder roadmap" sub={`A temporary roadmap view for ${profile.business_name} while the operator service reconnects.`} accent="#D4AF37" icon={Compass} /><div className="mb-5 flex items-center justify-between gap-3 border border-[#F59E0B]/30 bg-[#F59E0B]/[0.06] p-4 text-sm text-[#FCD34D]"><span>{error}</span><button type="button" onClick={onRetry} className="flex items-center gap-2 border border-[#FCD34D]/40 px-3 py-2 text-xs"><ArrowClockwise size={14} /> Retry operator</button></div><div className="grid gap-4 lg:grid-cols-4">{(plan?.buckets || []).map((bucket) => <section key={bucket.label} className="border border-white/10 bg-[#111A29] p-4"><div className="text-[10px] uppercase tracking-[0.2em] text-slate-500">{bucket.label}</div><div className="mt-4 space-y-3">{(bucket.items || []).map((item) => <div key={item.title} className="border border-white/5 p-3"><div className="text-sm font-medium text-white">{item.title}</div><div className="mt-1 text-xs leading-relaxed text-slate-400">{item.why}</div></div>)}</div></section>)}</div></>; }
