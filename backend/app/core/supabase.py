import json
import os
import urllib.error
import urllib.parse
import urllib.request


class SupabaseResponse:
    def __init__(self, data):
        self.data = data


class SupabaseTable:
    def __init__(self, client, table: str):
        self._client = client
        self._table = table
        self._select = "*"
        self._limit = None

    def select(self, columns: str):
        self._select = columns
        return self

    def limit(self, value: int):
        self._limit = value
        return self

    def insert(self, payload):
        return self._client._request("POST", self._table, json_body=payload)

    def execute(self):
        params = {"select": self._select}
        if self._limit is not None:
            params["limit"] = str(self._limit)
        return self._client._request("GET", self._table, params=params)


class SupabaseRestClient:
    def __init__(self, url: str, key: str):
        self._url = url.rstrip("/")
        self._key = key

    def table(self, table: str) -> SupabaseTable:
        return SupabaseTable(self, table)

    def _request(self, method: str, table: str, params=None, json_body=None):
        path = f"/rest/v1/{table}"
        query = urllib.parse.urlencode(params or {})
        url = f"{self._url}{path}"
        if query:
            url = f"{url}?{query}"

        headers = {
            "apikey": self._key,
            "Authorization": f"Bearer {self._key}",
            "Content-Type": "application/json",
            "Prefer": "return=representation",
        }

        body = None
        if json_body is not None:
            body = json.dumps(json_body, default=str).encode("utf-8")

        request = urllib.request.Request(url, data=body, headers=headers, method=method)

        try:
            with urllib.request.urlopen(request, timeout=15) as response:
                payload = response.read().decode("utf-8")
        except urllib.error.HTTPError as exc:
            detail = exc.read().decode("utf-8") if exc.fp else str(exc)
            raise RuntimeError(
                f"Supabase request failed: {exc.code} {detail}"
            ) from exc

        data = json.loads(payload) if payload else []
        return SupabaseResponse(data)


def get_supabase_admin_client() -> SupabaseRestClient:
    url = _get_supabase_url()
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

    if not url or not key:
        raise RuntimeError(
            "Supabase admin credentials are missing. "
            "Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in backend/.env."
        )

    return SupabaseRestClient(url, key)


def get_supabase_public_client() -> SupabaseRestClient:
    url = _get_supabase_url()
    key = os.getenv("SUPABASE_ANON_KEY") or os.getenv(
        "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"
    )

    if not url or not key:
        raise RuntimeError(
            "Supabase public credentials are missing. "
            "Set SUPABASE_URL and SUPABASE_ANON_KEY in backend/.env."
        )

    return SupabaseRestClient(url, key)


def _get_supabase_url() -> str:
    return os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL")