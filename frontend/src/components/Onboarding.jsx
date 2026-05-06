import React, { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Lightning, Sparkle } from "@phosphor-icons/react";
import { api } from "@/lib/api";

const INDUSTRIES = [
  "Agriculture & Farming",
  "Food & Beverage",
  "Hospitality / Restaurant",
  "Retail / E-commerce",
  "Logistics & Transport",
  "Construction",
  "Engineering (Civil / Mechanical / Electrical)",
  "Mining & Energy",
  "Manufacturing",
  "Beauty & Grooming (Barber / Salon)",
  "Health & Wellness",
  "Pharmacy / Medical Devices",
  "Technology / Software / SaaS",
  "Creative / Design / Media",
  "Film, Music & Entertainment",
  "Education / Training / EdTech",
  "Professional Services (Consulting, Legal, Accounting)",
  "Real Estate & Property",
  "Financial Services / Fintech",
  "Insurance",
  "Automotive (Sales, Repair, EV)",
  "Tourism & Travel",
  "Events & Weddings",
  "Sports & Fitness",
  "Childcare / Early Learning",
  "Non-Profit / NGO / NPO",
  "Religious / Faith-based Organisation",
  "Government / Public Sector Contractor",
  "Import / Export & Trade",
  "Telecommunications",
  "Other",
];

const STAGES = [
  { v: "idea", t: "Just an idea" },
  { v: "registered", t: "Registered, no clients yet" },
  { v: "operating", t: "Already operating" },
  { v: "scaling", t: "Looking to scale" },
];

const COUNTRIES = [
  "South Africa", "United States", "United Kingdom", "India", "Nigeria",
  "Kenya", "Canada", "Australia", "Germany", "Brazil", "Other / Global",
];

