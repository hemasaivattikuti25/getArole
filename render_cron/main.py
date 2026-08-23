import asyncio
import os
import sys
from datetime import datetime, timezone
from supabase import create_client, Client

# Ensure we can import from the parent directory if needed
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import local scraper modules (to be created)
# from scrapers.workday import WorkdayScraper
# from scrapers.taleo import TaleoScraper
# from scrapers.custom_portals import CustomPortalScraper

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
    # workday_scraper = WorkdayScraper()
    # taleo_scraper = TaleoScraper()
    # custom_scraper = CustomPortalScraper()
    
    all_jobs = []
    
    # TODO: Fetch jobs from all scrapers
    # print("Scraping Workday portals...")
    # workday_jobs = await workday_scraper.scrape_all()
    # all_jobs.extend(workday_jobs)
    
    # print("Scraping Taleo portals...")
    # taleo_jobs = await taleo_scraper.scrape_all()
    # all_jobs.extend(taleo_jobs)
    
    # print("Scraping Custom IT portals...")
    # custom_jobs = await custom_scraper.scrape_all()
    # all_jobs.extend(custom_jobs)
    
    print(f"Total jobs scraped: {len(all_jobs)}")
    
    # Initialize Database
    try:
        supabase = get_supabase_client()
        print("Connected to Supabase successfully.")
    except Exception as e:
        print(f"Failed to connect to Supabase: {e}")
        return

    # TODO: Upsert jobs into Supabase
    print("Upserting jobs to database...")
    for job in all_jobs:
        # We will add a 'last_seen_at' timestamp before upserting
        job_data = job.model_dump()
        job_data["last_seen_at"] = start_time.isoformat()
        
        # Example upsert logic (assuming a 'jobs' table and 'id' as primary key)
        # supabase.table("jobs").upsert(job_data, on_conflict="id").execute()
    
    # TODO: Prune Dead Jobs
    print("Pruning dead jobs...")
    # Any job where last_seen_at < start_time is dead (was not seen in this scrape)
    # supabase.table("jobs").delete().lt("last_seen_at", start_time.isoformat()).execute()

    print(f"[{datetime.now(timezone.utc).isoformat()}] Enterprise Scrape Job Completed Successfully.")

if __name__ == "__main__":
    asyncio.run(run_scrapers())
