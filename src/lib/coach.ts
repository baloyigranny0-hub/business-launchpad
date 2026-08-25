import { supabase } from "@/integrations/supabase/client";
import { coachContext, type Analysis } from "@/lib/store";

async function invoke<T>(body: Record<string, unknown>): Promise<T> {
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
