import { Link } from "react-router-dom";
import { useStore, isStepDone } from "@/lib/store";
import { STAGES } from "@/lib/roadmap";
import { ArrowRight, Sparkles, Target, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const Dashboard = () => {
  const { state } = useStore();
  const b = state.business;

  const totals = STAGES.map((s) => {
    const done = s.steps.filter((st) => isStepDone(state, s.id, st.id)).length;
    return { stage: s, done, total: s.steps.length, pct: Math.round((done / s.steps.length) * 100) };
  });
  const overallDone = totals.reduce((a, t) => a + t.done, 0);
  const overallTotal = totals.reduce((a, t) => a + t.total, 0);
  const overallPct = Math.round((overallDone / overallTotal) * 100);

  // Next best action
  let next: { stageId: string; stepId: string; title: string; stageTitle: string } | null = null;
  for (const s of STAGES) {
    const step = s.steps.find((st) => !isStepDone(state, s.id, st.id));
    if (step) { next = { stageId: s.id, stepId: step.id, title: step.title, stageTitle: s.title }; break; }
  }

  return (
    <div className="p-6 md:p-10 max-w-6xl">
      <div className="flex items-end justify-between flex-wrap gap-4 mb-10">
        <div>
          <div className="text-sm text-primary font-medium">Welcome back{b.name ? `, ${b.name.split(" ")[0]}` : ""}</div>
          <h1 className="font-display text-4xl mt-1">Your command center</h1>
        </div>
        <div className="text-right">
          <div className="text-xs uppercase tracking-widest text-muted-foreground">90-day goal</div>
          <div className="font-medium max-w-xs">{b.goal || "—"}</div>
        </div>
      </div>

      {/* Hero next action */}
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
                <p className="text-muted-foreground mt-2">From {next.stageTitle}. Knock this out, then we'll line up the next one.</p>
                <Button asChild className="mt-6 bg-gradient-primary text-primary-foreground hover:opacity-90">
                  <Link to={`/app/module/${next.stageId}`}>Open step <ArrowRight className="ml-1 size-4" /></Link>
                </Button>
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
            <div className="text-xs text-muted-foreground mt-1">{overallDone} of {overallTotal} steps</div>
          </div>
        </div>
      </div>

      {/* Stage cards */}
      <div className="mb-4 flex items-center gap-2">
        <Target className="size-4 text-primary" />
        <h3 className="font-display text-2xl">Your roadmap</h3>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {totals.map(({ stage, done, total, pct }) => (
          <Link key={stage.id} to={`/app/module/${stage.id}`}
            className="group rounded-2xl bg-gradient-card border border-border p-6 hover:border-primary/40 transition-all shadow-soft">
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
                <span>{done}/{total} steps</span>
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
