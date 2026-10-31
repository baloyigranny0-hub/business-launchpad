import React, { useState } from "react";
import { Check, CircleNotch, LockKey, Play, WarningCircle } from "@phosphor-icons/react";

const STATUS_LABELS = {
  open: "Open",
  in_progress: "In progress",
  completed: "Completed",
  blocked: "Blocked",
  deferred: "Deferred",
};

export default function TaskCard({ task, onUpdate, busy }) {
  const [mode, setMode] = useState("");
  const [note, setNote] = useState("");
  const isDone = task.status === "completed";
  const requiresNote = mode === "completed" || mode === "blocked" || mode === "deferred";

  async function submit() {
    if (requiresNote && !note.trim()) return;
    await onUpdate(task.id, mode, mode === "completed" ? { evidence: note } : { reason: note });
    setMode("");
    setNote("");
  }

  return (
    <article className={`border p-4 sm:p-5 transition ${isDone ? "border-emerald-400/30 bg-emerald-400/[0.04]" : "border-white/10 bg-[#111A29] hover:border-white/20"}`}>
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full border ${isDone ? "border-emerald-400/50 text-emerald-300" : "border-[#D4AF37]/50 text-[#D4AF37]"}`}>
          {isDone ? <Check size={16} weight="bold" /> : <span className="text-xs font-mono">{task.priority}</span>}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-white">{task.title}</h3>
            <span className="text-[10px] uppercase tracking-[0.16em] text-slate-500">{STATUS_LABELS[task.status] || task.status}</span>
          </div>
          <p className="mt-1 text-sm leading-relaxed text-slate-400">{task.why_now}</p>
          <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-slate-400">
            <span className="border border-white/10 px-2 py-1">{task.category}</span>
            <span className="border border-white/10 px-2 py-1">{task.estimated_minutes} min</span>
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-2 border-t border-white/5 pt-4 sm:grid-cols-[1fr_auto]">
        <div>
          <div className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Definition of done</div>
          <p className="mt-1 text-sm text-slate-300">{task.definition_of_done || task.expected_output}</p>
        </div>
        {!isDone && (
          <div className="flex flex-wrap items-start gap-2 sm:justify-end">
            {task.status === "open" && <ActionButton label="Start" icon={Play} onClick={() => onUpdate(task.id, "in_progress")} busy={busy} />}
            {(task.status === "open" || task.status === "in_progress") && <ActionButton label="Complete" icon={Check} onClick={() => setMode("completed")} busy={busy} />}
            {(task.status === "open" || task.status === "in_progress") && <ActionButton label="Block" icon={WarningCircle} onClick={() => setMode("blocked")} busy={busy} />}
            {(task.status === "open" || task.status === "in_progress") && <ActionButton label="Defer" icon={LockKey} onClick={() => setMode("deferred")} busy={busy} />}
            {(task.status === "blocked" || task.status === "deferred") && <ActionButton label="Resume" icon={Play} onClick={() => onUpdate(task.id, "in_progress")} busy={busy} />}
          </div>
        )}
      </div>

      {mode && (
        <div className="mt-4 border border-[#D4AF37]/30 bg-[#D4AF37]/[0.06] p-3">
          <label className="block text-xs text-slate-300" htmlFor={`task-note-${task.id}`}>
            {mode === "completed" ? "What proves this is complete?" : "What is stopping or delaying this task?"}
          </label>
          <textarea id={`task-note-${task.id}`} value={note} onChange={(event) => setNote(event.target.value)} rows={2} className="mt-2 w-full resize-y border border-white/10 bg-[#0A0F1A] px-3 py-2 text-sm text-white outline-none focus:border-[#D4AF37]" />
          <div className="mt-2 flex justify-end gap-2">
            <button type="button" onClick={() => { setMode(""); setNote(""); }} className="px-3 py-2 text-xs text-slate-400 hover:text-white">Cancel</button>
            <button type="button" disabled={!note.trim() || busy} onClick={submit} className="flex items-center gap-2 bg-[#D4AF37] px-3 py-2 text-xs font-semibold text-[#0A0F1A] disabled:opacity-50">{busy && <CircleNotch className="animate-spin" />} Save update</button>
          </div>
        </div>
      )}
    </article>
  );
}

function ActionButton({ label, icon: Icon, onClick, busy }) {
  return <button type="button" disabled={busy} onClick={onClick} className="flex items-center gap-1.5 border border-white/10 px-2.5 py-2 text-[11px] text-slate-300 hover:border-[#D4AF37]/60 hover:text-white disabled:opacity-50"><Icon size={13} />{label}</button>;
}
