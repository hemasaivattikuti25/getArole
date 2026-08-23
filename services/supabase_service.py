import os
from typing import List, Dict, Any, Optional
from dotenv import load_dotenv
from supabase import create_client, Client
from scrapers.models import JobListing, CandidateProfile
from domain.models import CandidateScreeningReport

load_dotenv()

class SupabaseService:
    def __init__(self):
        self.url = os.getenv("SUPABASE_URL", "https://tgmhtlqcjgcjedlnthfk.supabase.co")
        self.key = os.getenv("SUPABASE_KEY", "sb_publishable_ubfak-i16iK-jZCTpZIxTQ_9o10ZqDn")
        self.client: Optional[Any] = None
        
    async def _get_client(self):
        if not self.client and self.url and self.key:
            from supabase import create_async_client
            try:
                self.client = await create_async_client(self.url, self.key)
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
        client = await self._get_client()
        if not client:
            return []

        try:
            query = client.table("jobs").select("*").limit(limit)
            if city:
                query = query.ilike("city", f"%{city}%")
            if workplace_type:
                query = query.ilike("workplace_type", f"%{workplace_type}%")
                
            res = await query.execute()
            return res.data or []
        except Exception as e:
            print(f"[Supabase] Fetch error: {e}")
            return []

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

# Global Singleton
_supabase_service: Optional[SupabaseService] = None

def get_supabase_service() -> SupabaseService:
    global _supabase_service
    if _supabase_service is None:
        _supabase_service = SupabaseService()
    return _supabase_service
