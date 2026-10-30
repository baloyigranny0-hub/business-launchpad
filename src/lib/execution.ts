export type TaskPriority = "high" | "medium" | "low";

export type TaskCategory =
  | "registration"
  | "compliance"
  | "documents"
  | "branding"
  | "operations"
  | "marketing"
  | "sales"
  | "finance"
  | "validation"
  | "growth";

export interface ExecutionTask {
  id: string;
  title: string;
  detail: string;
  /** Day offset (1–90) from when the plan was generated. */
  day: number;
  /** Concrete due date (yyyy-mm-dd), computed when the plan is built. */
  due: string;
  priority: TaskPriority;
  category: TaskCategory;
  institution?: string;
  /** High-stakes action — Foundry prepares it, the founder must approve before anything is sent. */
  requiresApproval?: boolean;
  status: "open" | "done";
  doneAt?: string;
}

export type RiskVector =
  | "cash-flow"
  | "pricing"
  | "fixed-overheads"
  | "demand"
  | "competition"
  | "compliance"
  | "capacity"
  | "key-person";

export interface StressRisk {
  id: string;
  vector: RiskVector;
  severity: "high" | "medium" | "low";
  title: string;
  evidence: string;
  mitigation: string;
  horizon: "now" | "30 days" | "90 days";
  dismissed?: boolean;
}

export interface StressTest {
  verdict: string;
  risks: StressRisk[];
  updatedAt: string;
}

export const CATEGORY_META: Record<TaskCategory, { label: string }> = {
  registration: { label: "Registration" },
  compliance: { label: "Compliance" },
  documents: { label: "Documents" },
  branding: { label: "Branding" },
  operations: { label: "Operations" },
  marketing: { label: "Marketing" },
  sales: { label: "Sales" },
  finance: { label: "Money" },
  validation: { label: "Validation" },
  growth: { label: "Growth" },
};

export const VECTOR_META: Record<RiskVector, { label: string }> = {
  "cash-flow": { label: "Cash flow" },
  pricing: { label: "Pricing" },
  "fixed-overheads": { label: "Fixed overheads" },
  demand: { label: "Demand" },
  competition: { label: "Competition" },
  compliance: { label: "Compliance cost" },
  capacity: { label: "Founder capacity" },
  "key-person": { label: "Key person" },
};

/** yyyy-mm-dd for day N after the plan was generated (day 1 = the start date). */
export function dueDateFrom(startISO: string, day: number): string {
  const start = new Date(startISO);
  start.setDate(start.getDate() + (Math.max(1, Math.round(day)) - 1));
  return start.toISOString().slice(0, 10);
}

export function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export type TaskBucket = "overdue" | "today" | "week" | "later";

export function taskBucket(task: ExecutionTask, today = todayISO()): TaskBucket {
  if (task.due < today) return "overdue";
  if (task.due === today) return "today";
  const limit = new Date(today);
  limit.setDate(limit.getDate() + 7);
  if (task.due <= limit.toISOString().slice(0, 10)) return "week";
  return "later";
}

export function groupTasks(tasks: ExecutionTask[], today = todayISO()) {
  const groups: Record<TaskBucket, ExecutionTask[]> = { overdue: [], today: [], week: [], later: [] };
  for (const t of tasks) if (t.status === "open") groups[taskBucket(t, today)].push(t);
  (Object.keys(groups) as TaskBucket[]).forEach((k) => groups[k].sort((a, b) => a.due.localeCompare(b.due) || a.day - b.day));
  return groups;
}

/** Next open task the founder should act on. */
export function nextTask(tasks: ExecutionTask[], today = todayISO()): ExecutionTask | undefined {
  return groupTasks(tasks, today).overdue[0] ?? groupTasks(tasks, today).today[0] ?? groupTasks(tasks, today).week[0] ?? groupTasks(tasks, today).later[0];
}

export function activeRisks(test: StressTest | null): StressRisk[] {
  return (test?.risks ?? []).filter((r) => r.severity === "high" && !r.dismissed);
}

export const PRIORITY_CLASS: Record<TaskPriority, string> = {
  high: "text-primary",
  medium: "text-foreground",
  low: "text-muted-foreground",
};

export const PRIORITY_DOT: Record<TaskPriority, string> = {
  high: "bg-primary",
  medium: "bg-primary/50",
  low: "bg-muted-foreground/40",
};
