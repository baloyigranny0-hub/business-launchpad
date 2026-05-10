import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { GearSix, FloppyDisk, ArrowSquareOut, Copy, Check, SignOut, ArrowLeft } from "@phosphor-icons/react";
import { api, SESSION_KEY } from "@/lib/api";
import RoomHeader from "@/components/RoomHeader";

const INDUSTRIES = [
  "Agriculture & Farming","Food & Beverage","Hospitality / Restaurant","Retail / E-commerce",
  "Logistics & Transport","Construction","Engineering (Civil / Mechanical / Electrical)",
  "Mining & Energy","Manufacturing","Beauty & Grooming (Barber / Salon)","Health & Wellness",
  "Pharmacy / Medical Devices","Technology / Software / SaaS","Creative / Design / Media",
  "Film, Music & Entertainment","Education / Training / EdTech",
  "Professional Services (Consulting, Legal, Accounting)","Real Estate & Property",
  "Financial Services / Fintech","Insurance","Automotive (Sales, Repair, EV)","Tourism & Travel",
  "Events & Weddings","Sports & Fitness","Childcare / Early Learning","Non-Profit / NGO / NPO",
  "Religious / Faith-based Organisation","Government / Public Sector Contractor",
  "Import / Export & Trade","Telecommunications","Other",
];
const COUNTRIES = ["South Africa","United States","United Kingdom","India","Nigeria","Kenya","Canada","Australia","Germany","Brazil","Other / Global"];
const STAGES = [{v:"idea",t:"Just an idea"},{v:"registered",t:"Registered, no clients yet"},{v:"operating",t:"Already operating"},{v:"scaling",t:"Looking to scale"}];
const REG = [{v:"yes",t:"Yes"},{v:"no",t:"Not yet"},{v:"unsure",t:"Not sure"}];
const LVL = [{v:"beginner",t:"New to this"},{v:"intermediate",t:"I know some"},{v:"expert",t:"Experienced"}];

