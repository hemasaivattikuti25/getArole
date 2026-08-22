import asyncio
import json
import subprocess
from typing import List, Optional
from .models import JobListing
from .greenhouse import normalize_city

TARGET_QUERIES = [
    "AI Engineer Intern",
    "Python Developer Intern",
    "Software Engineer Intern",
    "Backend Developer Intern",
    "Machine Learning Intern"
]

TARGET_CITIES = [
    "Hyderabad, Telangana, India",
    "Bengaluru, Karnataka, India",
    "Chennai, Tamil Nadu, India",
    "Remote"
]

def run_linkedin_cli_search(query: str, location: str, limit: int = 15) -> List[JobListing]:
    listings: List[JobListing] = []
    
    cmd = [
        "bun", "run", "ai-job-search/.agents/skills/linkedin-search/cli/src/cli.ts",
        "search",
        "-q", query,
        "-l", location,
        "--jobage", "14",
        "-n", str(limit),
        "--format", "json"
    ]
    
    try:
        proc = subprocess.run(cmd, capture_output=True, text=True, timeout=25)
        if proc.returncode != 0:
            return listings
        
        data = json.loads(proc.stdout)
        results = data.get("results", [])
        
        for item in results:
            title = item.get("title", "")
            company = item.get("company", "")
            loc = item.get("location", location)
            job_id = str(item.get("id", ""))
            
            is_intern = any(w in title.lower() for w in ["intern", "trainee", "student"])
            
            job_obj = JobListing(
                id=f"li_{job_id}",
                title=title,
                company=company,
                location=loc,
                city="Remote" if "remote" in loc.lower() or "remote" in location.lower() else normalize_city(loc),
                platform="LinkedIn",
                url=item.get("url", f"https://www.linkedin.com/jobs/view/{job_id}"),
                workplace_type="Remote" if "remote" in loc.lower() or "remote" in location.lower() else "Onsite",
                employment_type="Internship" if is_intern else "Full-time",
                date_posted=item.get("date", "Recent")
            )
            listings.append(job_obj)
            
    except Exception:
        pass
        
    return listings

async def scrape_all_linkedin_jobs() -> List[JobListing]:
    all_jobs: List[JobListing] = []
    loop = asyncio.get_event_loop()
    
    tasks = []
    for q in TARGET_QUERIES:
        for loc in TARGET_CITIES:
            tasks.append(loop.run_in_executor(None, run_linkedin_cli_search, q, loc, 10))
            
    results = await asyncio.gather(*tasks, return_exceptions=True)
    for res in results:
        if isinstance(res, list):
            all_jobs.extend(res)
            
    return all_jobs
