import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useStore } from "@/lib/store";
import { ArrowLeft, ArrowRight, Compass } from "lucide-react";
import { APP_NAME } from "@/lib/roadmap";

const Onboarding = () => {
  const nav = useNavigate();
  const { state, setBusiness, completeOnboarding } = useStore();
  const [step, setStep] = useState(0);
  const b = state.business;

  const steps = [
    {
      title: "What's the business?",
      sub: "A working name is fine — you can change it later.",
      content: (
        <div className="space-y-4">
          <div>
            <Label>Business name</Label>
            <Input value={b.name} onChange={(e) => setBusiness({ name: e.target.value })} placeholder="e.g. Northwind Studio" className="mt-2" />
          </div>
          <div>
            <Label>The idea, in one paragraph</Label>
            <Textarea value={b.idea} onChange={(e) => setBusiness({ idea: e.target.value })} placeholder="What you do, who it's for, and why it matters." rows={5} className="mt-2" />
          </div>
        </div>
      ),
      canNext: !!b.name && !!b.idea,
    },
    {
      title: "Tell us about your industry",
      sub: "We'll tailor the roadmap to fit.",
      content: (
        <div className="space-y-4">
          <div>
            <Label>Industry</Label>
            <Input value={b.industry} onChange={(e) => setBusiness({ industry: e.target.value })} placeholder="e.g. Consulting, SaaS, Café, Construction" className="mt-2" />
          </div>
          <div>
            <Label>Where are you today?</Label>
            <div className="grid grid-cols-3 gap-2 mt-2">
              {(["idea", "early", "running"] as const).map((s) => (
                <button key={s} type="button" onClick={() => setBusiness({ stage: s })}
                  className={`px-3 py-3 rounded-lg border text-sm capitalize transition-colors ${b.stage === s ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground"}`}>
                  {s === "idea" ? "Just an idea" : s === "early" ? "Early days" : "Already running"}
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label>Team</Label>
            <div className="grid grid-cols-3 gap-2 mt-2">
              {(["solo", "small", "growing"] as const).map((s) => (
                <button key={s} type="button" onClick={() => setBusiness({ team: s })}
                  className={`px-3 py-3 rounded-lg border text-sm capitalize transition-colors ${b.team === s ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground"}`}>
                  {s === "solo" ? "Solo founder" : s === "small" ? "2–5 people" : "6+ people"}
                </button>
              ))}
            </div>
          </div>
        </div>
      ),
      canNext: !!b.industry,
    },
    {
      title: "Your 90-day goal",
      sub: "One sharp goal beats a list of five.",
      content: (
        <div>
          <Label>What do you want to achieve in 90 days?</Label>
          <Textarea value={b.goal} onChange={(e) => setBusiness({ goal: e.target.value })} placeholder="e.g. Land first 5 paying clients" rows={4} className="mt-2" />
        </div>
      ),
      canNext: !!b.goal,
    },
  ];

  const cur = steps[step];
  const last = step === steps.length - 1;

  return (
    <div className="min-h-screen flex flex-col">
      <header className="container flex items-center justify-between py-6">
        <div className="flex items-center gap-2">
          <div className="size-8 rounded-lg bg-gradient-primary grid place-items-center"><Compass className="size-4 text-primary-foreground" /></div>
          <span className="font-display text-lg">{APP_NAME}</span>
        </div>
        <div className="text-xs text-muted-foreground">Step {step + 1} of {steps.length}</div>
      </header>

      <div className="flex-1 container max-w-xl flex flex-col justify-center pb-20">
        <div className="h-1 w-full bg-surface rounded-full overflow-hidden mb-10">
          <div className="h-full bg-gradient-primary transition-all" style={{ width: `${((step + 1) / steps.length) * 100}%` }} />
        </div>

        <h1 className="font-display text-4xl">{cur.title}</h1>
        <p className="text-muted-foreground mt-2 mb-8">{cur.sub}</p>

        <div className="rounded-2xl bg-gradient-card border border-border p-6 shadow-card">
          {cur.content}
        </div>

        <div className="flex items-center justify-between mt-8">
          <Button variant="ghost" onClick={() => (step === 0 ? nav("/") : setStep(step - 1))}>
            <ArrowLeft className="mr-1 size-4" /> Back
          </Button>
          <Button
            disabled={!cur.canNext}
            onClick={() => {
              if (last) { completeOnboarding(); nav("/app"); }
              else setStep(step + 1);
            }}
            className="bg-gradient-primary text-primary-foreground hover:opacity-90"
          >
            {last ? "Generate roadmap" : "Continue"} <ArrowRight className="ml-1 size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
