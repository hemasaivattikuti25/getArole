import asyncio
import os
import sys
from datetime import datetime, timezone
from supabase import create_client, Client

# Ensure we can import from the parent directory if needed
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import local scraper modules
from scrapers.workday import WorkdayScraper
from scrapers.indian_it import IndianITScraper

def get_supabase_client() -> Client:
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_KEY")
    if not url or not key:
        raise ValueError("Missing SUPABASE_URL or SUPABASE_KEY environment variables")
    return create_client(url, key)

async def run_scrapers():
    print(f"[{datetime.now(timezone.utc).isoformat()}] Starting Enterprise Scrape Job (Top 25 Companies)")
    start_time = datetime.now(timezone.utc)
    
    # Initialize scrapers
    workday_scraper = WorkdayScraper()
    it_scraper = IndianITScraper()
    
    all_jobs = []
    
    print("Scraping Workday & Global Tech portals...")
    workday_jobs = await workday_scraper.scrape_all()
    all_jobs.extend(workday_jobs)
    
    print("Scraping Custom Indian IT portals...")
    it_jobs = await it_scraper.scrape_all()
    all_jobs.extend(it_jobs)
    
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
            job_data = job.model_dump() if hasattr(job, 'model_dump') else job
            job_data["last_seen_at"] = start_time.isoformat()
            
            # The 'id' column in Supabase is the primary key (usually URL or hash)
            supabase.table("jobs").upsert(job_data, on_conflict="id").execute()
            successful_upserts += 1
        except Exception as e:
            print(f"Error upserting job {job_data.get('title', 'Unknown')}: {e}")
            
    print(f"Successfully upserted {successful_upserts}/{len(all_jobs)} jobs.")
    
    # Prune Dead Jobs
    print("Pruning dead jobs...")
    try:
        # Any job where last_seen_at < start_time is dead (was not seen in this scrape)
        res = supabase.table("jobs").delete().lt("last_seen_at", start_time.isoformat()).execute()
        deleted_count = len(res.data) if hasattr(res, 'data') else 0
        print(f"Pruned {deleted_count} dead jobs.")
    except Exception as e:
        print(f"Error pruning jobs: {e}")

    print(f"[{datetime.now(timezone.utc).isoformat()}] Enterprise Scrape Job Completed Successfully.")

if __name__ == "__main__":
    asyncio.run(run_scrapers())
