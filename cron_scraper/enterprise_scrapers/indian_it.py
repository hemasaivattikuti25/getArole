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

class IndianITScraper:
    def __init__(self):
        self.companies = [
            {"name": "TCS", "url": "https://www.tcs.com/careers/india"},
            {"name": "Infosys", "url": "https://www.infosys.com/careers/apply.html"},
            {"name": "Wipro", "url": "https://careers.wipro.com/careers-home/"},
            {"name": "HCLTech", "url": "https://www.hcltech.com/careers"},
            {"name": "Tech Mahindra", "url": "https://careers.techmahindra.com/"},
            {"name": "Cognizant", "url": "https://careers.cognizant.com/global/en/search-results?location=India"},
            {"name": "Capgemini", "url": "https://www.capgemini.com/in-en/careers/job-search/"},
        ]
        
    async def scrape_single_it_giant(self, client: httpx.AsyncClient, company: Dict[str, str]) -> List[JobListing]:
        jobs = []
        name = company["name"]
        url = company["url"]
        headers = get_scraper_headers({
            "Referer": "https://www.google.co.in/",
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
                    if len(text) > 4 and len(text) < 65 and any(k in href.lower() for k in ["/job", "/career", "/role", "/opening"]):
                        full_url = href if href.startswith("http") else f"{url.rstrip('/')}/{href.lstrip('/')}"
                        uid = hashlib.md5(f"it_{name}_{text}_{full_url}".encode()).hexdigest()[:12]
                        
                        job = JobListing(
                            id=f"it_{uid}",
                            title=text,
                            company=name,
                            location="India",
                            city="India",
                            platform="Enterprise_IT",
                            url=full_url,
                            workplace_type="Onsite",
                            employment_type="Full-Time",
                            description=f"Active technology role at {name}. Direct application on corporate careers portal.",
                            skills=["Java", "C++", "Python", "SQL", "Cloud", "Testing", "Full-Stack"]
                        )
                        jobs.append(job)
        except Exception as e:
            print(f"[Indian IT] Scrape note for {name}: {e}")
        return jobs[:15]

    async def scrape_all(self) -> List[JobListing]:
        all_jobs = []
        async with create_scraper_client(timeout=10.0) as client:
            tasks = [self.scrape_single_it_giant(client, comp) for comp in self.companies]
            results = await asyncio.gather(*tasks, return_exceptions=True)
            for res in results:
                if isinstance(res, list):
                    all_jobs.extend(res)
        return all_jobs

if __name__ == "__main__":
    async def test():
        scraper = IndianITScraper()
        jobs = await scraper.scrape_all()
        for j in jobs:
            print(f"{j.title} | {j.company} | {j.url}")
    asyncio.run(test())
