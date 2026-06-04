import React, { useMemo, useState } from "react";
import {
  ClipboardText,
  FloppyDisk,
  Flag,
  Path,
  RocketLaunch,
  Sparkle,
} from "@phosphor-icons/react";
import { api } from "@/lib/api";
import RoomHeader, { InfoCard } from "@/components/RoomHeader";

const ACCENT = "#60A5FA";

const CANVAS_FIELDS = [
  {
    key: "problem",
    title: "Problem",
    prompt: "What are the top 3 real, local challenges your solution addresses?",
  },
  {
    key: "customer_segments",
    title: "Customer Segments",
    prompt: "Who experiences this problem most acutely? Define early adopters clearly.",
  },
  {
    key: "unique_value",
    title: "Unique Value Proposition",
    prompt: "Why is your solution different, compelling, and relevant in this market?",
  },
  {
    key: "solution",
    title: "Solution",
    prompt: "What is your product, service, or process? Describe key features concisely.",
  },
  {
    key: "channels",
    title: "Channels",
    prompt: "How will you reach and deliver value to customers - direct, B2B, platform, or partners?",
  },
  {
    key: "revenue_streams",
    title: "Revenue Streams",
    prompt: "How will this venture generate income - sales, licensing, SaaS, contracts, or pay-per-use?",
  },
  {
    key: "cost_structure",
    title: "Cost Structure",
    prompt: "What are the key costs - R&D, manufacturing, distribution, compliance, support, or labour?",
  },
  {
    key: "key_metrics",
    title: "Key Metrics",
    prompt: "What measurable indicators prove the solution is working?",
  },
  {
    key: "unfair_advantage",
    title: "Unfair Advantage",
    prompt: "What makes this hard to copy - IP, community trust, partnerships, data, or know-how?",
  },
];

const STAGES = [
  {
    key: "fit",
    title: "Problem-Solution Fit",
    icon: Flag,
    prompt: "Clear problem, customer pain, interviews, and evidence that the solution matters.",
  },
  {
    key: "model",
    title: "Business Model",
    icon: ClipboardText,
    prompt: "Revenue model, channels, cost logic, partners, and a credible route to market.",
  },
  {
    key: "prototype",
    title: "Prototype",
    icon: RocketLaunch,
    prompt: "Proof of concept, technical feasibility, product testing, and pilot readiness.",
  },
  {
    key: "market",
    title: "Market Readiness",
    icon: Sparkle,
    prompt: "Validation, adoption evidence, production plan, sales motion, and support plan.",
  },
];

const ROADMAP = [
  {
    phase: "Concept Phase",
    trl: "TRL 1, 2 & 3",
    items: ["Proof of concept", "Market needs assessment", "Venture assessment", "Disclosure of invention"],
    color: "#F59E0B",
  },
  {
    phase: "Development Phase",
    trl: "TRL 4",
    items: ["Technical feasibility", "Market study", "IP evaluation", "Economic feasibility"],
    color: "#38BDF8",
  },
  {
    phase: "Pre-commercialisation",
    trl: "TRL 5, 6, 7 & 8",
    items: ["Engineering prototype", "Marketing plan", "Business plan", "IP protection", "Market validation", "Business formation", "Pilot prototype"],
    color: "#22C55E",
  },
  {
    phase: "Commercialisation",
    trl: "TRL 9",
    items: ["Production", "Market entry", "Market monitoring", "Business growth", "Product support"],
    color: "#84CC16",
  },
];

const DEFAULT_PROGRESS = Object.fromEntries(STAGES.map((stage) => [stage.key, ""]));

