import React, { useState } from "react";
import Logo from "@/components/Logo";
import { resetPassword, signInWithEmail, signUpWithEmail } from "@/lib/firebaseAuth";

export default function AuthGate() {
  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const isSignup = mode === "signup";

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      if (isSignup) await signUpWithEmail(email, password);
      else await signInWithEmail(email, password);
    } catch (error) {
      setMessage(error?.message || "Could not sign in. Check your details and try again.");
    } finally {
      setBusy(false);
    }
  };

  const forgot = async () => {
    if (!email) {
      setMessage("Enter your email first, then request a reset link.");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      await resetPassword(email);
      setMessage("Password reset email sent.");
    } catch (error) {
      setMessage(error?.message || "Could not send reset email.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0F1A] text-white grid place-items-center px-4">
      <form onSubmit={submit} className="w-full max-w-sm border border-white/10 bg-white/[0.03] rounded-lg p-6 shadow-2xl">
        <div className="mb-6">
          <Logo size={28} />
          <h1 className="mt-6 font-display text-2xl">{isSignup ? "Create your Foundry account" : "Sign in to Foundry"}</h1>
          <p className="mt-2 text-sm text-slate-400">
            Your profile, vault, tasks, and AI history are saved against your account.
          </p>
        </div>

        <label className="block text-xs uppercase tracking-[0.18em] text-slate-500">Email</label>
        <input
          className="mt-2 mb-4 w-full rounded-md border border-white/10 bg-[#0F172A] px-3 py-2 text-sm outline-none focus:border-[#38BDF8]"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />

        <label className="block text-xs uppercase tracking-[0.18em] text-slate-500">Password</label>
        <input
          className="mt-2 mb-4 w-full rounded-md border border-white/10 bg-[#0F172A] px-3 py-2 text-sm outline-none focus:border-[#38BDF8]"
          type="password"
          autoComplete={isSignup ? "new-password" : "current-password"}
          minLength={6}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />

        {message && <div className="mb-4 rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-slate-300">{message}</div>}

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-md bg-[#38BDF8] px-4 py-2 text-sm font-semibold text-[#0A0F1A] disabled:opacity-60"
        >
          {busy ? "Working..." : isSignup ? "Create account" : "Sign in"}
        </button>

        <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
          <button type="button" onClick={() => setMode(isSignup ? "signin" : "signup")} className="hover:text-white">
            {isSignup ? "Already have an account?" : "Create an account"}
          </button>
          {!isSignup && (
            <button type="button" onClick={forgot} className="hover:text-white">
              Forgot password?
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
