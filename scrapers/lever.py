import asyncio
import hashlib
from typing import List, Optional
import httpx
from bs4 import BeautifulSoup
from .models import JobListing
from .greenhouse import normalize_city, clean_html, INDIAN_LOCATIONS

LEVER_COMPANIES = [
    "cred", "pocketfm"
]

async def scrape_single_lever_board(client: httpx.AsyncClient, company: str) -> List[JobListing]:
    url = f"https://api.lever.co/v0/postings/{company}?mode=json"
    listings: List[JobListing] = []
    
    try:
        response = await client.get(url, timeout=3.0)
        if response.status_code != 200:
            return listings
        
        jobs = response.json()
        if not isinstance(jobs, list):
            return listings
        
        for job in jobs:
            title = job.get("text", "")
            categories = job.get("categories", {})
            location_name = categories.get("location", "") or ""
            workplace = categories.get("workplaceType", "Onsite")
            commitment = categories.get("commitment", "Full-time")
            
            combined_loc = f"{location_name} {workplace}".lower()
            if not any(target in combined_loc for target in INDIAN_LOCATIONS):
                continue
            
            raw_desc = job.get("descriptionPlain", "") or clean_html(job.get("description", ""))
            
            is_intern = "intern" in (title + " " + commitment + " " + raw_desc).lower()
            emp_type = "Internship" if is_intern else "Full-time"
            
            job_id_str = f"lever_{company}_{job.get('id', title)}"
            uid = hashlib.md5(job_id_str.encode()).hexdigest()[:12]
            
            job_obj = JobListing(
                id=uid,
                title=title,
                company=company.capitalize(),
                location=location_name or "India",
                city=normalize_city(location_name),
                platform="Lever",
                url=job.get("hostedUrl", f"https://jobs.lever.co/{company}/{job.get('id')}"),
                workplace_type="Remote" if "remote" in combined_loc else "Onsite",
                employment_type=emp_type,
                description=raw_desc[:2000],
                date_posted=str(job.get("createdAt", ""))
            )
            listings.append(job_obj)
            
    except Exception as e:
        print(f"[Lever Scraper Warning] Exception during scraping {company_slug}: {e}")
    
    return listings

async def scrape_all_lever_jobs(companies: Optional[List[str]] = None) -> List[JobListing]:
    target_companies = companies or LEVER_COMPANIES
    all_jobs: List[JobListing] = []
    
    limits = httpx.Limits(max_keepalive_connections=30, max_connections=50)
    async with httpx.AsyncClient(limits=limits, headers={"User-Agent": "Mozilla/5.0"}, follow_redirects=True) as client:
        tasks = [scrape_single_lever_board(client, comp) for comp in target_companies]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        for res in results:
            if isinstance(res, list):
                all_jobs.extend(res)
                
    return all_jobs
