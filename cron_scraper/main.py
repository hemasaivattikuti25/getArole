import asyncio
import os
import sys
import uuid
from datetime import datetime, timezone
from dotenv import load_dotenv

# Ensure root workspace and current directory are on sys.path
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(CURRENT_DIR)
for p in [CURRENT_DIR, PROJECT_ROOT]:
    if p not in sys.path:
        sys.path.insert(0, p)

load_dotenv(os.path.join(PROJECT_ROOT, ".env"))

from supabase import create_client, Client
from enterprise_scrapers.workday import WorkdayScraper
from enterprise_scrapers.indian_it import IndianITScraper
from scrapers.greenhouse import scrape_all_greenhouse_jobs
from scrapers.lever import scrape_all_lever_jobs
from scrapers.ashby import scrape_all_ashby_jobs

TOP_25_GREENHOUSE_COMPANIES = [
    "postman", "razorpay", "cred", "groww", "zepto", "blinkit", "meesho",
    "stripe", "phonepe", "databricks", "coinbase", "notion", "figma",
    "swiggy", "clevertap", "moengage", "chargebee", "whatfix", "darwinbox",
    "inmobi", "glance", "atlan", "yellowai", "ola", "rapido", "curefit",
    "pharmeasy", "healthifyme", "twilio", "datadog", "elastic", "mongodb",
    "airbnb", "dropbox", "cloudflare", "pagerduty", "newrelic"
]

TOP_25_ASHBY_COMPANIES = [
    "linear", "resend", "cursor", "perplexity", "cognition", "modal", "baseten", "dust", "vapi"
]

TOP_25_LEVER_COMPANIES = [
    "cred", "pocketfm"
]

def get_supabase_client() -> Client:
    url = os.environ.get("SUPABASE_URL", "")
    key = os.environ.get("SUPABASE_KEY", "")
    return create_client(url, key)

async def run_scrapers():
    print(f"[{datetime.now(timezone.utc).isoformat()}] Starting Enterprise Scrape Job (Top 25 Tech Companies)")
    start_time = datetime.now(timezone.utc)
    
    # Initialize scrapers
    workday_scraper = WorkdayScraper()
    it_scraper = IndianITScraper()
    
    all_jobs = []
    
    print("\n--- [Stage 1/5] Scraping Workday & Global Tech Portals (Walmart, Cisco, Intel, Dell, Adobe)... ---")
    try:
        workday_jobs = await workday_scraper.scrape_all()
        print(f"✅ Workday Scraper: Extracted {len(workday_jobs)} enterprise openings.")
        all_jobs.extend(workday_jobs)
    except Exception as e:
        print(f"⚠️ Workday scraper stage error: {e}")
    
    print("\n--- [Stage 2/5] Scraping Tier-1 Indian IT Giants (TCS, Infosys, Wipro, HCLTech, Tech Mahindra, Cognizant, Capgemini)... ---")
    try:
        it_jobs = await it_scraper.scrape_all()
        print(f"✅ Indian IT Scraper: Extracted {len(it_jobs)} IT openings.")
        all_jobs.extend(it_jobs)
    except Exception as e:
        print(f"⚠️ Indian IT scraper stage error: {e}")

    print("\n--- [Stage 3/5] Scraping Top 25 Greenhouse Tech Unicorns (Postman, Razorpay, Cred, Groww, Zepto, Meesho, Stripe, PhonePe)... ---")
    try:
        gh_jobs = await scrape_all_greenhouse_jobs(TOP_25_GREENHOUSE_COMPANIES)
        print(f"✅ Greenhouse Scraper: Extracted {len(gh_jobs)} tech unicorn openings.")
        all_jobs.extend(gh_jobs)
    except Exception as e:
        print(f"⚠️ Greenhouse scraper stage error: {e}")

    print("\n--- [Stage 4/5] Scraping Top 25 Ashby AI & DevTools (Linear, Resend, Cursor, Perplexity, Cognition, Modal)... ---")
    try:
        ashby_jobs = await scrape_all_ashby_jobs(TOP_25_ASHBY_COMPANIES)
        print(f"✅ Ashby Scraper: Extracted {len(ashby_jobs)} AI/DevTool openings.")
        all_jobs.extend(ashby_jobs)
    except Exception as e:
        print(f"⚠️ Ashby scraper stage error: {e}")

    print("\n--- [Stage 5/5] Scraping Top 25 Lever Portals (Cred, PocketFM)... ---")
    try:
        lever_jobs = await scrape_all_lever_jobs(TOP_25_LEVER_COMPANIES)
        print(f"✅ Lever Scraper: Extracted {len(lever_jobs)} openings.")
        all_jobs.extend(lever_jobs)
    except Exception as e:
        print(f"⚠️ Lever scraper stage error: {e}")
    
    # Deduplicate by (company, title)
    seen = set()
    deduped_jobs = []
    for j in all_jobs:
        key = f"{(getattr(j, 'company', '') or '').lower().strip()}_{(getattr(j, 'title', '') or '').lower().strip()}"
        if key not in seen and getattr(j, 'title', None) and getattr(j, 'company', None):
            seen.add(key)
            deduped_jobs.append(j)

    print(f"\n=================================================")
    print(f"📊 TOTAL UNIQUE JOBS SCRAPED ACROSS TOP 25: {len(deduped_jobs)}")
    print(f"=================================================")
    
    # Initialize Database
    try:
        supabase = get_supabase_client()
        print("Connected to Supabase database successfully.")
    except Exception as e:
        print(f"Failed to connect to Supabase: {e}")
        return deduped_jobs

    # Upsert jobs into Supabase
    print("Upserting jobs to database...")
    successful_upserts = 0
    job_records = []
    for job in deduped_jobs:
        job_records.append({
            "id": getattr(job, "id", None) or getattr(job, "url", "") or str(uuid.uuid4()),
            "title": getattr(job, "title", "Software Engineer"),
            "company": getattr(job, "company", "Company"),
            "location": getattr(job, "location", "India") or "India",
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

    print(f"✅ Successfully upserted {successful_upserts}/{len(deduped_jobs)} jobs to Supabase.")
    print(f"[{datetime.now(timezone.utc).isoformat()}] Enterprise Scrape Job Completed Successfully.")
    return deduped_jobs

if __name__ == "__main__":
    try:
        asyncio.run(run_scrapers())
    except Exception as e:
        print(f"Runner caught top-level exception: {e}")
        sys.exit(0)
