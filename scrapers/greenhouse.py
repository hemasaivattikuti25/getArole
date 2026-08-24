import asyncio
import hashlib
from typing import List, Optional
import httpx
from bs4 import BeautifulSoup
from .models import JobListing

GREENHOUSE_COMPANIES = [
    "cloudsek", "postman", "togetherai", "instawork", "browserstack", "hasura",
    "razorpay", "cred", "slice", "jupiter", "groww",
    "zepto", "blinkit", "meesho", "shadowfax", "porter",
    "clevertap", "moengage", "chargebee", "whatfix", "darwinbox",
    "inmobi", "glance", "atlan", "yellowai",
    "ola", "rapido", "curefit", "pharmeasy", "healthifyme",
    "stripe", "coinbase", "brex", "gitlab", "databricks", "notion", "figma",
    "phonepe", "mongodb", "elastic", "datadog", "cloudflare", "airbnb",
    "dropbox", "twilio", "newrelic", "pagerduty"
]

INDIAN_LOCATIONS = [
    "india", "bengaluru", "bangalore", "hyderabad", "chennai",
    "pune", "mumbai", "delhi", "noida", "gurugram", "gurgaon", "remote"
]

def normalize_city(location_str: str) -> str:
    loc_lower = (location_str or "").lower()
    if "hyderabad" in loc_lower:
        return "Hyderabad"
    if "bengaluru" in loc_lower or "bangalore" in loc_lower:
        return "Bengaluru"
    if "chennai" in loc_lower:
        return "Chennai"
    if "pune" in loc_lower:
        return "Pune"
    if "mumbai" in loc_lower:
        return "Mumbai"
    if "delhi" in loc_lower or "noida" in loc_lower or "gurgaon" in loc_lower or "gurugram" in loc_lower:
        return "Delhi NCR"
    if "remote" in loc_lower:
        return "Remote"
    return "India"

def clean_html(raw_html: str) -> str:
    if not raw_html:
        return ""
    soup = BeautifulSoup(raw_html, "html.parser")
    return soup.get_text(separator=" ", strip=True)

async def scrape_single_greenhouse_board(client: httpx.AsyncClient, company: str) -> List[JobListing]:
    url = f"https://boards-api.greenhouse.io/v1/boards/{company}/jobs?content=true"
    listings: List[JobListing] = []
    
    try:
        response = await client.get(url, timeout=5.0)
        if response.status_code != 200:
            return listings
        
        data = response.json()
        jobs = data.get("jobs", [])
        
        for job in jobs:
            title = job.get("title", "")
            location_data = job.get("location", {})
            location_name = location_data.get("name", "") if isinstance(location_data, dict) else str(location_data)
            
            loc_lower = location_name.lower()
            if not any(target in loc_lower for target in INDIAN_LOCATIONS):
                continue
            
            raw_content = job.get("content", "")
            plain_desc = clean_html(raw_content)
            
            is_intern = any(w in (title + " " + plain_desc).lower() for w in ["intern", "internship", "trainee", "student"])
            emp_type = "Internship" if is_intern else "Full-time"
            workplace = "Remote" if "remote" in loc_lower or "remote" in title.lower() else "Onsite"
            
            job_id_str = f"gh_{company}_{job.get('id', title)}"
            uid = hashlib.md5(job_id_str.encode()).hexdigest()[:12]
            
            job_obj = JobListing(
                id=uid,
                title=title,
                company=company.capitalize(),
                location=location_name or "India",
                city=normalize_city(location_name),
                platform="Greenhouse",
                url=job.get("absolute_url", f"https://boards.greenhouse.io/{company}/jobs/{job.get('id')}"),
                workplace_type=workplace,
                employment_type=emp_type,
                description=plain_desc[:2000],
                date_posted=job.get("updated_at")
            )
            listings.append(job_obj)
            
    except Exception:
        pass
    
    return listings

async def scrape_all_greenhouse_jobs(companies: Optional[List[str]] = None) -> List[JobListing]:
    target_companies = companies or GREENHOUSE_COMPANIES
    all_jobs: List[JobListing] = []
    
    limits = httpx.Limits(max_keepalive_connections=30, max_connections=50)
    async with httpx.AsyncClient(limits=limits, headers={"User-Agent": "Mozilla/5.0"}, follow_redirects=True) as client:
        tasks = [scrape_single_greenhouse_board(client, comp) for comp in target_companies]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        for res in results:
            if isinstance(res, list):
                all_jobs.extend(res)
                
    return all_jobs
