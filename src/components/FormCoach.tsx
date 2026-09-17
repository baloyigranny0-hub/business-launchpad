import { useRef, useState } from "react";
import { Camera, Eraser, Loader2, Send, ShieldAlert, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { askFormCoach } from "@/lib/coach";
import { GOV_FORMS, formById } from "@/lib/formCoach";
import { loadImage, quickMaskPresets, redactToDataUrl, type RedactBox } from "@/lib/redact";
import { useStore } from "@/lib/store";
import { toast } from "sonner";

interface Msg {
  role: "user" | "assistant";
  content: string;
}

export const FormCoach = () => {
  const { state } = useStore();
  const [open, setOpen] = useState(false);
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [boxes, setBoxes] = useState<RedactBox[]>([]);
  const [drag, setDrag] = useState<RedactBox | null>(null);
  const [formId, setFormId] = useState("");
  const [section, setSection] = useState("");
  const [question, setQuestion] = useState("");
  const [busy, setBusy] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  const form = formById(formId);

  const takeFile = async (file?: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) return toast.error("Please choose a screenshot image.");
    try {
      const loaded = await loadImage(file);
      setImg(loaded);
      setBoxes([]);
      setPreview(loaded.src);
    } catch {
      toast.error("That image could not be read.");
    }
  };

  const relPoint = (e: React.PointerEvent) => {
    const rect = stageRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return {
      x: Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width)),
      y: Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height)),
    };
  };

  const onDown = (e: React.PointerEvent) => {
    if (!img) return;
    const p = relPoint(e);
    setDrag({ x: p.x, y: p.y, w: 0, h: 0 });
  };
  const onMove = (e: React.PointerEvent) => {
    if (!drag) return;
    const p = relPoint(e);
    setDrag({ x: Math.min(drag.x, p.x), y: Math.min(drag.y, p.y), w: Math.abs(p.x - drag.x), h: Math.abs(p.y - drag.y) });
  };
  const onUp = () => {
    if (drag && drag.w > 0.01 && drag.h > 0.01) setBoxes((b) => [...b, drag]);
    setDrag(null);
  };

  const send = async () => {
    if (busy) return;
    if (!img && !formId) return toast.error("Upload a screenshot or pick the form you are on.");
    let image: string | undefined;
    if (img) {
      try {
        image = redactToDataUrl(img, boxes);
      } catch {
        return toast.error("That screenshot could not be prepared.");
      }
    }
    const asked = question.trim() || (form ? `I am stuck on ${form.label}${section ? ` — ${section}` : ""}.` : "I am stuck on this screen.");
    setMsgs((m) => [...m, { role: "user", content: asked }]);
    setQuestion("");
    setBusy(true);
    try {
      const { text } = await askFormCoach({
        formId: formId || undefined,
        formLabel: form ? `${form.org} — ${form.label}` : undefined,
        formSection: section || undefined,
        question: asked,
        image,
        history: msgs.map((m) => ({ role: m.role, content: m.content })),
      });
      setMsgs((m) => [...m, { role: "assistant", content: text }]);
    } catch (e) {
      setMsgs((m) => [...m, { role: "assistant", content: e instanceof Error ? e.message : "The form coach could not answer. Try again." }]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)} className="gap-2">
        <Camera className="size-4" /> Help me with this form screen
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm overflow-y-auto" role="dialog" aria-label="Screen-aware form coach">
          <div className="min-h-full p-3 sm:p-6 flex items-start justify-center">
            <div className="w-full max-w-5xl rounded-2xl border border-border bg-card shadow-card">
              <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                <div>
                  <h2 className="font-display text-xl">Form screen coach</h2>
                  <p className="text-xs text-muted-foreground">
                    SARS eFiling · CIPC · BizPortal · Labour (UI-19) · COIDA — for {state.business.name || "your business"} in {state.business.city || "your city"}
                  </p>
                </div>
                <button onClick={() => setOpen(false)} aria-label="Close" className="text-muted-foreground hover:text-foreground">
                  <X className="size-5" />
                </button>
              </div>

              <div className="grid lg:grid-cols-2 gap-5 p-5">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium" htmlFor="fc-form">Which form are you on?</label>
                    <select
                      id="fc-form"
                      value={formId}
                      onChange={(e) => { setFormId(e.target.value); setSection(""); }}
                      className="mt-1 w-full rounded-lg border border-border bg-background/50 px-3 py-2 text-sm"
                    >
                      <option value="">Not sure / read it from my screenshot</option>
                      {GOV_FORMS.map((f) => (
                        <option key={f.id} value={f.id}>{f.org} — {f.label}</option>
                      ))}
                    </select>
                  </div>

                  {form && (
                    <div>
                      <label className="text-sm font-medium" htmlFor="fc-section">Section or field you are stuck on</label>
                      <select
                        id="fc-section"
                        value={section}
                        onChange={(e) => setSection(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-border bg-background/50 px-3 py-2 text-sm"
                      >
                        <option value="">Whole form</option>
                        {form.sections.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <p className="text-xs text-muted-foreground mt-1">{form.purpose}</p>
                    </div>
                  )}

                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => takeFile(e.target.files?.[0])} />
                  <div className="flex flex-wrap gap-2">
                    <Button variant="secondary" onClick={() => fileRef.current?.click()} className="gap-2"><Upload className="size-4" /> Upload screenshot</Button>
                    {img && <Button variant="ghost" onClick={() => setBoxes([])} className="gap-2"><Eraser className="size-4" /> Clear masks</Button>}
                  </div>

                  <div
                    onPaste={async (e) => {
                      const item = Array.from(e.clipboardData.files)[0];
                      if (item) await takeFile(item);
                    }}
                    tabIndex={0}
                    className="rounded-lg border border-dashed border-border p-3 text-xs text-muted-foreground"
                  >
                    You can also click here and paste a screenshot (Ctrl/Cmd + V).
                  </div>

                  {img && (
                    <>
                      <div className="flex flex-wrap gap-2">
                        {quickMaskPresets().map((p) => (
                          <button key={p.label} onClick={() => setBoxes((b) => [...b, p.box])} className="text-xs px-2 py-1 rounded-md border border-border hover:border-primary/60">
                            {p.label}
                          </button>
                        ))}
                      </div>
                      <div
                        ref={stageRef}
                        onPointerDown={onDown}
                        onPointerMove={onMove}
                        onPointerUp={onUp}
                        className="relative select-none touch-none rounded-lg overflow-hidden border border-border"
                      >
                        <img src={preview} alt="Your uploaded form screen" className="w-full block pointer-events-none" />
                        {[...boxes, ...(drag ? [drag] : [])].map((b, i) => (
                          <div
                            key={i}
                            className="absolute bg-foreground/90 border-2 border-destructive"
                            style={{ left: `${b.x * 100}%`, top: `${b.y * 100}%`, width: `${b.w * 100}%`, height: `${b.h * 100}%` }}
                          />
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground flex items-start gap-2">
                        <ShieldAlert className="size-4 text-accent shrink-0" />
                        Drag over any password, full ID number or bank detail to black it out. Masking happens on your device — only the masked, resized copy is sent.
                      </p>
                    </>
                  )}
                </div>

                <div className="flex flex-col min-h-[420px]">
                  <div className="flex-1 overflow-y-auto space-y-3 rounded-lg border border-border bg-background/40 p-3">
                    {msgs.length === 0 && (
                      <p className="text-sm text-muted-foreground">
                        Show me the screen you are stuck on, or pick the form above. I will name the form, explain each field in plain English, flag the red errors and tell you the next field to complete.
                      </p>
                    )}
                    {msgs.map((m, i) => (
                      <div key={i} className={`rounded-xl px-3 py-2 text-sm whitespace-pre-wrap ${m.role === "user" ? "bg-primary/10 ml-6" : "bg-surface-elevated mr-2"}`}>
                        {m.content}
                      </div>
                    ))}
                    {busy && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" /> Reading your screen…</div>}
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Textarea
                      value={question}
                      onChange={(e) => setQuestion(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                      rows={2}
                      placeholder="What is confusing you on this screen?"
                      className="resize-none bg-background/50 text-sm"
                    />
                    <Button onClick={send} disabled={busy} className="bg-gradient-primary text-primary-foreground shrink-0 self-end min-h-11">
                      <Send className="size-4" />
                    </Button>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-2">
                    Guidance only — it never fills in or submits anything for you, and does not replace a registered Tax Practitioner or CA(SA).
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
