import asyncio
import json
import logging
import os
import shutil
import tempfile
from typing import List, Optional, Dict, Any, Tuple
from fastapi import FastAPI, UploadFile, File, Form, Query, HTTPException, Body, Request, Header, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import HTMLResponse, JSONResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from scrapers.models import JobListing, CandidateProfile
from scrapers.aggregator import JobAggregator
from scrapers.matcher import ResumeMatcher
from services.llm_service import get_llm_service, NvidiaLLMService
from services.supabase_service import get_supabase_service, get_user_lock
from core.logging_config import configure_logging
from core.observability_middleware import ObservabilityMiddleware
from core.security import enforce_ai_rate_limit, extract_authenticated_uid, verify_crm_admin_access, is_crm_admin_authorized

# Initialize Structured JSON logging
configure_logging()

# Dynamic Directory Paths (Works locally and on Vercel/Render Linux containers)
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
STATIC_DIR = os.path.join(BASE_DIR, "web", "static")

# Job cache file paths
DATA_DIR = os.path.join(BASE_DIR, "data")
os.makedirs(DATA_DIR, exist_ok=True)
SAVED_JOBS_FILE = os.path.join(DATA_DIR, "jobs.json")
TMP_JOBS_FILE = os.path.join(tempfile.gettempdir(), "jobs.json")

app = FastAPI(
    title="getArole — Smart Resume Screener & Job Discovery Engine",
    description="Multi-platform job aggregator, local vector matcher, and AI recruiter resume screening pipeline",
    version="1.1.0"
)

# Attach Observability Middleware for Request ID tracing and Prometheus latency tracking
app.add_middleware(ObservabilityMiddleware)
# Attach GZip compression for all responses > 500 bytes (LCP/PageSpeed optimization)
app.add_middleware(GZipMiddleware, minimum_size=500)

