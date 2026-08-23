import asyncio
import json
import os
import shutil
from typing import List, Optional
from fastapi import FastAPI, UploadFile, File, Form, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from scrapers.models import JobListing, CandidateProfile
from scrapers.aggregator import JobAggregator
from scrapers.matcher import ResumeMatcher

app = FastAPI(
    title="getArole — Smart Resume Screener & Job Discovery Engine",
    description="Multi-platform job aggregator, local vector matcher, and AI recruiter resume screening pipeline",
    version="1.1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

AGGREGATOR = JobAggregator()
MATCHER: Optional[ResumeMatcher] = None
SAVED_JOBS_FILE = "/Users/sai2005/Downloads/gitprojects/job_finder/scraped_jobs.json"

def get_matcher() -> ResumeMatcher:
    global MATCHER
    if MATCHER is None:
        MATCHER = ResumeMatcher()
    return MATCHER

def load_cached_jobs() -> List[JobListing]:
    if os.path.exists(SAVED_JOBS_FILE):
        try:
            with open(SAVED_JOBS_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
                jobs = [JobListing(**item) for item in data]
                AGGREGATOR.cached_jobs = jobs
                return jobs
        except Exception:
            pass
    return []

@app.on_event("startup")
async def startup_event():
    load_cached_jobs()

class GenerateRequest(BaseModel):
    job_id: str
    resume_text: str
    doc_type: str = "both"
    api_key: Optional[str] = None
    provider: str = "nvidia"

class ScreeningResult(BaseModel):
    candidate_name: str
    file_name: str
    score_10: float = Field(..., description="Calibrated fit score on a 1-10 scale")
    verdict: str = Field(..., description="Shortlisted, Review, or Reject")
    rubric_breakdown: dict = Field(default_factory=dict)
    strengths: List[str] = Field(default_factory=list)
    missing_skills: List[str] = Field(default_factory=list)
    justification: str = ""
    extracted_skills: List[str] = Field(default_factory=list)
    raw_summary: str = ""

@app.post("/api/scrape")
async def trigger_scrape(
    include_greenhouse: bool = True,
    include_lever: bool = True,
    include_ashby: bool = True,
    include_internshala: bool = True,
    include_linkedin: bool = True
):
    """Trigger a live scrape of all enabled job platforms."""
    jobs = await AGGREGATOR.aggregate_all(
        include_greenhouse=include_greenhouse,
        include_lever=include_lever,
        include_ashby=include_ashby,
        include_internshala=include_internshala,
        include_linkedin=include_linkedin
    )
    AGGREGATOR.cached_jobs = jobs
    with open(SAVED_JOBS_FILE, "w", encoding="utf-8") as f:
        json.dump([j.model_dump(mode="json") for j in jobs], f, indent=2)

    # Sync to Supabase in background
    supabase_synced = 0
    try:
        from services.supabase_service import get_supabase_service
        supabase = get_supabase_service()
        if supabase.is_connected():
            supabase_synced = await supabase.upsert_jobs_bulk(jobs)
    except Exception as e:
        print(f"[Server] Supabase sync notice: {e}")

    return {
        "status": "success",
        "total_scraped": len(jobs),
        "supabase_synced": supabase_synced,
        "platforms": {
            "greenhouse": sum(1 for j in jobs if j.platform == "Greenhouse"),
            "lever": sum(1 for j in jobs if j.platform == "Lever"),
            "ashby": sum(1 for j in jobs if j.platform == "Ashby"),
            "internshala": sum(1 for j in jobs if j.platform == "Internshala"),
            "linkedin": sum(1 for j in jobs if j.platform == "LinkedIn"),
        }
    }

@app.get("/api/jobs")
async def get_jobs(
    city: Optional[str] = Query(None),
    min_stipend: Optional[int] = Query(None),
    keyword: Optional[str] = Query(None),
    employment_type: Optional[str] = Query(None),
    remote_only: bool = Query(False),
    platform: Optional[str] = Query(None)
):
    if not AGGREGATOR.cached_jobs:
        load_cached_jobs()
        
    jobs = AGGREGATOR.filter_jobs(
        city=city,
        min_stipend=min_stipend,
        keyword=keyword,
        employment_type=employment_type,
        remote_only=remote_only
    )
    
    if platform:
        jobs = [j for j in jobs if j.platform.lower() == platform.lower()]
        
    return {
        "total": len(jobs),
        "jobs": [j.model_dump() for j in jobs]
    }

@app.post("/api/match-resume")
async def match_resume(
    file: Optional[UploadFile] = File(None),
    raw_text: Optional[str] = Form(None)
):
    matcher = get_matcher()
    resume_content = ""
    
    if file and file.filename:
        temp_path = f"/tmp/{file.filename}"
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        try:
            resume_content = matcher.extract_text_from_pdf(temp_path)
        finally:
            if os.path.exists(temp_path):
                os.remove(temp_path)
    elif raw_text:
        resume_content = raw_text
    else:
        default_pdf = "/Users/sai2005/Downloads/gitprojects/job_finder/sairesume.pdf"
        if os.path.exists(default_pdf):
            resume_content = matcher.extract_text_from_pdf(default_pdf)
        else:
            raise HTTPException(status_code=400, detail="Please upload a resume PDF or provide text")

    if not AGGREGATOR.cached_jobs:
        load_cached_jobs()

    ranked_jobs = matcher.rank_jobs_by_fit(resume_content, AGGREGATOR.cached_jobs)
    
    with open(SAVED_JOBS_FILE, "w", encoding="utf-8") as f:
        json.dump([j.model_dump(mode="json") for j in ranked_jobs], f, indent=2)
        
    return {
        "status": "success",
        "total_matched": len(ranked_jobs),
        "top_matches": [j.model_dump() for j in ranked_jobs[:25]],
        "all_jobs": [j.model_dump() for j in ranked_jobs]
    }

# =========================================================================
# RECRUITER SMART RESUME SCREENER ENDPOINT (3-STAGE HYBRID PIPELINE)
# =========================================================================
from services.llm_service import get_llm_service

@app.post("/api/recruiter/screen")
async def screen_resumes_for_jd(
    job_description: str = Form(...),
    files: List[UploadFile] = File(...)
):
    if not files:
        raise HTTPException(status_code=400, detail="Please upload at least one resume PDF.")
        
    matcher = get_matcher()
    llm_service = get_llm_service()
    results: List[ScreeningResult] = []
    
    # Target JD Embedding
    jd_emb = list(matcher.embed_model.embed([job_description[:1500]]))[0]
    
    for upload in files:
        temp_path = f"/tmp/screening_{upload.filename}"
        with open(temp_path, "wb") as buf:
            shutil.copyfileobj(upload.file, buf)
            
        try:
            resume_text = matcher.extract_text_from_pdf(temp_path)
            candidate_profile = matcher.parse_profile(temp_path)
            
            # Stage 1: Vector dense similarity (bge-small ONNX)
            res_emb = list(matcher.embed_model.embed([resume_text[:1500]]))[0]
            sim = matcher.compute_similarity(jd_emb, res_emb)
            vector_10 = round(max(1.0, min(10.0, ((sim - 0.25) / 0.65) * 10)), 1)
            
            # Stage 2: Real Llama 3.1 70B Semantic Evaluation
            first_line = resume_text.strip().split("\n")[0].strip()
            cand_name = first_line if len(first_line) < 35 and len(first_line) > 2 else upload.filename.replace(".pdf", "")
            
            llm_eval = await llm_service.a_evaluate_candidate_match(
                resume_text=resume_text,
                job_title="Target Position",
                company="Hiring Team",
                job_description=job_description
            )
            
            llm_10 = float(llm_eval.get("score_10", vector_10))
            final_10 = round(0.35 * vector_10 + 0.65 * llm_10, 1)
            
            verdict_raw = llm_eval.get("verdict", "Review")
            if "shortlist" in verdict_raw.lower():
                verdict = "Shortlisted ✅"
            elif "reject" in verdict_raw.lower() or "unmatch" in verdict_raw.lower():
                verdict = "Unmatched ❌"
            else:
                verdict = "Review / Follow-up ⚠️"
                
            rubric_raw = llm_eval.get("rubric_breakdown", {})
            rubric = {
                "technical_skills": float(rubric_raw.get("technical_skills", final_10)),
                "experience_relevance": float(rubric_raw.get("experience_relevance", final_10)),
                "domain_knowledge": float(rubric_raw.get("domain_knowledge", final_10)),
                "prerequisites_met": float(rubric_raw.get("prerequisites_met", final_10))
            }
                
            results.append(ScreeningResult(
                candidate_name=cand_name,
                file_name=upload.filename,
                score_10=final_10,
                verdict=verdict,
                rubric_breakdown=rubric,
                strengths=llm_eval.get("strengths", candidate_profile.skills[:4]),
                missing_skills=llm_eval.get("missing_skills", []),
                justification=llm_eval.get("justification", f"Calibrated 70B evaluation: {final_10}/10 fit for position."),
                extracted_skills=candidate_profile.skills,
                raw_summary=resume_text[:300] + "..."
            ))
        finally:
            if os.path.exists(temp_path):
                os.remove(temp_path)
                
    # Sort leaderboard descending by score
    results.sort(key=lambda x: x.score_10, reverse=True)
    
    return {
        "status": "success",
        "job_analyzed": job_description[:100] + "...",
        "total_screened": len(results),
        "shortlisted_count": len([r for r in results if "Shortlisted" in r.verdict]),
        "leaderboard": [r.model_dump() for r in results]
    }

@app.post("/api/generate-ai-doc")
async def generate_ai_doc(req: GenerateRequest):
    job = next((j for j in AGGREGATOR.cached_jobs if j.id == req.job_id), None)
    if not job:
        # If job not in cached jobs, create minimal placeholder from ID or description
        job_title = "Software Engineer"
        job_company = "Target Company"
        job_desc = "Technical role requiring software engineering, problem solving, and architecture design."
    else:
        job_title = job.title
        job_company = job.company
        job_desc = job.description

    llm_service = get_llm_service()
    content = await llm_service.a_generate_tailored_application(
        resume_text=req.resume_text,
        job_title=job_title,
        company=job_company,
        job_description=job_desc
    )
    return {"status": "success", "content": content, "provider": "NVIDIA NIM (Llama 3.1 70B)"}

static_dir = "/Users/sai2005/Downloads/gitprojects/job_finder/web/static"
if os.path.exists(static_dir):
    app.mount("/static", StaticFiles(directory=static_dir), name="static")

@app.get("/", response_class=HTMLResponse)
async def serve_landing():
    landing_file = "/Users/sai2005/Downloads/gitprojects/job_finder/web/static/landing.html"
    if os.path.exists(landing_file):
        with open(landing_file, "r", encoding="utf-8") as f:
            return f.read()
    return "<h1>getArole — Starting Up</h1>"

@app.get("/onboarding", response_class=HTMLResponse)
async def serve_onboarding():
    ob_file = "/Users/sai2005/Downloads/gitprojects/job_finder/web/static/onboarding.html"
    if os.path.exists(ob_file):
        with open(ob_file, "r", encoding="utf-8") as f:
            return f.read()
    return "<h1>getArole Onboarding</h1>"

@app.get("/dashboard", response_class=HTMLResponse)
async def serve_dashboard():
    index_file = "/Users/sai2005/Downloads/gitprojects/job_finder/web/static/index.html"
    if os.path.exists(index_file):
        with open(index_file, "r", encoding="utf-8") as f:
            return f.read()
    return "<h1>getArole Dashboard</h1>"
