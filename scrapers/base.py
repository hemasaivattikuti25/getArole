import os
import random
from abc import ABC, abstractmethod
from typing import Dict, List, Optional, Any
import httpx
from scrapers.models import JobListing
from scrapers.stealth import (
    BrowserProfile,
    BROWSER_PROFILES,
    get_random_profile,
    get_profile_headers,
    async_rate_limit_delay
)

USER_AGENTS = [p.user_agent for p in BROWSER_PROFILES]

def get_random_user_agent() -> str:
    """Returns a randomized modern desktop user agent."""
    return get_random_profile().user_agent

def get_scraper_headers(custom_headers: Optional[Dict[str, str]] = None, profile: Optional[BrowserProfile] = None) -> Dict[str, str]:
    """Generates standard browser headers with synchronized user agent, client hints and anti-fingerprinting tokens."""
    selected_profile = profile or get_random_profile()
    return get_profile_headers(selected_profile, custom_headers)

def create_scraper_client(timeout: float = 6.0, profile: Optional[BrowserProfile] = None) -> httpx.AsyncClient:
    """
    Creates a hardened AsyncClient with:
    1. Session-pinned BrowserProfile (consistent User-Agent, Sec-Ch-Ua, and Accept-Language throughout session)
    2. Connection pooling & Keep-Alive tuning
    3. Transparent proxy support (ROTATING_PROXY_URL / HTTP_PROXY)
    4. HTTP Cookie persistence
    """
    active_profile = profile or get_random_profile()
    default_headers = get_profile_headers(active_profile)
    
    proxy_url = os.getenv("ROTATING_PROXY_URL") or os.getenv("HTTPS_PROXY") or os.getenv("HTTP_PROXY")
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