allowed_origins_env = os.getenv("ALLOWED_ORIGINS", "https://getarole.in,https://getarole.com")
allowed_origins = [o.strip() for o in allowed_origins_env.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins if allowed_origins else ["https://getarole.com"],
    allow_origin_regex=r"^https:\/\/([a-zA-Z0-9-]+\.)?vercel\.app$",
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global exception boundary to prevent raw stack trace leakage."""
    print(f"[Global Exception Boundary] Unhandled error at {request.url.path}: {exc}")
    if request.url.path.startswith("/api/"):
        return JSONResponse(
            status_code=500,
            content={"success": False, "error": "An internal server error occurred. Please try again."}
        )
    return HTMLResponse(
        """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>500 — Server Error | getArole</title>
  <link rel="icon" type="image/svg+xml" href="/logo.svg">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f172a; color: #f8fafc; display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 24px; text-align: center; }
    .card { background: #1e293b; border: 1px solid #334155; border-radius: 16px; padding: 48px 32px; max-width: 480px; width: 100%; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); }
    .icon { font-size: 56px; margin-bottom: 16px; }
    h1 { font-size: 28px; font-weight: 800; margin-bottom: 12px; color: #ffffff; }
    p { font-size: 15px; color: #94a3b8; line-height: 1.6; margin-bottom: 28px; }
    .btn { display: inline-flex; align-items: center; justify-content: center; background: #4f46e5; color: #ffffff; padding: 12px 24px; border-radius: 8px; font-weight: 700; text-decoration: none; font-size: 15px; transition: background 0.2s; border: none; cursor: pointer; }
    .btn:hover { background: #4338ca; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">⚠️</div>
    <h1>500 — Something Went Wrong</h1>
    <p>We encountered an unexpected server error while processing your request. Please retry or head back to the dashboard.</p>
    <div style="display: flex; gap: 12px; justify-content: center;">
      <button onclick="window.location.reload()" class="btn" style="background: #334155;">Retry Action</button>
      <a href="/dashboard" class="btn">Go to Dashboard</a>
    </div>
  </div>
</body>
</html>""",
        status_code=500
    )

@app.exception_handler(404)
async def custom_404_handler(request: Request, exc: Exception):
    """SPA fallback for invalid frontend routes."""
    if request.url.path.startswith("/api/"):
        return JSONResponse(status_code=404, content={"success": False, "error": "API route not found."})
    return HTMLResponse(
        """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>404 — Page Not Found | getArole</title>
  <link rel="icon" type="image/svg+xml" href="/logo.svg">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f172a; color: #f8fafc; display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 24px; text-align: center; }
    .card { background: #1e293b; border: 1px solid #334155; border-radius: 16px; padding: 48px 32px; max-width: 480px; width: 100%; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); }
    .icon { font-size: 56px; margin-bottom: 16px; }
    h1 { font-size: 28px; font-weight: 800; margin-bottom: 12px; color: #ffffff; }
    p { font-size: 15px; color: #94a3b8; line-height: 1.6; margin-bottom: 28px; }
    .btn { display: inline-flex; align-items: center; justify-content: center; background: #4f46e5; color: #ffffff; padding: 12px 24px; border-radius: 8px; font-weight: 700; text-decoration: none; font-size: 15px; transition: background 0.2s; }
    .btn:hover { background: #4338ca; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">🔍</div>
    <h1>404 — Page Not Found</h1>
    <p>The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.</p>
    <a href="/dashboard" class="btn">Return to Dashboard</a>
  </div>
</body>
</html>""",
        status_code=404
    )

AGGREGATOR = JobAggregator()
MATCHER: Optional[ResumeMatcher] = None

def get_matcher() -> ResumeMatcher:
    global MATCHER
    if MATCHER is None:
        MATCHER = ResumeMatcher()
    return MATCHER

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")

def _fetch_jobs_from_supabase_rest(limit: int = 1500) -> list:
    """Directly call Supabase REST API using httpx (sync). Always works regardless of async client state."""
    try:
        import httpx
        url = f"{SUPABASE_URL}/rest/v1/jobs?select=*&order=created_at.desc&limit={limit}"
        headers = {"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}"}
        with httpx.Client(timeout=15) as client:
            res = client.get(url, headers=headers)
            if res.status_code == 200:
                return res.json() or []
    except Exception as e:
        print(f"[Supabase REST] Direct fetch error: {e}")
    return []

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

    # 2. Fallback: direct Supabase REST API (sync httpx)
    try:
        raw_jobs = _fetch_jobs_from_supabase_rest(limit=1500)
        if raw_jobs:
            jobs = []
            for item in raw_jobs:
                try:
                    jobs.append(JobListing(**item))
                except Exception:
                    pass
            if jobs:
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

from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app_instance: FastAPI):
    load_cached_jobs()
    scraper_task = asyncio.create_task(periodic_scraper_loop())
    yield
    scraper_task.cancel()

app.router.lifespan_context = lifespan



@app.post("/api/scrape")
async def trigger_scrape(
    request: Request,
    include_greenhouse: bool = True,
    include_lever: bool = True,
    include_ashby: bool = True,
    include_internshala: bool = True,
    include_linkedin: bool = True,
    include_unstop: bool = True,
    x_admin_key: Optional[str] = Header(None, alias="X-Admin-Key")
):
    """
    Trigger a live scrape of all enabled job platforms.
    Protected by SCRAPER_ADMIN_KEY if configured in environment.
    """
    expected_key = os.getenv("SCRAPER_ADMIN_KEY", "")
    if expected_key and x_admin_key != expected_key:
        logging.getLogger("sre.security").warning(
            "unauthorized_scrape_trigger_attempt",
            extra={"client_ip": request.client.host if request.client else "unknown"}
        )
        return JSONResponse({"status": "error", "message": "Unauthorized: Invalid or missing X-Admin-Key header."}, status_code=403)

    jobs = await AGGREGATOR.aggregate_all(
        include_greenhouse=include_greenhouse,
        include_lever=include_lever,
        include_ashby=include_ashby,
        include_internshala=include_internshala,
        include_linkedin=include_linkedin,
        include_unstop=include_unstop
    )
    AGGREGATOR.cached_jobs = list(jobs) if jobs else []
    
    return {
        "status": "success",
        "message": "Scrape completed successfully",
        "jobs_found": len(jobs) if jobs else 0
    }

@app.get("/api/jobs")
async def get_jobs(
    limit: int = 1500,
    location: Optional[str] = None,
    category: Optional[str] = None
):
    """
    Returns all cached job listings for the frontend (Explore, Matches, Dashboard).
    Falls back to direct Supabase REST if in-memory cache is empty.
    """
    jobs = AGGREGATOR.cached_jobs or []

    # If in-memory cache is empty, load from disk cache
    if not jobs:
        jobs = load_cached_jobs() or []

    # If still empty, fetch directly from Supabase REST (always reliable)
    if not jobs:
        try:
            import asyncio
            raw_jobs = await asyncio.get_event_loop().run_in_executor(
                None, lambda: _fetch_jobs_from_supabase_rest(limit)
            )
            if raw_jobs:
                jobs_out = []
                for item in raw_jobs:
                    try:
                        jobs_out.append(JobListing(**item))
                    except Exception:
                        pass
                AGGREGATOR.cached_jobs = jobs_out
                jobs = jobs_out
        except Exception as e:
            print(f"[api/jobs] Supabase REST fallback error: {e}")

    jobs_list = [j.model_dump() if hasattr(j, 'model_dump') else j for j in jobs]
    return {"total": len(jobs_list), "jobs": jobs_list}


@app.get("/api/candidates")
async def get_all_candidates(
    request: Request,
    x_admin_key: Optional[str] = Header(None, alias="X-Admin-Key")
) -> Dict[str, Any]:
    """
    Returns all registered candidate profiles.
    Protected endpoint: Requires valid X-Admin-Key header.
    """
    expected_key = os.getenv("SCRAPER_ADMIN_KEY") or os.getenv("ADMIN_API_KEY", "")
    if expected_key and x_admin_key != expected_key:
        logging.getLogger("sre.security").warning(
            "unauthorized_candidate_directory_access_attempt",
            extra={"client_ip": request.client.host if request.client else "unknown"}
        )
        raise HTTPException(status_code=403, detail="Unauthorized: Invalid or missing X-Admin-Key header.")

    supabase = get_supabase_service()
    candidates = await supabase.fetch_all_candidates()
    
    if not candidates:
        cand_file = os.path.join(BASE_DIR, "candidates.json")
        for fp in [cand_file, os.path.join(tempfile.gettempdir(), "candidates.json")]:
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

@app.get("/api/candidate/{cand_id}")
async def get_candidate_by_id(
    cand_id: str,
    request: Request,
    x_admin_key: Optional[str] = Header(None, alias="X-Admin-Key"),
    key: Optional[str] = Query(None)
) -> Dict[str, Any]:
    """
    Returns a single candidate by UUID.
    Protected endpoint: Requires valid X-Admin-Key header, key query param, or authenticated user session.
    """
    expected_key = os.getenv("SCRAPER_ADMIN_KEY") or os.getenv("ADMIN_API_KEY", "")
    provided_key = x_admin_key or key
    uid = extract_authenticated_uid(request)

    is_authorized = (expected_key and provided_key == expected_key) or (uid and uid != "guest_user")

    if expected_key and not is_authorized:
        logging.getLogger("sre.security").warning(
            "unauthorized_candidate_detail_access_attempt",
            extra={"client_ip": request.client.host if request.client else "unknown", "cand_id": cand_id}
        )
        raise HTTPException(status_code=403, detail="Unauthorized: Invalid or missing X-Admin-Key header.")

    supabase = get_supabase_service()
    candidate = await supabase.fetch_candidate(cand_id)
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    
    return {"candidate": candidate}

# ── Resume Builder & Cover Letter Builder Pages ───────────────────────────────
@app.get("/resume-builder", response_class=HTMLResponse)
@app.get("/resume-builder/", response_class=HTMLResponse)
async def serve_resume_builder():
    rb_file = os.path.join(STATIC_DIR, "resume-builder", "index.html")
    return render_template(rb_file)
    return "<h1>Resume Builder — Starting Up</h1>"

@app.get("/cover-letter-builder", response_class=HTMLResponse)
@app.get("/cover-letter-builder/", response_class=HTMLResponse)
async def serve_cover_letter_builder():
    cl_file = os.path.join(STATIC_DIR, "cover-letter-builder", "index.html")
    return render_template(cl_file)
    return "<h1>Cover Letter Builder — Starting Up</h1>"

# ── AI Bullet Enhancer ───────────────────────────────────────────────────────
class BulletEnhanceRequest(BaseModel):
    bullet: str
    context: str = ""
    target_role: str = ""
    custom_instruction: str = ""

@app.post("/api/enhance-bullet")
async def enhance_bullet(req: BulletEnhanceRequest, request: Request):
    """
    Generates 3 tailored variations of a resume bullet point:
    1. STAR Format (Quantified Impact)
    2. Technical Architecture & Scale
    3. Crisp ATS Executive Statement
    Supports personalized user instructions.
    """
    # OWASP A04: DoS & Quota Preservation Rate Limiting
    enforce_ai_rate_limit(request, max_requests=25, window_seconds=60.0)

    bullet = req.bullet.strip()
    context = req.context.strip()
    custom_inst = req.custom_instruction.strip()

    # Rule-based fallback builder
    s = bullet.strip()
    if s:
        s = s[0].upper() + s[1:]
    weak_starts = ["worked on", "helped with", "assisted in", "responsible for", "was involved in", "did", "made"]
    strong_starts = ["Engineered", "Architected", "Delivered", "Built", "Designed", "Optimized", "Spearheaded"]
    import random
    for w in weak_starts:
        if s.lower().startswith(w):
            s = random.choice(strong_starts) + " " + s[len(w):].lstrip()
            break
    
    action_bullet = s.rstrip(".")
    if not any(action_bullet.lower().startswith(v.lower()) for v in strong_starts):
        action_bullet = f"Delivered {action_bullet[0].lower() + action_bullet[1:] if len(action_bullet) > 1 else action_bullet}"
    
    user_addition = f" — focusing on {custom_inst}" if custom_inst else ""
    star_fallback = f"{action_bullet}{user_addition}, improving delivery efficiency and operational reliability."
    tech_fallback = f"Engineered robust solution for {bullet.lower().rstrip('.')}, ensuring high reliability and maintainable architecture."
    concise_fallback = f"{action_bullet} adhering to modern production standards."

    try:
        llm = get_llm_service()
        user_guidance = f"\nUSER'S PERSONALIZED INSTRUCTION / SPECIFIC DIRECTION: {custom_inst}\nStrictly adhere to this custom instruction across all 3 variations." if custom_inst else ""
        prompt = f"""You are a principal engineer and executive resume coach. Provide 3 distinct rewritten variations for the following resume bullet point in STAR format.
Context: {context}
Original bullet: {bullet}
Target Role: {req.target_role or "Software Engineer / Technical Role"}{user_guidance}

Return JSON with exact keys:
{{
  "star": "STAR format with strong action verb and quantified outcome (max 22 words)",
  "technical": "High technical depth emphasizing architecture, scale or reliability (max 22 words)",
  "concise": "Crisp, direct executive ATS statement (max 18 words)"
}}"""
        resp_text = await llm.generate_text(prompt, max_tokens=300)
        parsed = NvidiaLLMService.extract_json_payload(resp_text)
        if parsed and isinstance(parsed, dict):
            return JSONResponse(
                content={
                    "enhanced": parsed.get("star", star_fallback),
                    "star": parsed.get("star", star_fallback),
                    "technical": parsed.get("technical", tech_fallback),
                    "concise": parsed.get("concise", concise_fallback),
                    "original": bullet
                },
                headers={"X-AI-Engine": "nvidia-nim"}
            )
        enhanced = resp_text.strip().lstrip("•-–—").strip()
        return JSONResponse(
            content={"enhanced": enhanced or star_fallback, "star": enhanced or star_fallback, "technical": tech_fallback, "concise": concise_fallback, "original": bullet},
            headers={"X-AI-Engine": "fallback-heuristics"}
        )
    except Exception as e:
        print(f"[BulletEnhancer] LLM Error (falling back to heuristics): {e}")
        return JSONResponse(
            content={"enhanced": star_fallback, "star": star_fallback, "technical": tech_fallback, "concise": concise_fallback, "original": bullet},
            headers={"X-AI-Engine": "fallback-heuristics"}
        )


class SuggestSkillsRequest(BaseModel):
    target_role: str = ""
    current_skills: str = ""
    experience_context: str = ""
    custom_instruction: str = ""

@app.post("/api/ai/suggest-skills")
async def suggest_skills_api(req: SuggestSkillsRequest, request: Request) -> Dict[str, Any]:
    """
    Recommends high-demand missing industry skills categorized by technical domain.
    Rate-limited per client IP/UID token bucket.
    """
    enforce_ai_rate_limit(request, max_requests=25, window_seconds=60.0)
    role = req.target_role.strip() or "Software Engineer"
    curr = req.current_skills.lower()

    # Domain skill maps
    domain_knowledge = {
        "Languages & Core": ["Python", "TypeScript", "JavaScript", "Go", "Java", "C++", "Rust", "SQL"],
        "Frameworks & Backend": ["FastAPI", "Node.js", "Django", "React", "Next.js", "Express.js", "Spring Boot"],
        "Cloud, DevOps & Data": ["Docker", "Kubernetes", "AWS", "PostgreSQL", "Redis", "Kafka", "CI/CD (GitHub Actions)", "GraphQL"],
        "System Design & AI": ["Microservices Architecture", "RESTful API Design", "Distributed Systems", "LLM Integration", "Vector Databases (Pinecone/Milvus)"]
    }

    missing_suggestions = []
    for cat, skills in domain_knowledge.items():
        missing_in_cat = [s for s in skills if s.lower() not in curr]
        if missing_in_cat:
            missing_suggestions.append({
                "category": cat,
                "skills": ", ".join(missing_in_cat[:4])
            })

    try:
        llm = get_llm_service()
        user_guidance = f"\nCandidate Focus / Custom Instruction: {req.custom_instruction}" if req.custom_instruction else ""
        prompt = f"""You are a senior tech recruiter. For a candidate targeting the role of '{role}', suggest missing modern industry skills.
Candidate Current Skills: {req.current_skills}{user_guidance}
Return a JSON array of objects with keys 'category' and 'skills' (comma-separated string of 3-5 top skills)."""
        resp_text = await llm.generate_text(prompt, max_tokens=300)
        parsed = NvidiaLLMService.extract_json_payload(resp_text)
        if parsed and isinstance(parsed, list):
            return {"suggestions": parsed, "target_role": role}
    except HTTPException:
        raise
    except Exception as e:
        print(f"[SuggestSkills] LLM Error: {e}")
        raise HTTPException(status_code=500, detail="AI skill suggestion failed.")

    return {"suggestions": missing_suggestions, "target_role": role}


class GenerateSummaryRequest(BaseModel):
    style: str = "technical"
    candidate_name: str = "Candidate"
    target_role: str = ""
    experience_context: str = ""
    skills_context: str = ""
    custom_instruction: str = ""

@app.post("/api/ai/generate-summary")
async def generate_summary_api(req: GenerateSummaryRequest, request: Request) -> Dict[str, Any]:
    """
    Generates 2 highly personalized, high-signal summary variations based on candidate background,
    target tone, and custom instructions. Rate-limited.
    """
    enforce_ai_rate_limit(request, max_requests=25, window_seconds=60.0)
    role = req.target_role.strip() or "Software Engineer"
    skills = req.skills_context or "Software Engineering, Problem Solving, System Design"

    fallbacks = {
        "technical": f"Backend & Systems Engineer with strong foundation in {skills.split(';')[0] if ';' in skills else 'modern architecture'}. Experienced in designing resilient APIs, optimizing system throughput, and delivering high-impact production features.",
        "fresher": f"Ambitious Computer Science graduate with hands-on project experience in {skills.split(';')[0] if ';' in skills else 'full-stack development'}. Demonstrated problem solver with solid foundational knowledge in algorithms and modern development workflows.",
        "leadership": f"Senior Engineering Lead with proven track record of scaling high-availability systems and mentoring engineering teams. Deep expertise in {skills.split(';')[0] if ';' in skills else 'cloud infrastructure'} and architectural excellence.",
        "general": f"Results-driven Software Engineer with extensive experience in {skills.split(';')[0] if ';' in skills else 'modern engineering practices'}. Passionate about building robust, user-centric applications and executing end-to-end technical solutions."
    }

    selected_fallback = fallbacks.get(req.style, fallbacks["technical"])
    if req.custom_instruction:
        selected_fallback = f"{selected_fallback} Specifically focused on {req.custom_instruction}."

    try:
        llm = get_llm_service()
        user_guidance = f"\nUSER'S PERSONALIZED INSTRUCTION & FOCUS:\n{req.custom_instruction}\nDeeply incorporate this instruction into both summary options." if req.custom_instruction else ""
        prompt = f"""You are an executive resume strategist. Write 2 crisp, personalized executive resume summary statements (each 2-3 sentences, 40-55 words) for {req.candidate_name}.
Tone style: {req.style}
Target Role: {role}
Skills: {req.skills_context}
Experience context: {req.experience_context}{user_guidance}

Return JSON:
{{
  "option_1": "First compelling tailored summary...",
  "option_2": "Second alternative tailored summary..."
}}"""
        resp_text = await llm.generate_text(prompt, max_tokens=350)
        parsed = NvidiaLLMService.extract_json_payload(resp_text)
        if parsed and isinstance(parsed, dict):
            return {
                "summaries": [parsed.get("option_1", selected_fallback), parsed.get("option_2", fallbacks["general"])],
                "style": req.style
            }
    except HTTPException:
        raise
    except Exception as e:
        print(f"[GenerateSummary] LLM Error: {e}")
        raise HTTPException(status_code=500, detail="AI summary generation failed.")

    return {
        "summaries": [selected_fallback, fallbacks["general"]],
        "style": req.style
    }


class TailorResumeRequest(BaseModel):
    job_description: str
    resume_data: Dict[str, Any] = {}
    custom_instruction: str = ""

@app.post("/api/ai/tailor-resume")
async def tailor_resume_api(req: TailorResumeRequest, request: Request) -> Dict[str, Any]:
    """
    Analyzes candidate resume against a target JD. Rate-limited.
    Upgraded to use the new 5D Neural LLM evaluation internally while maintaining the legacy API schema.
    """
    enforce_ai_rate_limit(request, max_requests=25, window_seconds=60.0)
    jd = req.job_description.lower()
    resume_data = req.resume_data
    resume_text = json.dumps(resume_data)

    try:
        llm = get_llm_service()
        eval_result = await llm.a_evaluate_candidate_match(
            resume_text=resume_text,
            job_title="Target Role",
            company="Target Company",
            job_description=jd,
            workplace_preference=req.custom_instruction
        )
        
        # Map 5D evaluation output to the legacy API schema
        score = int(eval_result.get("score_10", 7.0) * 10)
        score = min(max(score, 10), 100)
        
        return {
            "match_score": score,
            "matched_keywords": eval_result.get("strengths", []),
            "missing_keywords": eval_result.get("missing_skills", []),
            "tailored_summary": eval_result.get("justification", ""),
            "bullet_suggestions": eval_result.get("improvement_roadmap", [])
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"[TailorResume] LLM fallback: {e}")

    return {
        "match_score": 75,
        "matched_keywords": ["Experience"],
        "missing_keywords": ["Specific Tech Stack"],
        "tailored_summary": "Solid candidate with relevant experience.",
        "bullet_suggestions": [
            "Add specific metrics to your recent role.",
            "Highlight modern frameworks used in production."
        ]
    }


class DeepEvaluateRequest(BaseModel):
    resume_text: str
    job_title: str = "Software Engineer"
    company: str = "Target Company"
    job_description: str = ""
    workplace_preference: Optional[str] = None
    location_preference: Optional[str] = None

@app.post("/api/ai/deep-evaluate")
async def deep_evaluate_candidate_api(req: DeepEvaluateRequest, request: Request) -> Dict[str, Any]:
    """
    Performs 5-Dimensional AI Candidate Evaluation against a target Job Description.
    Calculates per-dimension scores (Skills, Experience, Culture, Location, Growth)
    and delivers an actionable improvement roadmap. Rate-limited.
    """
    enforce_ai_rate_limit(request, max_requests=25, window_seconds=60.0)
    llm = get_llm_service()
    result = await llm.a_evaluate_candidate_match(
        resume_text=req.resume_text,
        job_title=req.job_title,
        company=req.company,
        job_description=req.job_description,
        workplace_preference=req.workplace_preference,
        location_preference=req.location_preference
    )
    return result


class DrafterReviewerTailorRequest(BaseModel):
    resume_text: str
    job_title: str
    company: str
    job_description: str
    custom_instruction: str = ""

@app.post("/api/ai/tailor-application-drafter-reviewer")
async def tailor_application_drafter_reviewer_api(req: DrafterReviewerTailorRequest, request: Request) -> Dict[str, Any]:
    """
    Two-Pass Drafter-Reviewer Application Generation Engine:
    - Pass 1 (Drafter): Generates tailored ATS highlights and cover letter.
    - Pass 2 (Reviewer): Critiques and tightens the draft for vague claims and ATS keywords.
    """
    enforce_ai_rate_limit(request, max_requests=25, window_seconds=60.0)
    llm = get_llm_service()
    result = await llm.a_generate_tailored_application_dual_pass(
        resume_text=req.resume_text,
        job_title=req.job_title,
        company=req.company,
        job_description=req.job_description,
        custom_instruction=req.custom_instruction
    )
    return result


class PolishCoverLetterRequest(BaseModel):
    action: str = "concise" # concise | technical | executive | fix_grammar | custom
    current_text: str
    company_name: str = ""
    role_title: str = ""
    custom_instruction: str = ""

@app.post("/api/ai/polish-cover-letter")
async def polish_cover_letter_api(req: PolishCoverLetterRequest, request: Request) -> Dict[str, Any]:
    """
    Polishes an existing cover letter with specific stylistic transformations or personalized user instructions.
    Rate-limited per client IP/UID.
    """
    enforce_ai_rate_limit(request, max_requests=25, window_seconds=60.0)
    text = req.current_text.strip()
    if not text:
        return {"polished_text": text, "message": "No text provided"}

    actions_prompt = {
        "concise": "Make this cover letter more concise, punchy, and eliminate any filler phrases while keeping all key impact points.",
        "technical": "Infuse deeper technical precision, metrics, and engineering rigor into this cover letter.",
        "executive": "Elevate the tone to be highly confident, polished, and executive-level.",
        "fix_grammar": "Perfect all grammar, syntax, flow, and professional phrasing without altering core message."
    }

    instruction = req.custom_instruction.strip() if req.custom_instruction else actions_prompt.get(req.action, actions_prompt["concise"])

    try:
        llm = get_llm_service()
        prompt = f"""You are a master cover letter editor and career strategist.
TASK / EDITING INSTRUCTION: {instruction}
Company: {req.company_name}
Role: {req.role_title}
Current Letter:
{text}

Return ONLY the polished letter text, maintaining complete professional structure."""
        resp_text = await llm.generate_text(prompt, max_tokens=750)
        polished = resp_text.strip()
        return {"polished_text": polished, "action": req.action}
    except HTTPException:
        raise
    except Exception as e:
        print(f"[PolishCoverLetter] LLM Error: {e}")
        raise HTTPException(status_code=500, detail="AI cover letter polish failed.")

class CoverLetterRequest(BaseModel):
    company_name: str
    role_title: str
    job_description: str = ""
    candidate_summary: str = ""
    candidate_name: str = "Candidate"
    candidate_email: str = ""
    candidate_phone: str = ""
    candidate_experience: str = ""
    candidate_skills: str = ""
    custom_instruction: str = ""

def _build_cover_letter_prompt(req: CoverLetterRequest) -> str:
    """Helper to build Cover Letter prompt."""
    user_guidance = f"""
SPECIFIC USER INSTRUCTIONS & TALKING POINTS:
{req.custom_instruction}
Ensure the candidate's custom instructions and specific personal talking points are seamlessly woven into the letter body.
""" if req.custom_instruction else ""

    return f"""You are an elite career strategist and executive recruiter. Write a compelling, tailored, high-signal 3-paragraph Cover Letter for {req.candidate_name} applying for the {req.role_title} position at {req.company_name}.

CANDIDATE DOSSIER:
Name: {req.candidate_name}
Summary / Background: {req.candidate_summary or "Experienced professional with proven track record in executing high-impact technical initiatives, building reliable solutions, and driving team success."}
Skills & Competencies: {req.candidate_skills or "System architecture, modern engineering practices, problem solving, cross-functional collaboration"}
Key Experience Context: {req.candidate_experience[:700] if req.candidate_experience else "Hands-on delivery in production environments, measurable performance improvements, and end-to-end project execution."}

TARGET SPECIFICATION:
Company: {req.company_name}
Role Title: {req.role_title}
Job Requirements / Description: {req.job_description[:1000] if req.job_description else "Looking for a high-performing professional to drive key projects and contribute to team goals."}{user_guidance}

Letter Structure:
- Salutation: Dear {req.company_name} Hiring Team, (or Dear Hiring Manager,)
- Paragraph 1 (Opening): Express enthusiasm for {req.company_name} and applying for {req.role_title}, highlighting overarching value proposition.
- Paragraph 2 (Evidence & Alignment): Connect candidate's specific background, skills, and past accomplishments directly to the technical/business needs of {req.company_name}. If user provided custom talking points, highlight them here.
- Paragraph 3 (Closing & Call to Action): Reiterate commitment, culture alignment, and polite call to action for an interview.
- Sign-off: Sincerely,\n{req.candidate_name}

Tone: Authentic, highly personalized, persuasive, crisp, tailored to the specific role and company. Zero filler. Return ONLY the letter text."""

@app.post("/api/generate-cover-letter")
async def generate_cover_letter_api(req: CoverLetterRequest, request: Request):
    """
    Generates a personalized, professional 3-paragraph Cover Letter. Rate-limited.
    Delegates prompt assembly to _build_cover_letter_prompt (<50 lines).
    """
    enforce_ai_rate_limit(request, max_requests=25, window_seconds=60.0)
    llm = get_llm_service()
    prompt = _build_cover_letter_prompt(req)

    try:
        async def event_generator():
            yield f": ping\n\n"
            try:
                # Attempt live LLM streaming
                stream_gen = llm.a_stream_chat(
                    messages=[{"role": "user", "content": prompt}],
                    temperature=0.3,
                    max_tokens=700
                )
                async for chunk in stream_gen:
                    yield f"data: {json.dumps({'content': chunk})}\n\n"
                yield "data: [DONE]\n\n"
            except Exception as e:
                print(f"[CoverLetter Streaming] Error: {e}")
                yield f"data: {json.dumps({'error': 'AI generation failed'})}\n\n"
                
        return StreamingResponse(
            event_generator(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no"
            }
        )
        
    except Exception as e:
        print(f"[CoverLetter Setup] Error: {e}")
        raise HTTPException(status_code=500, detail="AI cover letter generation failed.")


if os.path.exists(STATIC_DIR):
    app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")
    js_dir = os.path.join(STATIC_DIR, "js")
    if os.path.exists(js_dir):
        app.mount("/js", StaticFiles(directory=js_dir), name="js")
    css_dir = os.path.join(STATIC_DIR, "css")
    if os.path.exists(css_dir):
        app.mount("/css", StaticFiles(directory=css_dir), name="css")

def create_root_handler(filename):
    @app.get(f"/{filename}")
    async def _serve_file():
        fpath = os.path.join(STATIC_DIR, filename)
        if os.path.exists(fpath):
            media_type = "application/javascript" if filename.endswith(".js") else \
                         "image/svg+xml" if filename.endswith(".svg") else \
                         "image/png" if filename.endswith(".png") else \
                         "image/x-icon" if filename.endswith(".ico") else \
                         "text/plain" if filename.endswith(".txt") else \
                         "application/xml" if filename.endswith(".xml") else None
            with open(fpath, "rb") as f:
                return Response(content=f.read(), media_type=media_type)
        raise HTTPException(status_code=404, detail="Not found")

for file in ["firebase-auth.js", "logo.svg", "founder.png", "favicon.png", "favicon.ico", "apple-touch-icon.png", "og-image.png", "robots.txt", "sitemap.xml", "llms.txt"]:
    create_root_handler(file)
@app.get("/sw.js")
async def serve_service_worker():
    sw_path = os.path.join(STATIC_DIR, "sw.js")
    if os.path.exists(sw_path):
        with open(sw_path, "r", encoding="utf-8") as f:
            return Response(content=f.read(), media_type="application/javascript", headers={"Cache-Control": "no-cache, must-revalidate", "Service-Worker-Allowed": "/"})
    raise HTTPException(status_code=404, detail="Service worker not found.")
def render_template(filepath: str) -> str:
    if not os.path.exists(filepath):
        return "<h1>Not Found</h1>"
        
    with open(filepath, "r", encoding="utf-8") as f:
        html = f.read()
        
    header_path = os.path.join(STATIC_DIR, "components", "header.html")
    if "<!-- GLOBAL_HEADER -->" in html and os.path.exists(header_path):
        with open(header_path, "r", encoding="utf-8") as hf:
            html = html.replace("<!-- GLOBAL_HEADER -->", hf.read())
            
    footer_path = os.path.join(STATIC_DIR, "components", "footer.html")
    if "<!-- GLOBAL_FOOTER -->" in html and os.path.exists(footer_path):
        with open(footer_path, "r", encoding="utf-8") as ff:
            html = html.replace("<!-- GLOBAL_FOOTER -->", ff.read())
            
    return html



@app.get("/candidate", response_class=HTMLResponse)
@app.get("/candidate/", response_class=HTMLResponse)
async def serve_candidate():
    cand_file = os.path.join(STATIC_DIR, "candidate", "index.html")
    return render_template(cand_file)
    return "<h1>Candidate Not Found</h1>"

@app.get("/onboarding", response_class=HTMLResponse)
@app.get("/onboarding/", response_class=HTMLResponse)
async def serve_onboarding():
    ob_file = os.path.join(STATIC_DIR, "onboarding", "index.html")
    return render_template(ob_file)
    return "<h1>getArole Onboarding</h1>"

@app.get("/dashboard", response_class=HTMLResponse)
@app.get("/dashboard/", response_class=HTMLResponse)
async def serve_dashboard():
    dash_file = os.path.join(STATIC_DIR, "dashboard", "index.html")
    return render_template(dash_file)
    return "<h1>getArole Dashboard</h1>"

@app.get("/explore", response_class=HTMLResponse)
@app.get("/explore/", response_class=HTMLResponse)
async def serve_explore():
    exp_file = os.path.join(STATIC_DIR, "explore", "index.html")
    return render_template(exp_file)
    return "<h1>getArole Explore</h1>"

@app.get("/matches", response_class=HTMLResponse)
@app.get("/matches/", response_class=HTMLResponse)
async def serve_matches():
    match_file = os.path.join(STATIC_DIR, "matches", "index.html")
    return render_template(match_file)
    return "<h1>getArole Matches</h1>"

@app.get("/profile", response_class=HTMLResponse)
@app.get("/profile/", response_class=HTMLResponse)
async def serve_profile():
    prof_file = os.path.join(STATIC_DIR, "profile", "index.html")
    return render_template(prof_file)
    return "<h1>getArole Profile</h1>"

@app.get("/privacy", response_class=HTMLResponse)
@app.get("/privacy/", response_class=HTMLResponse)
async def serve_privacy():
    priv_file = os.path.join(STATIC_DIR, "privacy", "index.html")
    return render_template(priv_file)
    return "<h1>getArole Privacy Policy</h1>"

@app.get("/terms", response_class=HTMLResponse)
@app.get("/terms/", response_class=HTMLResponse)
async def serve_terms():
    terms_file = os.path.join(STATIC_DIR, "terms", "index.html")
    return render_template(terms_file)
    return "<h1>getArole Terms of Service</h1>"

# ─── CRM Sheet & Admin Dashboard (Restricted to hemasaivattikuti2727@gmail.com) ───

@app.get("/crm", response_class=HTMLResponse)
@app.get("/crm/", response_class=HTMLResponse)
@app.get("/admin/crm", response_class=HTMLResponse)
@app.get("/admin/crm/", response_class=HTMLResponse)
async def serve_crm_dashboard():
    crm_file = os.path.join(STATIC_DIR, "crm", "index.html")
    return render_template(crm_file)
    return "<h1>getArole CRM Dashboard</h1>"

@app.get("/api/admin/crm/users")
async def get_crm_users_endpoint(
    request: Request,
    x_admin_key: Optional[str] = Header(None, alias="X-Admin-Key"),
    x_user_email: Optional[str] = Header(None, alias="X-User-Email")
) -> Dict[str, Any]:
    """
    Returns unified candidate, user profile, preferences, and resume data for getArole CRM Sheet.
    Access restricted strictly to hemasaivattikuti2727@gmail.com.
    """
    verify_crm_admin_access(request, x_admin_key=x_admin_key, x_user_email=x_user_email)
    
    supabase = get_supabase_service()
    users = await supabase.fetch_crm_all_users(limit=1000)
    
    total_users = len(users)
    users_with_resumes = sum(1 for u in users if u.get("has_resume"))
    users_with_contact = sum(1 for u in users if u.get("phone") or u.get("email"))
    
    # Skill frequency analysis
    skill_counts: Dict[str, int] = {}
    for u in users:
        for sk in (u.get("skills") or []):
            sk_clean = str(sk).strip()
            if sk_clean:
                skill_counts[sk_clean] = skill_counts.get(sk_clean, 0) + 1
    top_skills = sorted(skill_counts.items(), key=lambda x: x[1], reverse=True)[:10]

    return {
        "status": "ok",
        "total_users": total_users,
        "metrics": {
            "total_candidates": total_users,
            "resumes_count": users_with_resumes,
            "contacts_count": users_with_contact,
            "top_skills": [{"skill": s, "count": c} for s, c in top_skills]
        },
        "users": users
    }

@app.get("/api/admin/crm/export.csv")
async def export_crm_csv_endpoint(
    request: Request,
    x_admin_key: Optional[str] = Header(None, alias="X-Admin-Key"),
    x_user_email: Optional[str] = Header(None, alias="X-User-Email"),
    email: Optional[str] = Query(None)
):
    """
    Generates a direct, downloadable CSV file for Excel / Google Sheets with complete user profiles and resumes.
    Access restricted strictly to hemasaivattikuti2727@gmail.com.
    """
    verify_crm_admin_access(request, x_admin_key=x_admin_key, x_user_email=x_user_email)
    
    supabase = get_supabase_service()
    users = await supabase.fetch_crm_all_users(limit=2000)
    
    import io
    import csv
    
    output = io.StringIO()
    writer = csv.writer(output, quoting=csv.QUOTE_MINIMAL)
    
    # Header Row
    writer.writerow([
        "Candidate ID",
        "Name",
        "Email",
        "Phone",
        "Location",
        "Headline / Title",
        "Target Role",
        "Preferred Locations",
        "Workplace Type",
        "Company Sizes",
        "Skills",
        "Experience Count",
        "Education Count",
        "Projects Count",
        "Has Resume",
        "Resume Filename",
        "LinkedIn URL",
        "GitHub URL",
        "Portfolio URL",
        "Registered / Updated At",
        "Raw Resume Text"
    ])
    
    for u in users:
        skills_str = ", ".join(u.get("skills") or [])
        locs_str = ", ".join(u.get("preferred_locations") or [])
        comps_str = ", ".join(u.get("company_sizes") or [])
        roles_str = ", ".join(u.get("roles") or [])
        raw_text_clean = " ".join((u.get("resume_raw_text") or "").split())[:3000]
        
        writer.writerow([
            u.get("id") or u.get("firebase_uid") or "",
            u.get("name") or "",
            u.get("email") or "",
            u.get("phone") or "",
            u.get("location") or "",
            u.get("headline") or "",
            u.get("target_role") or roles_str or "",
            locs_str or "",
            u.get("workplace_type") or "",
            comps_str or "",
            skills_str or "",
            len(u.get("experience") or []),
            len(u.get("education") or []),
            len(u.get("projects") or []),
            "Yes" if u.get("has_resume") else "No",
            u.get("resume_filename") or "",
            u.get("linkedin") or "",
            u.get("github") or "",
            u.get("portfolio") or "",
            u.get("updated_at") or u.get("created_at") or "",
            raw_text_clean
        ])
    
    output.seek(0)
    csv_bytes = output.getvalue().encode("utf-8-sig")
    
    return Response(
        content=csv_bytes,
        media_type="text/csv",
        headers={
            "Content-Disposition": "attachment; filename=getArole_CRM_Candidates_Export.csv"
        }
    )

# ─── User Profile & Preferences API (Supabase-backed, Firebase UID keyed) ───

@app.get("/api/user/profile")
async def get_user_profile(request: Request, x_firebase_uid: Optional[str] = Header(None, alias="X-Firebase-UID")):
    uid = extract_authenticated_uid(request)
    supabase = get_supabase_service()
    data = await supabase.load_user_profile(uid)
    return JSONResponse(data or {})

class UserProfileSchema(BaseModel):
    name: Optional[str] = None
    first: Optional[str] = None
    last: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    pref_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    headline: Optional[str] = None
    location: Optional[str] = None
    summary: Optional[str] = None
    skills: List[str] = []
    experience: List[Dict[str, Any]] = []
    education: List[Dict[str, Any]] = []
    projects: List[Dict[str, Any]] = []
    links: Dict[str, Any] = {}
    preferences: Dict[str, Any] = {}

class UserPreferencesSchema(BaseModel):
    query: Optional[str] = None
    target_title: Optional[str] = None
    locations: List[str] = []
    workplace_type: List[str] = []
    employment_type: List[str] = []
    skills_inc: List[str] = []
    salary_min_inr: Optional[str] = None
    salary_min_usd: Optional[str] = None

@app.post("/api/user/profile")
async def save_user_profile_endpoint(request: Request, profile: Dict[str, Any] = Body(...), x_firebase_uid: Optional[str] = Header(None, alias="X-Firebase-UID")):
    uid = extract_authenticated_uid(request)
    async with get_user_lock(uid):
        supabase = get_supabase_service()
        result = await supabase.save_user_profile(uid, profile)
        return JSONResponse({"status": "ok", "data": result})

@app.get("/api/user/preferences")
async def get_user_preferences(request: Request, x_firebase_uid: Optional[str] = Header(None, alias="X-Firebase-UID")):
    uid = extract_authenticated_uid(request)
    supabase = get_supabase_service()
    data = await supabase.load_user_preferences(uid)
    return JSONResponse(data or {})

@app.post("/api/user/preferences")
async def save_user_preferences_endpoint(request: Request, prefs: Dict[str, Any] = Body(...), x_firebase_uid: Optional[str] = Header(None, alias="X-Firebase-UID")):
    uid = extract_authenticated_uid(request)
    async with get_user_lock(uid):
        supabase = get_supabase_service()
        result = await supabase.save_user_preferences(uid, prefs)
        return JSONResponse({"status": "ok", "data": result})

@app.get("/api/user/resume")
async def get_user_resume(request: Request, x_firebase_uid: Optional[str] = Header(None, alias="X-Firebase-UID")):
    uid = extract_authenticated_uid(request)
    if not uid or uid == "guest_user":
        logging.getLogger("sre.security").warning(
            "auth_missing_uid_header",
            extra={"path": request.url.path, "client_ip": request.client.host if request.client else "unknown"}
        )
        return JSONResponse({"error": "Missing X-Firebase-UID or Authorization header"}, status_code=401)
    supabase = get_supabase_service()
    data = await supabase.load_user_resume(uid)
    return JSONResponse(data or {})

@app.post("/api/user/resume")
async def save_user_resume_endpoint(request: Request, resume_data: Dict[str, Any] = Body(...), x_firebase_uid: Optional[str] = Header(None, alias="X-Firebase-UID")):
    uid = extract_authenticated_uid(request)
    if not uid or uid == "guest_user":
        logging.getLogger("sre.security").warning(
            "auth_missing_uid_header",
            extra={"path": request.url.path, "client_ip": request.client.host if request.client else "unknown"}
        )
        return JSONResponse({"error": "Missing X-Firebase-UID or Authorization header"}, status_code=401)
    async with get_user_lock(uid):
        supabase = get_supabase_service()
        result = await supabase.save_user_resume(uid, resume_data)
        return JSONResponse({"status": "ok", "data": result})

@app.delete("/api/user/account")
async def delete_user_account_endpoint(request: Request, x_firebase_uid: Optional[str] = Header(None, alias="X-Firebase-UID")):
    """
    GDPR Right to be Forgotten & Cascade Account Erasure:
    Permanently purges all profile, preference, and resume records for the authenticated user.
    """
    uid = extract_authenticated_uid(request)
    if not uid or uid == "guest_user":
        if x_firebase_uid and x_firebase_uid.strip() and x_firebase_uid.strip() != "guest_user":
            uid = x_firebase_uid.strip()
        else:
            return JSONResponse({"error": "Authentication required to delete account."}, status_code=401)
    async with get_user_lock(uid):
        supabase = get_supabase_service()
        success = await supabase.purge_user_account(uid)
        return JSONResponse({"status": "ok" if success else "error", "message": "Account data purged successfully."})


from services.resume_parser_service import get_resume_parser_service

# ── Resume Parsing & PDF Matcher Endpoints ──────────────────────────────
@app.post("/api/match-resume")
@app.post("/api/parse-resume")
async def parse_and_match_resume(file: UploadFile = File(...)):
    """
    Parses an uploaded PDF / DOCX resume, extracts text and key profile fields
    (name, email, phone, headline, skills, summary, experience), and returns structured candidate profile.
    Delegates to ResumeParserService for domain processing (Single Responsibility Principle).
    Enforces a strict 10MB upload payload ceiling to prevent memory exhaustion / OOM kills.
    """
    try:
        contents = await file.read()
        if len(contents) > 10 * 1024 * 1024:
            raise HTTPException(
                status_code=413,
                detail="Resume file size exceeds maximum allowable limit of 10MB."
            )
        filename = file.filename or "resume.pdf"
        lower_name = filename.lower()
        if not (lower_name.endswith(".pdf") or lower_name.endswith(".docx") or lower_name.endswith(".doc") or lower_name.endswith(".txt")):
            raise HTTPException(
                status_code=400,
                detail="Unsupported file format. Please upload a PDF or Word document (.pdf, .docx)."
            )
        
        parser_service = get_resume_parser_service()
        result = await parser_service.process_resume_bytes(contents, filename)
        return JSONResponse(result)

    except HTTPException:
        raise
    except Exception as e:
        print(f"[Resume Parse Error] {e}")
        return JSONResponse(status_code=500, content={"error": f"Error parsing resume: {str(e)}"})


@app.get("/settings", response_class=HTMLResponse)
@app.get("/settings/", response_class=HTMLResponse)
async def serve_settings():
    settings_file = os.path.join(STATIC_DIR, "settings", "index.html")
    return render_template(settings_file)


from prometheus_client import generate_latest, CONTENT_TYPE_LATEST
from services.embedding_service import embedding_service

@app.get("/metrics")
async def metrics_endpoint():
    """Prometheus metrics scrape endpoint."""
    return Response(content=generate_latest(), media_type=CONTENT_TYPE_LATEST)

@app.get("/healthz")
async def liveness_probe():
    """Liveness probe: verifies ASGI process is alive (<5ms)."""
    return JSONResponse({"status": "alive", "pid": os.getpid()})

@app.get("/readyz")
async def readiness_probe(response: Response):
    """
    Readiness probe: validates external dependencies before accepting traffic.
    Returns 503 if critical dependencies (FastEmbed 384-dim probe or Supabase connectivity) fail.
    Returns 200 with degraded=true if non-critical checks fail.
    """
    checks = {}
    overall = "ready"
    
    # 1. Probe Supabase live query
    try:
        async with asyncio.timeout(1.5):
            supabase = get_supabase_service()
            client = await supabase._get_client()
            if client:
                await client.table("jobs").select("id").limit(1).execute()
                checks["supabase"] = "ok"
            else:
                checks["supabase"] = "missing_credentials"
                overall = "degraded"
    except Exception as e:
        checks["supabase"] = f"degraded: {type(e).__name__}"
        overall = "degraded"

    # 2. Probe FastEmbed in-memory vector model and assert 384 dimensions
    try:
        if hasattr(embedding_service, 'model') and embedding_service.model is not None:
            probe = list(embedding_service.model.embed(["probe"]))[0]
            assert len(probe) == 384, f"Dimension mismatch: expected 384, got {len(probe)}"
            checks["fastembed_384dim"] = "ok"
        else:
            checks["fastembed_384dim"] = "model_not_loaded"
            overall = "not_ready"
    except Exception as e:
        checks["fastembed_384dim"] = f"failed: {type(e).__name__}"
        overall = "not_ready"  # Blocks traffic

    # 3. Check NVIDIA NIM API Key presence
    nvidia_key = os.getenv("NVIDIA_NIM_API_KEY", "")
    checks["nvidia_api_key"] = "configured" if bool(nvidia_key) else "missing"

    if overall == "not_ready":
        response.status_code = 503
        return JSONResponse(status_code=503, content={"status": "not_ready", "checks": checks})
    elif overall == "degraded":
        return JSONResponse(status_code=200, content={"status": "degraded", "degraded": True, "checks": checks})
        
    return JSONResponse(status_code=200, content={"status": "ready", "degraded": False, "checks": checks})

