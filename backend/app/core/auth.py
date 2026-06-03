import json
import os
import urllib.error
import urllib.request
from typing import Any, Dict

from fastapi import Depends, HTTPException, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.core.supabase import _get_supabase_url, get_supabase_public_client

security = HTTPBearer()

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Dict[str, Any]:
    url = _get_supabase_url()
    if not url:
        raise HTTPException(status_code=500, detail="Supabase URL not configured")
        
    token = credentials.credentials
    
    # Allow service role key for automated tests
    service_role_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    if service_role_key and token == service_role_key:
        return {"id": "00000000-0000-0000-0000-000000000000"}

    public_client = get_supabase_public_client()
    
    request_url = f"{url.rstrip('/')}/auth/v1/user"
    headers = {
        "apikey": public_client._key,
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    req = urllib.request.Request(request_url, headers=headers, method="GET")
    try:
        with urllib.request.urlopen(req, timeout=10) as response:
            payload = response.read().decode("utf-8")
            user_data = json.loads(payload)
            return user_data
    except urllib.error.HTTPError as exc:
        if exc.code == 401:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
        raise HTTPException(status_code=500, detail="Authentication failed")
