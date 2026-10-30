import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { runOrchestrator } from "@/lib/coach";
import {
  type ExecutionTask,
  type TaskBucket,
  CATEGORY_META,
  PRIORITY_DOT,
  dueDateFrom,
  groupTasks,
  todayISO,
} from "@/lib/execution";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Bot,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Loader2,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";

const BUCKET_META: Record<TaskBucket, { label: string; hint: string }> = {
  overdue: { label: "Overdue", hint: "Past its deadline — move it up or reschedule it" },
  today: { label: "Due today", hint: "Do these before you close the laptop" },
  week: { label: "This week", hint: "Next 7 days" },
  later: { label: "Coming up", hint: "Scheduled for later in your 90-day plan" },
};

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const Execution = () => {
  const { state, setExecution, toggleTask } = useStore();
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState("tasks");
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return { y: d.getFullYear(), m: d.getMonth() };
  });

  const tasks = state.execution;
  const groups = useMemo(() => groupTasks(tasks), [tasks]);
  const openCount = tasks.filter((t) => t.status === "open").length;

  const build = async () => {
    setBusy(true);
    try {
      const result = await runOrchestrator();
      const startISO = new Date().toISOString();
      const planned: ExecutionTask[] = (result.tasks ?? []).map((t, i) => ({
        id: `t${Date.now()}-${i}`,
        title: t.title,
        detail: t.detail,
        day: t.due_day,
        due: dueDateFrom(startISO, t.due_day),
        priority: t.priority,
        category: t.category,
        institution: t.institution ?? undefined,
        requiresApproval: t.requires_approval,
        status: "open",
      }));
      setExecution(planned);
      toast.success("Execution plan built", { description: `${planned.length} micro-tasks scheduled with deadlines.` });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not build the execution plan");
    } finally {
      setBusy(false);
    }
  };

  // Calendar grid for the current month.
  const grid = useMemo(() => {
    const first = new Date(cursor.y, cursor.m, 1);
    const startPad = first.getDay(); // 0 = Sunday
    const daysInMonth = new Date(cursor.y, cursor.m + 1, 0).getDate();
    const cells: (string | null)[] = [];
    for (let i = 0; i < startPad; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push(`${cursor.y}-${String(cursor.m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`);
    }
    return cells;
  }, [cursor]);

  const byDue = useMemo(() => {
    const map: Record<string, ExecutionTask[]> = {};
    for (const t of tasks) (map[t.due] ??= []).push(t);
    return map;
  }, [tasks]);

  const today = todayISO();

  const TaskCard = ({ t }: { t: ExecutionTask }) => (
    <div className={`rounded-xl border p-4 transition-colors ${t.status === "done" ? "border-border opacity-60" : "border-border bg-gradient-card"}`}>
      <div className="flex items-start gap-3">
        <button
          onClick={() => toggleTask(t.id)}
          aria-label="Toggle task complete"
          className={`mt-0.5 size-5 shrink-0 rounded-md border grid place-items-center transition-colors ${
            t.status === "done" ? "bg-gradient-primary border-transparent text-primary-foreground" : "border-border hover:border-primary"
          }`}
        >
          {t.status === "done" && <Check className="size-3" />}
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`size-2 rounded-full ${PRIORITY_DOT[t.priority]}`} aria-label={`${t.priority} priority`} />
            <h3 className={`text-sm font-medium ${t.status === "done" ? "line-through text-muted-foreground" : ""}`}>{t.title}</h3>
            <span className="text-[10px] uppercase tracking-wide text-muted-foreground border border-border rounded px-1.5 py-0.5">
              {CATEGORY_META[t.category]?.label ?? t.category}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">{t.detail}</p>
          <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
            <span>Due {new Date(`${t.due}T00:00:00`).toLocaleDateString(undefined, { day: "numeric", month: "short" })}</span>
            {t.institution && (
              <span className="flex items-center gap-1"><CalendarDays className="size-3" /> {t.institution}</span>
            )}
            {t.requiresApproval && (
              <span className="flex items-center gap-1 text-primary"><ShieldCheck className="size-3" /> Your approval needed first</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6 md:p-10 max-w-5xl">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
        <div>
          <div className="text-sm text-primary font-medium flex items-center gap-1"><Bot className="size-4" /> Autonomous co-founder</div>
          <h1 className="font-display text-4xl mt-1">Execution engine</h1>
          <p className="text-muted-foreground mt-2 max-w-2xl">
            Your 90-day roadmap broken into daily micro-tasks with strict deadlines, priority flags and reminders — synced with the calendar below.
          </p>
        </div>
        <div className="text-right">
          <div className="text-4xl font-display text-gradient">{openCount}</div>
          <div className="text-xs text-muted-foreground">open tasks</div>
        </div>
      </div>

      {(groups.overdue.length > 0 || groups.today.length > 0) && (
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 mb-6 flex flex-wrap gap-4 text-sm">
          {groups.overdue.length > 0 && (
            <span className="flex items-center gap-2 font-medium text-primary"><CircleAlert className="size-4" /> {groups.overdue.length} overdue — act today</span>
          )}
          {groups.today.length > 0 && (
            <span className="flex items-center gap-2 font-medium"><CalendarDays className="size-4" /> {groups.today.length} due today</span>
          )}
        </div>
      )}

      <Tabs value={tab} onValueChange={setTab}>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <TabsList>
            <TabsTrigger value="tasks" className="gap-2"><Bot className="size-4" /> Micro-tasks</TabsTrigger>
            <TabsTrigger value="calendar" className="gap-2"><CalendarDays className="size-4" /> Calendar</TabsTrigger>
          </TabsList>
          <Button onClick={build} disabled={busy} className="bg-gradient-primary text-primary-foreground hover:opacity-90">
            {busy ? <Loader2 className="size-4 mr-2 animate-spin" /> : tasks.length ? <RefreshCw className="size-4 mr-2" /> : <Bot className="size-4 mr-2" />}
            {tasks.length ? "Rebuild my plan" : "Build my execution plan"}
          </Button>
        </div>

        <TabsContent value="tasks" className="space-y-8 mt-0">
          {tasks.length === 0 && (
            <div className="rounded-2xl border border-border bg-gradient-card p-8 text-center">
              <p className="text-muted-foreground max-w-md mx-auto">
                Hit “Build my execution plan” and the co-founder brain turns your roadmap into dated micro-tasks — what to do, when it's due, and which authority it involves.
              </p>
            </div>
          )}
          {(["overdue", "today", "week", "later"] as TaskBucket[]).map((bucket) =>
            groups[bucket].length ? (
              <section key={bucket} aria-labelledby={`bucket-${bucket}`}>
                <h2 id={`bucket-${bucket}`} className="font-display text-xl">
                  {BUCKET_META[bucket].label}
                  <span className="text-sm text-muted-foreground font-sans font-normal ml-2">{groups[bucket].length}</span>
                </h2>
                <p className="text-xs text-muted-foreground mb-3">{BUCKET_META[bucket].hint}</p>
                <div className="space-y-3">
                  {groups[bucket].map((t) => <TaskCard key={t.id} t={t} />)}
                </div>
              </section>
            ) : null
          )}
          {tasks.some((t) => t.status === "done") && (
            <details className="text-sm text-muted-foreground">
              <summary className="cursor-pointer">Completed ({tasks.filter((t) => t.status === "done").length})</summary>
              <div className="space-y-3 mt-3">
                {tasks.filter((t) => t.status === "done").sort((a, b) => b.due.localeCompare(a.due)).map((t) => <TaskCard key={t.id} t={t} />)}
              </div>
            </details>
          )}
        </TabsContent>

        <TabsContent value="calendar" className="mt-0">
          <div className="rounded-2xl border border-border bg-gradient-card p-5">
            <div className="flex items-center justify-between mb-4">
              <Button variant="ghost" size="sm" onClick={() => setCursor(({ y, m }) => (m === 0 ? { y: y - 1, m: 11 } : { y, m: m - 1 }))} aria-label="Previous month">
                <ChevronLeft className="size-4" />
              </Button>
              <h2 className="font-display text-xl">{MONTHS[cursor.m]} {cursor.y}</h2>
              <Button variant="ghost" size="sm" onClick={() => setCursor(({ y, m }) => (m === 11 ? { y: y + 1, m: 0 } : { y, m: m + 1 }))} aria-label="Next month">
                <ChevronRight className="size-4" />
              </Button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-[10px] uppercase tracking-wide text-muted-foreground mb-1">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => <span key={d}>{d}</span>)}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {grid.map((iso, i) =>
                iso ? (
                  <div
                    key={iso}
                    className={`min-h-16 rounded-lg border p-1 text-left ${iso === today ? "border-primary/60 bg-primary/5" : "border-border/60"}`}
                  >
                    <div className={`text-[10px] ${iso === today ? "text-primary font-bold" : "text-muted-foreground"}`}>{Number(iso.slice(-2))}</div>
                    <div className="flex flex-wrap gap-0.5 mt-1">
                      {(byDue[iso] ?? []).slice(0, 6).map((t) => (
                        <span key={t.id} className={`size-1.5 rounded-full ${PRIORITY_DOT[t.priority]}`} title={t.title} />
                      ))}
                    </div>
                    {(byDue[iso] ?? []).length > 0 && (
                      <div className="text-[9px] text-muted-foreground mt-0.5">{(byDue[iso] ?? []).length} task{(byDue[iso] ?? []).length > 1 ? "s" : ""}</div>
                    )}
                  </div>
                ) : (
                  <span key={`pad-${i}`} />
                )
              )}
            </div>
            <div className="flex flex-wrap gap-4 mt-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-primary" /> High priority</span>
              <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-primary/50" /> Medium</span>
              <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-muted-foreground/40" /> Low</span>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Execution;
