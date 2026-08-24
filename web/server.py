import asyncio
import json
import os
import shutil
from typing import List, Optional, Dict, Any
from fastapi import FastAPI, UploadFile, File, Form, Query, HTTPException, Body, Request, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, JSONResponse, StreamingResponse
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

# Job cache file paths
DATA_DIR = os.path.join(BASE_DIR, "data")
os.makedirs(DATA_DIR, exist_ok=True)
SAVED_JOBS_FILE = os.path.join(DATA_DIR, "jobs.json")
TMP_JOBS_FILE = "/tmp/jobs.json"

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

SUPABASE_URL = os.getenv("SUPABASE_URL", "https://tgmhtlqcjgcjedlnthfk.supabase.co")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "sb_publishable_ubfak-i16iK-jZCTpZIxTQ_9o10ZqDn")

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

@app.get("/api/candidate/{cand_id}")
async def get_candidate_by_id(cand_id: str):
    """
    Returns a single candidate by UUID for public sharing.
    """
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
    if os.path.exists(rb_file):
        with open(rb_file, "r", encoding="utf-8") as f:
            return f.read()
    return "<h1>Resume Builder — Starting Up</h1>"

@app.get("/cover-letter-builder", response_class=HTMLResponse)
@app.get("/cover-letter-builder/", response_class=HTMLResponse)
async def serve_cover_letter_builder():
    cl_file = os.path.join(STATIC_DIR, "cover-letter-builder", "index.html")
    if os.path.exists(cl_file):
        with open(cl_file, "r", encoding="utf-8") as f:
            return f.read()
    return "<h1>Cover Letter Builder — Starting Up</h1>"

# ── AI Bullet Enhancer ───────────────────────────────────────────────────────
class BulletEnhanceRequest(BaseModel):
    bullet: str
    context: str = ""
    target_role: str = ""
    custom_instruction: str = ""

@app.post("/api/enhance-bullet")
async def enhance_bullet(req: BulletEnhanceRequest):
    """
    Generates 3 tailored variations of a resume bullet point:
    1. STAR Format (Quantified Impact)
    2. Technical Architecture & Scale
    3. Crisp ATS Executive Statement
    Supports personalized user instructions.
    """
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
    
    extra_metric = f" ({custom_inst})" if custom_inst else ", driving a 30%+ performance gain."
    star_fallback = s.rstrip(".") + (extra_metric if not any(c.isdigit() for c in s) else ".")
    tech_fallback = f"Architected high-reliability solution for {bullet.lower().rstrip('.')}, ensuring fault tolerance and sub-100ms response times."
    concise_fallback = f"Delivered {bullet.lower().rstrip('.')} adhering to modern production standards."

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
        # Parse JSON from response
        try:
            start_idx = resp_text.find("{")
            end_idx = resp_text.rfind("}") + 1
            if start_idx != -1 and end_idx > start_idx:
                parsed = json.loads(resp_text[start_idx:end_idx])
                return {
                    "enhanced": parsed.get("star", star_fallback),
                    "star": parsed.get("star", star_fallback),
                    "technical": parsed.get("technical", tech_fallback),
                    "concise": parsed.get("concise", concise_fallback),
                    "original": bullet
                }
        except Exception:
            pass
        enhanced = resp_text.strip().lstrip("•-–—").strip()
        return {"enhanced": enhanced or star_fallback, "star": enhanced or star_fallback, "technical": tech_fallback, "concise": concise_fallback, "original": bullet}
    except Exception as e:
        print(f"[BulletEnhancer] LLM Error: {e}")
        raise HTTPException(status_code=500, detail="AI bullet enhancement failed.")


class SuggestSkillsRequest(BaseModel):
    target_role: str = ""
    current_skills: str = ""
    experience_context: str = ""
    custom_instruction: str = ""

@app.post("/api/ai/suggest-skills")
async def suggest_skills_api(req: SuggestSkillsRequest):
    """
    Recommends high-demand missing industry skills categorized by technical domain.
    """
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
        start_idx = resp_text.find("[")
        end_idx = resp_text.rfind("]") + 1
        if start_idx != -1 and end_idx > start_idx:
            parsed = json.loads(resp_text[start_idx:end_idx])
            return {"suggestions": parsed, "target_role": role}
    except Exception as e:
        print(f"[SuggestSkills] LLM Error: {e}")
        raise HTTPException(status_code=500, detail="AI skill suggestion failed.")


