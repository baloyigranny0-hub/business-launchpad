import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [recovery, setRecovery] = useState(window.location.hash.includes("type=recovery"));
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setRecovery(true);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Password updated");
    navigate("/app");
  };

  return (
    <main className="min-h-screen grid place-items-center px-6">
      <div className="w-full max-w-md">
        <h1 className="font-display text-4xl">Set a new password</h1>
        <p className="text-muted-foreground mt-2 mb-7">Choose at least eight characters for your Foundry account.</p>
        {recovery ? (
          <form onSubmit={submit} className="border border-border bg-gradient-card p-6 space-y-4 rounded-lg">
            <div><Label>New password</Label><Input className="mt-2" type="password" minLength={8} required value={password} onChange={(e) => setPassword(e.target.value)} /></div>
            <Button className="w-full" disabled={busy}>{busy ? "Updating…" : "Update password"}</Button>
          </form>
        ) : (
          <div className="border border-border bg-gradient-card p-6 rounded-lg text-sm text-muted-foreground">Open the recovery link from your email to continue.</div>
        )}
        <Link className="inline-block mt-5 text-sm text-primary" to="/auth">Back to sign in</Link>
      </div>
    </main>
  );
};

export default ResetPassword;