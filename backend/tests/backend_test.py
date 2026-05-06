"""Backend API tests for Foundry (entrepreneurship coaching app) - Iteration 2.
Covers: rebrand to Foundry, 9 agents, guardrails (compliance disclaimer),
unknown agent fallback, profiles, vault CRUD, tasks CRUD, resources. No _id leak."""
import os
import uuid
import json
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://startup-forge-79.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"
SESSION_ID = f"TEST_sess_{uuid.uuid4().hex[:8]}"


def _no_objectid(obj):
    """Recursively verify no '_id' keys exist in response."""
    if isinstance(obj, dict):
        assert "_id" not in obj, f"Leaked ObjectId in: {obj}"
        for v in obj.values():
            _no_objectid(v)
    elif isinstance(obj, list):
        for v in obj:
            _no_objectid(v)


@pytest.fixture(scope="module")
def client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# ----- Root & agents -----
class TestRoot:
    def test_root_status(self, client):
        r = client.get(f"{API}/")
        assert r.status_code == 200
        data = r.json()
        assert data["app"] == "Foundry"
        assert data["status"] == "ok"
        assert "model" in data and isinstance(data["model"], str) and data["model"]
        _no_objectid(data)

    def test_list_agents(self, client):
        r = client.get(f"{API}/agents")
        assert r.status_code == 200
        agents = r.json()
        assert isinstance(agents, list)
        assert len(agents) == 9, f"Expected 9 agents, got {len(agents)}"
        keys = {a["key"] for a in agents}
        expected = {"research", "compliance", "brand", "profile",
                    "operations", "sop", "marketing", "sales_gym", "general"}
        assert expected.issubset(keys), f"Missing agents: {expected - keys}"
        for a in agents:
            assert "name" in a and "role" in a
        _no_objectid(agents)


# ----- Profiles -----
class TestProfiles:
    def test_create_and_get_profile(self, client):
        payload = {
            "session_id": SESSION_ID,
            "business_name": "TEST_Acme Coffee",
            "industry": "Food & Beverage",
            "country": "South Africa",
            "stage": "idea",
            "idea": "Mobile specialty coffee cart for offices",
            "target_customer": "Corporate parks",
        }
        r = client.post(f"{API}/profiles", json=payload)
        assert r.status_code == 200, r.text
        p = r.json()
        assert p["session_id"] == SESSION_ID
        assert p["business_name"] == "TEST_Acme Coffee"
        assert p["industry"] == "Food & Beverage"
        assert "id" in p and isinstance(p["id"], str)
        _no_objectid(p)

        # GET back -> must persist
        r2 = client.get(f"{API}/profiles/{SESSION_ID}")
        assert r2.status_code == 200
        got = r2.json()
        assert got is not None
        assert got["business_name"] == "TEST_Acme Coffee"
        assert got["country"] == "South Africa"
        _no_objectid(got)

    def test_profile_upsert_by_session(self, client):
        # Upsert: same session_id, different business_name replaces
        payload = {
            "session_id": SESSION_ID,
            "business_name": "TEST_Acme Coffee v2",
            "industry": "Food & Beverage",
            "country": "South Africa",
            "stage": "registered",
            "idea": "Updated idea",
            "target_customer": "Offices",
        }
        r = client.post(f"{API}/profiles", json=payload)
        assert r.status_code == 200
        r2 = client.get(f"{API}/profiles/{SESSION_ID}")
        assert r2.status_code == 200
        assert r2.json()["business_name"] == "TEST_Acme Coffee v2"
        assert r2.json()["stage"] == "registered"

    def test_get_missing_profile_returns_null(self, client):
        r = client.get(f"{API}/profiles/TEST_nonexistent_{uuid.uuid4().hex[:6]}")
        assert r.status_code == 200
        assert r.json() is None


# ----- Agents: chat & generate (OpenRouter free w/ fallback) -----
class TestAgentAI:
    def test_research_chat_non_empty(self, client):
        body = {
            "session_id": SESSION_ID,
            "agent": "research",
            "messages": [{"role": "user", "content": "Quick lean canvas for a coffee cart targeting offices in Cape Town."}],
            "profile": {"business_name": "Acme Coffee", "industry": "F&B", "country": "South Africa"},
        }
        r = client.post(f"{API}/agents/chat", json=body, timeout=120)
        assert r.status_code == 200, f"status={r.status_code} body={r.text[:300]}"
        data = r.json()
        assert data["agent"] == "research"
        assert isinstance(data["reply"], str) and data["reply"].strip(), "Empty reply"
        assert isinstance(data["model"], str) and data["model"]
        _no_objectid(data)

    def test_profile_generate_non_empty(self, client):
        body = {
            "session_id": SESSION_ID,
            "agent": "profile",
            "prompt": "Build a contract-ready company profile for a small coffee cart business.",
            "profile": {"business_name": "Acme Coffee", "industry": "F&B"},
        }
        r = client.post(f"{API}/agents/generate", json=body, timeout=120)
        assert r.status_code == 200, f"status={r.status_code} body={r.text[:300]}"
        data = r.json()
        assert data["agent"] == "profile"
        assert isinstance(data["reply"], str) and data["reply"].strip(), "Empty reply"
        _no_objectid(data)

    def test_compliance_generate_has_disclaimer(self, client):
        """Anti-hallucination guardrail: compliance reply must contain
        a 'licensed professional' style disclaimer."""
        body = {
            "session_id": SESSION_ID,
            "agent": "compliance",
            "prompt": "What are the top 3 registration steps for a new food cart in South Africa?",
            "profile": {"business_name": "Acme Coffee", "industry": "Food & Beverage", "country": "South Africa"},
        }
        r = client.post(f"{API}/agents/generate", json=body, timeout=120)
        assert r.status_code == 200, f"status={r.status_code} body={r.text[:300]}"
        data = r.json()
        assert data["agent"] == "compliance"
        reply = data["reply"].lower()
        assert reply.strip(), "Empty reply"
        # Guardrail phrase match (tolerant to LLM phrasing variations)
        assert (
            "licensed professional" in reply
            or "licensed attorney" in reply
            or "qualified professional" in reply
            or "legal professional" in reply
        ), f"Missing compliance disclaimer. Reply tail: ...{data['reply'][-400:]}"
        _no_objectid(data)

    def test_unknown_agent_falls_back_to_general(self, client):
        """Unknown agent key should fall back to 'general' (Foundry Coach) and still return a reply.
        Note: response.agent echoes the request key; what matters is non-empty reply w/o 500."""
        body = {
            "session_id": SESSION_ID,
            "agent": "not_a_real_agent_xyz",
            "prompt": "Give me one sentence of encouragement for a new founder.",
        }
        r = client.post(f"{API}/agents/generate", json=body, timeout=120)
        assert r.status_code == 200, f"status={r.status_code} body={r.text[:300]}"
        data = r.json()
        assert isinstance(data["reply"], str) and data["reply"].strip(), "Empty reply on fallback"
        assert isinstance(data["model"], str) and data["model"]
        _no_objectid(data)