export default function Onboarding({ sessionId, onDone }) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    business_name: "",
    industry: "",
    country: "",
    stage: "idea",
    idea: "",
    target_customer: "",
  });
  const [saving, setSaving] = useState(false);
  const update = (k, v) => setForm({ ...form, [k]: v });

  const next = () => setStep((s) => s + 1);
  const back = () => setStep((s) => Math.max(0, s - 1));

  const submit = async () => {
    setSaving(true);
    try {
      const r = await api.post("/profiles", { session_id: sessionId, ...form });
      onDone(r.data);
    } finally { setSaving(false); }
  };

  const canNext = () => {
    if (step === 0) return form.business_name.trim().length >= 2;
    if (step === 1) return !!form.industry && !!form.country;
    if (step === 2) return !!form.stage;
    if (step === 3) return form.idea.trim().length >= 10;
    return true;
  };

  return (
    <div className="min-h-screen w-full relative overflow-hidden bg-[#0A0F1A] text-white" style={{ minHeight: "100dvh" }}>
      <div className="absolute inset-0 dot-grid opacity-40" />
      <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full" style={{ background: "radial-gradient(circle, rgba(212,175,55,0.18), transparent 60%)" }} />
      <div className="absolute -bottom-40 -left-40 w-[600px] h-[600px] rounded-full" style={{ background: "radial-gradient(circle, rgba(56,189,248,0.14), transparent 60%)" }} />

      <div className="relative max-w-3xl mx-auto px-6 py-12 md:py-20">
        <div className="flex items-center gap-2 mb-10">
          <Sparkle weight="fill" className="text-[#D4AF37]" size={22} />
          <span className="font-display text-xl tracking-tight">Foundry</span>
          <span className="text-xs text-slate-500 font-mono ml-auto">step {step + 1} / 5</span>
        </div>

        <motion.div key={step} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          {step === 0 && (
            <Block title="What are you building?" sub="Give your venture a working name. We can change it later in the Design Studio.">
              <input
                data-testid="onboarding-business-name-input"
                autoFocus
                value={form.business_name}
                onChange={(e) => update("business_name", e.target.value)}
                placeholder="e.g. Sunrise Honey Co."
                className="w-full bg-transparent border-b border-white/15 focus:border-[#D4AF37] outline-none py-3 font-display text-2xl sm:text-3xl md:text-5xl tracking-tight placeholder:text-slate-700"
              />
            </Block>
          )}
          {step === 1 && (
            <Block title="Industry & country" sub="So we can shape compliance and resources around your reality.">
              <div className="grid md:grid-cols-2 gap-3">
                <Select label="Industry" value={form.industry} onChange={(v) => update("industry", v)} options={INDUSTRIES} testid="onboarding-industry-select" />
                <Select label="Country" value={form.country} onChange={(v) => update("country", v)} options={COUNTRIES} testid="onboarding-country-select" />
              </div>
            </Block>
          )}
          {step === 2 && (
            <Block title="Where are you right now?" sub="No wrong answer. Honesty makes the coach sharper.">
              <div className="grid sm:grid-cols-2 gap-3 mt-2">
                {STAGES.map((s) => (
                  <button
                    key={s.v}
                    data-testid={`onboarding-stage-${s.v}`}
                    onClick={() => update("stage", s.v)}
                    className={`text-left p-5 rounded-xl border transition ${
                      form.stage === s.v
                        ? "border-[#D4AF37] bg-[#D4AF37]/10"
                        : "border-white/10 hover:border-white/25 bg-[#131B2B]"
                    }`}
                  >
                    <div className="font-display text-lg">{s.t}</div>
                  </button>
                ))}
              </div>
            </Block>
          )}
          {step === 3 && (
            <Block title="Describe the idea in plain words" sub="One short paragraph. What is the product, who is it for, why now?">
              <textarea
                data-testid="onboarding-idea-textarea"
                value={form.idea}
                onChange={(e) => update("idea", e.target.value)}
                rows={5}
                placeholder="e.g. Pure raw honey from highveld beekeepers, sold in 500g jars to wellness retailers in Joburg…"
                className="w-full bg-[#131B2B] border border-white/10 rounded-xl p-4 outline-none focus:border-[#D4AF37] text-base leading-relaxed"
              />
              <input
                data-testid="onboarding-target-input"
                value={form.target_customer}
                onChange={(e) => update("target_customer", e.target.value)}
                placeholder="Who is the target customer? (optional)"
                className="mt-3 w-full bg-[#131B2B] border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-[#D4AF37]"
              />
            </Block>
          )}
          {step === 4 && (
            <Block title="Ready to walk in?" sub="The agents will tailor every room to this profile.">
              <div className="card p-6 space-y-2 text-slate-300">
                <Row k="Business" v={form.business_name} />
                <Row k="Industry" v={form.industry} />
                <Row k="Country" v={form.country} />
                <Row k="Stage" v={STAGES.find(s => s.v === form.stage)?.t} />
                <Row k="Idea" v={form.idea} />
                {form.target_customer && <Row k="Target" v={form.target_customer} />}
              </div>
            </Block>
          )}

          <div className="flex items-center justify-between mt-8 sm:mt-10 gap-3">
            <button data-testid="onboarding-back-btn" onClick={back} disabled={step === 0}
              className="text-slate-400 hover:text-white text-sm disabled:opacity-30 disabled:cursor-not-allowed">
              ← Back
            </button>
            {step < 4 ? (
              <button
                data-testid="onboarding-next-btn"
                onClick={next}
                disabled={!canNext()}
                className="group flex items-center gap-2 bg-[#D4AF37] text-[#0A0F1A] font-semibold px-5 sm:px-6 py-2.5 sm:py-3 rounded-full text-sm sm:text-base disabled:opacity-30 disabled:cursor-not-allowed hover:brightness-110 transition"
              >
                Continue <ArrowRight weight="bold" size={18} />
              </button>
            ) : (
              <button
                data-testid="onboarding-submit-btn"
                onClick={submit}
                disabled={saving}
                className="flex items-center gap-2 bg-[#D4AF37] text-[#0A0F1A] font-semibold px-5 sm:px-6 py-2.5 sm:py-3 rounded-full text-sm sm:text-base hover:brightness-110 transition glow-gold"
              >
                {saving ? "Opening doors…" : (<>Enter Foundry <Lightning weight="fill" size={18} /></>)}
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function Block({ title, sub, children }) {
  return (
    <div className="space-y-5">
      <div>
        <div className="text-[10px] sm:text-xs uppercase tracking-[0.2em] sm:tracking-[0.25em] text-slate-500 mb-2 sm:mb-3">Onboarding</div>
        <h1 className="font-display text-2xl sm:text-3xl md:text-5xl tracking-tight leading-[1.1] sm:leading-[1.05]">{title}</h1>
        <p className="text-slate-400 mt-2 max-w-xl text-sm sm:text-base">{sub}</p>
      </div>
      <div>{children}</div>
    </div>
  );
}

function Select({ label, value, onChange, options, testid }) {
  return (
    <label className="block">
      <span className="block text-xs uppercase tracking-[0.2em] text-slate-500 mb-1.5">{label}</span>
      <select
        data-testid={testid}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-[#131B2B] border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-[#D4AF37]"
      >
        <option value="">Select…</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </label>
  );
}

function Row({ k, v }) {
  return (
    <div className="flex gap-4">
      <div className="w-24 text-xs uppercase tracking-[0.2em] text-slate-500 mt-1">{k}</div>
      <div className="flex-1 text-white/90">{v || "—"}</div>
    </div>
  );
}
