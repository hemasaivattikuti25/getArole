import asyncio
import json
import os
import shutil
from typing import List, Optional, Dict, Any
from fastapi import FastAPI, UploadFile, File, Form, Query, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from scrapers.models import JobListing, CandidateProfile
from scrapers.aggregator import JobAggregator
from scrapers.matcher import ResumeMatcher
from services.llm_service import get_llm_service
from services.supabase_service import get_supabase_service

# Dynamic Directory Paths (Works locally and on Vercel/Render Linux containers)
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
STATIC_DIR = os.path.join(BASE_DIR, "web", "static")
SAVED_JOBS_FILE = os.path.join(BASE_DIR, "scraped_jobs.json")
TMP_JOBS_FILE = "/tmp/scraped_jobs.json"

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

def get_matcher() -> ResumeMatcher:
    global MATCHER
    if MATCHER is None:
        MATCHER = ResumeMatcher()
    return MATCHER

def load_cached_jobs() -> List[JobListing]:
    # 1. Check project directory first, then /tmp
    target_files = [SAVED_JOBS_FILE, TMP_JOBS_FILE]
    for fp in target_files:
        if os.path.exists(fp):
            try:
                with open(fp, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    jobs = [JobListing(**item) for item in data]
                    if jobs:
                        AGGREGATOR.cached_jobs = jobs
                        return jobs
            except Exception:
                pass

    # 2. Fallback to Supabase cloud PostgreSQL
    try:
        from services.supabase_service import get_supabase_service
        supabase = get_supabase_service()
        if supabase.is_connected() and supabase.client:
            res = supabase.client.table("jobs").select("*").limit(2000).execute()
            if res.data:
                jobs = [JobListing(**item) for item in res.data]
                AGGREGATOR.cached_jobs = jobs
                return jobs
    except Exception as e:
        print(f"[Server] Supabase job fetch fallback: {e}")

async def periodic_scraper_loop():
    """Background worker that continuously scrapes all job portals every 30 minutes."""
    # Small initial delay so startup completes smoothly
    await asyncio.sleep(10)
    while True:
        try:
            print("[Auto-Cron] 🔄 Starting scheduled 30-minute career gateway sync...")
            jobs = await AGGREGATOR.aggregate_all()
            if jobs:
                AGGREGATOR.cached_jobs = jobs
                for save_path in [SAVED_JOBS_FILE, TMP_JOBS_FILE]:
                    try:
                        with open(save_path, "w", encoding="utf-8") as f:
                            json.dump([j.model_dump() for j in jobs], f, indent=2)
                    except Exception:
                        pass
                
                # Sync to Supabase PostgreSQL
                try:
                    supabase = get_supabase_service()
                    if supabase.is_connected():
                        await supabase.upsert_jobs_bulk(jobs)
                        print(f"[Auto-Cron] ✅ Successfully synced {len(jobs)} live jobs to Supabase.")
                except Exception as e:
                    print(f"[Auto-Cron] Supabase sync notice: {e}")
        except Exception as err:
            print(f"[Auto-Cron] Periodic scrape error: {err}")

        # Wait 30 minutes (1800 seconds) before next automated run
        await asyncio.sleep(1800)

@app.on_event("startup")
async def startup_event():
    load_cached_jobs()
    asyncio.create_task(periodic_scraper_loop())

class GenerateRequest(BaseModel):
    job_id: str
    resume_text: str
    doc_type: str = "both"
    api_key: Optional[str] = None

class ScreeningResult(BaseModel):
    candidate_name: str
    file_name: str
    score_10: float
    verdict: str
    rubric_breakdown: dict
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
    
    # Save to local file or /tmp
    for save_path in [SAVED_JOBS_FILE, TMP_JOBS_FILE]:
        try:
            with open(save_path, "w", encoding="utf-8") as f:
                json.dump([j.model_dump(mode="json") for j in jobs], f, indent=2)
            break
        except Exception:
            continue

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
        temp_path = f"/tmp/upload_{file.filename}"
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
        raise HTTPException(status_code=400, detail="Must provide either a PDF resume file or raw text.")
        
    if not AGGREGATOR.cached_jobs:
        load_cached_jobs()
        
    ranked_jobs = matcher.rank_jobs_by_fit(resume_content, AGGREGATOR.cached_jobs)
    
    return {
        "candidate_skills": matcher.parse_profile(temp_path if file else "").skills if file else [],
        "total_matches": len(ranked_jobs),
        "matches": [j.model_dump() for j in ranked_jobs]
    }

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

@app.post("/api/candidate/profile")
async def save_candidate_profile_endpoint(profile: Dict[str, Any] = Body(...)):
    """
    Saves candidate personal details, skills, education, and raw resume text into Supabase & local storage.
    """
    # 1. Save to Supabase
    supabase = get_supabase_service()
    supa_record = await supabase.upsert_candidate_profile(profile)

    # 2. Save locally for instant access
    cand_file = os.path.join(BASE_DIR, "candidates.json")
    tmp_cand_file = "/tmp/candidates.json"
    candidates = []
    
    if os.path.exists(cand_file):
        try:
            with open(cand_file, "r", encoding="utf-8") as f:
                candidates = json.load(f)
        except Exception:
            candidates = []

    # Upsert by email/name
    cand_id = profile.get("email") or profile.get("name") or "candidate"
    candidates = [c for c in candidates if (c.get("email") != cand_id and c.get("name") != cand_id)]
    candidates.insert(0, profile)

    for fp in [cand_file, tmp_cand_file]:
        try:
            with open(fp, "w", encoding="utf-8") as f:
                json.dump(candidates, f, indent=2)
        except Exception:
            pass

    return {
        "status": "success",
        "message": "Candidate profile and resume stored successfully.",
        "candidate": supa_record or profile
    }

@app.get("/api/candidates")
async def get_all_candidates():
    """
    Returns all registered candidate profiles and their full resume data.
    """
    supabase = get_supabase_service()
    candidates = await supabase.fetch_all_candidates()
    
    if not candidates:
        cand_file = os.path.join(BASE_DIR, "candidates.json")
        for fp in [cand_file, "/tmp/candidates.json"]:
            if os.path.exists(fp):
                try:
                    with open(fp, "r", encoding="utf-8") as f:
                        candidates = json.load(f)
                        if candidates:
                            break
                except Exception:
                    pass

    return {
        "total_candidates": len(candidates),
        "candidates": candidates
    }

# ── Resume Builder page ──────────────────────────────────────────────────────
@app.get("/resume-builder", response_class=HTMLResponse)
async def serve_resume_builder():
    rb_file = os.path.join(STATIC_DIR, "resume-builder.html")
    if os.path.exists(rb_file):
        with open(rb_file, "r", encoding="utf-8") as f:
            return f.read()
    return "<h1>Resume Builder — Starting Up</h1>"

# ── AI Bullet Enhancer ───────────────────────────────────────────────────────
class BulletEnhanceRequest(BaseModel):
    bullet: str
    context: str = ""

@app.post("/api/enhance-bullet")
async def enhance_bullet(req: BulletEnhanceRequest):
    """
    Rewrites a resume bullet point using STAR format (Situation, Task, Action, Result).
    Uses the configured LLM service (Gemini Flash). Falls back to rule-based enhancement.
    """
    bullet = req.bullet.strip()
    context = req.context.strip()

    # Try LLM service first
    try:
        llm = get_llm_service()
        prompt = f"""You are an expert resume coach. Rewrite the following resume bullet point to use the STAR format (Situation → Task → Action → Result). 
Make it concise (max 20 words), start with a strong action verb, and add a quantified impact if possible.
Context: {context}
Original bullet: {bullet}
Rewritten bullet (return ONLY the bullet, no explanation, no prefix):"""
        enhanced = await llm.generate_text(prompt, max_tokens=120)
        enhanced = enhanced.strip().lstrip("•-–—").strip()
        return {"enhanced": enhanced, "original": bullet}
    except Exception as e:
        print(f"[BulletEnhancer] LLM unavailable, using rule-based fallback: {e}")

    # Rule-based fallback
    s = bullet.strip()
    if s:
        s = s[0].upper() + s[1:]
    weak_starts = ["worked on", "helped with", "assisted in", "responsible for", "was involved in", "did", "made"]
    strong_starts = ["Engineered", "Architected", "Delivered", "Built", "Designed", "Optimised", "Led"]
    import random
    for w in weak_starts:
        if s.lower().startswith(w):
            s = random.choice(strong_starts) + " " + s[len(w):].lstrip()
            break
    if not any(c.isdigit() for c in s) and len(s) > 20:
        s = s.rstrip(".") + ", improving team efficiency by 20%+."
    return {"enhanced": s, "original": bullet}

class CoverLetterRequest(BaseModel):
    company_name: str
    role_title: str
    job_description: str = ""
    candidate_summary: str = ""
    candidate_name: str = "Hemasai Vattikuti"
    candidate_email: str = ""
    candidate_phone: str = ""

@app.post("/api/generate-cover-letter")
async def generate_cover_letter_api(req: CoverLetterRequest):
    """
    Generates a personalized, professional 3-paragraph Cover Letter using NVIDIA Llama 3.1 70B.
    """
    llm = get_llm_service()
    prompt = f"""You are an elite career strategist. Write a compelling, tailored, high-signal 3-paragraph Cover Letter for {req.candidate_name} applying for the {req.role_title} position at {req.company_name}.

CANDIDATE BACKGROUND:
{req.candidate_summary or "Backend Applied AI Engineer building scalable, high-availability distributed systems (DRDO, LangChain, RAG pipelines, FastAPI, PostgreSQL, MongoDB, Qdrant)."}

JOB DETAILS:
Company: {req.company_name}
Role: {req.role_title}
Job Description: {req.job_description[:1000] if req.job_description else "Building scalable systems and AI infrastructure."}

Structure:
- Salutation: Dear Hiring Manager, (or Dear {req.company_name} Team,)
- Paragraph 1: Strong opening hook explaining excitement for {req.company_name} and applying for {req.role_title}.
- Paragraph 2: Direct connection of candidate's proven experience (DRDO defense asset management, sub-10s MongoDB failover, production RAG pipelines with Qdrant/pgvector) to the company's technical mission.
- Paragraph 3: Confident closing, value proposition, and polite call to action for an interview.
- Sign-off: Sincerely, {req.candidate_name}

Tone: Confident, specific, professional, zero filler or generic clichés. Return ONLY the letter text."""

    try:
        letter = await llm.generate_text(prompt, max_tokens=700)
        return {"cover_letter": letter.strip()}
    except Exception as e:
        print(f"[CoverLetter] Fallback used: {e}")
        fallback = f"""Dear Hiring Team at {req.company_name},

I am writing to express my strong interest in the {req.role_title} role at {req.company_name}. With hands-on experience engineering high-availability distributed systems at DRDO and developing production-grade RAG & AI microservices, I am eager to contribute immediately to your engineering goals.

At the Defence Research and Development Laboratory (DRDL - DRDO), I architected a 3-node MongoDB Replica Set achieving sub-10s automatic failover for a mission-critical defense asset management system, complemented by a production-grade FastAPI backend with zero-trust RBAC and rate limiting. Additionally, I built and scaled platforms like Mithra Life OS and VITAP-UniOS, serving thousands of queries using Qdrant vector retrieval and PostgreSQL Row-Level Security.

I am excited by the technical vision of {req.company_name} and look forward to discussing how my experience in backend systems and applied AI can drive measurable impact for your team.

Sincerely,
{req.candidate_name}"""
        return {"cover_letter": fallback}


if os.path.exists(STATIC_DIR):
    app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

@app.get("/", response_class=HTMLResponse)
async def serve_landing():
    landing_file = os.path.join(STATIC_DIR, "landing.html")
    if os.path.exists(landing_file):
        with open(landing_file, "r", encoding="utf-8") as f:
            return f.read()
    return "<h1>getArole — Starting Up</h1>"

@app.get("/onboarding", response_class=HTMLResponse)
async def serve_onboarding():
    ob_file = os.path.join(STATIC_DIR, "onboarding.html")
    if os.path.exists(ob_file):
        with open(ob_file, "r", encoding="utf-8") as f:
            return f.read()
    return "<h1>getArole Onboarding</h1>"

@app.get("/dashboard", response_class=HTMLResponse)
async def serve_dashboard():
    index_file = os.path.join(STATIC_DIR, "index.html")
    if os.path.exists(index_file):
        with open(index_file, "r", encoding="utf-8") as f:
            return f.read()
    return "<h1>getArole Dashboard</h1>"
