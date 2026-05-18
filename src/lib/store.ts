import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

const KEY = "foundry-state-v1";

export interface BusinessProfile {
  name: string;
  idea: string;
  industry: string;
  stage: "idea" | "early" | "running";
  team: "solo" | "small" | "growing";
  goal: string;
}

export interface AppState {
  onboarded: boolean;
  business: BusinessProfile;
  completed: Record<string, boolean>;
  notes: Record<string, string>;
}

const empty: AppState = {
  onboarded: false,
  business: { name: "", idea: "", industry: "", stage: "idea", team: "solo", goal: "" },
  completed: {},
  notes: {},
};

function readLocal(): AppState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return empty;
    return { ...empty, ...JSON.parse(raw) };
  } catch {
    return empty;
  }
}

let listeners: Array<() => void> = [];
let current: AppState = typeof window !== "undefined" ? readLocal() : empty;
let cloudUserId: string | null = null;
let syncTimer: ReturnType<typeof setTimeout> | null = null;

function notify() {
  listeners.forEach((l) => l());
}

function persistLocal(next: AppState) {
  localStorage.setItem(KEY, JSON.stringify(next));
}

async function pushCloud(state: AppState) {
  if (!cloudUserId) return;
  await supabase.from("workspaces").upsert({
    user_id: cloudUserId,
    business: state.business as any,
    completed: state.completed as any,
    notes: state.notes as any,
    onboarded: state.onboarded,
  });
}

function schedulePush() {
  if (syncTimer) clearTimeout(syncTimer);
  syncTimer = setTimeout(() => pushCloud(current), 600);
}

function write(next: AppState) {
  current = next;
  persistLocal(next);
  notify();
  schedulePush();
}

// Initialize cloud sync once a user logs in / out
export async function bindCloud(userId: string | null) {
  cloudUserId = userId;
  if (!userId) return;

  // Pull existing cloud state
  const { data, error } = await supabase
    .from("workspaces")
    .select("business, completed, notes, onboarded")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("Workspace fetch failed", error);
    return;
  }

  if (data) {
    // Cloud wins on login
    current = {
      onboarded: data.onboarded ?? false,
      business: { ...empty.business, ...(data.business as any) },
      completed: (data.completed as any) ?? {},
      notes: (data.notes as any) ?? {},
    };
    persistLocal(current);
    notify();
  } else {
    // No cloud row yet — push current local state
    await pushCloud(current);
  }
}

export function useStore() {
  const [, setTick] = useState(0);
  useEffect(() => {
    const l = () => setTick((t) => t + 1);
    listeners.push(l);
    return () => {
      listeners = listeners.filter((x) => x !== l);
    };
  }, []);

  const setBusiness = useCallback((b: Partial<BusinessProfile>) => {
    write({ ...current, business: { ...current.business, ...b } });
  }, []);
  const completeOnboarding = useCallback(() => {
    write({ ...current, onboarded: true });
  }, []);
  const toggleStep = useCallback((stageId: string, stepId: string) => {
    const k = `${stageId}:${stepId}`;
    write({ ...current, completed: { ...current.completed, [k]: !current.completed[k] } });
  }, []);
  const setNote = useCallback((stageId: string, stepId: string, note: string) => {
    const k = `${stageId}:${stepId}`;
    write({ ...current, notes: { ...current.notes, [k]: note } });
  }, []);
  const reset = useCallback(() => write(empty), []);

  return { state: current, setBusiness, completeOnboarding, toggleStep, setNote, reset };
}

export function isStepDone(state: AppState, stageId: string, stepId: string) {
  return !!state.completed[`${stageId}:${stepId}`];
}
