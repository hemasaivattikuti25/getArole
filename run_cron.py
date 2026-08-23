"""
getArole — 30-Minute Continuous Job Scraper & Ingestion Engine
Can be run as a background daemon, a cron job, or in GitHub Actions.
"""
import asyncio
import os
import sys

# Ensure project root is in sys.path
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, BASE_DIR)

from scrapers.aggregator import JobAggregator
from services.supabase_service import get_supabase_service

async def run_sync():
    print("=" * 65)
    print("🚀 [getArole Cron] Starting 30-minute career gateway sync...")
    print("=" * 65)

    aggregator = JobAggregator()
    jobs = await aggregator.aggregate_all()
    print(f"📦 [getArole Cron] Scraped {len(jobs)} total live jobs across all gateways.")

    if jobs:
        # 1. Save local snapshot
        import json
        with open(os.path.join(BASE_DIR, "scraped_jobs.json"), "w", encoding="utf-8") as f:
            json.dump([j.model_dump() for j in jobs], f, indent=2)

        # 2. Push to Supabase PostgreSQL
        supabase = get_supabase_service()
        if supabase.is_connected():
            inserted = await supabase.upsert_jobs_bulk(jobs)
            print(f"✅ [getArole Cron] Successfully pushed {inserted} listings into Supabase database.")
        else:
            print("⚠️ [getArole Cron] Supabase client offline. Local snapshot updated.")

    print("🏁 [getArole Cron] Sync finished successfully.")

if __name__ == "__main__":
    asyncio.run(run_sync())
