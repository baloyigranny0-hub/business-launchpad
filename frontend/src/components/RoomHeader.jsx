import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";

export default function RoomHeader({ title, sub, accent = "#D4AF37", icon: Icon, kicker = "Room" }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}
      className="mb-5 sm:mb-7 flex items-end justify-between flex-wrap gap-3"
    >
      <div className="min-w-0">
        <div className="text-[10px] sm:text-[11px] uppercase tracking-[0.25em] sm:tracking-[0.3em] text-slate-500 mb-1.5 sm:mb-2">{kicker}</div>
        <h1 className="font-display text-2xl sm:text-3xl md:text-4xl tracking-tight flex items-center gap-2 sm:gap-3">
          {Icon && <Icon size={28} weight="duotone" style={{ color: accent }} className="shrink-0" />} {title}
        </h1>
        <p className="text-slate-400 mt-1 max-w-2xl text-sm sm:text-base">{sub}</p>
      </div>
      <div className="hidden md:flex h-1 w-24 rounded" style={{ background: accent }} />
    </motion.div>
  );
}

export function RoomGrid({ children }) {
  return <div className="grid lg:grid-cols-5 gap-4 sm:gap-6">{children}</div>;
}

export function ChatCol({ children }) {
  return <div className="lg:col-span-3">{children}</div>;
}

export function SideCol({ children }) {
  return <div className="lg:col-span-2 space-y-5">{children}</div>;
}

export function InfoCard({ title, children, accent = "#D4AF37" }) {
  return (
    <div className="card p-5">
      <div className="text-[11px] uppercase tracking-[0.25em] mb-3" style={{ color: accent }}>{title}</div>
      <div className="text-sm text-slate-300 space-y-2">{children}</div>
    </div>
  );
}
