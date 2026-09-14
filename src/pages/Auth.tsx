import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Compass, Mail, Chrome } from "lucide-react";
import { APP_NAME } from "@/lib/roadmap";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";

const Auth = () => {
  const nav = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [forgot, setForgot] = useState(false);
  const from = (location.state as { from?: string } | null)?.from ?? sessionStorage.getItem("foundry-auth-return") ?? "/app";

  useEffect(() => {
    if (!user) return;
    sessionStorage.removeItem("foundry-auth-return");
    nav(from, { replace: true });
  }, [from, nav, user]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (forgot) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
        if (error) throw error;
        toast({ title: "Check your email", description: "Use the recovery link to choose a new password." });
      } else if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/auth` },
        });
        if (error) throw error;
        toast({ title: "Check your email", description: "Confirm your address to finish signing up." });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        nav(from);
      }
    } catch (err: any) {
      toast({ title: "Auth error", description: err.message ?? "Something went wrong", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    sessionStorage.setItem("foundry-auth-return", from);
    const { error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${window.location.origin}/auth` } });
    if (error) toast({ title: "Could not continue with Google", description: error.message, variant: "destructive" });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="container flex items-center justify-between py-6">
        <Link to="/" className="flex items-center gap-2">
          <div className="size-8 rounded-lg bg-gradient-primary grid place-items-center">
            <Compass className="size-4 text-primary-foreground" />
          </div>
          <span className="font-display text-lg">{APP_NAME}</span>
        </Link>
      </header>
      <div className="flex-1 container max-w-md flex flex-col justify-center pb-20">
        <h1 className="font-display text-4xl">{forgot ? "Reset your password" : mode === "signin" ? "Welcome back" : "Create your account"}</h1>
        <p className="text-muted-foreground mt-2 mb-8">
          {forgot ? "We’ll email you a secure recovery link." : mode === "signin" ? "Sign in to open your private business workspace." : "Create your private business workspace."}
        </p>
        {!forgot && <Button type="button" variant="outline" className="w-full mb-4" onClick={google}><Chrome className="size-4 mr-2" /> Continue with Google</Button>}
        {!forgot && <div className="flex items-center gap-3 mb-4 text-xs text-muted-foreground"><span className="h-px bg-border flex-1" /><span>or use email</span><span className="h-px bg-border flex-1" /></div>}
        <form onSubmit={submit} className="rounded-2xl bg-gradient-card border border-border p-6 space-y-4 shadow-card">
          {!forgot && <div>
            <Label>Email</Label>
            <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-2" />
          </div>}
          <div>
            <Label>Password</Label>
            <Input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="mt-2" />
          </div>
          <Button type="submit" disabled={busy} className="w-full bg-gradient-primary text-primary-foreground hover:opacity-90">
            {busy ? "Please wait…" : forgot ? <><Mail className="size-4 mr-2" /> Send recovery link</> : mode === "signin" ? "Sign in" : "Create account"}
          </Button>
        </form>
        {mode === "signin" && <button type="button" onClick={() => setForgot(!forgot)} className="mt-4 text-sm text-primary">{forgot ? "Back to sign in" : "Forgot password?"}</button>}
        <button
          type="button"
          onClick={() => { setForgot(false); setMode(mode === "signin" ? "signup" : "signin"); }}
          className="mt-6 text-sm text-muted-foreground hover:text-foreground"
        >
          {mode === "signin" ? "No account? Sign up" : "Already have an account? Sign in"}
        </button>
      </div>
    </div>
  );
};

export default Auth;
