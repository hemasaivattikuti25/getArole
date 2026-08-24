import asyncio
import json
from typing import List, Optional
from .models import JobListing
from .greenhouse import scrape_all_greenhouse_jobs
from .lever import scrape_all_lever_jobs
from .ashby import scrape_all_ashby_jobs
from .internshala import scrape_all_internshala_jobs
from .linkedin import scrape_all_linkedin_jobs
from .unstop import fetch_unstop_jobs

import random
from core.metrics import SCRAPER_FAILURE_TOTAL

class JobAggregator:
    def __init__(self, scrapers: Optional[List[BaseScraper]] = None):
        self.cached_jobs: List[JobListing] = []
        self.registered_scrapers: List[BaseScraper] = scrapers or []

    def register_scraper(self, scraper: BaseScraper):
        """Register a new scraper strategy dynamically (Open/Closed Principle)."""
        self.registered_scrapers.append(scraper)

    def _validate_payload(self, jobs: List[JobListing], name: str) -> List[JobListing]:
        """Validate that returned jobs meet minimum schema and sanity standards."""
        if not jobs:
            return []
        valid = []
        for j in jobs:
            if getattr(j, "title", None) and getattr(j, "company", None) and getattr(j, "url", None):
                valid.append(j)
        if len(valid) < len(jobs) * 0.5:
            SCRAPER_FAILURE_TOTAL.labels(scraper=name, reason="anti_bot_schema_mismatch").inc()
            return []
        return valid

    async def _run_with_retries(self, scraper_func, name: str, max_retries: int = 3, base_delay: float = 1.5) -> List[JobListing]:
        """Runs an async scraper function with full jitter exponential backoff retries."""
        for attempt in range(1, max_retries + 1):
            try:
                print(f"[Aggregator] Starting {name} (Attempt {attempt}/{max_retries})...")
                results = await scraper_func()
                validated = self._validate_payload(results, name)
                print(f"[Aggregator] ✅ {name} completed successfully. Found {len(validated)} verified jobs.")
                return validated
            except Exception as e:
                error_type = type(e).__name__
                print(f"[Aggregator] ⚠️ {name} failed on attempt {attempt}: {error_type} - {e}")
                if attempt < max_retries:
                    # Full Jitter formula
                    jittered_delay = random.uniform(0.5, base_delay * (2 ** (attempt - 1)))
                    print(f"[Aggregator] Retrying {name} in {jittered_delay:.2f}s with jitter...")
                    await asyncio.sleep(jittered_delay)
                else:
                    SCRAPER_FAILURE_TOTAL.labels(scraper=name, reason=error_type).inc()
                    print(f"[Aggregator] ❌ {name} exhausted all retries. Skipping.")
        return []

    async def aggregate_all(
        self,
        query: str = "Software Engineer",
        location: str = "Remote",
        limit: int = 20,
        include_greenhouse: bool = True,
        include_lever: bool = True,
        include_ashby: bool = True,
        include_internshala: bool = True,
        include_linkedin: bool = True,
        include_unstop: bool = True
    ) -> List[JobListing]:
        tasks = []
        
        # If custom scrapers registered, execute registered strategy instances
        if self.registered_scrapers:
            for s in self.registered_scrapers:
                tasks.append(self._run_with_retries(lambda sc=s: sc.scrape(query, location, limit), getattr(s, 'name', type(s).__name__)))
        else:
            if include_greenhouse:
                tasks.append(self._run_with_retries(scrape_all_greenhouse_jobs, "Greenhouse Scraper"))
            if include_lever:
                tasks.append(self._run_with_retries(scrape_all_lever_jobs, "Lever Scraper"))
            if include_ashby:
                tasks.append(self._run_with_retries(scrape_all_ashby_jobs, "Ashby Scraper"))
            if include_internshala:
                tasks.append(self._run_with_retries(scrape_all_internshala_jobs, "Internshala Scraper"))
            if include_linkedin:
                tasks.append(self._run_with_retries(scrape_all_linkedin_jobs, "LinkedIn Scraper"))
            if include_unstop:
                tasks.append(self._run_with_retries(fetch_unstop_jobs, "Unstop Scraper"))

        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        all_raw_jobs: List[JobListing] = []
        for res in results:
            if isinstance(res, list):
                all_raw_jobs.extend(res)
            elif isinstance(res, Exception):
                print(f"[Aggregator] Unhandled Exception during gather: {res}")

        # Deduplicate based on lowercase title + company
        seen = set()
        deduped: List[JobListing] = []
        
        for job in all_raw_jobs:
            key = f"{job.company.lower().strip()}_{job.title.lower().strip()}"
            if key not in seen:
                seen.add(key)
                deduped.append(job)

        self.cached_jobs = deduped
        return deduped

    def filter_jobs(
        self,
        city: Optional[str] = None,
        min_stipend: Optional[int] = None,
        keyword: Optional[str] = None,
        employment_type: Optional[str] = None,
        remote_only: bool = False
    ) -> List[JobListing]:
        filtered = self.cached_jobs

        if city:
            city_lower = city.lower()
            filtered = [j for j in filtered if j.city and city_lower in j.city.lower()]

        if min_stipend is not None:
            # If minimum stipend filter is specified, include jobs where amount is >= min_stipend OR unstated
            filtered = [
                j for j in filtered 
                if j.stipend_amount_min is None or j.stipend_amount_min >= min_stipend
            ]

        if keyword:
            kw_lower = keyword.lower()
            filtered = [
                j for j in filtered 
                if kw_lower in j.title.lower() or kw_lower in j.description.lower() or kw_lower in j.company.lower()
            ]

        if employment_type:
            emp_lower = employment_type.lower()
            filtered = [j for j in filtered if j.employment_type and emp_lower in j.employment_type.lower()]

        if remote_only:
            filtered = [j for j in filtered if j.workplace_type == "Remote" or (j.city and j.city.lower() == "remote")]

        return filtered
