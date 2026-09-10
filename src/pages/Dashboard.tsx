import { useState } from "react";
import { Link } from "react-router-dom";
import { useStore, isStepDone } from "@/lib/store";
import { STAGES, PHASES, stagesOfPhase, getStage } from "@/lib/roadmap";
import { analyzeIdea } from "@/lib/coach";
import { ArrowRight, Sparkles, Target, CheckCircle2, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const Dashboard = () => {
  const { state, setAnalysis } = useStore();
  const [busy, setBusy] = useState(false);
  const b = state.business;
  const a = state.analysis;

  const totals = STAGES.map((s) => {
    const done = s.steps.filter((st) => isStepDone(state, s.id, st.id)).length;
    return { stage: s, done, total: s.steps.length, pct: Math.round((done / s.steps.length) * 100) };
  });
  const overallDone = totals.reduce((x, t) => x + t.done, 0);
  const overallTotal = totals.reduce((x, t) => x + t.total, 0);
  const overallPct = Math.round((overallDone / overallTotal) * 100);

  const activePhase = a?.phase ?? "concept";

  let next: { stageId: string; title: string; stageTitle: string } | null = null;
  for (const s of STAGES) {
    const step = s.steps.find((st) => !isStepDone(state, s.id, st.id));
    if (step) {
      next = { stageId: s.id, title: step.title, stageTitle: s.title };
      break;
    }
  }

  const run = async () => {
    setBusy(true);
    try {
      setAnalysis(await analyzeIdea());
      toast.success("Your plan is up to date");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not reach the coach");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-6xl">
      <div className="flex items-end justify-between flex-wrap gap-4 mb-8">
        <div>
          <div className="text-sm text-primary font-medium">
            {b.name ? b.name : "Welcome back"}
            {b.city ? ` · ${b.city}` : ""}
          </div>
          <h1 className="font-display text-4xl mt-1">Your command center</h1>
        </div>
        <div className="text-right">
          <div className="text-xs uppercase tracking-widest text-muted-foreground">90-day goal</div>
          <div className="font-medium max-w-xs">{b.goal || "—"}</div>
        </div>
      </div>

      {/* Phase tracker */}
      <div className="grid sm:grid-cols-3 gap-3 mb-8">
        {PHASES.map((p, i) => {
          const active = p.id === activePhase;
          const stages = stagesOfPhase(p.id);
          const d = stages.reduce((x, s) => x + s.steps.filter((st) => isStepDone(state, s.id, st.id)).length, 0);
          const t = stages.reduce((x, s) => x + s.steps.length, 0);
          return (
            <div
              key={p.id}
              className={`rounded-2xl border p-5 transition-colors ${
                active ? "border-primary/50 bg-primary/5" : "border-border bg-gradient-card"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-muted-foreground">PHASE 0{i + 1}</span>
                {active && <span className="text-[10px] uppercase tracking-widest text-primary">You are here</span>}
              </div>
              <h3 className="font-display text-xl mt-2">{p.title}</h3>
              <p className="text-xs text-muted-foreground">{p.subtitle}</p>
              <div className="h-1.5 bg-surface rounded-full overflow-hidden mt-4">
                <div className="h-full bg-gradient-primary transition-all" style={{ width: `${Math.round((d / t) * 100)}%` }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl border border-border bg-gradient-card p-8 mb-8 shadow-card">
        <div className="absolute -top-20 -right-20 size-60 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative flex items-start justify-between gap-6 flex-wrap">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 text-xs text-primary mb-3">
              <Sparkles className="size-3.5" /> Next best action
            </div>
            {next ? (
              <>
                <h2 className="font-display text-3xl">{next.title}</h2>
                <p className="text-muted-foreground mt-2">
                  {a?.summary ?? `From ${next.stageTitle}. Knock this out and the next one lines up.`}
                </p>
                <div className="flex gap-3 mt-6 flex-wrap">
                  <Button asChild className="bg-gradient-primary text-primary-foreground hover:opacity-90">
                    <Link to={`/app/module/${next.stageId}`}>
                      Open step <ArrowRight className="ml-1 size-4" />
                    </Link>
                  </Button>
                  <Button variant="outline" onClick={run} disabled={busy}>
                    {busy ? <Loader2 className="size-4 mr-2 animate-spin" /> : <RefreshCw className="size-4 mr-2" />}
                    {a ? "Refresh my plan" : "Build my plan"}
                  </Button>
                </div>
              </>
            ) : (
              <>
                <h2 className="font-display text-3xl">You've completed everything.</h2>
                <p className="text-muted-foreground mt-2">Time to revisit, refine, and grow.</p>
              </>
            )}
          </div>
          <div className="text-right">
            <div className="text-6xl font-display text-gradient">{overallPct}%</div>
            <div className="text-xs text-muted-foreground mt-1">
              {overallDone} of {overallTotal} steps
            </div>
          </div>
        </div>
      </div>

      {/* AI priorities */}
      {a?.priorities?.length ? (
        <div className="mb-10">
          <div className="mb-4 flex items-center gap-2">
            <Sparkles className="size-4 text-primary" />
            <h3 className="font-display text-2xl">Priorities for you right now</h3>
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            {a.priorities.map((p, i) => {
              const stage = getStage(p.stageId);
              return (
                <Link
                  key={i}
                  to={stage ? `/app/module/${stage.id}` : "/app/roadmap"}
                  className="rounded-2xl border border-border bg-gradient-card p-5 hover:border-primary/40 transition-colors"
                >
                  <div className="text-xs text-primary uppercase tracking-widest">{stage?.title ?? "Roadmap"}</div>
                  <div className="font-medium mt-1">{p.title}</div>
                  <p className="text-sm text-muted-foreground mt-1">{p.why}</p>
                </Link>
              );
            })}
          </div>
        </div>
      ) : null}

      {/* Stage cards */}
      <div className="mb-4 flex items-center gap-2">
        <Target className="size-4 text-primary" />
        <h3 className="font-display text-2xl">Your roadmap</h3>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {totals.map(({ stage, done, total, pct }) => (
          <Link
            key={stage.id}
            to={`/app/module/${stage.id}`}
            className="group rounded-2xl bg-gradient-card border border-border p-6 hover:border-primary/40 transition-all shadow-soft"
          >
            <div className="flex items-start justify-between mb-5">
              <div className="size-11 rounded-xl bg-primary/10 grid place-items-center text-primary">
                <stage.icon className="size-5" />
              </div>
              {pct === 100 && <CheckCircle2 className="size-5 text-primary" />}
            </div>
            <h4 className="font-display text-xl">{stage.title}</h4>
            <p className="text-sm text-muted-foreground">{stage.tagline}</p>
            <div className="mt-5">
              <div className="flex justify-between text-xs text-muted-foreground mb-2">
                <span>
                  {done}/{total} steps
                </span>
                <span>{pct}%</span>
              </div>
              <div className="h-1.5 bg-surface rounded-full overflow-hidden">
                <div className="h-full bg-gradient-primary transition-all" style={{ width: `${pct}%` }} />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
