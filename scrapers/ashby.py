import asyncio
import hashlib
from typing import List, Optional
import httpx
from .models import JobListing
from .greenhouse import normalize_city, clean_html, INDIAN_LOCATIONS

# Prominent tech companies using Ashby
ASHBY_COMPANIES = [
    "linear", "retool", "resend", "vapi", "cursor", "perplexity",
    "sanas", "baseten", "together-ai", "dust", "cognition", "modal", "qdrant"
]

async def scrape_single_ashby_board(client: httpx.AsyncClient, company: str) -> List[JobListing]:
    url = f"https://api.ashbyhq.com/posting-api/job-board/{company}"
    listings: List[JobListing] = []
    
    try:
        response = await client.get(url, timeout=10.0)
        if response.status_code != 200:
            return listings
        
        data = response.json()
        jobs = data.get("jobs", [])
        
        for job in jobs:
            title = job.get("title", "")
            location_name = job.get("location", "")
            is_remote = job.get("isRemote", False)
            
            combined_loc = f"{location_name} {'remote' if is_remote else ''}".lower()
            if not any(target in combined_loc for target in INDIAN_LOCATIONS):
                continue
            
            raw_desc = clean_html(job.get("descriptionHtml", ""))
            
            is_intern = "intern" in (title + " " + raw_desc).lower()
            emp_type = "Internship" if is_intern else "Full-time"
            
            job_id_str = f"ashby_{company}_{job.get('id', title)}"
            uid = hashlib.md5(job_id_str.encode()).hexdigest()[:12]
            
            job_obj = JobListing(
                id=uid,
                title=title,
                company=company.capitalize(),
                location=location_name or "India",
                city=normalize_city(location_name),
                platform="Ashby",
                url=job.get("jobUrl", f"https://jobs.ashbyhq.com/{company}/{job.get('id')}"),
                workplace_type="Remote" if is_remote else "Onsite",
                employment_type=emp_type,
                description=raw_desc[:4000],
                date_posted=str(job.get("publishedAt", ""))
            )
            listings.append(job_obj)
            
    except Exception:
        pass
    
    return listings

async def scrape_all_ashby_jobs(companies: Optional[List[str]] = None) -> List[JobListing]:
    target_companies = companies or ASHBY_COMPANIES
    all_jobs: List[JobListing] = []
    
    limits = httpx.Limits(max_keepalive_connections=20, max_connections=50)
    async with httpx.AsyncClient(limits=limits, headers={"User-Agent": "Mozilla/5.0"}) as client:
        tasks = [scrape_single_ashby_board(client, comp) for comp in target_companies]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        for res in results:
            if isinstance(res, list):
                all_jobs.extend(res)
                
    return all_jobs
