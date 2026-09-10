import { useState } from "react";
import { useStore } from "@/lib/store";
import { PWS_CRITERIA, READINESS_BLOCKS } from "@/lib/roadmap";
import { analyzeIdea } from "@/lib/coach";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, RefreshCw } from "lucide-react";

const Validation = () => {
  const { state, setAnalysis } = useStore();
  const [busy, setBusy] = useState(false);
  const a = state.analysis;

  const rerun = async () => {
    setBusy(true);
    try {
      setAnalysis(await analyzeIdea());
      toast.success("Analysis refreshed");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not analyse right now");
    } finally {
      setBusy(false);
    }
  };

  const scoreOf = (key: string) => a?.pws.criteria.find((c) => c.key === key);
  const total = a ? Math.round(a.pws.criteria.reduce((s, c) => s + c.score, 0) / a.pws.criteria.length * 10) : 0;

  return (
    <div className="p-6 md:p-10 max-w-5xl">
      <div className="flex items-start justify-between gap-4 flex-wrap mb-8">
        <div>
          <h1 className="font-display text-4xl mb-2">Is the problem worth solving?</h1>
          <p className="text-muted-foreground max-w-2xl">
            Six criteria decide whether an idea has a real business behind it.
          </p>
        </div>
        <Button variant="outline" onClick={rerun} disabled={busy}>
          {busy ? <Loader2 className="size-4 mr-2 animate-spin" /> : <RefreshCw className="size-4 mr-2" />}
          {a ? "Re-analyse" : "Analyse my idea"}
        </Button>
      </div>

      {a && (
        <div className="rounded-2xl border border-border bg-gradient-card p-6 mb-6 shadow-card flex items-center gap-6 flex-wrap">
          <div className="text-6xl font-display text-gradient">{total}</div>
          <div className="flex-1 min-w-[240px]">
            <div className="text-xs uppercase tracking-widest text-muted-foreground">Verdict</div>
            <p className="mt-1">{a.pws.verdict}</p>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4 mb-12">
        {PWS_CRITERIA.map((c, i) => {
          const s = scoreOf(c.key);
          return (
            <div key={c.key} className="rounded-2xl border border-border bg-gradient-card p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-baseline gap-2">
                  <span className="text-xs font-mono text-primary">0{i + 1}</span>
                  <h2 className="font-display text-xl">{c.label}</h2>
                </div>
                <span className="font-display text-2xl">{s ? `${s.score}/10` : "—"}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{c.hint}</p>
              <div className="h-1.5 bg-surface rounded-full overflow-hidden mt-3">
                <div className="h-full bg-gradient-primary transition-all" style={{ width: `${(s?.score ?? 0) * 10}%` }} />
              </div>
              {s && <p className="text-sm text-muted-foreground mt-3">{s.reason}</p>}
            </div>
          );
        })}
      </div>

      <h2 className="font-display text-2xl mb-4">Readiness</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {READINESS_BLOCKS.map((r) => {
          const v = a ? (a.readiness as Record<string, number>)[r.key] ?? 0 : 0;
          return (
            <div key={r.key} className="rounded-2xl border border-border bg-gradient-card p-5 text-center">
              <div className="text-4xl font-display text-gradient">{v}%</div>
              <div className="text-sm text-muted-foreground mt-2">{r.label}</div>
              <div className="h-1.5 bg-surface rounded-full overflow-hidden mt-3">
                <div className="h-full bg-gradient-primary transition-all" style={{ width: `${v}%` }} />
              </div>
            </div>
          );
        })}
      </div>

      {!a && (
        <p className="text-sm text-muted-foreground mt-8">
          No analysis yet — hit “Analyse my idea” and the coach will score it against all six criteria.
        </p>
      )}
    </div>
  );
};

export default Validation;
