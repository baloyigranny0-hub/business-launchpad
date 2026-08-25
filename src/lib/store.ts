import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { PhaseId } from "@/lib/roadmap";

const KEY = "foundry-state-v2";

export interface BusinessProfile {
  name: string;
  idea: string;
  industry: string;
  country: string;
  city: string;
  customer: string;
  stage: "idea" | "early" | "running";
  team: "solo" | "small" | "growing";
  budget: "none" | "small" | "funded";
  goal: string;
}

export interface PwsCriterion {
  key: string;
  score: number;
  reason: string;
}

export interface Analysis {
  summary: string;
  phase: PhaseId;
  phase_reason: string;
  pws: { verdict: string; criteria: PwsCriterion[] };
  canvas: Record<string, string>;
  readiness: { fit: number; model: number; prototype: number; market: number };
  priorities: { title: string; stageId: string; why: string }[];
  generatedAt?: string;
}

export interface AppState {
  onboarded: boolean;
  business: BusinessProfile;
  completed: Record<string, boolean>;
  notes: Record<string, string>;
  canvas: Record<string, string>;
  analysis: Analysis | null;
}

const emptyBusiness: BusinessProfile = {
  name: "",
  idea: "",
  industry: "",
  country: "",
  city: "",
  customer: "",
  stage: "idea",
  team: "solo",
  budget: "none",
  goal: "",
};

const empty: AppState = {
  onboarded: false,
  business: emptyBusiness,
  completed: {},
  notes: {},
  canvas: {},
  analysis: null,
};

function readLocal(): AppState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return empty;
    const parsed = JSON.parse(raw);
    return { ...empty, ...parsed, business: { ...emptyBusiness, ...(parsed.business ?? {}) } };
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
  const { error } = await supabase.from("workspaces").upsert({
    user_id: cloudUserId,
    business: state.business as never,
    completed: state.completed as never,
    notes: state.notes as never,
    lean_canvas: state.canvas as never,
    plan: (state.analysis ?? {}) as never,
    onboarded: state.onboarded,
  });
  if (error) console.error("Workspace sync failed", error);
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

export async function bindCloud(userId: string | null) {
  cloudUserId = userId;
  if (!userId) return;

  const { data, error } = await supabase
    .from("workspaces")
    .select("business, completed, notes, onboarded, lean_canvas, plan")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("Workspace fetch failed", error);
    return;
  }

  if (data) {
    const plan = (data.plan ?? {}) as Partial<Analysis>;
    current = {
      onboarded: data.onboarded ?? false,
      business: { ...emptyBusiness, ...((data.business ?? {}) as Partial<BusinessProfile>) },
      completed: ((data.completed ?? {}) as Record<string, boolean>) ?? {},
      notes: ((data.notes ?? {}) as Record<string, string>) ?? {},
      canvas: ((data.lean_canvas ?? {}) as Record<string, string>) ?? {},
      analysis: plan && plan.summary ? (plan as Analysis) : null,
    };
    persistLocal(current);
    notify();
  } else {
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
  const setCanvas = useCallback((key: string, value: string) => {
    write({ ...current, canvas: { ...current.canvas, [key]: value } });
  }, []);
  const setAnalysis = useCallback((a: Analysis) => {
    write({
      ...current,
      analysis: { ...a, generatedAt: new Date().toISOString() },
      canvas: { ...a.canvas, ...current.canvas },
    });
  }, []);
  const reset = useCallback(() => write(empty), []);

  return { state: current, setBusiness, completeOnboarding, toggleStep, setNote, setCanvas, setAnalysis, reset };
}

export function isStepDone(state: AppState, stageId: string, stepId: string) {
  return !!state.completed[`${stageId}:${stepId}`];
}

export function getState() {
  return current;
}

/** Compact context object sent to the AI coach. */
export function coachContext() {
  const s = current;
  return {
    business: s.business,
    lean_canvas: s.canvas,
    completed_steps: Object.keys(s.completed).filter((k) => s.completed[k]),
    current_phase: s.analysis?.phase ?? "concept",
  };
}
