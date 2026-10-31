import React, { useState } from "react";
import { FilePlus, FloppyDisk, X } from "@phosphor-icons/react";

const TYPES = ["job_card", "pricing_sheet", "inspection_checklist", "invoice", "customer_script", "supplier_checklist", "cash_tracker"];

export default function TemplateDrawer({ sessionId, trade, onDraft, onSave, templates = [], busy }) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState("job_card");
  const [prompt, setPrompt] = useState("Create a simple template I can use this week.");
  const [draft, setDraft] = useState(null);
  const [approved, setApproved] = useState(false);
  async function draftTemplate() { setDraft(await onDraft(type, trade, prompt)); setApproved(false); }
  async function saveTemplate() { await onSave({ ...draft, user_approved: approved }); setDraft(null); setOpen(false); }
  return <>
    <button type="button" onClick={() => setOpen(true)} className="flex items-center gap-2 border border-white/10 px-3 py-2 text-xs text-slate-300 hover:border-[#D4AF37]/60 hover:text-white"><FilePlus size={15} /> Operational toolkit</button>
    {open && <div className="fixed inset-0 z-50 bg-[#050812]/80 p-4" onMouseDown={(event) => event.target === event.currentTarget && setOpen(false)}><aside className="ml-auto flex h-full w-full max-w-lg flex-col border border-white/10 bg-[#0F172A] p-5 shadow-2xl sm:p-6">
      <div className="flex items-center justify-between border-b border-white/10 pb-4"><div><div className="text-[10px] uppercase tracking-[0.2em] text-[#D4AF37]">Operational toolkit</div><h2 className="mt-1 text-lg font-semibold text-white">Build a reusable asset</h2></div><button type="button" aria-label="Close toolkit" onClick={() => setOpen(false)} className="p-2 text-slate-400 hover:text-white"><X size={18} /></button></div>
      <div className="flex-1 overflow-y-auto py-5"><label className="block text-xs text-slate-400">Template type<select value={type} onChange={(event) => setType(event.target.value)} className="mt-2 w-full border border-white/10 bg-[#0A0F1A] px-3 py-2.5 text-sm text-white outline-none"><>{TYPES.map((item) => <option key={item} value={item}>{item.replaceAll("_", " ")}</option>)}</></select></label><label className="mt-4 block text-xs text-slate-400">What should it help you do?<textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} rows={3} className="mt-2 w-full resize-y border border-white/10 bg-[#0A0F1A] px-3 py-2.5 text-sm text-white outline-none focus:border-[#D4AF37]" /></label><button type="button" onClick={draftTemplate} disabled={busy} className="mt-4 flex items-center gap-2 border border-[#D4AF37]/50 px-3 py-2 text-xs text-[#D4AF37] disabled:opacity-50"><FilePlus size={15} /> Draft for review</button>
      {draft && <div className="mt-5 border border-white/10 bg-[#111A29] p-4"><div className="text-sm font-semibold text-white">{draft.name}</div><pre className="mt-3 whitespace-pre-wrap text-xs leading-relaxed text-slate-400">{JSON.stringify(draft.content, null, 2)}</pre><label className="mt-4 flex gap-2 text-xs text-slate-300"><input type="checkbox" checked={approved} onChange={(event) => setApproved(event.target.checked)} /> I reviewed this draft and approve saving it.</label><button type="button" disabled={!approved || busy} onClick={saveTemplate} className="mt-4 flex items-center gap-2 bg-[#D4AF37] px-3 py-2 text-xs font-semibold text-[#0A0F1A] disabled:opacity-50"><FloppyDisk size={15} /> Save template</button></div>}
      {templates.length > 0 && <div className="mt-6 border-t border-white/10 pt-5"><div className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Saved templates</div><div className="mt-3 space-y-2">{templates.map((item) => <div key={item.id} className="border border-white/5 px-3 py-2 text-sm text-slate-300">{item.name}<span className="ml-2 text-[10px] text-slate-600">v{item.version}</span></div>)}</div></div>}
      </div>
    </aside></div>}
  </>;
}
