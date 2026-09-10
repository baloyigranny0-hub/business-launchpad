import { Link } from "react-router-dom";
import { PHASES, stagesOfPhase } from "@/lib/roadmap";
import { useStore, isStepDone } from "@/lib/store";
import { Check } from "lucide-react";

const Roadmap = () => {
  const { state } = useStore();
  const activePhase = state.analysis?.phase ?? "concept";

  return (
    <div className="p-6 md:p-10 max-w-3xl">
      <h1 className="font-display text-4xl mb-2">Your roadmap</h1>
      <p className="text-muted-foreground mb-10">
        Three phases, from a raw idea to a trading business. Every step is yours to tick off.
      </p>

      {PHASES.map((phase, pi) => (
        <section key={phase.id} className="mb-12">
          <div className="flex items-baseline gap-3 mb-1">
            <span className="text-xs font-mono text-muted-foreground">PHASE 0{pi + 1}</span>
            <h2 className="font-display text-3xl">{phase.title}</h2>
            {phase.id === activePhase && (
              <span className="text-[10px] uppercase tracking-widest text-primary">You are here</span>
            )}
          </div>
          <p className="text-sm text-muted-foreground mb-6">{phase.subtitle}</p>

          <div className="relative pl-8">
            <div className="absolute left-3 top-2 bottom-2 w-px bg-border" />
            {stagesOfPhase(phase.id).map((stage) => (
              <div key={stage.id} className="relative mb-8">
                <div className="absolute -left-8 top-0 size-7 rounded-full bg-gradient-primary grid place-items-center shadow-glow">
                  <stage.icon className="size-3.5 text-primary-foreground" />
                </div>
                <Link
                  to={`/app/module/${stage.id}`}
                  className="font-display text-2xl hover:text-primary transition-colors"
                >
                  {stage.title}
                </Link>
                <div className="text-xs text-muted-foreground mb-3">{stage.tagline}</div>
                <ul className="space-y-1.5">
                  {stage.steps.map((s) => {
                    const done = isStepDone(state, stage.id, s.id);
                    return (
                      <li key={s.id} className="flex items-center gap-2 text-sm">
                        <span
                          className={`size-4 rounded grid place-items-center ${
                            done ? "bg-primary/20 text-primary" : "bg-surface text-muted-foreground"
                          }`}
                        >
                          {done && <Check className="size-3" />}
                        </span>
                        <span className={done ? "line-through text-muted-foreground" : ""}>{s.title}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
};

export default Roadmap;
