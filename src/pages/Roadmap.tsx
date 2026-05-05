import { Link } from "react-router-dom";
import { STAGES } from "@/lib/roadmap";
import { useStore, isStepDone } from "@/lib/store";
import { Check } from "lucide-react";

const Roadmap = () => {
  const { state } = useStore();
  return (
    <div className="p-6 md:p-10 max-w-3xl">
      <h1 className="font-display text-4xl mb-2">Your roadmap</h1>
      <p className="text-muted-foreground mb-10">A complete view of every stage and step.</p>

      <div className="relative pl-8">
        <div className="absolute left-3 top-2 bottom-2 w-px bg-border" />
        {STAGES.map((stage) => (
          <div key={stage.id} className="relative mb-10">
            <div className="absolute -left-8 top-0 size-7 rounded-full bg-gradient-primary grid place-items-center shadow-glow">
              <stage.icon className="size-3.5 text-primary-foreground" />
            </div>
            <Link to={`/app/module/${stage.id}`} className="font-display text-2xl hover:text-primary transition-colors">{stage.title}</Link>
            <div className="text-xs text-muted-foreground mb-3">{stage.tagline}</div>
            <ul className="space-y-1.5">
              {stage.steps.map((s) => {
                const done = isStepDone(state, stage.id, s.id);
                return (
                  <li key={s.id} className="flex items-center gap-2 text-sm">
                    <span className={`size-4 rounded grid place-items-center ${done ? "bg-primary/20 text-primary" : "bg-surface text-muted-foreground"}`}>
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
    </div>
  );
};

export default Roadmap;
