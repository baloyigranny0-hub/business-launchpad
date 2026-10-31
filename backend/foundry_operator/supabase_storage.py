from typing import Any

from .storage import AgentAuditInput, MentorSessionInput, ReminderInput, SaveTemplateInput


class SupabaseFoundryStorageAdapter:
    """Supabase boundary kept inactive until the project supplies a configured client."""

    def __init__(self, client: Any = None):
        self.client = client

    @classmethod
    def from_environment(cls):
        import os

        url = os.getenv("SUPABASE_URL")
        key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_ANON_KEY")
        if not url or not key:
            raise RuntimeError("Supabase storage requires SUPABASE_URL and a server-side Supabase key")
        try:
            from supabase import create_client
        except ImportError as exc:
            raise RuntimeError("Supabase storage requires the supabase Python package") from exc
        return cls(create_client(url, key))

    def _configured(self):
        if self.client is None:
            raise RuntimeError("Supabase storage is not configured; use Mongo or memory storage")

    def __getattr__(self, name):
        if name.startswith("_"):
            raise AttributeError(name)
        async def unavailable(*args, **kwargs):
            self._configured()
            raise NotImplementedError(f"Supabase adapter method {name} is not enabled in this increment")
        return unavailable
