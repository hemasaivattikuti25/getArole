import asyncio
import hashlib
from typing import List
import httpx
from .models import JobListing
from .greenhouse import normalize_city

async def fetch_unstop_jobs() -> List[JobListing]:
    jobs = []
    
    # We will search for 'jobs' opportunity type. We can also do 'internships' if needed.
    # For now, let's fetch the first page of 'jobs'.
    url = "https://unstop.com/api/public/opportunity/search-result?opportunity=jobs&page=1"
    
    # Custom headers to mimic a normal request
    headers = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        "Accept": "application/json"
    }

    async with httpx.AsyncClient(headers=headers, timeout=15.0) as client:
        try:
            resp = await client.get(url)
            resp.raise_for_status()
            data = resp.json()
            
            # The API returns data -> data -> list of opportunities
            opportunities = data.get("data", {}).get("data", [])
            
            for opp in opportunities:
                title = opp.get("title", "")
                
                # Sometime org name is at root or inside organization object
                company = "Unstop Partner"
                org_obj = opp.get("organization")
                if org_obj and isinstance(org_obj, dict):
                    company = org_obj.get("name", "Unstop Partner")
                elif opp.get("organization_name"):
                    company = opp.get("organization_name")
                
                # Region/Location
                region = opp.get("region", "")
                is_remote = region.lower() == "online"
                location = "Remote" if is_remote else (region if region else "Various")
                
                # Construct URL
                public_url_slug = opp.get("public_url", "")
                apply_url = f"https://unstop.com/{public_url_slug}"
                
                job_id = f"unstop_{opp.get('id', '')}"
                
                jobs.append(
                    JobListing(
                        id=job_id,
                        title=title,
                        company=company,
                        location=location,
                        city=normalize_city(location),
                        platform="Unstop",
                        url=apply_url,
                        workplace_type="Remote" if is_remote else "Onsite"
                    )
                )
        except Exception as e:
            print(f"Error fetching Unstop jobs: {e}")
            
    return jobs

if __name__ == "__main__":
    async def test():
        jobs = await fetch_unstop_jobs()
        print(f"Found {len(jobs)} Unstop jobs")
        if jobs:
            print(jobs[0])
    asyncio.run(test())