export default function Settings({ profile, sessionId, setProfile }) {
  const navigate = useNavigate();
  const [form, setForm] = useState(profile || {});
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => { setForm(profile || {}); }, [profile]);
  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    setSaving(true);
    try {
      const r = await api.post("/profiles", { ...form, session_id: sessionId });
      setProfile(r.data);
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 2200);
    } catch (e) {
      alert("Couldn't save. Try again in a moment.");
    } finally { setSaving(false); }
  };

  const restoreUrl = `${window.location.origin}/?session=${sessionId}`;

  const copyRestore = async () => {
    try {
      await navigator.clipboard.writeText(restoreUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      window.prompt("Copy your access link:", restoreUrl);
    }
  };

  const signOut = () => {
    const ok = window.confirm(
      "Sign out from THIS device only.\n\n" +
      "Your data stays safe on Foundry's servers, tied to your access link.\n" +
      "Make sure you've copied your access link above first — without it, you cannot get back in on a new device."
    );
    if (!ok) return;
    localStorage.removeItem(SESSION_KEY);
    setProfile(null);
    window.location.href = "/";
  };

  return (
    <>
      <RoomHeader
        kicker="Settings"
        title="Your founder profile"
        sub="Edit anything. Your data is saved to the cloud against your access link."
        accent="#D4AF37" icon={GearSix}
      />

      <button onClick={() => navigate(-1)} className="text-slate-400 hover:text-white text-sm mb-5 flex items-center gap-1">
        <ArrowLeft size={14} /> Back
      </button>

      {/* Editable profile */}
      <div className="card p-5 sm:p-6 space-y-5 mb-6">
        <Field label="Business name">
          <input data-testid="settings-name-input" value={form.business_name || ""} onChange={(e) => update("business_name", e.target.value)}
            className="w-full bg-[#0A0F1A] border border-white/10 rounded-lg px-3 py-2 outline-none focus:border-[#D4AF37]" />
        </Field>
        <Field label="Industry">
          <select data-testid="settings-industry-select" value={form.industry || ""} onChange={(e) => update("industry", e.target.value)}
            className="w-full bg-[#0A0F1A] border border-white/10 rounded-lg px-3 py-2 outline-none focus:border-[#D4AF37]">
            {INDUSTRIES.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        </Field>
        <Field label="Country">
          <select data-testid="settings-country-select" value={form.country || ""} onChange={(e) => update("country", e.target.value)}
            className="w-full bg-[#0A0F1A] border border-white/10 rounded-lg px-3 py-2 outline-none focus:border-[#D4AF37]">
            {COUNTRIES.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        </Field>
        <div className="grid sm:grid-cols-3 gap-3">
          <Field label="Stage">
            <select data-testid="settings-stage-select" value={form.stage || "idea"} onChange={(e) => update("stage", e.target.value)}
              className="w-full bg-[#0A0F1A] border border-white/10 rounded-lg px-3 py-2 outline-none focus:border-[#D4AF37]">
              {STAGES.map((o) => <option key={o.v} value={o.v}>{o.t}</option>)}
            </select>
          </Field>
          <Field label="Registered">
            <select data-testid="settings-registered-select" value={form.is_registered || "no"} onChange={(e) => update("is_registered", e.target.value)}
              className="w-full bg-[#0A0F1A] border border-white/10 rounded-lg px-3 py-2 outline-none focus:border-[#D4AF37]">
              {REG.map((o) => <option key={o.v} value={o.v}>{o.t}</option>)}
            </select>
          </Field>
          <Field label="Level">
            <select data-testid="settings-level-select" value={form.knowledge_level || "beginner"} onChange={(e) => update("knowledge_level", e.target.value)}
              className="w-full bg-[#0A0F1A] border border-white/10 rounded-lg px-3 py-2 outline-none focus:border-[#D4AF37]">
              {LVL.map((o) => <option key={o.v} value={o.v}>{o.t}</option>)}
            </select>
          </Field>
        </div>
        <Field label="Idea">
          <textarea data-testid="settings-idea-textarea" rows={3} value={form.idea || ""} onChange={(e) => update("idea", e.target.value)}
            className="w-full bg-[#0A0F1A] border border-white/10 rounded-lg px-3 py-2 outline-none focus:border-[#D4AF37]" />
        </Field>
        <Field label="Target customer">
          <input data-testid="settings-target-input" value={form.target_customer || ""} onChange={(e) => update("target_customer", e.target.value)}
            className="w-full bg-[#0A0F1A] border border-white/10 rounded-lg px-3 py-2 outline-none focus:border-[#D4AF37]" />
        </Field>
        <Field label="Biggest blocker">
          <input data-testid="settings-blocker-input" value={form.biggest_blocker || ""} onChange={(e) => update("biggest_blocker", e.target.value)}
            className="w-full bg-[#0A0F1A] border border-white/10 rounded-lg px-3 py-2 outline-none focus:border-[#D4AF37]" />
        </Field>
        <div className="flex items-center gap-2 pt-1">
          <button data-testid="settings-save-btn" onClick={save} disabled={saving}
            className="bg-[#D4AF37] text-[#0A0F1A] font-semibold px-5 py-2.5 rounded-full text-sm flex items-center gap-2 hover:brightness-110 disabled:opacity-40">
            <FloppyDisk size={16} weight="fill" /> {saving ? "Saving…" : savedFlash ? "Saved!" : "Save changes"}
          </button>
        </div>
      </div>

      {/* Access link & sign-out */}
      <div className="card p-5 sm:p-6 space-y-4 mb-6">
        <div>
          <div className="text-[11px] uppercase tracking-[0.25em] text-[#D4AF37] mb-1">Your access link</div>
          <p className="text-slate-400 text-sm">
            Foundry has no passwords. <b>This link IS your login.</b> Save it somewhere safe before you sign out.
            Open it on any device to restore your profile, Vault and tasks.
          </p>
        </div>
        <div className="flex items-stretch gap-2 flex-wrap">
          <input
            data-testid="settings-restore-input"
            readOnly value={restoreUrl}
            className="flex-1 min-w-0 bg-[#0A0F1A] border border-white/10 rounded-lg px-3 py-2 font-mono text-xs sm:text-sm outline-none"
          />
          <button data-testid="settings-copy-btn" onClick={copyRestore}
            className="px-4 py-2 rounded-lg border border-white/10 hover:border-white/30 hover:bg-white/5 text-sm flex items-center gap-2">
            {copied ? <><Check size={14} className="text-[#10B981]" /> Copied</> : <><Copy size={14} /> Copy</>}
          </button>
          <a data-testid="settings-mail-btn" href={`mailto:?subject=My%20Foundry%20access%20link&body=${encodeURIComponent(restoreUrl)}`}
            className="px-4 py-2 rounded-lg border border-white/10 hover:border-white/30 hover:bg-white/5 text-sm flex items-center gap-2">
            <ArrowSquareOut size={14} /> Email it
          </a>
        </div>
      </div>

      <div className="card p-5 sm:p-6 border-[#EF4444]/30">
        <div className="text-[11px] uppercase tracking-[0.25em] text-[#EF4444] mb-2">Danger zone</div>
        <p className="text-slate-400 text-sm mb-3">
          Sign out clears this device. Your data is preserved on Foundry's servers and can be restored with your access link above.
        </p>
        <button data-testid="settings-signout-btn" onClick={signOut}
          className="px-5 py-2.5 rounded-full text-sm flex items-center gap-2 border border-[#EF4444]/40 text-[#FCA5A5] hover:bg-[#EF4444]/10">
          <SignOut size={14} /> Sign out (keep my data on the cloud)
        </button>
      </div>
    </>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="block text-[10px] sm:text-[11px] uppercase tracking-[0.2em] text-slate-500 mb-1.5">{label}</span>
      {children}
    </label>
  );
}
