import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Compass, ShieldCheck, Sparkles, Cog, Megaphone, TrendingUp, FileText, ArrowRight } from "lucide-react";
import { APP_NAME, STAGES } from "@/lib/roadmap";

const Landing = () => {
  return (
    <div className="min-h-screen">
      {/* Nav */}
      <header className="container flex items-center justify-between py-6">
        <div className="flex items-center gap-2">
          <div className="size-9 rounded-xl bg-gradient-primary grid place-items-center shadow-glow">
            <Compass className="size-5 text-primary-foreground" />
          </div>
          <span className="font-display text-xl">{APP_NAME}</span>
        </div>
        <Button asChild variant="ghost"><Link to="/app">Open app</Link></Button>
      </header>

      {/* Hero */}
      <section className="relative">
        <div className="absolute inset-0 grid-bg opacity-30 [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]" />
        <div className="container relative pt-16 pb-24 text-center max-w-4xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/60 px-4 py-1.5 text-xs text-muted-foreground mb-8">
            <span className="size-1.5 rounded-full bg-primary animate-pulse" />
            Your founder companion — idea to scale
          </div>
          <h1 className="font-display text-5xl md:text-7xl font-medium leading-[1.05] tracking-tight">
            The command center for <span className="text-gradient">first-time founders.</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
            {APP_NAME} guides you from raw idea to a compliant, branded, operational business — one clear next action at a time.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg" className="bg-gradient-primary text-primary-foreground hover:opacity-90 shadow-glow">
              <Link to="/onboarding">Start your business <ArrowRight className="ml-1 size-4" /></Link>
            </Button>
            <Button asChild size="lg" variant="outline"><Link to="/app">Explore dashboard</Link></Button>
          </div>
        </div>
      </section>

      {/* Stages */}
      <section className="container pb-24">
        <div className="text-center mb-12">
          <div className="text-sm text-primary font-medium uppercase tracking-widest">The journey</div>
          <h2 className="font-display text-4xl mt-2">Six stages. One clear path.</h2>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {STAGES.map((s, i) => (
            <div key={s.id} className="group relative rounded-2xl bg-gradient-card border border-border p-6 hover:border-primary/40 transition-colors shadow-soft">
              <div className="flex items-center justify-between mb-6">
                <div className="size-11 rounded-xl bg-primary/10 grid place-items-center text-primary">
                  <s.icon className="size-5" />
                </div>
                <span className="text-xs text-muted-foreground font-mono">0{i + 1}</span>
              </div>
              <h3 className="font-display text-xl">{s.title}</h3>
              <p className="text-sm text-muted-foreground mt-1">{s.tagline}</p>
              <div className="mt-4 text-xs text-muted-foreground">{s.steps.length} guided steps</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container pb-24">
        <div className="relative overflow-hidden rounded-3xl border border-border bg-gradient-card p-12 text-center">
          <div className="absolute inset-0 bg-gradient-primary opacity-[0.06]" />
          <h2 className="font-display text-4xl">Stop guessing what to do next.</h2>
          <p className="text-muted-foreground mt-3 max-w-xl mx-auto">A calm, structured path from idea to revenue. Built for founders who'd rather build than research.</p>
          <Button asChild size="lg" className="mt-8 bg-gradient-primary text-primary-foreground hover:opacity-90">
            <Link to="/onboarding">Build my roadmap</Link>
          </Button>
        </div>
      </section>

      <footer className="container py-8 text-center text-xs text-muted-foreground">© {new Date().getFullYear()} {APP_NAME}</footer>
    </div>
  );
};

export default Landing;
