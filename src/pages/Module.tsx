import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { STAGES, StageId } from "@/lib/roadmap";
import { useStore, isStepDone } from "@/lib/store";
import { draftDocument } from "@/lib/coach";
import { ArrowLeft, Check, Loader2, Wand2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const Module = () => {
  const { id } = useParams<{ id: StageId }>();
  const stage = STAGES.find((s) => s.id === id);
  const { state, toggleStep, setNote } = useStore();
  const [drafting, setDrafting] = useState<string | null>(null);

  if (!stage)
    return (
      <div className="p-10">
        Module not found.{" "}
        <Link to="/app" className="text-primary">
          Back
        </Link>
      </div>
    );

  const done = stage.steps.filter((st) => isStepDone(state, stage.id, st.id)).length;
  const pct = Math.round((done / stage.steps.length) * 100);

  const draft = async (stepId: string, target: string) => {
    setDrafting(stepId);
    try {
      const { text } = await draftDocument(target);
      const key = `${stage.id}:${stepId}`;
      const existing = state.notes[key];
      setNote(stage.id, stepId, existing ? `${existing}\n\n---\n\n${text}` : text);
      toast.success("Draft ready — edit it to make it yours");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not draft that right now");
    } finally {
      setDrafting(null);
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-4xl">
      <Link to="/app" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="size-4" /> Dashboard
      </Link>

      <div className="flex items-center gap-4 mb-2">
        <div className="size-12 rounded-xl bg-primary/10 grid place-items-center text-primary">
          <stage.icon className="size-6" />
        </div>
        <div>
          <div className="text-xs uppercase tracking-widest text-primary">{stage.tagline}</div>
          <h1 className="font-display text-4xl">{stage.title}</h1>
        </div>
      </div>

      <div className="mt-6 mb-10">
        <div className="flex justify-between text-xs text-muted-foreground mb-2">
          <span>
            {done} of {stage.steps.length} complete
          </span>
          <span>{pct}%</span>
        </div>
        <div className="h-1.5 bg-surface rounded-full overflow-hidden">
          <div className="h-full bg-gradient-primary transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className="space-y-3">
        {stage.steps.map((step, i) => {
          const checked = isStepDone(state, stage.id, step.id);
          const noteKey = `${stage.id}:${step.id}`;
          return (
            <div
              key={step.id}
              className={`rounded-2xl border bg-gradient-card p-5 transition-colors ${
                checked ? "border-primary/40" : "border-border"
              }`}
            >
              <div className="flex items-start gap-4">
                <button
                  onClick={() => toggleStep(stage.id, step.id)}
                  className={`mt-1 size-6 shrink-0 rounded-md border grid place-items-center transition-colors ${
                    checked
                      ? "bg-gradient-primary border-transparent text-primary-foreground"
                      : "border-border hover:border-primary"
                  }`}
                  aria-label="Toggle complete"
                >
                  {checked && <Check className="size-3.5" />}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-3">
                    <span className="text-xs text-muted-foreground font-mono">0{i + 1}</span>
                    <h3 className={`font-medium ${checked ? "text-muted-foreground line-through" : ""}`}>{step.title}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{step.description}</p>
                  <Textarea
                    value={state.notes[noteKey] || ""}
                    onChange={(e) => setNote(stage.id, step.id, e.target.value)}
                    placeholder="Notes, links, or draft content for this step…"
                    rows={2}
                    className="mt-3 bg-background/50 text-sm"
                  />
                  {step.draft && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3"
                      disabled={drafting === step.id}
                      onClick={() => draft(step.id, step.draft!)}
                    >
                      {drafting === step.id ? (
                        <Loader2 className="size-4 mr-2 animate-spin" />
                      ) : (
                        <Wand2 className="size-4 mr-2" />
                      )}
                      Draft this for me
                    </Button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Module;
