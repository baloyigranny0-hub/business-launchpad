import { supabase } from "@/integrations/supabase/client";
import { coachContext, hasIndustryContext, type Analysis } from "@/lib/store";

async function invoke<T>(body: Record<string, unknown>): Promise<T> {
  if (!hasIndustryContext()) throw new Error("Add your industry, country, city, customer and business idea before asking the coach.");
  const { data, error } = await supabase.functions.invoke("ai-coach", { body });
  if (error) {
    const msg = (data as { error?: string } | null)?.error ?? error.message;
    throw new Error(msg || "The coach could not be reached.");
  }
  if ((data as { error?: string })?.error) throw new Error((data as { error: string }).error);
  return data as T;
}

export function analyzeIdea() {
  return invoke<Analysis>({ action: "analyze", context: coachContext() });
}

export function askCoach(question: string, history: { role: string; content: string }[]) {
  return invoke<{ text: string }>({ action: "ask", question, history, context: coachContext() });
}

export function draftDocument(target: string) {
  return invoke<{ text: string }>({ action: "draft", target, context: coachContext() });
}

export function generateCompliancePack(packId: string, packLabel: string, focus: string[]) {
  return invoke<{ text: string }>({ action: "compliance", packId, packLabel, focus, context: coachContext() });
}

export function askFormCoach(args: {
  formId?: string;
  formLabel?: string;
  formSection?: string;
  question?: string;
  image?: string;
  history: { role: string; content: string }[];
}) {
  return invoke<{ text: string }>({ action: "formscreen", ...args, context: coachContext() });
}

export type OrchestratorTask = {
  title: string;
  detail: string;
  due_day: number;
  priority: "high" | "medium" | "low";
  category: "registration" | "compliance" | "documents" | "branding" | "operations" | "marketing" | "sales" | "finance" | "validation" | "growth";
  institution: string | null;
  requires_approval: boolean;
};

export type StressResult = {
  verdict: string;
  risks: {
    vector: "cash-flow" | "pricing" | "fixed-overheads" | "demand" | "competition" | "compliance" | "capacity" | "key-person";
    severity: "high" | "medium" | "low";
    title: string;
    evidence: string;
    mitigation: string;
    horizon: "now" | "30 days" | "90 days";
  }[];
};

/** Autonomous execution brain: decomposes the 90-day plan into dated micro-tasks. */
export function runOrchestrator() {
  return invoke<{ tasks: OrchestratorTask[] }>({ action: "orchestrate", context: coachContext() });
}

/** Failure/risk diagnostic: audits the idea against real startup failure vectors. */
export function runStressTest() {
  return invoke<StressResult>({ action: "stress", context: coachContext() });
}

