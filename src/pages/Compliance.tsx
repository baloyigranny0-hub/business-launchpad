import { useEffect, useMemo, useState } from "react";
import { COMPLIANCE_PACKS, CUSTOM_PACK, suggestedPack } from "@/lib/compliance";
import { generateCompliancePack } from "@/lib/coach";
import { FormCoach } from "@/components/FormCoach";
import { ApprovalGate } from "@/components/ApprovalGate";
import { INSTITUTIONS, type Institution } from "@/lib/institutions";

import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { BadgeCheck, Building2, Clock3, FileCheck2, Landmark, Loader2, MapPin, ShieldCheck, Sparkles, ArrowUpRight } from "lucide-react";
import { toast } from "sonner";

const Compliance = () => {
  const { state, setCompliance } = useStore();
  const suggested = useMemo(() => suggestedPack(state.business.industry), [state.business.industry]);
  const [selected, setSelected] = useState(state.compliance.packId || suggested.id);
  const [busy, setBusy] = useState(false);
  const pack = [...COMPLIANCE_PACKS, CUSTOM_PACK].find((item) => item.id === selected) ?? CUSTOM_PACK;
  const [routerTarget, setRouterTarget] = useState<Institution | null>(null);
  useEffect(() => { if (!state.compliance.packId) setSelected(suggested.id); }, [state.compliance.packId, suggested.id]);

  const generate = async () => {
    setBusy(true);
    try {
      const result = await generateCompliancePack(pack.id, pack.label, pack.focus);
      setCompliance({ packId: pack.id, packLabel: pack.label, content: result.text, updatedAt: new Date().toISOString() });
      toast.success("Industry compliance pack ready");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not build the compliance pack");
    } finally { setBusy(false); }
  };

  return (
    <div className="p-6 md:p-10 max-w-6xl">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
        <div><div className="text-sm text-primary font-medium">{state.business.industry}</div><h1 className="font-display text-4xl mt-1">Industry compliance</h1><p className="text-muted-foreground mt-2 max-w-2xl">A working checklist for {state.business.city}, {state.business.country}—matched to how your industry operates.</p></div>
        <div className="flex gap-3 text-xs text-muted-foreground"><span className="flex items-center gap-1"><MapPin className="size-4" /> {state.business.city}</span><span className="flex items-center gap-1"><Building2 className="size-4" /> {state.business.stage}</span></div>
      </div>

      <div className="mb-8 rounded-xl border border-border bg-gradient-card p-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-medium">Stuck on a government form?</h2>
          <p className="text-sm text-muted-foreground mt-1">Show the coach your SARS eFiling, CIPC/BizPortal, UI-19 or COIDA screen and it explains each field.</p>
        </div>
        <FormCoach />
      </div>


      <section aria-labelledby="pack-title">
        <div className="flex items-center gap-2 mb-4"><ShieldCheck className="size-5 text-primary" /><h2 id="pack-title" className="font-display text-2xl">Choose a starter pack</h2></div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[...COMPLIANCE_PACKS, CUSTOM_PACK].map((item) => (
            <button key={item.id} type="button" onClick={() => setSelected(item.id)} className={`text-left border p-4 rounded-lg transition-colors ${selected === item.id ? "border-primary bg-primary/10" : "border-border bg-card hover:border-primary/50"}`}>
              <div className="flex justify-between gap-3"><span className="font-medium">{item.label}</span>{item.id === suggested.id && <span className="text-[10px] uppercase text-primary">Best match</span>}</div>
              <p className="text-xs text-muted-foreground mt-2">{item.focus.slice(0, 3).join(" · ")}</p>
            </button>
          ))}
        </div>
        <Button className="mt-5" onClick={generate} disabled={busy}>{busy ? <Loader2 className="size-4 mr-2 animate-spin" /> : <Sparkles className="size-4 mr-2" />}{state.compliance.content ? "Refresh my pack" : "Build my compliance pack"}</Button>
      </section>

      {/* Institutional router — direct routes with a safety stop before anything opens */}
      <section aria-labelledby="router-title" className="mt-10">
        <div className="flex items-center gap-2 mb-4"><Landmark className="size-5 text-primary" /><h2 id="router-title" className="font-display text-2xl">Go straight to the source</h2></div>
        <p className="text-sm text-muted-foreground mb-4 max-w-2xl">
          Direct routes to the institutions South African founders deal with, each with the exact checklist of what to have ready before you click through. Registering outside South Africa? Ask the coach instead.
        </p>
        <div className="grid sm:grid-cols-2 gap-3">
          {INSTITUTIONS.map((inst) => (
            <div key={inst.id} className="rounded-2xl border border-border bg-gradient-card p-5 flex flex-col">
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-medium">{inst.name}</h3>
                <span className="text-[10px] uppercase tracking-wide text-muted-foreground text-right shrink-0">{inst.when.split("—")[0]}</span>
              </div>
              <p className="text-sm text-muted-foreground mt-2 flex-1">{inst.handles}</p>
              <div className="flex flex-wrap gap-1 mt-3">
                {inst.forms.map((f) => (
                  <span key={f} className="text-[10px] border border-border rounded px-1.5 py-0.5 text-muted-foreground">{f}</span>
                ))}
              </div>
              <Button variant="outline" size="sm" className="mt-4 self-start" onClick={() => setRouterTarget(inst)}>
                <ArrowUpRight className="size-4 mr-1" /> Prepare &amp; open
              </Button>
            </div>
          ))}
        </div>
      </section>

      <ApprovalGate
        open={!!routerTarget}
        title={routerTarget ? `Prepare to visit ${routerTarget.name}` : ""}
        whatHappens={`Foundry opens ${routerTarget?.name ?? "the site"} in a new tab — nothing is filled in or sent for you. Work through the checklist yourself, and only click submit on their site when you're satisfied. Foundry never submits anything on your behalf.`}
        payload={[
          { label: "Business", value: state.business.name || "Not set yet" },
          { label: "Industry", value: state.business.industry || "Not set yet" },
          { label: "City / municipality", value: `${state.business.city || "—"}, ${state.business.country || "—"}` },
          { label: "Stage", value: state.business.stage },
          { label: "Opens", value: routerTarget?.url ?? "" },
        ]}
        bring={routerTarget?.bring}
        approveLabel="Approve & open"
        onApprove={() => {
          if (routerTarget) window.open(routerTarget.url, "_blank", "noopener");
          setRouterTarget(null);
        }}
        onClose={() => setRouterTarget(null)}
      />

      {state.compliance.content && (
        <section className="mt-10" aria-labelledby="saved-title">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4"><div className="flex items-center gap-2"><FileCheck2 className="size-5 text-primary" /><h2 id="saved-title" className="font-display text-2xl">{state.compliance.packLabel}</h2></div>{state.compliance.updatedAt && <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock3 className="size-3" /> Updated {new Date(state.compliance.updatedAt).toLocaleDateString()}</span>}</div>
          <div className="border border-border bg-gradient-card p-5 rounded-lg">
            <div className="flex items-start gap-2 text-xs text-muted-foreground mb-4"><BadgeCheck className="size-4 text-accent shrink-0" /><span>Confirm fees, forms, and renewal dates with the named authority before paying or submitting.</span></div>
            <Textarea value={state.compliance.content} onChange={(e) => setCompliance({ content: e.target.value })} rows={24} className="font-mono text-sm bg-background/50" aria-label="Saved compliance checklist" />
          </div>
        </section>
      )}
    </div>
  );
};

export default Compliance;