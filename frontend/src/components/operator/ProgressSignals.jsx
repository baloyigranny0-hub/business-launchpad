import React from "react";
import { CheckCircle, ChartLineUp, Flame, Target } from "@phosphor-icons/react";

export default function ProgressSignals({ progress = {} }) {
  const signals = [
    [CheckCircle, "Completed this week", progress.completed_this_week || 0, "#34D399"],
    [Target, "Revenue actions", progress.revenue_actions_completed || 0, "#D4AF37"],
    [Flame, "Active days", progress.active_days || 0, "#FB7185"],
    [ChartLineUp, "Current stage", progress.current_stage || "idea", "#60A5FA"],
  ];
  return <section aria-label="Progress signals" className="grid grid-cols-2 gap-3 lg:grid-cols-4">{signals.map(([Icon, label, value, color]) => <div key={label} className="border border-white/10 bg-[#111A29] p-4"><Icon size={17} style={{ color }} /><div className="mt-3 text-xl font-semibold text-white">{value}</div><div className="mt-1 text-xs text-slate-500">{label}</div></div>)}</section>;
}
