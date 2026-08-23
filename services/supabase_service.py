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
        self.client: Optional[Client] = None
        
        if self.url and self.key:
            try:
                self.client = create_client(self.url, self.key)
            except Exception as e:
                print(f"[Supabase] Warning: Could not initialize Supabase client: {e}")

    def is_connected(self) -> bool:
        return self.client is not None

    async def upsert_jobs_bulk(self, jobs: List[JobListing]) -> int:
        """
        Batches and upserts job listings into Supabase public.jobs table.
        """
        if not self.client or not jobs:
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
                self.client.table("jobs").upsert(batch, on_conflict="id").execute()
                inserted_count += len(batch)
            except Exception as e:
                print(f"[Supabase] Batch upsert error (batch {i//batch_size + 1}): {e}")
                break

        return inserted_count

    async def fetch_jobs(self, limit: int = 100, city: Optional[str] = None, workplace_type: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Fetches live jobs directly from Supabase with optional filters.
        """
        if not self.client:
            return []

        try:
            query = self.client.table("jobs").select("*").limit(limit)
            if city:
                query = query.ilike("city", f"%{city}%")
            if workplace_type:
                query = query.ilike("workplace_type", f"%{workplace_type}%")
                
            res = query.execute()
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
        """
        Records candidate screening result and 70B evaluation in Supabase.
        """
        if not self.client:
            return False

        try:
            # 1. Insert candidate
            cand_res = self.client.table("candidates").insert({
                "name": candidate_name,
                "skills": report.extracted_skills,
                "raw_resume_text": resume_text[:5000]
            }).execute()
            
            cand_id = cand_res.data[0]["id"] if cand_res.data else None

            # 2. Insert evaluation
            self.client.table("match_evaluations").insert({
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

# Global Singleton
_supabase_service: Optional[SupabaseService] = None

def get_supabase_service() -> SupabaseService:
    global _supabase_service
    if _supabase_service is None:
        _supabase_service = SupabaseService()
    return _supabase_service
