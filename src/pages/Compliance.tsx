import { useEffect, useMemo, useState } from "react";
import { COMPLIANCE_PACKS, CUSTOM_PACK, suggestedPack } from "@/lib/compliance";
import { generateCompliancePack } from "@/lib/coach";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { BadgeCheck, Building2, Clock3, FileCheck2, Loader2, MapPin, ShieldCheck, Sparkles } from "lucide-react";
import { toast } from "sonner";

const Compliance = () => {
  const { state, setCompliance } = useStore();
  const suggested = useMemo(() => suggestedPack(state.business.industry), [state.business.industry]);
  const [selected, setSelected] = useState(state.compliance.packId || suggested.id);
  const [busy, setBusy] = useState(false);
  const pack = [...COMPLIANCE_PACKS, CUSTOM_PACK].find((item) => item.id === selected) ?? CUSTOM_PACK;
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