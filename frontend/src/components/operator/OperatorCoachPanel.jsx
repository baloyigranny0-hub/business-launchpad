import React, { useState } from "react";
import { ArrowUpRight, CircleNotch, ChatCircleText } from "@phosphor-icons/react";

export default function OperatorCoachPanel({ bottleneck, message, model, onPlan, loading }) {
  const [prompt, setPrompt] = useState("");
  async function submit(event) {
    event.preventDefault();
    const text = prompt.trim() || "Help me choose today's highest-leverage action.";
    await onPlan(text);
    setPrompt("");
  }
  return <section className="border border-white/10 bg-[#111A29] p-5 sm:p-6">
    <div className="flex items-start gap-3"><div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#D4AF37]/15 text-[#D4AF37]"><ChatCircleText size={19} /></div><div><div className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Operator coach</div><p className="mt-1 text-sm leading-relaxed text-slate-200">{message || "Tell me what is getting in the way and I will turn it into a small plan."}</p></div></div>
    <div className="mt-4 border-l-2 border-[#D4AF37]/60 pl-3 text-xs text-slate-400"><span className="text-slate-500">Current bottleneck:</span> {bottleneck || "not diagnosed yet"}</div>
    <form onSubmit={submit} className="mt-5 flex gap-2"><input value={prompt} onChange={(event) => setPrompt(event.target.value)} placeholder="What is blocking progress today?" className="min-w-0 flex-1 border border-white/10 bg-[#0A0F1A] px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-600 focus:border-[#D4AF37]" /><button type="submit" disabled={loading} aria-label="Ask Foundry for a plan" className="grid h-11 w-11 shrink-0 place-items-center bg-[#D4AF37] text-[#0A0F1A] disabled:opacity-50">{loading ? <CircleNotch className="animate-spin" /> : <ArrowUpRight size={18} weight="bold" />}</button></form>
    {model && <div className="mt-3 text-[10px] text-slate-600">planner: {model}</div>}
  </section>;
}
