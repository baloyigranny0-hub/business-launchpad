import { useStore } from "@/lib/store";
import { CANVAS_BLOCKS } from "@/lib/roadmap";
import { Textarea } from "@/components/ui/textarea";

const Canvas = () => {
  const { state, setCanvas } = useStore();

  return (
    <div className="p-6 md:p-10 max-w-6xl">
      <h1 className="font-display text-4xl mb-2">Lean Canvas</h1>
      <p className="text-muted-foreground mb-8 max-w-2xl">
        Your whole business on one page. The coach drafts a first version from your idea — edit anything, it saves as you type.
      </p>

      <div className="grid md:grid-cols-3 gap-4">
        {CANVAS_BLOCKS.map((b, i) => (
          <div
            key={b.key}
            className="rounded-2xl border border-border bg-gradient-card p-5 shadow-soft flex flex-col"
          >
            <div className="flex items-baseline gap-2">
              <span className="text-xs font-mono text-primary">0{i + 1}</span>
              <h2 className="font-display text-lg">{b.label}</h2>
            </div>
            <p className="text-xs text-muted-foreground mt-1">{b.hint}</p>
            <Textarea
              value={state.canvas[b.key] || ""}
              onChange={(e) => setCanvas(b.key, e.target.value)}
              rows={5}
              placeholder="…"
              className="mt-3 bg-background/50 text-sm flex-1"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default Canvas;
