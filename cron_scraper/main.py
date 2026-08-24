import asyncio
import os
import sys
import uuid
import json
import hashlib
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any, Optional
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
from scrapers.text_normalizer import (
    clean_text,
    normalize_job_url,
    sanitize_job_description,
    semantic_dedup_key,
    generate_idempotent_job_id,
    validate_job_listing_assertions
)
from scrapers.models import JobListing

PIPELINE_VERSION = "v2.5-enterprise-lineage"
CHECKPOINT_FILE = os.path.join(CURRENT_DIR, "checkpoint_run_state.json")
DLQ_FILE = os.path.join(CURRENT_DIR, "dlq_rejected_records.jsonl")

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

def log_to_dlq(raw_job: Any, reason: str, run_id: str):
    """Quarantines malformed/rejected records into a structured Dead-Letter Queue file."""
    try:
        entry = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "pipeline_run_id": run_id,
            "reason": reason,
            "payload": str(raw_job)
        }
        with open(DLQ_FILE, "a", encoding="utf-8") as f:
            f.write(json.dumps(entry) + "\n")
    except Exception as e:
        print(f"[DLQ] Error logging to DLQ: {e}")

def save_checkpoint(stage_name: str, job_count: int, run_id: str):
    """Saves pipeline state for crash recovery."""
    try:
        state = {
            "last_stage": stage_name,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "pipeline_run_id": run_id,
            "jobs_accumulated": job_count
        }
        with open(CHECKPOINT_FILE, "w", encoding="utf-8") as f:
            json.dump(state, f, indent=2)
    except Exception as e:
        print(f"[Checkpoint] Error saving state: {e}")

def reap_stale_jobs(supabase: Client, max_age_days: int = 30) -> int:
    """
    Data Freshness SLA Reaper:
    Identifies and purges closed/stale job postings not refreshed within max_age_days.
    """
    try:
        cutoff_date = (datetime.now(timezone.utc) - timedelta(days=max_age_days)).isoformat()
        res = supabase.table("jobs").delete().lt("updated_at", cutoff_date).execute()
        reaped_count = len(res.data) if res and res.data else 0
        if reaped_count > 0:
            print(f"🧹 [Freshness SLA] Reaped {reaped_count} expired job postings older than {max_age_days} days.")
        return reaped_count
    except Exception as e:
        print(f"⚠️ [Freshness SLA] Reaper note: {e}")
        return 0