# ----- Vault CRUD -----
class TestVault:
    _doc_id = None

    def test_save_doc(self, client):
        r = client.post(f"{API}/vault", json={
            "session_id": SESSION_ID,
            "title": "TEST_Lean Canvas",
            "agent": "research",
            "content": "## Canvas\n- Problem: ...",
        })
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["title"] == "TEST_Lean Canvas"
        assert "id" in d
        _no_objectid(d)
        TestVault._doc_id = d["id"]

    def test_list_docs(self, client):
        r = client.get(f"{API}/vault/{SESSION_ID}")
        assert r.status_code == 200
        docs = r.json()
        assert isinstance(docs, list) and len(docs) >= 1
        assert any(d["id"] == TestVault._doc_id for d in docs)
        _no_objectid(docs)

    def test_delete_doc(self, client):
        assert TestVault._doc_id is not None
        r = client.delete(f"{API}/vault/{TestVault._doc_id}")
        assert r.status_code == 200
        assert r.json()["deleted"] == 1
        r2 = client.get(f"{API}/vault/{SESSION_ID}")
        assert all(d["id"] != TestVault._doc_id for d in r2.json())


# ----- Tasks CRUD -----
class TestTasks:
    _task_id = None

    def test_create_task(self, client):
        r = client.post(f"{API}/tasks", json={
            "session_id": SESSION_ID,
            "title": "TEST_Register at CIPC",
            "room": "legal",
        })
        assert r.status_code == 200, r.text
        t = r.json()
        assert t["title"] == "TEST_Register at CIPC"
        assert t["room"] == "legal"
        assert t["done"] is False
        _no_objectid(t)
        TestTasks._task_id = t["id"]

    def test_list_tasks(self, client):
        r = client.get(f"{API}/tasks/{SESSION_ID}")
        assert r.status_code == 200
        tasks = r.json()
        assert any(t["id"] == TestTasks._task_id for t in tasks)
        _no_objectid(tasks)

    def test_toggle_done(self, client):
        assert TestTasks._task_id is not None
        r = client.patch(f"{API}/tasks/{TestTasks._task_id}", json={"done": True})
        assert r.status_code == 200
        assert r.json()["done"] is True
        # persistence
        r2 = client.get(f"{API}/tasks/{SESSION_ID}")
        match = [t for t in r2.json() if t["id"] == TestTasks._task_id][0]
        assert match["done"] is True

    def test_patch_unknown_returns_404(self, client):
        r = client.patch(f"{API}/tasks/TEST_no_such_task", json={"done": True})
        assert r.status_code == 404

    def test_delete_task(self, client):
        assert TestTasks._task_id is not None
        r = client.delete(f"{API}/tasks/{TestTasks._task_id}")
        assert r.status_code == 200
        assert r.json()["deleted"] == 1


# ----- Resources -----
class TestResources:
    def test_list_all(self, client):
        r = client.get(f"{API}/resources")
        assert r.status_code == 200
        res = r.json()
        assert isinstance(res, list) and len(res) >= 5
        for item in res:
            assert {"name", "purpose", "url", "country"}.issubset(item.keys())
        _no_objectid(res)

    def test_filter_south_africa(self, client):
        r = client.get(f"{API}/resources", params={"country": "South Africa"})
        assert r.status_code == 200
        res = r.json()
        # Filter includes South Africa + Global entries
        assert all(item["country"] in ("South Africa", "Global") for item in res)
        assert any(item["country"] == "South Africa" for item in res)


# ----- Cleanup -----
def test_zz_cleanup(client):
    """Best-effort cleanup of TEST_ data."""
    try:
        # Delete any remaining vault docs for this session
        for d in client.get(f"{API}/vault/{SESSION_ID}").json():
            client.delete(f"{API}/vault/{d['id']}")
        for t in client.get(f"{API}/tasks/{SESSION_ID}").json():
            client.delete(f"{API}/tasks/{t['id']}")
    except Exception as e:
        print(f"cleanup soft-fail: {e}")
