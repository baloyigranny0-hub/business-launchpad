import { Button } from "@/components/ui/button";
import { ShieldCheck, TriangleAlert, X } from "lucide-react";

export interface PreparedPayload {
  label: string;
  value: string;
}

/**
 * Human-in-the-loop safety stop. Foundry prepares the complete payload —
 * the founder reviews it and makes the single "Approve & Submit" click
 * before anything external happens. Nothing is ever auto-submitted.
 */
export function ApprovalGate({
  open,
  title,
  whatHappens,
  payload,
  bring,
  approveLabel = "Approve & Submit",
  busy,
  onApprove,
  onClose,
}: {
  open: boolean;
  title: string;
  whatHappens: string;
  payload: PreparedPayload[];
  bring?: string[];
  approveLabel?: string;
  busy?: boolean;
  onApprove: () => void;
  onClose: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-background/80 backdrop-blur-sm p-4" role="dialog" aria-modal="true" aria-label={title}>
      <div className="w-full max-w-lg rounded-2xl border border-border bg-gradient-card shadow-card max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-3 p-5 border-b border-border">
          <div className="flex items-start gap-3">
            <div className="size-10 rounded-xl bg-primary/10 grid place-items-center text-primary shrink-0">
              <ShieldCheck className="size-5" />
            </div>
            <div>
              <h2 className="font-display text-xl leading-tight">{title}</h2>
              <p className="text-xs text-muted-foreground mt-1">Foundry prepared this — you decide. Nothing is sent until you approve.</p>
            </div>
          </div>
          <button onClick={onClose} aria-label="Close" className="text-muted-foreground hover:text-foreground p-1">
            <X className="size-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="rounded-lg bg-primary/5 border border-primary/20 p-3 text-sm">{whatHappens}</div>

          <div>
            <div className="text-xs uppercase tracking-widest text-muted-foreground mb-2">What Foundry prepared</div>
            <dl className="rounded-lg border border-border bg-background/50 divide-y divide-border">
              {payload.map((p) => (
                <div key={p.label} className="px-3 py-2 flex flex-col sm:flex-row sm:justify-between gap-1">
                  <dt className="text-xs text-muted-foreground sm:w-40 shrink-0">{p.label}</dt>
                  <dd className="text-sm">{p.value}</dd>
                </div>
              ))}
            </dl>
          </div>

          {bring && bring.length > 0 && (
            <div>
              <div className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Have ready</div>
              <ul className="text-sm space-y-1">
                {bring.map((b) => (
                  <li key={b} className="flex gap-2"><span className="text-primary">•</span>{b}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex items-start gap-2 rounded-lg border border-border bg-background/50 p-3 text-xs text-muted-foreground">
            <TriangleAlert className="size-4 text-accent shrink-0 mt-0.5" />
            <span>
              Foundry never submits anything for you and never handles passwords, OTPs or full account numbers. Confirm fees and requirements with the authority — you remain in control of every submission.
            </span>
          </div>
        </div>

        <div className="p-5 pt-0 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>Not yet</Button>
          <Button className="bg-gradient-primary text-primary-foreground hover:opacity-90" disabled={busy} onClick={onApprove}>
            {busy ? "Preparing…" : approveLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
