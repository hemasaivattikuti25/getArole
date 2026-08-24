import os
import random
from abc import ABC, abstractmethod
from typing import Dict, List, Optional
import httpx
from scrapers.models import JobListing

USER_AGENTS = [
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 Edg/126.0.0.0"
]

def get_random_user_agent() -> str:
    """Returns a randomized modern desktop user agent."""
    return random.choice(USER_AGENTS)

def get_scraper_headers(custom_headers: Optional[Dict[str, str]] = None) -> Dict[str, str]:
    """Generates standard browser headers with rotated user agent and anti-fingerprinting tokens."""
    headers = {
        "User-Agent": get_random_user_agent(),
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,application/json,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Sec-Ch-Ua": '"Not/A)Brand";v="8", "Chromium";v="126", "Google Chrome";v="126"',
        "Sec-Ch-Ua-Mobile": "?0",
        "Sec-Ch-Ua-Platform": '"macOS"',
        "Sec-Fetch-Dest": "empty",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Site": "same-origin",
        "DNT": "1"
    }
    if custom_headers:
        headers.update(custom_headers)
    return headers

def create_scraper_client(timeout: float = 6.0) -> httpx.AsyncClient:
    """Creates a hardened AsyncClient with proxy support and connection pooling."""
    proxy_url = os.getenv("ROTATING_PROXY_URL") or os.getenv("HTTPS_PROXY") or os.getenv("HTTP_PROXY")
    limits = httpx.Limits(max_keepalive_connections=15, max_connections=30)
    
    kwargs = {
        "limits": limits,
        "timeout": timeout,
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
