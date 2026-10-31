import os
import sys
from pathlib import Path

os.environ.setdefault("OPENROUTER_API_KEY", "test-only")
os.environ["USE_MEMORY_DB"] = "true"
os.environ["FOUNDRY_STORAGE_BACKEND"] = "memory"
os.environ["FOUNDRY_PROVIDER"] = "deterministic"
sys.path.insert(0, str(Path(__file__).parents[1]))

import pytest

from backend import server
from backend.foundry_operator.routes import PlanRequest, SessionRequest, TaskStatusRequest, create_plan, get_context, update_task


def run(coroutine):
    try:
        coroutine.send(None)
    except StopIteration as result:
        return result.value
    raise AssertionError("route unexpectedly yielded")


def test_operator_routes_resolve_session_to_internal_founder_id():
    server._foundry_storage = None
    session_id = "firebase-session-1"
    profile = server.ProfileCreate(session_id=session_id, business_name="Ubuntu Auto Care", industry="mechanic")
    run(server.create_profile(profile))

    response = run(get_context(session_id=session_id, authorization=None))

    assert response["context"].founder_id != session_id
    assert response["context"].auth_subject == session_id


def test_operator_plan_and_status_update_keep_json_safe_domain_shape():
    server._foundry_storage = None
    session_id = "firebase-session-2"
    run(server.create_profile(server.ProfileCreate(session_id=session_id, business_name="Ubuntu Auto Care", industry="mechanic", biggest_blocker="no_pricing")))

    plan = run(create_plan(PlanRequest(session_id=session_id, message="Help me plan today."), authorization=None))
    assert len(plan.today_tasks) <= 3
    assert plan.today_tasks[0].founder_id != session_id

    task = plan.today_tasks[0]
    with pytest.raises(Exception):
        run(update_task(task.id, TaskStatusRequest(session_id=session_id, status="completed"), authorization=None))
    updated = run(update_task(task.id, TaskStatusRequest(session_id=session_id, status="in_progress"), authorization=None))
    assert updated.status == "in_progress"