class GenerateSummaryRequest(BaseModel):
    style: str = "technical"
    candidate_name: str = "Candidate"
    target_role: str = ""
    experience_context: str = ""
    skills_context: str = ""
    custom_instruction: str = ""

@app.post("/api/ai/generate-summary")
async def generate_summary_api(req: GenerateSummaryRequest):
    """
    Generates 2 highly personalized, high-signal summary variations based on candidate background,
    target tone, and custom instructions.
    """
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
        start_idx = resp_text.find("{")
        end_idx = resp_text.rfind("}") + 1
        if start_idx != -1 and end_idx > start_idx:
            parsed = json.loads(resp_text[start_idx:end_idx])
            return {
                "summaries": [parsed.get("option_1", selected_fallback), parsed.get("option_2", fallbacks["general"])],
                "style": req.style
            }
    except Exception as e:
        print(f"[GenerateSummary] LLM Error: {e}")
        raise HTTPException(status_code=500, detail="AI summary generation failed.")


class TailorResumeRequest(BaseModel):
    job_description: str
    resume_data: Dict[str, Any] = {}
    custom_instruction: str = ""

@app.post("/api/ai/tailor-resume")
async def tailor_resume_api(req: TailorResumeRequest):
    """
    Analyzes candidate resume against a target JD: calculates ATS match score,
    extracts matched & missing keywords, and produces personalized tailored summary and bullet suggestions.
    """
    jd = req.job_description.lower()
    r = req.resume_data

    # Extract all text from resume
    resume_text = json.dumps(r).lower()

    # Common technical keywords pool
    common_keywords = [
        "python", "javascript", "typescript", "react", "next.js", "fastapi", "django",
        "node.js", "docker", "kubernetes", "aws", "gcp", "azure", "postgresql", "mysql",
        "mongodb", "redis", "kafka", "graphql", "rest api", "ci/cd", "git", "microservices",
        "distributed systems", "system design", "unit testing", "agile", "machine learning",
        "llm", "ai", "performance optimization", "sql", "nosql", "linux"
    ]

    jd_keywords = [kw for kw in common_keywords if kw in jd]
    if not jd_keywords:
        words = set([w.strip(".,;:()") for w in jd.split() if len(w) > 4])
        jd_keywords = list(words)[:15]

    matched = [kw for kw in jd_keywords if kw in resume_text]
    missing = [kw for kw in jd_keywords if kw not in resume_text]

    score = int((len(matched) / max(len(jd_keywords), 1)) * 100)
    score = min(max(score, 50), 98)

    tailored_summary = f"Results-driven Engineer with expertise in {', '.join(matched[:3]) if matched else 'modern software development'}, targeting key contributions in scalable architecture and high-reliability systems."

    try:
        llm = get_llm_service()
        user_guidance = f"\nUSER'S CUSTOM TAILORING INSTRUCTION: {req.custom_instruction}" if req.custom_instruction else ""
        prompt = f"""You are an elite ATS optimization engine. Compare the candidate's resume to the target Job Description and provide personalized recommendations.
Job Description (snippet): {req.job_description[:1200]}
Resume Data: {json.dumps(r)[:1200]}{user_guidance}

Return JSON:
{{
  "match_score": 85,
  "matched_keywords": ["keyword1", "keyword2"],
  "missing_keywords": ["missing1", "missing2"],
  "tailored_summary": "2-sentence tailored executive summary incorporating missing keywords naturally.",
  "bullet_suggestions": [
    "Suggested enhanced bullet point matching JD requirements...",
    "Another suggested bullet point..."
  ]
}}"""
        resp_text = await llm.generate_text(prompt, max_tokens=450)
        start_idx = resp_text.find("{")
        end_idx = resp_text.rfind("}") + 1
        if start_idx != -1 and end_idx > start_idx:
            parsed = json.loads(resp_text[start_idx:end_idx])
            return parsed
    except Exception as e:
        print(f"[TailorResume] LLM fallback: {e}")

    return {
        "match_score": score,
        "matched_keywords": matched,
        "missing_keywords": missing,
        "tailored_summary": tailored_summary,
        "bullet_suggestions": [
            f"Engineered scalable solutions leveraging {', '.join(matched[:2]) if matched else 'production technologies'}, enhancing reliability by 25%+.",
            f"Implemented automated pipelines and robust testing, accelerating feature delivery cycles."
        ]
    }


