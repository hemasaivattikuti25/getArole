import os
from abc import ABC, abstractmethod
from typing import Dict, List, Optional, Tuple
import httpx
from scrapers.models import JobListing
from scrapers.stealth import (
    BrowserProfile,
    BROWSER_PROFILES,
    get_random_profile,
    get_profile_headers
)

USER_AGENTS = [p.user_agent for p in BROWSER_PROFILES]

def get_random_user_agent() -> str:
    """Returns a randomized modern desktop user agent."""
    return get_random_profile().user_agent

def get_scraper_headers(custom_headers: Optional[Dict[str, str]] = None, profile: Optional[BrowserProfile] = None) -> Dict[str, str]:
    """Generates standard browser headers with synchronized user agent, client hints and anti-fingerprinting tokens."""
    selected_profile = profile or get_random_profile()
    return get_profile_headers(selected_profile, custom_headers)

def create_scraper_client(
    timeout: float = 6.0,
    profile: Optional[BrowserProfile] = None,
    force_proxy: Optional[str] = None
) -> httpx.AsyncClient:
    """
    Creates a hardened AsyncClient with:
    1. Session-pinned BrowserProfile (consistent User-Agent, Sec-Ch-Ua, and Accept-Language)
    2. Connection pooling & Keep-Alive tuning
    3. Transparent proxy support (ROTATING_PROXY_URL / HTTPS_PROXY / HTTP_PROXY or explicit force_proxy)
    4. HTTP Cookie persistence
    """
    active_profile = profile or get_random_profile()
    default_headers = get_profile_headers(active_profile)
    
    proxy_url = force_proxy or os.getenv("ROTATING_PROXY_URL") or os.getenv("HTTPS_PROXY") or os.getenv("HTTP_PROXY")
    limits = httpx.Limits(max_keepalive_connections=15, max_connections=30)
    
    kwargs = {
        "limits": limits,
        "timeout": timeout,
        "headers": default_headers,
        "follow_redirects": True
    }
    if proxy_url:
        kwargs["proxy"] = proxy_url
        
    return httpx.AsyncClient(**kwargs)

def inspect_response_health(
    resp: Optional[httpx.Response],
    target_name: str,
    platform: str
) -> Tuple[bool, str]:
    """
    Inspects HTTP response for anti-bot defenses, WAF challenge pages, and rate limits.
    Prevents silent data death by distinguishing true 0-job queries from anti-bot blocks.
    Returns (is_healthy: bool, reason: str).
    """
    if resp is None:
        return False, f"Connection dropped / null response on {target_name}"
        
    status = resp.status_code
    if status == 403:
        return False, f"HTTP 403 Forbidden (WAF / Perimeter IP block on {target_name})"
    if status == 429:
        return False, f"HTTP 429 Rate Limited (Too Many Requests on {target_name})"
    if status in (502, 503, 504):
        return False, f"HTTP {status} Gateway/Service Unavailable on {target_name}"
        
    text_sample = (resp.text or "")[:2000].lower()
    waf_challenge_patterns = [
        "cf-browser-verification",
        "<title>just a moment...</title>",
        "<title>security challenge</title>",
        "<title>attention required! | cloudflare</title>",
        "challenge-platform",
        "perimeterx",
        "datadome",
        "access denied",
        "please verify you are a human",
        "checking your browser before accessing",
        "enable javascript and cookies to continue"
    ]
    for pattern in waf_challenge_patterns:
        if pattern in text_sample:
            return False, f"WAF Anti-Bot Challenge ({pattern}) detected on {target_name} ({platform})"
            
    if len(text_sample.strip()) < 80 and not (text_sample.startswith("{") or text_sample.startswith("[")):
        return False, f"Suspiciously empty payload ({len(text_sample)} bytes) on {target_name} ({platform})"
        
    return True, "OK"


class BaseScraper(ABC):
    """
    Abstract Base Class for all Job Board Scrapers (Open/Closed Principle).
    """
    def __init__(self, name: str):
        self.name = name

    @abstractmethod
    async def scrape(self, query: str, location: str = "Remote", limit: int = 20) -> List[JobListing]:
        """
        Scrapes job listings for a given query and location.
        Returns a list of JobListing model objects.
        """
        pass