async def run_scrapers():
    run_id = f"run_{uuid.uuid4().hex[:12]}"
    print(f"[{datetime.now(timezone.utc).isoformat()}] Starting Enterprise Scrape Pipeline [{run_id}] (Version: {PIPELINE_VERSION})")
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
        save_checkpoint("stage_1_workday", len(all_jobs), run_id)
    except Exception as e:
        print(f"⚠️ Workday scraper stage error: {e}")
    
    print("\n--- [Stage 2/5] Scraping Tier-1 Indian IT Giants (TCS, Infosys, Wipro, HCLTech, Tech Mahindra, Cognizant, Capgemini)... ---")
    try:
        it_jobs = await it_scraper.scrape_all()
        print(f"✅ Indian IT Scraper: Extracted {len(it_jobs)} IT openings.")
        all_jobs.extend(it_jobs)
        save_checkpoint("stage_2_indian_it", len(all_jobs), run_id)
    except Exception as e:
        print(f"⚠️ Indian IT scraper stage error: {e}")

    print("\n--- [Stage 3/5] Scraping Top 25 Greenhouse Tech Unicorns (Postman, Razorpay, Cred, Groww, Zepto, Meesho, Stripe, PhonePe)... ---")
    try:
        gh_jobs = await scrape_all_greenhouse_jobs(TOP_25_GREENHOUSE_COMPANIES)
        print(f"✅ Greenhouse Scraper: Extracted {len(gh_jobs)} tech unicorn openings.")
        all_jobs.extend(gh_jobs)
        save_checkpoint("stage_3_greenhouse", len(all_jobs), run_id)
    except Exception as e:
        print(f"⚠️ Greenhouse scraper stage error: {e}")

    print("\n--- [Stage 4/5] Scraping Top 25 Ashby AI & DevTools (Linear, Resend, Cursor, Perplexity, Cognition, Modal)... ---")
    try:
        ashby_jobs = await scrape_all_ashby_jobs(TOP_25_ASHBY_COMPANIES)
        print(f"✅ Ashby Scraper: Extracted {len(ashby_jobs)} AI/DevTool openings.")
        all_jobs.extend(ashby_jobs)
        save_checkpoint("stage_4_ashby", len(all_jobs), run_id)
    except Exception as e:
        print(f"⚠️ Ashby scraper stage error: {e}")

    print("\n--- [Stage 5/5] Scraping Top 25 Lever Portals (Cred, PocketFM)... ---")
    try:
        lever_jobs = await scrape_all_lever_jobs(TOP_25_LEVER_COMPANIES)
        print(f"✅ Lever Scraper: Extracted {len(lever_jobs)} openings.")
        all_jobs.extend(lever_jobs)
        save_checkpoint("stage_5_lever", len(all_jobs), run_id)
    except Exception as e:
        print(f"⚠️ Lever scraper stage error: {e}")
    
    # Semantic Deduplication
    seen = set()
    deduped_jobs = []
    for j in all_jobs:
        company_name = getattr(j, "company", None) or ""
        job_title = getattr(j, "title", None) or ""
        s_key = semantic_dedup_key(company_name, job_title)
        if s_key not in seen and company_name.strip() and job_title.strip():
            seen.add(s_key)
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

    # Pre-Ingestion Schema Validation, PII Scrubbing & DLQ Gating
    print("Executing Pre-Ingestion Schema Gating & PII Sanitization...")
    job_records = []
    dlq_rejected_count = 0
    
    for job in deduped_jobs:
        try:
            # 1. Clean and normalize fields
            raw_title = clean_text(getattr(job, "title", ""))
            raw_company = clean_text(getattr(job, "company", ""))
            raw_loc = clean_text(getattr(job, "location", "India") or "India")
            raw_city = clean_text(getattr(job, "city", "India") or "India")
            raw_url = normalize_job_url(getattr(job, "url", ""))
            raw_platform = getattr(job, "platform", "Enterprise")
            raw_desc = sanitize_job_description(getattr(job, "description", "") or "")
            
            # 2. Strict Pre-Ingestion Assertion Validation
            if not raw_title or len(raw_title) < 2:
                log_to_dlq(job, "Invalid or empty title", run_id)
                dlq_rejected_count += 1
                continue
                
            if not raw_company or len(raw_company) < 1:
                log_to_dlq(job, "Missing company name", run_id)
                dlq_rejected_count += 1
                continue

            if not raw_url or not raw_url.startswith("http"):
                log_to_dlq(job, "Invalid URL scheme", run_id)
                dlq_rejected_count += 1
                continue

            # 3. Deterministic Idempotent ID Generation
            surrogate_id = generate_idempotent_job_id(raw_platform, raw_company, raw_title, raw_url)

            job_records.append({
                "id": surrogate_id,
                "title": raw_title,
                "company": raw_company,
                "location": raw_loc,
                "city": raw_city,
                "platform": raw_platform,
                "url": raw_url,
                "workplace_type": getattr(job, "workplace_type", "Onsite") or "Onsite",
                "employment_type": getattr(job, "employment_type", "Full-Time") or "Full-Time",
                "stipend_or_salary": getattr(job, "stipend_or_salary", None),
                "stipend_amount_min": getattr(job, "stipend_amount_min", None),
                "description": raw_desc[:4000],
                "skills": getattr(job, "skills", []) or [],
                "updated_at": start_time.isoformat()
            })
        except Exception as ex:
            log_to_dlq(job, f"Schema validation exception: {ex}", run_id)
            dlq_rejected_count += 1

    if dlq_rejected_count > 0:
        print(f"⚠️ [DLQ] Isolated {dlq_rejected_count} malformed records to {DLQ_FILE}")

    # Bulk batch upsert in chunks of 100 records
    print(f"Upserting {len(job_records)} validated records to database...")
    successful_upserts = 0
    batch_size = 100
    for i in range(0, len(job_records), batch_size):
        chunk = job_records[i:i + batch_size]
        try:
            supabase.table("jobs").upsert(chunk, on_conflict="id").execute()
            successful_upserts += len(chunk)
        except Exception as e:
            print(f"Error bulk upserting job batch {i}-{i+len(chunk)}: {e}")

    # Run Freshness SLA Reaper
    reap_stale_jobs(supabase, max_age_days=45)

    print(f"✅ Successfully upserted {successful_upserts}/{len(job_records)} jobs to Supabase.")
    print(f"[{datetime.now(timezone.utc).isoformat()}] Enterprise Scrape Job Completed Successfully [Run ID: {run_id}].")
    return deduped_jobs

if __name__ == "__main__":
    try:
        asyncio.run(run_scrapers())
    except Exception as e:
        print(f"Runner caught top-level exception: {e}")
        sys.exit(0)
