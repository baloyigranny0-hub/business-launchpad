import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { askCoach } from "@/lib/coach";
import { useStore } from "@/lib/store";

interface Msg {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTIONS = [
  "What must I register first?",
  "What does my municipality require?",
  "How should I price this?",
  "Who are my first 10 customers?",
];

export const CoachDock = () => {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const { state } = useStore();
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, busy]);

  const send = async (text: string) => {
    const q = text.trim();
    if (!q || busy) return;
    const history = msgs.map((m) => ({ role: m.role, content: m.content }));
    setMsgs((m) => [...m, { role: "user", content: q }]);
    setInput("");
    setBusy(true);
    try {
      const { text: answer } = await askCoach(q, history);
      setMsgs((m) => [...m, { role: "assistant", content: answer }]);
    } catch (e) {
      setMsgs((m) => [
        ...m,
        { role: "assistant", content: e instanceof Error ? e.message : "Something went wrong. Try again." },
      ]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-40 h-14 pl-4 pr-5 rounded-full bg-gradient-primary text-primary-foreground shadow-glow flex items-center gap-2 hover:opacity-90 transition-opacity"
        >
          <MessageCircle className="size-5" />
          <span className="font-medium">Ask your coach</span>
        </button>
      )}

      {open && (
        <div className="fixed inset-x-3 bottom-3 sm:inset-x-auto sm:right-6 sm:bottom-6 z-40 w-auto sm:w-[400px] h-[70vh] sm:h-[560px] rounded-2xl glass shadow-card flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <div className="flex items-center gap-2">
              <div className="size-8 rounded-lg bg-gradient-primary grid place-items-center">
                <Sparkles className="size-4 text-primary-foreground" />
              </div>
              <div>
                <div className="font-display text-base leading-none">Foundry Coach</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">
                  Knows {state.business.name || "your business"}
                </div>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
              <X className="size-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {msgs.length === 0 && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Ask anything about registering, complying, branding, pricing or selling.
                </p>
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="block w-full text-left text-sm px-3 py-2 rounded-lg border border-border hover:border-primary/50 hover:text-primary transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
            {msgs.map((m, i) => (
              <div
                key={i}
                className={`rounded-xl px-3 py-2 text-sm whitespace-pre-wrap ${
                  m.role === "user"
                    ? "bg-primary/10 text-foreground ml-8"
                    : "bg-surface-elevated text-foreground mr-4"
                }`}
              >
                {m.content}
              </div>
            ))}
            {busy && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" /> Thinking…
              </div>
            )}
            <div ref={endRef} />
          </div>

          <div className="p-3 border-t border-border flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send(input);
                }
              }}
              rows={1}
              placeholder="Ask your coach…"
              className="resize-none bg-background/50 text-sm min-h-[40px]"
            />
            <Button size="icon" onClick={() => send(input)} disabled={busy || !input.trim()} className="bg-gradient-primary text-primary-foreground shrink-0">
              <Send className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </>
  );
};
