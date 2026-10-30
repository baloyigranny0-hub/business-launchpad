ALTER TABLE public.workspaces ADD COLUMN IF NOT EXISTS execution_plan jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.workspaces ADD COLUMN IF NOT EXISTS stress_test jsonb;
COMMENT ON COLUMN public.workspaces.execution_plan IS 'Autonomous task engine: array of micro-tasks with day offsets, priority, category and status';
COMMENT ON COLUMN public.workspaces.stress_test IS 'Startup failure/risk diagnostic: verdict plus risk flags with severity and mitigation';