export default function Submission({ profile, sessionId }) {
  const [canvas, setCanvas] = useState(() => Object.fromEntries(CANVAS_FIELDS.map((field) => [field.key, ""])));
  const [progress, setProgress] = useState(DEFAULT_PROGRESS);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState("");

  const completion = useMemo(() => {
    const filled = CANVAS_FIELDS.filter((field) => canvas[field.key]?.trim()).length;
    return Math.round((filled / CANVAS_FIELDS.length) * 100);
  }, [canvas]);

  const updateCanvas = (key, value) => {
    setCanvas((current) => ({ ...current, [key]: value }));
    setSaved("");
  };

  const updateProgress = (key, value) => {
    setProgress((current) => ({ ...current, [key]: value }));
    setSaved("");
  };

  const saveToVault = async () => {
    setSaving(true);
    setSaved("");
    try {
      await api.post("/vault", {
        session_id: sessionId,
        title: `${profile.business_name} - Submission Pack`,
        agent: "submission",
        content: buildSubmissionPack(profile, canvas, progress),
      });
      setSaved("Saved to Vault");
    } catch (err) {
      setSaved(err?.response?.data?.detail || "Could not save yet. Check the backend and try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <RoomHeader
        kicker="Submission Lab"
        title="Build the evidence pack"
        sub="Lean canvas, grant readiness, prototype path, and commercialisation evidence in one workspace."
        accent={ACCENT}
        icon={Path}
      />

      <div className="grid xl:grid-cols-[minmax(0,1fr)_360px] gap-5 sm:gap-6">
        <div className="space-y-5">
          <section className="space-y-3">
            <SectionHeader
              eyebrow="Lean Canvas"
              title="9 elements for a credible venture"
              meta={`${completion}% complete`}
            />
            <div className="grid md:grid-cols-2 2xl:grid-cols-3 gap-3">
              {CANVAS_FIELDS.map((field, index) => (
                <CanvasField
                  key={field.key}
                  number={index + 1}
                  field={field}
                  value={canvas[field.key]}
                  onChange={(value) => updateCanvas(field.key, value)}
                />
              ))}
            </div>
          </section>

          <section className="space-y-3">
            <SectionHeader
              eyebrow="Submission Journey"
              title="From problem to prototype"
              meta="Evidence stages"
            />
            <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-3">
              {STAGES.map((stage) => (
                <StageCard
                  key={stage.key}
                  stage={stage}
                  value={progress[stage.key]}
                  onChange={(value) => updateProgress(stage.key, value)}
                />
              ))}
            </div>
          </section>

          <section className="space-y-3">
            <SectionHeader
              eyebrow="Commercialisation Roadmap"
              title="TRL path from concept to market"
              meta="Technical, business, marketing, and IP"
            />
            <div className="grid lg:grid-cols-4 gap-3">
              {ROADMAP.map((phase) => (
                <RoadmapPhase key={phase.phase} phase={phase} />
              ))}
            </div>
          </section>
        </div>

        <aside className="space-y-5">
          <InfoCard title="How to use this room" accent={ACCENT}>
            <p>Capture the evidence a reviewer expects: the problem, the customer, the prototype path, and the route to market.</p>
            <p>Save the pack to Vault when it is useful enough to reuse in a grant, incubator, or investor application.</p>
          </InfoCard>

          <InfoCard title="Venture Context" accent={ACCENT}>
            <Row k="Venture" v={profile.business_name} />
            <Row k="Industry" v={profile.industry} />
            <Row k="Country" v={profile.country} />
            <Row k="Stage" v={profile.stage} />
          </InfoCard>

          <InfoCard title="Mobile Stack Decision" accent={ACCENT}>
            <p>Best free-first path: Cloudflare for the API edge and Supabase for persistent database, auth, and file storage.</p>
            <p>For Android, Capacitor can package this web app while the app calls the same cloud API.</p>
          </InfoCard>

          <button
            type="button"
            onClick={saveToVault}
            disabled={saving}
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-[#60A5FA] px-4 py-3 font-semibold text-[#07111F] hover:brightness-110 disabled:opacity-50"
            data-testid="submission-save-vault"
          >
            <FloppyDisk size={19} weight="bold" />
            {saving ? "Saving..." : "Save submission pack"}
          </button>
          {saved && (
            <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300" data-testid="submission-save-status">
              {saved}
            </div>
          )}
        </aside>
      </div>
    </>
  );
}

function SectionHeader({ eyebrow, title, meta }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-2">
      <div>
        <div className="text-[11px] uppercase tracking-[0.25em] text-slate-500">{eyebrow}</div>
        <h2 className="font-display text-xl sm:text-2xl tracking-tight">{title}</h2>
      </div>
      <div className="text-xs font-mono text-slate-500">{meta}</div>
    </div>
  );
}

function CanvasField({ number, field, value, onChange }) {
  return (
    <label className="card p-0 overflow-hidden min-h-[210px] flex flex-col">
      <div className="h-1.5 bg-[#60A5FA]" />
      <div className="p-4 flex-1 flex flex-col">
        <div className="flex items-center gap-2 mb-2">
          <span className="grid h-6 w-6 place-items-center rounded-full border border-white/10 text-[11px] font-mono text-slate-400">{number}</span>
          <span className="font-display text-lg text-[#A3E635]">{field.title}</span>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed mb-3">{field.prompt}</p>
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          rows={4}
          className="mt-auto min-h-[86px] resize-none rounded-lg border border-white/10 bg-[#0F1726] p-3 text-sm text-white outline-none focus:border-[#60A5FA]"
          placeholder="Write the evidence here..."
          data-testid={`submission-canvas-${field.key}`}
        />
      </div>
    </label>
  );
}

function StageCard({ stage, value, onChange }) {
  const Icon = stage.icon;
  return (
    <label className="card p-4 min-h-[245px] flex flex-col">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-display text-lg">{stage.title}</div>
          <p className="text-xs text-slate-400 mt-2 leading-relaxed">{stage.prompt}</p>
        </div>
        <Icon size={26} weight="duotone" style={{ color: ACCENT }} className="shrink-0" />
      </div>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={4}
        className="mt-auto min-h-[96px] resize-none rounded-lg border border-white/10 bg-[#0F1726] p-3 text-sm text-white outline-none focus:border-[#60A5FA]"
        placeholder="What evidence do you have?"
        data-testid={`submission-stage-${stage.key}`}
      />
    </label>
  );
}

function RoadmapPhase({ phase }) {
  return (
    <div className="card p-4 min-h-[270px]">
      <div className="h-1 rounded mb-3" style={{ background: phase.color }} />
      <div className="text-[11px] uppercase tracking-[0.2em] text-slate-500">{phase.trl}</div>
      <div className="font-display text-lg mt-1">{phase.phase}</div>
      <div className="mt-3 space-y-2">
        {phase.items.map((item) => (
          <div key={item} className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-slate-300">
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}

function Row({ k, v }) {
  return (
    <div className="flex gap-3 py-1">
      <div className="w-20 text-[11px] uppercase tracking-[0.2em] text-slate-500 mt-0.5">{k}</div>
      <div className="flex-1 text-white/90 text-sm">{v || "-"}</div>
    </div>
  );
}

function buildSubmissionPack(profile, canvas, progress) {
  const lines = [
    `# ${profile.business_name} - Submission Pack`,
    "",
    "## Venture Context",
    `- Industry: ${profile.industry || "-"}`,
    `- Country: ${profile.country || "-"}`,
    `- Stage: ${profile.stage || "-"}`,
    "",
    "## Lean Canvas",
  ];

  for (const field of CANVAS_FIELDS) {
    lines.push(`### ${field.title}`, canvas[field.key]?.trim() || "Not completed yet.", "");
  }

  lines.push("## Submission Journey");
  for (const stage of STAGES) {
    lines.push(`### ${stage.title}`, progress[stage.key]?.trim() || "Evidence still needed.", "");
  }

  lines.push("## Commercialisation Roadmap");
  for (const phase of ROADMAP) {
    lines.push(`### ${phase.phase} (${phase.trl})`, ...phase.items.map((item) => `- ${item}`), "");
  }

  return lines.join("\n");
}