class PolishCoverLetterRequest(BaseModel):
    action: str = "concise" # concise | technical | executive | fix_grammar | custom
    current_text: str
    company_name: str = ""
    role_title: str = ""
    custom_instruction: str = ""

@app.post("/api/ai/polish-cover-letter")
async def polish_cover_letter_api(req: PolishCoverLetterRequest):
    """
    Polishes an existing cover letter with specific stylistic transformations or personalized user instructions.
    """
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

@app.post("/api/generate-cover-letter")
async def generate_cover_letter_api(req: CoverLetterRequest):
    """
    Generates a personalized, professional 3-paragraph Cover Letter using NVIDIA Llama 3.1 70B,
    deeply integrating any specific user instructions or talking points.
    """
    llm = get_llm_service()
    user_guidance = f"""
SPECIFIC USER INSTRUCTIONS & TALKING POINTS:
{req.custom_instruction}
Ensure the candidate's custom instructions and specific personal talking points are seamlessly woven into the letter body.
""" if req.custom_instruction else ""

    prompt = f"""You are an elite career strategist and executive recruiter. Write a compelling, tailored, high-signal 3-paragraph Cover Letter for {req.candidate_name} applying for the {req.role_title} position at {req.company_name}.

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

    try:
        async def event_generator():
            yield f": ping\n\n"
            streamed_any = False
            try:
                # Attempt live LLM streaming
                stream_gen = llm.a_stream_chat(
                    messages=[{"role": "user", "content": prompt}],
                    temperature=0.3,
                    max_tokens=700
                )
                async for chunk in stream_gen:
                    streamed_any = True
                    yield f"data: {json.dumps({'content': chunk})}\n\n"
                yield "data: [DONE]\n\n"
            except Exception as e:
                print(f"[CoverLetter Streaming] Error: {e}")
                import json
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

@app.get("/", response_class=HTMLResponse)
async def serve_landing():
    landing_file = os.path.join(STATIC_DIR, "landing.html")
    if os.path.exists(landing_file):
        with open(landing_file, "r", encoding="utf-8") as f:
            return f.read()
    return "<h1>getArole — Starting Up</h1>"

@app.get("/candidate", response_class=HTMLResponse)
async def serve_candidate():
    with open(os.path.join(STATIC_DIR, "candidate.html"), "r", encoding="utf-8") as f:
        return f.read()

@app.get("/onboarding", response_class=HTMLResponse)
async def serve_onboarding():
    ob_file = os.path.join(STATIC_DIR, "onboarding", "index.html")
    if os.path.exists(ob_file):
        with open(ob_file, "r", encoding="utf-8") as f:
            return f.read()
    return "<h1>getArole Onboarding</h1>"

@app.get("/dashboard", response_class=HTMLResponse)
@app.get("/dashboard/", response_class=HTMLResponse)
async def serve_dashboard():
    dash_file = os.path.join(STATIC_DIR, "dashboard", "index.html")
    if os.path.exists(dash_file):
        with open(dash_file, "r", encoding="utf-8") as f:
            return f.read()
    return "<h1>getArole Dashboard</h1>"

@app.get("/explore", response_class=HTMLResponse)
@app.get("/explore/", response_class=HTMLResponse)
async def serve_explore():
    exp_file = os.path.join(STATIC_DIR, "explore", "index.html")
    if os.path.exists(exp_file):
        with open(exp_file, "r", encoding="utf-8") as f:
            return f.read()
    return "<h1>getArole Explore</h1>"

@app.get("/matches", response_class=HTMLResponse)
@app.get("/matches/", response_class=HTMLResponse)
async def serve_matches():
    match_file = os.path.join(STATIC_DIR, "matches", "index.html")
    if os.path.exists(match_file):
        with open(match_file, "r", encoding="utf-8") as f:
            return f.read()
    return "<h1>getArole Matches</h1>"

@app.get("/profile", response_class=HTMLResponse)
@app.get("/profile/", response_class=HTMLResponse)
async def serve_profile():
    prof_file = os.path.join(STATIC_DIR, "profile", "index.html")
    if os.path.exists(prof_file):
        with open(prof_file, "r", encoding="utf-8") as f:
            return f.read()
    return "<h1>getArole Profile</h1>"

# ─── User Profile & Preferences API (Supabase-backed, Firebase UID keyed) ───

@app.get("/api/user/profile")
async def get_user_profile(request: Request, x_firebase_uid: Optional[str] = Header(None, alias="X-Firebase-UID")):
    uid = x_firebase_uid or request.headers.get("X-Firebase-UID") or "guest_user"
    supabase = get_supabase_service()
    data = await supabase.load_user_profile(uid)
    return JSONResponse(data or {})

@app.post("/api/user/profile")
async def save_user_profile_endpoint(request: Request, profile: Dict[str, Any] = Body(...), x_firebase_uid: Optional[str] = Header(None, alias="X-Firebase-UID")):
    uid = x_firebase_uid or request.headers.get("X-Firebase-UID") or "guest_user"
    supabase = get_supabase_service()
    result = await supabase.save_user_profile(uid, profile)
    return JSONResponse({"status": "ok", "data": result})

@app.get("/api/user/preferences")
async def get_user_preferences(request: Request, x_firebase_uid: Optional[str] = Header(None, alias="X-Firebase-UID")):
    uid = x_firebase_uid or request.headers.get("X-Firebase-UID") or "guest_user"
    supabase = get_supabase_service()
    data = await supabase.load_user_preferences(uid)
    return JSONResponse(data or {})

@app.post("/api/user/preferences")
async def save_user_preferences_endpoint(request: Request, prefs: Dict[str, Any] = Body(...), x_firebase_uid: Optional[str] = Header(None, alias="X-Firebase-UID")):
    uid = x_firebase_uid or request.headers.get("X-Firebase-UID") or "guest_user"
    supabase = get_supabase_service()
    result = await supabase.save_user_preferences(uid, prefs)
    return JSONResponse({"status": "ok", "data": result})

@app.get("/api/user/resume")
async def get_user_resume(request: Request, x_firebase_uid: Optional[str] = Header(None, alias="X-Firebase-UID")):
    uid = x_firebase_uid or request.headers.get("X-Firebase-UID")
    if not uid:
        return JSONResponse({"error": "Missing X-Firebase-UID header"}, status_code=401)
    supabase = get_supabase_service()
    data = await supabase.load_user_resume(uid)
    return JSONResponse(data or {})

@app.post("/api/user/resume")
async def save_user_resume_endpoint(request: Request, resume_data: Dict[str, Any] = Body(...), x_firebase_uid: Optional[str] = Header(None, alias="X-Firebase-UID")):
    uid = x_firebase_uid or request.headers.get("X-Firebase-UID")
    if not uid:
        return JSONResponse({"error": "Missing X-Firebase-UID header"}, status_code=401)
    supabase = get_supabase_service()
    result = await supabase.save_user_resume(uid, resume_data)
    return JSONResponse({"status": "ok", "data": result})


# ── Resume Parsing & PDF Matcher Endpoints ──────────────────────────────
@app.post("/api/match-resume")
@app.post("/api/parse-resume")
async def parse_and_match_resume(file: UploadFile = File(...)):
    """
    Parses an uploaded PDF / DOCX resume, extracts text and key profile fields
    (name, email, phone, headline, skills, summary, experience), and returns structured candidate profile.
    """
    try:
        contents = await file.read()
        filename = file.filename or "resume.pdf"
        text = ""

        # 1. Extract text and link annotations using PyMuPDF (PDF)
        pdf_links = []
        if filename.lower().endswith(".pdf") or file.content_type == "application/pdf" or contents.startswith(b"%PDF"):
            try:
                import fitz
                doc = fitz.open(stream=contents, filetype="pdf")
                pages_text = []
                for p in doc:
                    pages_text.append(p.get_text())
                    for l in p.get_links():
                        if l.get("uri"):
                            pdf_links.append(l.get("uri"))
                text = "\n".join(pages_text).strip()
            except Exception as pe:
                print(f"[PDF Parse Error] {pe}")

        if not text:
            # Fallback text decoding
            try:
                text = contents.decode("utf-8", errors="ignore").strip()
            except Exception:
                text = ""

        if not text or len(text) < 20:
            return JSONResponse(
                status_code=400,
                content={"error": "Could not extract text from document. Please ensure it is a valid text-based PDF or document."}
            )

        # Append PDF annotation links to text so LLM and RegEx see all URIs
        if pdf_links:
            text += "\n\n=== EXTRACTED PDF ANNOTATION LINKS ===\n" + "\n".join(set(pdf_links))

        # 2. Extract Basic Fields with RegEx
        import re
        email_match = re.search(r'[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+', text)
        email = email_match.group(0) if email_match else ""

        phone_match = re.search(r'(?:(?:\+|0{0,2})\d{1,3}[\s-]*)?(?:\(?\d{2,5}\)?[\s-]*)?\d{3,4}[\s-]*\d{4}', text)
        phone = phone_match.group(0).strip() if phone_match else ""

        lines = [l.strip() for l in text.splitlines() if l.strip()]
        first_few_lines = lines[:5]
        candidate_name = first_few_lines[0] if first_few_lines and len(first_few_lines[0].split()) <= 4 else "Candidate"
        
        # 3. Extract Skills Taxonomy
        common_tech_skills = [
            "python", "java", "c++", "c#", "c", "rust", "golang", "go", "typescript", "javascript",
            "kotlin", "swift", "php", "ruby", "scala", "sql", "r", "dart", "bash", "shell",
            "react", "react.js", "next.js", "vue", "vue.js", "angular", "svelte", "react native",
            "flutter", "ios", "android", "tailwind css", "tailwind", "html5", "css3", "redux", "vite",
            "fastapi", "flask", "django", "node.js", "express", "express.js", "spring boot", "spring",
            "asp.net", ".net", "nest.js", "graphql", "rest api", "grpc", "microservices",
            "pytorch", "tensorflow", "keras", "scikit-learn", "langchain", "llamaindex", "rag",
            "hugging face", "transformers", "nlp", "computer vision", "llm", "large language models",
            "pandas", "numpy", "apache spark", "spark", "kafka", "airflow", "snowflake", "databricks",
            "postgresql", "postgres", "mysql", "mongodb", "redis", "cassandra", "dynamodb",
            "pinecone", "chromadb", "pgvector", "elasticsearch", "supabase", "sqlite",
            "aws", "amazon web services", "gcp", "google cloud", "azure", "docker", "kubernetes", "k8s",
            "terraform", "ansible", "ci/cd", "github actions", "linux", "nginx", "prometheus", "grafana",
            "system design", "distributed systems", "agile", "scrum", "git"
        ]
        lower_text = text.lower()
        extracted_skills = sorted(list(set([s for s in common_tech_skills if s in lower_text])))

        # 4. Extract Headline & Summary
        headline = "Software Engineer"
        for candidate_headline in ["Full Stack Developer", "Backend Engineer", "Frontend Engineer", "AI/ML Engineer", "Data Scientist", "DevOps Engineer", "Mobile Developer", "Software Development Engineer"]:
            if candidate_headline.lower() in lower_text:
                headline = candidate_headline
                break

        summary = ""
        for i, l in enumerate(lines[:10]):
            if any(k in l.lower() for k in ["summary", "profile", "about", "objective"]):
                summary = " ".join(lines[i+1:i+4])
                break
        if not summary and len(lines) > 2:
            summary = " ".join(lines[1:4])

        # 5. Attempt LLM Enhancement if available with full resume context (up to 8000 chars)
        llm_parsed = {}
        try:
            llm = get_llm_service()
            prompt = f"""You are a principal HR Resume Parser. Extract structured candidate profile from this resume:

