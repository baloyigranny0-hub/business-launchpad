import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthCtx {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
  profile: { display_name: string; preferred_industry: string; country: string; city: string; onboarding_complete: boolean } | null;
  saveProfile: (updates: Partial<{ display_name: string; preferred_industry: string; country: string; city: string; onboarding_complete: boolean }>) => Promise<void>;
}

const Ctx = createContext<AuthCtx>({ user: null, session: null, loading: true, signOut: async () => {}, profile: null, saveProfile: async () => {} });

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<AuthCtx["profile"]>(null);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const user = session?.user;
    if (!user) { setProfile(null); return; }
    supabase.from("profiles").select("display_name, preferred_industry, country, city, onboarding_complete").eq("user_id", user.id).maybeSingle().then(async ({ data }) => {
      if (data) { setProfile(data); return; }
      const initial = { user_id: user.id, display_name: String(user.user_metadata?.full_name ?? "") };
      const { data: created } = await supabase.from("profiles").upsert(initial).select("display_name, preferred_industry, country, city, onboarding_complete").single();
      setProfile(created ?? null);
    });
  }, [session?.user]);

  return (
    <Ctx.Provider
      value={{
        user: session?.user ?? null,
        session,
        profile,
        loading,
        saveProfile: async (updates) => {
          const user = session?.user;
          if (!user) return;
          const { data, error } = await supabase.from("profiles").upsert({ user_id: user.id, ...updates }).select("display_name, preferred_industry, country, city, onboarding_complete").single();
          if (error) throw error;
          setProfile(data);
        },
        signOut: async () => {
          await supabase.auth.signOut();
        },
      }}
    >
      {children}
    </Ctx.Provider>
  );
};

export const useAuth = () => useContext(Ctx);
