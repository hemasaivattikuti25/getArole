import os
import time
import asyncio
import logging
from collections import defaultdict
from typing import List, Dict, Any, Optional
from dotenv import load_dotenv
from supabase import create_client, Client
from scrapers.models import JobListing, CandidateProfile
from domain.models import CandidateScreeningReport
from core.metrics import SUPABASE_FAILURES_TOTAL, DEPENDENCY_ERRORS_TOTAL, SUPABASE_QUERY_DURATION, CACHE_OPERATIONS

load_dotenv()

_JOB_WRITE_THROUGH_CACHE: List[Dict[str, Any]] = []
_CACHE_TIMESTAMP: float = 0.0
SLOW_QUERY_THRESHOLD_MS = 200.0  # 10% of 2.0s P99 Search Latency SLO

class SupabaseService:
    def __init__(self):
        self.url = os.getenv("SUPABASE_URL", "")
        self.key = os.getenv("SUPABASE_KEY", "")
        self.client: Optional[Any] = None
        
    async def _get_client(self):
        if self.url and self.key:
            try:
                loop = asyncio.get_running_loop()
                if self.client and getattr(self, "_loop", None) != loop:
                    self.client = None
                if not self.client:
                    from supabase import create_async_client
                    self.client = await create_async_client(self.url, self.key)
                    self._loop = loop
            except Exception as e:
                print(f"[Supabase] Warning: Could not initialize Async Supabase client: {e}")
        return self.client

    def is_connected(self) -> bool:
        # Note: Since client is initialized lazily, this returns True optimistically if credentials exist.
        return bool(self.url and self.key)

    async def upsert_jobs_bulk(self, jobs: List[JobListing]) -> int:
        """
        Batches and upserts job listings into Supabase public.jobs table asynchronously.
        """
        client = await self._get_client()
        if not client or not jobs:
            return 0

        records = []
        for j in jobs:
            records.append({
                "id": j.id,
                "title": j.title,
                "company": j.company,
                "location": j.location,
                "city": j.city or "India",
                "platform": j.platform,
                "url": j.url,
                "workplace_type": j.workplace_type or "Onsite",
                "employment_type": j.employment_type or "Full-Time",
                "stipend_or_salary": j.stipend_or_salary,
                "stipend_amount_min": j.stipend_amount_min,
                "description": (j.description or "")[:4000],
                "skills": j.skills if hasattr(j, "skills") else []
            })

        inserted_count = 0
        batch_size = 100
        for i in range(0, len(records), batch_size):
            batch = records[i:i + batch_size]
            try:
                await client.table("jobs").upsert(batch, on_conflict="id").execute()
                inserted_count += len(batch)
            except Exception as e:
                print(f"[Supabase] Batch upsert error (batch {i//batch_size + 1}): {e}")
                # Don't break on a single batch failure to ensure partial successes
                continue

        return inserted_count

    async def fetch_jobs(self, limit: int = 100, city: Optional[str] = None, workplace_type: Optional[str] = None) -> List[Dict[str, Any]]:
        global _JOB_WRITE_THROUGH_CACHE, _CACHE_TIMESTAMP
        client = await self._get_client()
        if not client:
            CACHE_OPERATIONS.labels(cache="supabase_jobs", operation="stale_serve").inc()
            return _JOB_WRITE_THROUGH_CACHE

        query_start = time.time()
        try:
            async with asyncio.timeout(2.5):  # 2.5s strict timeout
                query = client.table("jobs").select("id,title,company,location,city,platform,url,workplace_type,employment_type,stipend_or_salary,description,skills,created_at,updated_at").limit(limit)
                if city:
                    query = query.ilike("city", f"%{city}%")
                if workplace_type:
                    query = query.ilike("workplace_type", f"%{workplace_type}%")
                    
                res = await query.execute()
                duration_s = time.time() - query_start
                query_duration_ms = round(duration_s * 1000, 2)
                
                # Observe duration into Prometheus Histogram
                SUPABASE_QUERY_DURATION.labels(operation="fetch_jobs").observe(duration_s)

                # SRE Slow Query Alerting threshold (200ms = 10% of 2.0s P99 SLO)
                if query_duration_ms > SLOW_QUERY_THRESHOLD_MS:
                    slo_consumed = round((query_duration_ms / 2000.0) * 100, 1)
                    logging.getLogger("sre.database").warning(
                        "slow_database_query",
                        extra={
                            "table": "jobs",
                            "duration_ms": query_duration_ms,
                            "threshold_ms": SLOW_QUERY_THRESHOLD_MS,
                            "slo_budget_consumed_pct": slo_consumed,
                            "limit": limit
                        }
                    )

                if res.data:
                    _JOB_WRITE_THROUGH_CACHE = res.data
                    _CACHE_TIMESTAMP = time.time()
                    CACHE_OPERATIONS.labels(cache="supabase_jobs", operation="write_through_refresh").inc()
                return res.data or _JOB_WRITE_THROUGH_CACHE
        except asyncio.TimeoutError:
            SUPABASE_FAILURES_TOTAL.labels(error_type="timeout_2.5s").inc()
            DEPENDENCY_ERRORS_TOTAL.labels(dependency="supabase", error_type="timeout").inc()
            CACHE_OPERATIONS.labels(cache="supabase_jobs", operation="stale_serve").inc()
            logging.getLogger("sre.database").error(
                "supabase_timeout_serving_cache",
                extra={"cache_age_sec": round(time.time() - _CACHE_TIMESTAMP, 1), "timeout_limit_s": 2.5}
            )
            return _JOB_WRITE_THROUGH_CACHE
        except Exception as e:
            error_name = type(e).__name__
            SUPABASE_FAILURES_TOTAL.labels(error_type=error_name).inc()
            DEPENDENCY_ERRORS_TOTAL.labels(dependency="supabase", error_type=error_name).inc()
            CACHE_OPERATIONS.labels(cache="supabase_jobs", operation="stale_serve").inc()
            logging.getLogger("sre.database").error(
                "supabase_fetch_error_serving_cache",
                extra={"error_type": error_name, "error": str(e)}
            )
            return _JOB_WRITE_THROUGH_CACHE

    async def save_candidate_screening(
        self,
        candidate_name: str,
        resume_text: str,
        job_id: str,
        report: CandidateScreeningReport
    ) -> bool:
        client = await self._get_client()
        if not client:
            return False

        try:
            cand_res = await client.table("candidates").insert({
                "name": candidate_name,
                "skills": report.extracted_skills,
                "raw_resume_text": resume_text[:5000]
            }).execute()
            
            cand_id = cand_res.data[0]["id"] if cand_res.data else None

            await client.table("match_evaluations").insert({
                "candidate_id": cand_id,
                "job_id": job_id,
                "fit_score_percent": float(report.score_10 * 10),
                "score_10": float(report.score_10),
                "verdict": report.verdict,
                "rubric_breakdown": {
                    "technical_skills": report.rubric_breakdown.technical_skills,
                    "experience_relevance": report.rubric_breakdown.experience_depth,
                    "prerequisites_met": report.rubric_breakdown.prerequisite_coverage
                },
                "strengths": report.strengths,
                "missing_skills": report.missing_skills,
                "justification": report.justification
            }).execute()
            return True
        except Exception as e:
            print(f"[Supabase] Screening log error: {e}")
            return False

    async def upsert_candidate_profile(self, profile_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        client = await self._get_client()
        if not client:
            return None

        try:
            record = {
                "name": profile_data.get("name") or f"{profile_data.get('firstName', '')} {profile_data.get('lastName', '')}".strip() or "Candidate",
                "email": profile_data.get("email"),
                "skills": profile_data.get("skills") or [],
                "education": str(profile_data.get("education") or ""),
                "raw_resume_text": profile_data.get("raw_resume_text") or "",
            }
            res = await client.table("candidates").insert(record).execute()
            return res.data[0] if res.data else record
        except Exception as e:
            print(f"[Supabase] Candidate upsert error: {e}")
            return None

    async def fetch_all_candidates(self, limit: int = 100) -> List[Dict[str, Any]]:
        client = await self._get_client()
        if not client:
            return []

        try:
            res = await client.table("candidates").select("*").order("created_at", desc=True).limit(limit).execute()
            return res.data or []
        except Exception as e:
            print(f"[Supabase] Fetch candidates error: {e}")
            return []
            
    async def fetch_candidate(self, cand_id: str) -> Optional[Dict[str, Any]]:
        client = await self._get_client()
        if not client:
            return None

        try:
            res = await client.table("candidates").select("*").eq("id", cand_id).limit(1).execute()
            return res.data[0] if res.data else None
        except Exception as e:
            print(f"[Supabase] Fetch candidate error: {e}")
            return None

    async def save_user_profile(self, firebase_uid: str, profile: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Upsert a user's profile into user_profiles table, keyed by firebase_uid."""
        client = await self._get_client()
        if not client:
            return None
        try:
            valid_cols = {
                "firebase_uid", "email", "first", "last", "pref_name", "suffix", "phone", "dob", "loc",
                "add1", "add2", "add3", "zip", "headline", "linkedin_url", "github_url", "portfolio_url", "other_url"
            }
            # Map common aliases if present
            flat_profile = {**profile}
            if "pref" in flat_profile and "pref_name" not in flat_profile:
                flat_profile["pref_name"] = flat_profile.pop("pref")
            if "links" in flat_profile and isinstance(flat_profile["links"], dict):
                links = flat_profile["links"]
                if links.get("linkedin"): flat_profile["linkedin_url"] = links["linkedin"]
                if links.get("github"): flat_profile["github_url"] = links["github"]
                if links.get("portfolio"): flat_profile["portfolio_url"] = links["portfolio"]
                if links.get("other"): flat_profile["other_url"] = links["other"]

            record = {"firebase_uid": firebase_uid}
            for k, v in flat_profile.items():
                if k in valid_cols and v is not None:
                    record[k] = v

            res = await client.table("user_profiles").upsert(record, on_conflict="firebase_uid").execute()
            return res.data[0] if res.data else record
        except Exception as e:
            print(f"[Supabase] save_user_profile error: {e}")
            return None

    async def load_user_profile(self, firebase_uid: str) -> Optional[Dict[str, Any]]:
        """Fetch a user's profile from user_profiles table."""
        client = await self._get_client()
        if not client:
            return None
        try:
            res = await client.table("user_profiles").select("*").eq("firebase_uid", firebase_uid).limit(1).execute()
            data = res.data[0] if res.data else None
            if data:
                if "pref_name" in data and "pref" not in data:
                    data["pref"] = data["pref_name"]
            return data
        except Exception as e:
            print(f"[Supabase] load_user_profile error: {e}")
            return None

    async def save_user_preferences(self, firebase_uid: str, prefs: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Upsert a user's job preferences into user_preferences table, keyed by firebase_uid."""
        client = await self._get_client()
        if not client:
            return None
        try:
            valid_cols = {
                "firebase_uid", "values", "roles", "locations", "roletype", "rolelevel",
                "compsize", "industries", "skills_inc", "salary_amt", "salary_curr", "status"
            }
            flat_prefs = {**prefs}
            # Map aliases
            if "industries_inc" in flat_prefs and "industries" not in flat_prefs:
                flat_prefs["industries"] = flat_prefs.pop("industries_inc")

            record = {"firebase_uid": firebase_uid}
            for k, v in flat_prefs.items():
                if k in valid_cols and v is not None:
                    record[k] = v

            res = await client.table("user_preferences").upsert(record, on_conflict="firebase_uid").execute()
            return res.data[0] if res.data else record
        except Exception as e:
            print(f"[Supabase] save_user_preferences error: {e}")
            return None

    async def load_user_preferences(self, firebase_uid: str) -> Optional[Dict[str, Any]]:
        """Fetch a user's job preferences from user_preferences table."""
        client = await self._get_client()
        if not client:
            return None
        try:
            res = await client.table("user_preferences").select("*").eq("firebase_uid", firebase_uid).limit(1).execute()
            data = res.data[0] if res.data else None
            if data:
                if "industries" in data and "industries_inc" not in data:
                    data["industries_inc"] = data["industries"]
            return data
        except Exception as e:
            print(f"[Supabase] load_user_preferences error: {e}")
            return None

    async def save_user_resume(self, firebase_uid: str, resume_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Save a user's uploaded and parsed resume into user_resumes table."""
        client = await self._get_client()
        if not client:
            return None
        try:
            record = {"firebase_uid": firebase_uid, **resume_data}
            res = await client.table("user_resumes").insert(record).execute()
            return res.data[0] if res.data else record
        except Exception as e:
            print(f"[Supabase] save_user_resume error: {e}")
            return None

    async def load_user_resume(self, firebase_uid: str) -> Optional[Dict[str, Any]]:
        """Fetch a user's active resume from user_resumes table."""
        client = await self._get_client()
        if not client:
            return None
        try:
            res = await client.table("user_resumes").select("*").eq("firebase_uid", firebase_uid).order("uploaded_at", desc=True).limit(1).execute()
            return res.data[0] if res.data else None
        except Exception as e:
            print(f"[Supabase] load_user_resume error: {e}")
            return None

    async def purge_user_account(self, firebase_uid: str) -> bool:
        """
        GDPR Right-to-be-Forgotten & Cascade Deletion:
        Purges all user records from user_profiles, user_preferences, and user_resumes.
        """
        client = await self._get_client()
        if not client or not firebase_uid or firebase_uid == "guest_user":
            return False
        try:
            # Delete in parallel across user tables
            await asyncio.gather(
                client.table("user_profiles").delete().eq("firebase_uid", firebase_uid).execute(),
                client.table("user_preferences").delete().eq("firebase_uid", firebase_uid).execute(),
                client.table("user_resumes").delete().eq("firebase_uid", firebase_uid).execute(),
                return_exceptions=True
            )
            print(f"🧹 [GDPR Purge] Successfully purged all associated records for UID: {firebase_uid}")
            return True
        except Exception as e:
            print(f"[Supabase] purge_user_account error: {e}")
            return False

# Global User Mutex Registry for TOCTOU concurrency serialization
_USER_LOCKS: Dict[Any, asyncio.Lock] = {}

def get_user_lock(uid: str) -> asyncio.Lock:
    """Returns an async lock bound to the currently active running event loop."""
    try:
        loop = asyncio.get_running_loop()
    except RuntimeError:
        loop = None
    key = (loop, uid)
    if key not in _USER_LOCKS:
        _USER_LOCKS[key] = asyncio.Lock()
    return _USER_LOCKS[key]

# Global Singleton
_supabase_service: Optional[SupabaseService] = None

def get_supabase_service() -> SupabaseService:
    global _supabase_service
    if _supabase_service is None:
        _supabase_service = SupabaseService()
    return _supabase_service