Resume Text:
{text[:8000]}

Return valid JSON with exact structure:
{{
  "first_name": "First Name",
  "last_name": "Last Name",
  "name": "Full Name",
  "headline": "Target Title e.g. Senior Software Engineer",
  "email": "email@example.com",
  "phone": "+1234567890",
  "location": "City, Country",
  "summary": "2-3 sentence executive summary",
  "linkedin_url": "https://linkedin.com/in/username",
  "github_url": "https://github.com/username",
  "portfolio_url": "https://portfolio.dev",
  "other_url": "",
  "skills": ["Python", "React", "AWS", "FastAPI"],
  "experience": [
    {{
      "company": "Company Name",
      "title": "Role Title",
      "dates": "Jan 2024 - Present",
      "bullets": ["Built high-throughput API...", "Reduced latency by 40%..."]
    }}
  ],
  "education": [
    {{
      "school": "University Name",
      "degree": "B.Tech Computer Science",
      "year": "2025"
    }}
  ],
  "projects": [
    {{
      "name": "Project Name",
      "description": "Full stack real-time application using FastAPI and React.",
      "link": "https://github.com/user/project"
    }}
  ]
}}"""
            resp = await llm.a_call_chat([{"role": "user", "content": prompt}], max_tokens=1800)
            start_idx = resp.find("{")
            end_idx = resp.rfind("}") + 1
            if start_idx != -1 and end_idx > start_idx:
                llm_parsed = json.loads(resp[start_idx:end_idx])
        except Exception as llm_err:
            print(f"[ResumeParser LLM Notice] {llm_err}")

        # Extract names
        first_name = llm_parsed.get("first_name", "")
        last_name = llm_parsed.get("last_name", "")
        if llm_parsed.get("name") and llm_parsed["name"] != "Candidate Full Name":
            candidate_name = llm_parsed["name"]
        
        if not first_name or not last_name:
            name_parts = candidate_name.split()
            if len(name_parts) >= 2:
                first_name = first_name or name_parts[0]
                last_name = last_name or " ".join(name_parts[1:])
            elif len(name_parts) == 1:
                first_name = first_name or name_parts[0]
                last_name = last_name or ""

        if llm_parsed.get("headline"): headline = llm_parsed["headline"]
        if llm_parsed.get("summary"): summary = llm_parsed["summary"]
        if llm_parsed.get("email"): email = llm_parsed["email"]
        if llm_parsed.get("phone"): phone = llm_parsed["phone"]
        if llm_parsed.get("skills"):
            extracted_skills = sorted(list(set(extracted_skills + [s for s in llm_parsed["skills"] if isinstance(s, str)])))

        # 6. Structured arrays: experience, education, projects, links
        experience_list = llm_parsed.get("experience") or []
        education_list = llm_parsed.get("education") or []
        projects_list = llm_parsed.get("projects") or []

        # Robust URL Extractor for Links (LinkedIn, GitHub, Portfolio)
        links = {
            "linkedin": llm_parsed.get("linkedin_url", ""),
            "github": llm_parsed.get("github_url", ""),
            "portfolio": llm_parsed.get("portfolio_url", ""),
            "other": llm_parsed.get("other_url", "")
        }

        # Fallback URL regex if LLM missed them (combines PDF annotation links & regex)
        import re as re2
        raw_urls = pdf_links + re2.findall(r'(?:https?://)?(?:www\.)?([a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+(?:/[^\s,)]*)?)', text)
        for url_str in raw_urls:
            url_clean = url_str.replace("mailto:", "").strip()
            full_url = url_clean if url_clean.startswith("http") else f"https://{url_clean}"
            lower_u = url_clean.lower()
            if "linkedin.com" in lower_u and not links["linkedin"]:
                links["linkedin"] = full_url
            elif "github.com" in lower_u and not links["github"]:
                if not any(sub in lower_u for sub in ["/mithra", "/vitap"]):
                    links["github"] = full_url
            elif not links["portfolio"] and not any(ignore in lower_u for ignore in ["google.com", "schema.org", "w3.org", "fonts.googleapis", "gmail.com"]):
                if any(ext in lower_u for ext in [".dev", ".io", ".me", "portfolio", "vercel.app", "github.io", "lifeos.com", "mithra"]):
                    links["portfolio"] = full_url

        # Smart Fallback Section Parser if experience, education, or projects are missing
        if not experience_list or not education_list or not projects_list:
            fb_exp, fb_edu, fb_proj = [], [], []
            sec_lines = [l.strip() for l in text.splitlines() if l.strip()]
            sections = {}
            curr_sec = "HEADER"
            sections[curr_sec] = []
            
            for l in sec_lines:
                u = l.upper().strip(":")
                if u in ["EXPERIENCE", "WORK EXPERIENCE", "EMPLOYMENT", "EMPLOYMENT HISTORY", "WORK HISTORY"]:
                    curr_sec = "EXPERIENCE"
                    sections[curr_sec] = []
                elif u in ["PROJECTS", "KEY PROJECTS", "PERSONAL PROJECTS", "PROJECTS & OUTSIDE EXPERIENCE"]:
                    curr_sec = "PROJECTS"
                    sections[curr_sec] = []
                elif u in ["EDUCATION", "ACADEMIC BACKGROUND", "QUALIFICATIONS"]:
                    curr_sec = "EDUCATION"
                    sections[curr_sec] = []
                elif u in ["SKILLS", "TECHNICAL SKILLS", "SUMMARY", "ACHIEVEMENTS", "CERTIFICATIONS", "LANGUAGES"]:
                    curr_sec = "OTHER_" + u
                    sections[curr_sec] = []
                else:
                    sections.setdefault(curr_sec, []).append(l)

            # ── EXPERIENCE PARSER (robust multi-line grouping) ──
            if "EXPERIENCE" in sections:
                import re as re_fb
                curr_exp = None
                month_pattern = re_fb.compile(r'(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|Present)\b.*(\d{4}|Present)', re_fb.IGNORECASE)
                date_pattern = re_fb.compile(r'\d{4}\s*[-–—]\s*(\d{4}|Present)', re_fb.IGNORECASE)
                company_indicators = ["Ltd", "Inc", "Corp", "LLC", "Pvt", "GmbH", "Technologies", "Solutions", "Laboratory", "DRDO", "Organization", "Foundation", "Company", "Group"]
                role_indicators = ["Intern", "Engineer", "Developer", "Manager", "Lead", "Architect", "Analyst", "Designer", "Consultant", "Director", "Officer"]
                
                for l in sections["EXPERIENCE"]:
                    is_bullet = l.startswith("•") or l.startswith("-") or l.startswith("·") or l.startswith("*")
                    has_date = bool(month_pattern.search(l)) or bool(date_pattern.search(l))
                    is_company = any(ci in l for ci in company_indicators) and len(l) < 120
                    is_role = any(ri in l for ri in role_indicators) and len(l) < 120
                    
                    if is_bullet:
                        bullet = l.lstrip("•-·* ").strip()
                        if curr_exp and bullet:
                            curr_exp["bullets"].append(bullet)
                    elif is_company and not is_bullet:
                        # New company entry
                        curr_exp = {"company": l, "title": "", "dates": "", "bullets": []}
                        fb_exp.append(curr_exp)
                    elif has_date and curr_exp and not curr_exp.get("dates"):
                        curr_exp["dates"] = l
                    elif is_role and curr_exp and not curr_exp.get("title"):
                        curr_exp["title"] = l
                    elif curr_exp and not curr_exp.get("title") and not is_bullet and len(l) < 100:
                        # Non-bullet, non-company, non-date short line = role/title
                        curr_exp["title"] = l
                    # else: skip continuation fragments of bullet text

            # ── PROJECTS PARSER (skip noise fragments) ──
            if "PROJECTS" in sections:
                import re as re_fp
                curr_proj = None
                noise_words = {"Live", "GitHub", "Demo", "Link", "Source", "Code", "View"}
                
                for l in sections["PROJECTS"]:
                    is_bullet = l.startswith("•") or l.startswith("-") or l.startswith("·") or l.startswith("*")
                    is_url = l.startswith("http") or l.startswith("www.") or "://" in l
                    is_noise = l.strip() in noise_words
                    is_year_only = bool(re_fp.match(r'^\d{4}(\s*[-–—]\s*(Present|\d{4}))?$', l.strip()))
                    is_tech_stack = "·" in l and len(l.split("·")) >= 3  # "React · FastAPI · Supabase"
                    
                    if is_bullet:
                        bullet = l.lstrip("•-·* ").strip()
                        if curr_proj and bullet:
                            curr_proj["bullets"].append(bullet)
                            if not curr_proj["description"]:
                                curr_proj["description"] = bullet
                    elif is_noise or is_year_only or is_url:
                        # Skip noise, just attach URL if available
                        if is_url and curr_proj and not curr_proj.get("link"):
                            curr_proj["link"] = l
                        continue
                    elif is_tech_stack and curr_proj:
                        # Tech stack line belongs to current project, add as metadata
                        curr_proj["tech"] = l
                        continue
                    elif not is_bullet and not is_noise and not is_year_only and not is_tech_stack:
                        # Potential project name line
                        # Only create new project if: line is short, not a sentence, and looks like a name
                        l_stripped = l.strip()
                        word_count = len(l_stripped.split())
                        starts_upper = l_stripped[0].isupper() if l_stripped else False
                        if word_count <= 6 and starts_upper and not l_stripped.endswith(".") and not l_stripped.startswith("for ") and not l_stripped.startswith("and "):
                            if curr_proj and len(curr_proj["bullets"]) > 0:
                                # Previous project had bullets, start a new one
                                curr_proj = {"name": l_stripped, "description": "", "link": "", "bullets": []}
                                fb_proj.append(curr_proj)
                            elif not curr_proj:
                                # First project
                                curr_proj = {"name": l_stripped, "description": "", "link": "", "bullets": []}
                                fb_proj.append(curr_proj)
                            else:
                                # Continuation text, append to description
                                curr_proj["description"] = (curr_proj["description"] + " " + l_stripped).strip()
                        else:
                            # Long line = description text
                            if curr_proj:
                                curr_proj["description"] = (curr_proj["description"] + " " + l_stripped).strip()

            # ── EDUCATION PARSER (filter out URLs and noise) ──
            if "EDUCATION" in sections:
                curr_edu = None
                for l in sections["EDUCATION"]:
                    # Skip URLs and noise
                    if l.startswith("http") or l.startswith("mailto:") or "://" in l:
                        continue
                    if l.startswith("==="):
                        continue
                    
                    is_school = any(k in l.lower() for k in ["university", "institute", "vit", "college", "school", "iit", "nit", "bits"])
                    has_year = bool(re.search(r'20\d{2}', l))
                    
                    if is_school:
                        curr_edu = {"school": l, "degree": "", "year": ""}
                        fb_edu.append(curr_edu)
                    elif curr_edu:
                        if has_year and not curr_edu["year"]:
                            curr_edu["year"] = l
                        elif not curr_edu["degree"]:
                            curr_edu["degree"] = l
                        elif len(l) > 5 and not l.startswith("http"):
                            curr_edu["degree"] += " · " + l

            if not experience_list and fb_exp: experience_list = fb_exp
            if not education_list and fb_edu: education_list = fb_edu
            if not projects_list and fb_proj: projects_list = fb_proj

        candidate_profile = {
            "first_name": first_name,
            "last_name": last_name,
            "first": first_name,
            "last": last_name,
            "name": candidate_name,
            "email": email,
            "phone": phone,
            "headline": headline,
            "location": llm_parsed.get("location", "India"),
            "skills": extracted_skills,
            "summary": summary,
            "experience": experience_list,
            "education": education_list,
            "projects": projects_list,
            "links": links
        }

        resume_data = {
            "header": {
                "name": candidate_name,
                "first_name": first_name,
                "last_name": last_name,
                "email": email,
                "phone": phone,
                "location": llm_parsed.get("location", "India"),
                "title": headline
            },
            "summary": { "text": summary },
            "skills": {
                "languages": ", ".join(extracted_skills[:10]),
                "all": ", ".join(extracted_skills)
            },
            "experience": experience_list,
            "education": education_list,
            "projects": projects_list,
            "links": links,
            "raw_text": text
        }

        return JSONResponse({
            "success": True,
            "filename": filename,
            "resume_text": text,
            "candidate_profile": candidate_profile,
            "resume_data": resume_data
        })

    except Exception as e:
        print(f"[Resume Parse Error] {e}")
        return JSONResponse(status_code=500, content={"error": f"Error parsing resume: {str(e)}"})


@app.get("/preferences", response_class=HTMLResponse)
@app.get("/preferences/", response_class=HTMLResponse)
async def serve_preferences():
    pref_file = os.path.join(STATIC_DIR, "preferences", "index.html")
    if os.path.exists(pref_file):
        with open(pref_file, "r", encoding="utf-8") as f:
            return f.read()
    return "<h1>getArole Preferences</h1>"

