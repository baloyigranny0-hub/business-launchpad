import { useEffect, useState, useCallback } from "react";

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
  completed: Record<string, boolean>; // key: `${stageId}:${stepId}`
  notes: Record<string, string>;
}

const empty: AppState = {
  onboarded: false,
  business: { name: "", idea: "", industry: "", stage: "idea", team: "solo", goal: "" },
  completed: {},
  notes: {},
};

function read(): AppState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return empty;
    return { ...empty, ...JSON.parse(raw) };
  } catch {
    return empty;
  }
}

let listeners: Array<() => void> = [];
let current: AppState = typeof window !== "undefined" ? read() : empty;

function write(next: AppState) {
  current = next;
  localStorage.setItem(KEY, JSON.stringify(next));
  listeners.forEach((l) => l());
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
    const completed = { ...current.completed, [k]: !current.completed[k] };
    write({ ...current, completed });
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
