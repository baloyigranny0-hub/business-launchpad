import React, { useEffect, useRef, useState } from "react";
import { PaperPlaneRight, FloppyDisk, Sparkle, CircleNotch, Lightning } from "@phosphor-icons/react";
import { api } from "@/lib/api";
import Markdown from "@/components/Markdown";

export default function AgentChat({
  agentKey,
  agentName,
  profile,
  sessionId,
  intro,
  starters = [],
  vaultDefaultTitle = "AI Note",
  accent = "#D4AF37",
}) {
  const [messages, setMessages] = useState(
    intro ? [{ role: "assistant", content: intro }] : []
  );
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (!loading) { setElapsed(0); return; }
    const t = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [loading]);

  const send = async (text) => {
    const content = (text ?? input).trim();
    if (!content || loading) return;
    const next = [...messages, { role: "user", content }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const r = await api.post("/agents/chat", {
        session_id: sessionId,
        agent: agentKey,
        messages: next,
        profile,
      });
      setMessages([...next, { role: "assistant", content: r.data.reply }]);
    } catch (e) {
      const msg = e?.response?.data?.detail || "AI is busy. Try again in a moment.";
      setMessages([...next, { role: "assistant", content: `⚠️ ${msg}` }]);
    } finally {
      setLoading(false);
    }
  };

  const saveLast = async () => {
    const lastAssistant = [...messages].reverse().find(m => m.role === "assistant");
    if (!lastAssistant) return;
    const title = window.prompt("Save as title:", vaultDefaultTitle) || vaultDefaultTitle;
    await api.post("/vault", {
      session_id: sessionId,
      title,
      agent: agentKey,
      content: lastAssistant.content,
    });
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1800);
  };

  return (
    <div className="card p-0 overflow-hidden flex flex-col h-[70vh] min-h-[480px] sm:h-[640px] sm:min-h-[640px]" data-testid={`chat-${agentKey}`}>
      <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-white/5 flex items-center gap-2 sm:gap-3">
        <Sparkle weight="fill" style={{ color: accent }} />
        <div className="min-w-0">
          <div className="font-display text-base sm:text-lg truncate">{agentName}</div>
          <div className="text-[10px] sm:text-[11px] uppercase tracking-[0.18em] sm:tracking-[0.2em] text-slate-500 truncate">live agent · gemma 4 free</div>
        </div>
        <div className="ml-auto flex items-center gap-2 shrink-0">
          <button
            data-testid={`save-vault-${agentKey}`}
            onClick={saveLast}
            className="text-[11px] sm:text-xs text-slate-400 hover:text-[#D4AF37] flex items-center gap-1"
            title="Save last reply to Vault"
          >
            <FloppyDisk size={14} />
            <span className="hidden sm:inline">{savedFlash ? "Saved!" : "Save to Vault"}</span>
            <span className="sm:hidden">{savedFlash ? "✓" : "Save"}</span>
          </button>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 sm:px-5 py-4 sm:py-5 space-y-3 sm:space-y-4">
        {messages.map((m, i) => (
          <Bubble key={i} role={m.role} content={m.content} accent={accent} />
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-slate-500 text-sm">
            <CircleNotch size={16} className="animate-spin" />
            thinking… <span className="font-mono text-[11px]">{elapsed}s</span>
            {elapsed > 8 && <span className="text-[11px] text-slate-600">· trying another free model</span>}
          </div>
        )}
      </div>

      {starters.length > 0 && messages.filter(m => m.role === "user").length === 0 && (
        <div className="px-4 sm:px-5 pb-3 flex flex-wrap gap-1.5 sm:gap-2">
          {starters.map((s, i) => (
            <button
              key={i}
              data-testid={`starter-${agentKey}-${i}`}
              onClick={() => send(s)}
              className="text-[11px] sm:text-xs px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full border border-white/10 hover:border-white/30 hover:bg-white/5 text-slate-300 flex items-center gap-1"
            >
              <Lightning size={11} weight="fill" style={{ color: accent }} /> {s}
            </button>
          ))}
        </div>
      )}

      <form
        onSubmit={(e) => { e.preventDefault(); send(); }}
        className="px-3 sm:px-4 py-3 border-t border-white/5 flex items-end gap-2"
        style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom, 0px))" }}
      >
        <textarea
          data-testid={`chat-input-${agentKey}`}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
          }}
          rows={1}
          placeholder="Type a message…"
          className="flex-1 resize-none bg-transparent outline-none text-white placeholder:text-slate-600 text-sm py-2"
        />
        <button
          data-testid={`chat-send-${agentKey}`}
          type="submit"
          disabled={loading || !input.trim()}
          className="rounded-full p-2.5 disabled:opacity-30"
          style={{ background: accent, color: "#0A0F1A" }}
        >
          <PaperPlaneRight size={16} weight="fill" />
        </button>
      </form>
    </div>
  );
}

function Bubble({ role, content, accent }) {
  if (role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm bg-[#1E293B] border border-white/10">
          {content}
        </div>
      </div>
    );
  }
  return (
    <div className="flex gap-3">
      <div className="w-7 h-7 rounded-full grid place-items-center shrink-0 mt-1" style={{ background: accent + "22", border: `1px solid ${accent}55` }}>
        <Sparkle size={14} weight="fill" style={{ color: accent }} />
      </div>
      <div className="max-w-[88%] text-sm text-slate-200">
        <Markdown>{content}</Markdown>
      </div>
    </div>
  );
}
