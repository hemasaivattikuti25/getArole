import asyncio
import hashlib
import json
import uuid
import re
from typing import List, Dict, Any
import httpx
from bs4 import BeautifulSoup

from scrapers.models import JobListing
from scrapers.base import get_scraper_headers, create_scraper_client
from scrapers.greenhouse import normalize_city

class WorkdayScraper:
    def __init__(self):
        self.companies = [
            {"name": "Walmart Global Tech", "url": "https://walmart.wd5.myworkdayjobs.com/Walmart_External"},
            {"name": "Cisco", "url": "https://jobs.cisco.com/jobs/SearchJobs/India"},
            {"name": "Intel", "url": "https://jobs.intel.com/us/en/search-results?location=India"},
            {"name": "Dell", "url": "https://jobs.dell.com/search-jobs/India/375/2/1269750/1/25/50/2"},
            {"name": "Adobe", "url": "https://careers.adobe.com/us/en/search-results?location=India"}
        ]
        
    async def scrape_single_company(self, client: httpx.AsyncClient, company: Dict[str, str]) -> List[JobListing]:
        jobs = []
        name = company["name"]
        url = company["url"]
        headers = get_scraper_headers({
            "Referer": "https://www.google.com/",
            "Sec-Fetch-Dest": "document",
            "Sec-Fetch-Mode": "navigate"
        })
        try:
            resp = await client.get(url, headers=headers, timeout=10.0)
            if resp.status_code == 200 and resp.text:
                soup = BeautifulSoup(resp.text, "html.parser")
                links = soup.find_all("a", href=True)
                for a in links:
                    href = a["href"]
                    text = a.get_text(strip=True)
                    if len(text) > 4 and len(text) < 70 and any(k in href.lower() for k in ["/job/", "/requisition/", "/careers/", "/search/"]):
                        full_url = href if href.startswith("http") else f"{url.split('/jobs')[0]}{href}"
                        uid = hashlib.md5(f"workday_{name}_{text}_{full_url}".encode()).hexdigest()[:12]
                        
                        job = JobListing(
                            id=f"ent_{uid}",
                            title=text,
                            company=name,
                            location="India",
                            city="India",
                            platform="Workday",
                            url=full_url,
                            workplace_type="Hybrid",
                            employment_type="Full-Time",
                            description=f"Active engineering opportunity at {name}. Apply directly on the official career portal.",
                            skills=["Software Engineering", "Python", "Java", "Cloud", "Distributed Systems"]
                        )
                        jobs.append(job)
        except Exception as e:
            print(f"[Workday] Scrape note for {name}: {e}")
        return jobs[:15]

    async def scrape_all(self) -> List[JobListing]:
        all_jobs = []
        async with create_scraper_client(timeout=10.0) as client:
            tasks = [self.scrape_single_company(client, comp) for comp in self.companies]
            results = await asyncio.gather(*tasks, return_exceptions=True)
            for res in results:
                if isinstance(res, list):
                    all_jobs.extend(res)
        return all_jobs

if __name__ == "__main__":
    async def test():
        scraper = WorkdayScraper()
        jobs = await scraper.scrape_all()
        for j in jobs:
            print(f"{j.title} | {j.company} | {j.url}")
    asyncio.run(test())
