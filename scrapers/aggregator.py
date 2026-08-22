import asyncio
import json
from typing import List, Optional
from .models import JobListing
from .greenhouse import scrape_all_greenhouse_jobs
from .lever import scrape_all_lever_jobs
from .ashby import scrape_all_ashby_jobs
from .internshala import scrape_all_internshala_jobs
from .linkedin import scrape_all_linkedin_jobs

class JobAggregator:
    def __init__(self):
        self.cached_jobs: List[JobListing] = []

    async def aggregate_all(
        self,
        include_greenhouse: bool = True,
        include_lever: bool = True,
        include_ashby: bool = True,
        include_internshala: bool = True,
        include_linkedin: bool = True
    ) -> List[JobListing]:
        tasks = []
        if include_greenhouse:
            tasks.append(scrape_all_greenhouse_jobs())
        if include_lever:
            tasks.append(scrape_all_lever_jobs())
        if include_ashby:
            tasks.append(scrape_all_ashby_jobs())
        if include_internshala:
            tasks.append(scrape_all_internshala_jobs())
        if include_linkedin:
            tasks.append(scrape_all_linkedin_jobs())

        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        all_raw_jobs: List[JobListing] = []
        for res in results:
            if isinstance(res, list):
                all_raw_jobs.extend(res)

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
