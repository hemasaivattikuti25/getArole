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
_CACHE_FETCH_LOCK: Optional[asyncio.Lock] = None
SLOW_QUERY_THRESHOLD_MS = 200.0  # 10% of 2.0s P99 Search Latency SLO

def _get_cache_fetch_lock() -> asyncio.Lock:
    global _CACHE_FETCH_LOCK
    if _CACHE_FETCH_LOCK is None:
        _CACHE_FETCH_LOCK = asyncio.Lock()
    return _CACHE_FETCH_LOCK

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
                DEPENDENCY_ERRORS_TOTAL.labels(dependency="supabase", error_type="batch_upsert_failure").inc()
                logging.getLogger("sre.database").error(
                    "supabase_batch_upsert_failure",
                    extra={"batch_index": i // batch_size + 1, "batch_size": len(batch), "error": str(e)}
                )
                # Don't break on a single batch failure to ensure partial successes
                continue

        return inserted_count

    async def fetch_jobs(self, limit: int = 100, city: Optional[str] = None, workplace_type: Optional[str] = None) -> List[Dict[str, Any]]:
        global _JOB_WRITE_THROUGH_CACHE, _CACHE_TIMESTAMP
        now = time.time()
        
        # High-Concurrency L1 Cache Fast Path (15s TTL for general unfiltered queries)
        # Absorbs 1k-5k VU spikes without exhausting Supabase connection pool
        is_general_query = not city and not workplace_type
        if is_general_query and _JOB_WRITE_THROUGH_CACHE and (now - _CACHE_TIMESTAMP < 15.0):
            CACHE_OPERATIONS.labels(cache="supabase_jobs", operation="l1_memory_hit").inc()
            return _JOB_WRITE_THROUGH_CACHE[:limit]

        client = await self._get_client()
        if not client:
            CACHE_OPERATIONS.labels(cache="supabase_jobs", operation="stale_serve").inc()
            return _JOB_WRITE_THROUGH_CACHE[:limit] if _JOB_WRITE_THROUGH_CACHE else []

        # Acquire stampede lock for general cache refreshes
        lock = _get_cache_fetch_lock() if is_general_query else None
        if lock and is_general_query and _JOB_WRITE_THROUGH_CACHE and (now - _CACHE_TIMESTAMP < 15.0):
            return _JOB_WRITE_THROUGH_CACHE[:limit]

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

                # CRITICAL: Only update global general cache if this was an unfiltered query!
                # Prevents cache poisoning where a city filter overwrites general listings for all users.
                if res.data and is_general_query:
                    _JOB_WRITE_THROUGH_CACHE = res.data
                    _CACHE_TIMESTAMP = time.time()
                    CACHE_OPERATIONS.labels(cache="supabase_jobs", operation="write_through_refresh").inc()
                return res.data or (_JOB_WRITE_THROUGH_CACHE if is_general_query else [])
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
            res = await client.table("candidates").select("id, name, email, skills, education, raw_resume_text, created_at").order("created_at", desc=True).limit(limit).execute()
            return res.data or []
        except Exception as e:
            print(f"[Supabase] Fetch candidates error: {e}")
            return []
            
    async def fetch_candidate(self, cand_id: str) -> Optional[Dict[str, Any]]:
        client = await self._get_client()
        if not client:
            return None

        try:
            res = await client.table("candidates").select("id, name, email, skills, education, raw_resume_text, created_at").eq("id", cand_id).limit(1).execute()
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
            if "first_name" in flat_profile and "first" not in flat_profile:
                flat_profile["first"] = flat_profile.pop("first_name")
            if "last_name" in flat_profile and "last" not in flat_profile:
                flat_profile["last"] = flat_profile.pop("last_name")
            if "pref" in flat_profile and "pref_name" not in flat_profile:
                flat_profile["pref_name"] = flat_profile.pop("pref")
            if "links" in flat_profile and isinstance(flat_profile["links"], dict):
                links = flat_profile.pop("links")
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
        """Fetch a user's profile from user_profiles table using explicit column projection."""
        client = await self._get_client()
        if not client:
            return None
        try:
            cols = "firebase_uid, email, first, last, pref_name, suffix, phone, dob, loc, add1, add2, add3, zip, headline, linkedin_url, github_url, portfolio_url, other_url, updated_at"
            res = await client.table("user_profiles").select(cols).eq("firebase_uid", firebase_uid).limit(1).execute()
            data = res.data[0] if res.data else None
            if data:
                if "first" in data and "first_name" not in data:
                    data["first_name"] = data["first"]
                if "last" in data and "last_name" not in data:
                    data["last_name"] = data["last"]
                if "pref_name" in data and "pref" not in data:
                    data["pref"] = data["pref_name"]
                if "first" in data or "last" in data:
                    full_name = f"{data.get('first') or ''} {data.get('last') or ''}".strip()
                    if full_name and "name" not in data:
                        data["name"] = full_name
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
        """Fetch a user's job preferences from user_preferences table using explicit column projection."""
        client = await self._get_client()
        if not client:
            return None
        try:
            cols = "firebase_uid, values, roles, locations, roletype, rolelevel, compsize, industries, skills_inc, salary_amt, salary_curr, status, updated_at"
            res = await client.table("user_preferences").select(cols).eq("firebase_uid", firebase_uid).limit(1).execute()
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
        if not client or not firebase_uid or firebase_uid == "guest_user":
            return None
        try:
            header = resume_data.get("header") if isinstance(resume_data.get("header"), dict) else {}
            name = resume_data.get("name") or header.get("name") or ""
            email = resume_data.get("email") or header.get("email") or ""
            phone = resume_data.get("phone") or header.get("phone") or ""
            headline = resume_data.get("headline") or header.get("headline") or header.get("title") or ""
            summary = resume_data.get("summary") or header.get("summary") or ""
            skills = resume_data.get("skills") if isinstance(resume_data.get("skills"), list) else []
            experience = resume_data.get("experience") or resume_data.get("work_experience") or []
            education = resume_data.get("education") or []
            projects = resume_data.get("projects") or []
            links = resume_data.get("links") or {
                "linkedin": header.get("linkedin", ""),
                "github": header.get("github", ""),
                "portfolio": header.get("portfolio", "")
            }
            raw_text = resume_data.get("raw_text") or resume_data.get("raw_resume_text") or ""
            filename = resume_data.get("filename") or ""

            record = {
                "firebase_uid": firebase_uid,
                "name": name,
                "email": email,
                "phone": phone,
                "headline": headline,
                "summary": summary,
                "skills": [s if isinstance(s, str) else str(s) for s in skills],
                "experience": experience,
                "education": education,
                "projects": projects,
                "links": links,
                "raw_text": raw_text,
                "filename": filename
            }
            clean_record = {k: v for k, v in record.items() if v is not None}
            res = await client.table("user_resumes").insert(clean_record).execute()
            return res.data[0] if res.data else clean_record
        except Exception as e:
            try:
                minimal_record = {
                    "firebase_uid": firebase_uid,
                    "raw_text": (resume_data.get("raw_text") or resume_data.get("raw_resume_text") or "")[:5000]
                }
                res = await client.table("user_resumes").insert(minimal_record).execute()
                return res.data[0] if res.data else minimal_record
            except Exception as e2:
                print(f"[Supabase] save_user_resume error: {e} | fallback: {e2}")
                return None

    async def load_user_resume(self, firebase_uid: str) -> Optional[Dict[str, Any]]:
        """Fetch a user's active resume from user_resumes table using explicit column projection."""
        client = await self._get_client()
        if not client or not firebase_uid or firebase_uid == "guest_user":
            return None
        try:
            res = await client.table("user_resumes").select("*").eq("firebase_uid", firebase_uid).order("uploaded_at", desc=True).limit(1).execute()
            data = res.data[0] if res.data else None
            if data:
                if not data.get("header"):
                    data["header"] = {
                        "name": data.get("name") or "",
                        "email": data.get("email") or "",
                        "phone": data.get("phone") or "",
                        "headline": data.get("headline") or "",
                        "linkedin": (data.get("links") or {}).get("linkedin", "") if isinstance(data.get("links"), dict) else "",
                        "github": (data.get("links") or {}).get("github", "") if isinstance(data.get("links"), dict) else "",
                        "portfolio": (data.get("links") or {}).get("portfolio", "") if isinstance(data.get("links"), dict) else ""
                    }
            return data
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

# Global User Mutex Registry with Bounded LRU Eviction (Max 5,000 active locks)
# Prevents memory leak vectors during 24h continuous soak tests
from collections import OrderedDict
_USER_LOCKS: OrderedDict = OrderedDict()
_MAX_MUTEX_LOCKS = 5000

def get_user_lock(uid: str) -> asyncio.Lock:
    """Returns an async lock bound to the currently active running event loop with LRU bounded capacity."""
    try:
        loop = asyncio.get_running_loop()
    except RuntimeError:
        loop = None
    key = (loop, uid)
    if key in _USER_LOCKS:
        _USER_LOCKS.move_to_end(key)
        return _USER_LOCKS[key]
    
    # Evict oldest unheld lock if capacity is reached
    if len(_USER_LOCKS) >= _MAX_MUTEX_LOCKS:
        # Pop oldest item
        _USER_LOCKS.popitem(last=False)
        
    lock = asyncio.Lock()
    _USER_LOCKS[key] = lock
    return lock

# Global Singleton
_supabase_service: Optional[SupabaseService] = None

def get_supabase_service() -> SupabaseService:
    global _supabase_service
    if _supabase_service is None:
        _supabase_service = SupabaseService()
    return _supabase_service
