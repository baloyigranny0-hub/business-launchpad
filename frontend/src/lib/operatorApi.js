import { api } from "@/lib/api";

export async function getOperatorContext(sessionId) {
  const response = await api.get("/operator/context", { params: { session_id: sessionId } });
  return response.data;
}

export async function createDailyPlan(sessionId, message) {
  const response = await api.post("/operator/plan", { session_id: sessionId, message });
  return response.data;
}

export async function updateOperatorTask(sessionId, taskId, status, details = {}) {
  const response = await api.patch(`/operator/tasks/${taskId}`, {
    session_id: sessionId,
    status,
    reason: details.reason || null,
    evidence: details.evidence || null,
  });
  return response.data;
}

export async function listOperatorTemplates(sessionId) {
  const response = await api.get("/operator/templates", { params: { session_id: sessionId } });
  return response.data;
}

export async function draftOperatorTemplate(sessionId, templateType, trade, prompt) {
  const response = await api.post("/operator/templates/draft", {
    session_id: sessionId,
    template_type: templateType,
    trade,
    prompt,
  });
  return response.data;
}

export async function saveOperatorTemplate(sessionId, draft) {
  const response = await api.post("/operator/templates", { ...draft, session_id: sessionId });
  return response.data;
}

export async function createOperatorReminder(sessionId, title, remindAt, taskId) {
  const response = await api.post("/operator/reminders", {
    session_id: sessionId,
    title,
    remind_at: remindAt,
    task_id: taskId || null,
  });
  return response.data;
}
