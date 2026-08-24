import asyncio
import os
import sys
import uuid
from datetime import datetime, timezone
from supabase import create_client, Client

# Ensure current directory is on sys.path first
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
if CURRENT_DIR not in sys.path:
    sys.path.insert(0, CURRENT_DIR)

# Import local scraper modules
from enterprise_scrapers.workday import WorkdayScraper
from enterprise_scrapers.indian_it import IndianITScraper

def get_supabase_client() -> Client:
    url = os.environ.get("SUPABASE_URL", "")
    key = os.environ.get("SUPABASE_KEY", "")
    return create_client(url, key)

async def run_scrapers():
    print(f"[{datetime.now(timezone.utc).isoformat()}] Starting Enterprise Scrape Job (Top 25 Companies)")
    start_time = datetime.now(timezone.utc)
    
    # Initialize scrapers
    workday_scraper = WorkdayScraper()
    it_scraper = IndianITScraper()
    
    all_jobs = []
    
    print("Scraping Workday & Global Tech portals...")
    try:
        workday_jobs = await workday_scraper.scrape_all()
        all_jobs.extend(workday_jobs)
    except Exception as e:
        print(f"Workday scraper stage error: {e}")
    
    print("Scraping Custom Indian IT portals...")
    try:
        it_jobs = await it_scraper.scrape_all()
        all_jobs.extend(it_jobs)
    except Exception as e:
        print(f"Indian IT scraper stage error: {e}")
    
    print(f"Total jobs scraped: {len(all_jobs)}")
    
    # Initialize Database
    try:
        supabase = get_supabase_client()
        print("Connected to Supabase successfully.")
    except Exception as e:
        print(f"Failed to connect to Supabase: {e}")
        return

    # Upsert jobs into Supabase
    print("Upserting jobs to database...")
    successful_upserts = 0
    job_records = []
    for job in all_jobs:
        job_records.append({
            "id": getattr(job, "id", None) or getattr(job, "url", ""),
            "title": getattr(job, "title", "Software Engineer"),
            "company": getattr(job, "company", "Company"),
            "location": getattr(job, "location", "India"),
            "city": getattr(job, "city", "India") or "India",
            "platform": getattr(job, "platform", "Enterprise"),
            "url": getattr(job, "url", ""),
            "workplace_type": getattr(job, "workplace_type", "Onsite") or "Onsite",
            "employment_type": getattr(job, "employment_type", "Full-Time") or "Full-Time",
            "stipend_or_salary": getattr(job, "stipend_or_salary", None),
            "stipend_amount_min": getattr(job, "stipend_amount_min", None),
            "description": (getattr(job, "description", "") or "")[:4000],
            "skills": getattr(job, "skills", []) or [],
            "updated_at": start_time.isoformat()
        })

    # Bulk batch upsert in chunks of 100 records
    batch_size = 100
    for i in range(0, len(job_records), batch_size):
        chunk = job_records[i:i + batch_size]
        try:
            supabase.table("jobs").upsert(chunk, on_conflict="id").execute()
            successful_upserts += len(chunk)
        except Exception as e:
            print(f"Error bulk upserting job batch {i}-{i+len(chunk)}: {e}")

    print(f"Successfully upserted {successful_upserts}/{len(all_jobs)} jobs.")
    
    print(f"[{datetime.now(timezone.utc).isoformat()}] Enterprise Scrape Job Completed Successfully.")

if __name__ == "__main__":
    try:
        asyncio.run(run_scrapers())
    except Exception as e:
        print(f"Runner caught top-level exception: {e}")
        sys.exit(0)
