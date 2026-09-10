import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useStore } from "@/lib/store";
import { analyzeIdea } from "@/lib/coach";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Compass, Loader2, Sparkles } from "lucide-react";
import { APP_NAME } from "@/lib/roadmap";

const Choice = ({
  options,
  value,
  onChange,
}: {
  options: { v: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) => (
  <div className="grid sm:grid-cols-3 gap-2 mt-2">
    {options.map((o) => (
      <button
        key={o.v}
        type="button"
        onClick={() => onChange(o.v)}
        className={`px-3 py-3 rounded-lg border text-sm transition-colors ${
          value === o.v
            ? "border-primary bg-primary/10 text-primary"
            : "border-border text-muted-foreground hover:text-foreground"
        }`}
      >
        {o.label}
      </button>
    ))}
  </div>
);

const Intake = () => {
  const nav = useNavigate();
  const { state, setBusiness, completeOnboarding, setAnalysis } = useStore();
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const b = state.business;

  const steps = [
    {
      title: "What are you trying to build?",
      sub: "Describe it like you'd tell a friend. No jargon needed.",
      content: (
        <div className="space-y-4">
          <div>
            <Label>Your idea, in your own words</Label>
            <Textarea
              value={b.idea}
              onChange={(e) => setBusiness({ idea: e.target.value })}
              placeholder="I want to… for… because…"
              rows={5}
              className="mt-2"
            />
          </div>
          <div>
            <Label>Working business name</Label>
            <Input
              value={b.name}
              onChange={(e) => setBusiness({ name: e.target.value })}
              placeholder="You can change this later"
              className="mt-2"
            />
          </div>
        </div>
      ),
      canNext: b.idea.trim().length > 15,
    },
    {
      title: "Who has this problem?",
      sub: "The sharper you are here, the sharper your roadmap.",
      content: (
        <div className="space-y-4">
          <div>
            <Label>Who exactly is your customer?</Label>
            <Textarea
              value={b.customer}
              onChange={(e) => setBusiness({ customer: e.target.value })}
              placeholder="e.g. Small salon owners in townships who take bookings by WhatsApp"
              rows={3}
              className="mt-2"
            />
          </div>
          <div>
            <Label>Industry</Label>
            <Input
              value={b.industry}
              onChange={(e) => setBusiness({ industry: e.target.value })}
              placeholder="e.g. Beauty services, Logistics, SaaS, Construction"
              className="mt-2"
            />
          </div>
        </div>
      ),
      canNext: !!b.customer && !!b.industry,
    },
    {
      title: "Where are you registering?",
      sub: "Compliance is local — this makes every instruction specific to you.",
      content: (
        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label>Country</Label>
              <Input value={b.country} onChange={(e) => setBusiness({ country: e.target.value })} placeholder="e.g. South Africa" className="mt-2" />
            </div>
            <div>
              <Label>City / municipality</Label>
              <Input value={b.city} onChange={(e) => setBusiness({ city: e.target.value })} placeholder="e.g. Polokwane" className="mt-2" />
            </div>
          </div>
          <div>
            <Label>Where are you today?</Label>
            <Choice
              value={b.stage}
              onChange={(v) => setBusiness({ stage: v as typeof b.stage })}
              options={[
                { v: "idea", label: "Just an idea" },
                { v: "early", label: "Early days" },
                { v: "running", label: "Already trading" },
              ]}
            />
          </div>
        </div>
      ),
      canNext: !!b.country,
    },
    {
      title: "What are you working with?",
      sub: "So the plan fits your reality, not a textbook.",
      content: (
        <div className="space-y-4">
          <div>
            <Label>Team</Label>
            <Choice
              value={b.team}
              onChange={(v) => setBusiness({ team: v as typeof b.team })}
              options={[
                { v: "solo", label: "Just me" },
                { v: "small", label: "2–5 people" },
                { v: "growing", label: "6+ people" },
              ]}
            />
          </div>
          <div>
            <Label>Starting budget</Label>
            <Choice
              value={b.budget}
              onChange={(v) => setBusiness({ budget: v as typeof b.budget })}
              options={[
                { v: "none", label: "Almost nothing" },
                { v: "small", label: "Some savings" },
                { v: "funded", label: "Funded" },
              ]}
            />
          </div>
          <div>
            <Label>What do you want to achieve in 90 days?</Label>
            <Textarea
              value={b.goal}
              onChange={(e) => setBusiness({ goal: e.target.value })}
              placeholder="e.g. Registered, compliant and 5 paying customers"
              rows={3}
              className="mt-2"
            />
          </div>
        </div>
      ),
      canNext: !!b.goal,
    },
  ];

  const cur = steps[step];
  const last = step === steps.length - 1;

  const finish = async () => {
    setBusy(true);
    try {
      const analysis = await analyzeIdea();
      setAnalysis(analysis);
      completeOnboarding();
      nav("/app");
    } catch (e) {
      completeOnboarding();
      toast.error(e instanceof Error ? e.message : "Could not build your plan", {
        description: "You can retry from the dashboard.",
      });
      nav("/app");
    } finally {
      setBusy(false);
    }
  };

  if (busy) {
    return (
      <div className="min-h-screen grid place-items-center px-6 text-center">
        <div>
          <div className="size-16 rounded-2xl bg-gradient-primary grid place-items-center shadow-glow mx-auto animate-pulse">
            <Sparkles className="size-7 text-primary-foreground" />
          </div>
          <h1 className="font-display text-3xl mt-6">Studying your idea…</h1>
          <p className="text-muted-foreground mt-2 max-w-md">
            Scoring the problem, drafting your canvas and building a roadmap for {b.city || b.country || "your area"}.
          </p>
          <Loader2 className="size-5 animate-spin text-primary mx-auto mt-8" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="container flex items-center justify-between py-6">
        <div className="flex items-center gap-2">
          <div className="size-8 rounded-lg bg-gradient-primary grid place-items-center">
            <Compass className="size-4 text-primary-foreground" />
          </div>
          <span className="font-display text-lg">{APP_NAME}</span>
        </div>
        <div className="text-xs text-muted-foreground">
          Step {step + 1} of {steps.length}
        </div>
      </header>

      <div className="flex-1 container max-w-xl flex flex-col justify-center pb-20">
        <div className="h-1 w-full bg-surface rounded-full overflow-hidden mb-10">
          <div className="h-full bg-gradient-primary transition-all" style={{ width: `${((step + 1) / steps.length) * 100}%` }} />
        </div>

        <h1 className="font-display text-4xl">{cur.title}</h1>
        <p className="text-muted-foreground mt-2 mb-8">{cur.sub}</p>

        <div className="rounded-2xl bg-gradient-card border border-border p-6 shadow-card">{cur.content}</div>

        <div className="flex items-center justify-between mt-8">
          <Button variant="ghost" onClick={() => (step === 0 ? nav("/") : setStep(step - 1))}>
            <ArrowLeft className="mr-1 size-4" /> Back
          </Button>
          <Button
            disabled={!cur.canNext}
            onClick={() => (last ? finish() : setStep(step + 1))}
            className="bg-gradient-primary text-primary-foreground hover:opacity-90"
          >
            {last ? "Build my roadmap" : "Continue"} <ArrowRight className="ml-1 size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Intake;
