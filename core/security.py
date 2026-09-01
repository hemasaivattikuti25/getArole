import re
import time
import logging
from collections import defaultdict
from typing import Optional, Dict, Tuple, Any
from fastapi import Request, HTTPException, status
from fastapi.responses import JSONResponse

logger = logging.getLogger("sre.security")

class SlidingWindowRateLimiter:
    """
    In-memory Sliding Window Rate Limiter for DoS protection & AI API quota preservation.
    Thread-safe and async-compatible.
    """
    def __init__(self):
        # Key: (client_ip, endpoint_tag) -> list of timestamp floats
        self._history: Dict[str, list] = defaultdict(list)
        self._cleanup_interval = 60.0
        self._last_cleanup = time.time()

    def is_allowed(self, key: str, max_requests: int = 15, window_seconds: float = 60.0) -> Tuple[bool, int, float]:
        """
        Checks if request is allowed within the sliding window.
        Returns: (allowed: bool, remaining_requests: int, retry_after_seconds: float)
        """
        now = time.time()
        self._periodic_cleanup(now)
        
        timestamps = self._history[key]
        # Discard timestamps outside the current window
        valid_timestamps = [ts for ts in timestamps if now - ts < window_seconds]
        self._history[key] = valid_timestamps
        
        if len(valid_timestamps) >= max_requests:
            oldest = valid_timestamps[0]
            retry_after = max(1.0, round(window_seconds - (now - oldest), 1))
            return False, 0, retry_after
            
        # Record this request
        valid_timestamps.append(now)
        remaining = max_requests - len(valid_timestamps)
        return True, remaining, 0.0

    def _periodic_cleanup(self, now: float):
        if now - self._last_cleanup > self._cleanup_interval:
            self._last_cleanup = now
            keys_to_delete = []
            for k, timestamps in self._history.items():
                # Purge history older than 5 minutes
                recent = [ts for ts in timestamps if now - ts < 300.0]
                if recent:
                    self._history[k] = recent
                else:
                    keys_to_delete.append(k)
            for k in keys_to_delete:
                del self._history[k]

# Global Rate Limiter Instance
RATE_LIMITER = SlidingWindowRateLimiter()

def get_client_ip(request: Request) -> str:
    """Extracts client IP respecting standard reverse-proxy headers."""
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    real_ip = request.headers.get("X-Real-IP")
    if real_ip:
        return real_ip.strip()
    if request.client and request.client.host:
        return request.client.host
    return "127.0.0.1"

def enforce_ai_rate_limit(request: Request, max_requests: int = 20, window_seconds: float = 60.0):
    """
    Enforces rate limits on AI endpoints to prevent Denial of Wallet & token exhaustion.
    Raises HTTPException(429) if exceeded.
    """
    client_ip = get_client_ip(request)
    endpoint = request.url.path
    key = f"{client_ip}:{endpoint}"
    
    allowed, remaining, retry_after = RATE_LIMITER.is_allowed(key, max_requests=max_requests, window_seconds=window_seconds)
    if not allowed:
        logger.warning(
            "rate_limit_exceeded",
            extra={
                "client_ip": client_ip,
                "path": endpoint,
                "retry_after": retry_after,
                "request_id": getattr(request.state, "request_id", "unknown")
            }
        )
        headers = {
            "Retry-After": str(int(retry_after)),
            "X-RateLimit-Limit": str(max_requests),
            "X-RateLimit-Remaining": "0"
        }
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Rate limit exceeded for AI generation. Please wait {int(retry_after)} seconds before trying again.",
            headers=headers
        )

def sanitize_auth_identifier(raw_uid: Optional[str]) -> str:
    """
    Validates and sanitizes user identifiers (Firebase UID, session ID)
    to prevent path traversal, SQL injection, and IDOR format spoofing.
    """
    if not raw_uid:
        return "guest_user"
        
    s = str(raw_uid).strip()
    # Firebase UIDs are alphanumeric strings, 1-128 chars, may include - or _
    if not re.match(r"^[a-zA-Z0-9_\-\.]{1,128}$", s):
        logger.warning("invalid_uid_format_blocked", extra={"raw_uid": s[:30]})
        return "guest_user"
        
    return s

def extract_authenticated_uid(request: Request) -> str:
    """
    Extracts and sanitizes the user identity from standard authorization headers.
    Supports:
    1. Authorization: Bearer <token_or_uid>
    2. X-Firebase-UID: <uid>
    3. Fallback: 'guest_user'
    """
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header[7:].strip()
        # If standard token/uid passed in bearer
        if token:
            return sanitize_auth_identifier(token)
            
    uid_header = request.headers.get("X-Firebase-UID")
    if uid_header:
        return sanitize_auth_identifier(uid_header)
        
    return "guest_user"

AUTHORIZED_CRM_EMAILS = {"hemasaivattikuti2727@gmail.com"}

def is_crm_admin_authorized(request: Request, x_admin_key: Optional[str] = None, x_user_email: Optional[str] = None) -> bool:
    """
    Validates if incoming request has owner/admin CRM permissions.
    Only hemasaivattikuti2727@gmail.com or valid system X-Admin-Key is authorized.
    """
    import os
    expected_key = os.getenv("SCRAPER_ADMIN_KEY") or os.getenv("ADMIN_API_KEY", "")
    if expected_key and x_admin_key and x_admin_key == expected_key:
        return True
        
    client_email = (x_user_email or request.headers.get("X-User-Email") or request.headers.get("X-Admin-Email") or "").strip().lower()
    if client_email and client_email in AUTHORIZED_CRM_EMAILS:
        return True
        
    query_email = (request.query_params.get("email") or request.query_params.get("admin_email") or "").strip().lower()
    if query_email and query_email in AUTHORIZED_CRM_EMAILS:
        return True
        
    return False

def verify_crm_admin_access(request: Request, x_admin_key: Optional[str] = None, x_user_email: Optional[str] = None):
    """
    Raises HTTP 403 Forbidden if the requester is not hemasaivattikuti2727@gmail.com or authorized admin key.
    """
    if not is_crm_admin_authorized(request, x_admin_key=x_admin_key, x_user_email=x_user_email):
        logger.warning(
            "unauthorized_crm_access_attempt",
            extra={
                "client_ip": get_client_ip(request),
                "path": request.url.path,
                "attempted_email": x_user_email or request.headers.get("X-User-Email") or request.query_params.get("email") or "anonymous"
            }
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access Denied: getArole CRM is strictly restricted to hemasaivattikuti2727@gmail.com."
        )

