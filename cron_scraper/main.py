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
    url = os.environ.get("SUPABASE_URL") or "https://tgmhtlqcjgcjedlnthfk.supabase.co"
    key = os.environ.get("SUPABASE_KEY") or "sb_publishable_ubfak-i16iK-jZCTpZIxTQ_9o10ZqDn"
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
    for job in all_jobs:
        try:
            job_record = {
                "id": getattr(job, "id", None) or str(uuid.uuid4()),
                "title": getattr(job, "title", "Job Role"),
                "company": getattr(job, "company", "Enterprise"),
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
            }
            
            # The 'id' column in Supabase is the primary key (usually URL or hash)
            supabase.table("jobs").upsert(job_record, on_conflict="id").execute()
            successful_upserts += 1
        except Exception as e:
            print(f"Error upserting job: {e}")
            
    print(f"Successfully upserted {successful_upserts}/{len(all_jobs)} jobs.")
    
    print(f"[{datetime.now(timezone.utc).isoformat()}] Enterprise Scrape Job Completed Successfully.")

if __name__ == "__main__":
    try:
        asyncio.run(run_scrapers())
    except Exception as e:
        print(f"Runner caught top-level exception: {e}")
        sys.exit(0)
