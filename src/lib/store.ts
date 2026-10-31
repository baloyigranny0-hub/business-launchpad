import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { PhaseId } from "@/lib/roadmap";
import type { ExecutionTask, StressTest } from "@/lib/execution";

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
  experience: "novice" | "some" | "experienced";
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

export interface ComplianceState {
  packId: string;
  packLabel: string;
  content: string;
  updatedAt?: string;
}

export interface AppState {
  onboarded: boolean;
  business: BusinessProfile;
  completed: Record<string, boolean>;
  notes: Record<string, string>;
  canvas: Record<string, string>;
  analysis: Analysis | null;
  compliance: ComplianceState;
  execution: ExecutionTask[];
  stress: StressTest | null;
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
  experience: "novice",
  goal: "",
};

const empty: AppState = {
  onboarded: false,
  business: emptyBusiness,
  completed: {},
  notes: {},
  canvas: {},
  analysis: null,
  compliance: { packId: "", packLabel: "", content: "" },
  execution: [],
  stress: null,
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
let cloudReady = false;

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
    industry_compliance: state.compliance as never,
    execution_plan: state.execution as never,
    stress_test: (state.stress ?? {}) as never,
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
  cloudReady = false;
  if (!userId) {
    current = empty;
    persistLocal(current);
    cloudReady = true;
    notify();
    return;
  }

  const { data, error } = await supabase
    .from("workspaces")
    .select("business, completed, notes, onboarded, lean_canvas, plan, industry_compliance, execution_plan, stress_test")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("Workspace fetch failed", error);
    cloudReady = true;
    notify();
    return;
  }

  if (data) {
    const plan = (data.plan ?? {}) as Partial<Analysis>;
    current = {
      onboarded: data.onboarded ?? false,
      business: { ...emptyBusiness, ...((data.business ?? {}) as Partial<BusinessProfile>) },
      completed: (data.completed ?? {}) as Record<string, boolean>,
      notes: (data.notes ?? {}) as Record<string, string>,
      canvas: (data.lean_canvas ?? {}) as Record<string, string>,
      analysis: plan && plan.summary ? (plan as Analysis) : null,
      compliance: { ...empty.compliance, ...((data.industry_compliance ?? {}) as Partial<ComplianceState>) },
      execution: Array.isArray(data.execution_plan) ? (data.execution_plan as ExecutionTask[]) : [],
      stress: (data.stress_test as Partial<StressTest> | null)?.risks ? (data.stress_test as StressTest) : null,
    };
    persistLocal(current);
    notify();
  } else {
    await pushCloud(current);
  }
  cloudReady = true;
  notify();
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
  const setCompliance = useCallback((value: Partial<ComplianceState>) => {
    write({ ...current, compliance: { ...current.compliance, ...value } });
  }, []);
  const setExecution = useCallback((tasks: ExecutionTask[]) => {
    write({ ...current, execution: tasks });
  }, []);
  const toggleTask = useCallback((taskId: string) => {
    write({
      ...current,
      execution: current.execution.map((t) =>
        t.id === taskId
          ? t.status === "done"
            ? { ...t, status: "open", doneAt: undefined }
            : { ...t, status: "done", doneAt: new Date().toISOString() }
          : t
      ),
    });
  }, []);
  const setStress = useCallback((test: StressTest | null) => {
    write({ ...current, stress: test });
  }, []);
  const reset = useCallback(() => write(empty), []);

  return {
    state: current,
    cloudReady,
    setBusiness,
    completeOnboarding,
    toggleStep,
    setNote,
    setCanvas,
    setAnalysis,
    setCompliance,
    setExecution,
    toggleTask,
    setStress,
    reset,
  };
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
  const execution = Array.isArray(s.execution) ? s.execution : [];
  const open = execution.filter((t) => t.status === "open");
  return {
    business: s.business,
    lean_canvas: s.canvas,
    completed_steps: Object.keys(s.completed).filter((k) => s.completed[k]),
    current_phase: s.analysis?.phase ?? "concept",
    compliance_pack: s.compliance.packLabel || undefined,
    execution_summary: {
      open_tasks: open.length,
      overdue_tasks: open.filter((t) => t.due < new Date().toISOString().slice(0, 10)).length,
      next_tasks: open.sort((a, b) => a.due.localeCompare(b.due)).slice(0, 8).map((t) => ({ title: t.title, due: t.due, priority: t.priority })),
    },
  };
}

export function hasIndustryContext() {
  const business = current.business;
  return Boolean(business.idea.trim() && business.customer.trim() && business.industry.trim() && business.country.trim() && business.city.trim());
}
