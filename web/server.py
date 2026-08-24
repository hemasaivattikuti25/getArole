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
    rb_file = os.path.join(STATIC_DIR, "resume-builder.html")
    if os.path.exists(rb_file):
        with open(rb_file, "r", encoding="utf-8") as f:
            return f.read()
    return "<h1>Resume Builder — Starting Up</h1>"

@app.get("/cover-letter-builder", response_class=HTMLResponse)
@app.get("/cover-letter-builder/", response_class=HTMLResponse)
async def serve_cover_letter_builder():
    cl_file = os.path.join(STATIC_DIR, "cover-letter-builder.html")
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
    ob_file = os.path.join(STATIC_DIR, "onboarding.html")
    if os.path.exists(ob_file):
        with open(ob_file, "r", encoding="utf-8") as f:
            return f.read()
    return "<h1>getArole Onboarding</h1>"

@app.get("/dashboard", response_class=HTMLResponse)
async def serve_dashboard():
    dash_file = os.path.join(STATIC_DIR, "dashboard.html")
    if os.path.exists(dash_file):
        with open(dash_file, "r", encoding="utf-8") as f:
            return f.read()
    return "<h1>getArole Dashboard</h1>"

@app.get("/profile", response_class=HTMLResponse)
@app.get("/profile/", response_class=HTMLResponse)
async def serve_profile():
    prof_file = os.path.join(STATIC_DIR, "profile.html")
    if os.path.exists(prof_file):
        with open(prof_file, "r", encoding="utf-8") as f:
            return f.read()
    return "<h1>getArole Profile</h1>"

# ─── User Profile & Preferences API (Supabase-backed, Firebase UID keyed) ───

@app.get("/api/user/profile")
async def get_user_profile(request: Request, x_firebase_uid: Optional[str] = Header(None, alias="X-Firebase-UID")):
    uid = x_firebase_uid or request.headers.get("X-Firebase-UID")
    if not uid:
        return JSONResponse({"error": "Missing X-Firebase-UID header"}, status_code=401)
    supabase = get_supabase_service()
    data = await supabase.load_user_profile(uid)
    return JSONResponse(data or {})

@app.post("/api/user/profile")
async def save_user_profile_endpoint(request: Request, profile: Dict[str, Any] = Body(...), x_firebase_uid: Optional[str] = Header(None, alias="X-Firebase-UID")):
    uid = x_firebase_uid or request.headers.get("X-Firebase-UID")
    if not uid:
        return JSONResponse({"error": "Missing X-Firebase-UID header"}, status_code=401)
    supabase = get_supabase_service()
    result = await supabase.save_user_profile(uid, profile)
    return JSONResponse({"status": "ok", "data": result})

@app.get("/api/user/preferences")
async def get_user_preferences(request: Request, x_firebase_uid: Optional[str] = Header(None, alias="X-Firebase-UID")):
    uid = x_firebase_uid or request.headers.get("X-Firebase-UID")
    if not uid:
        return JSONResponse({"error": "Missing X-Firebase-UID header"}, status_code=401)
    supabase = get_supabase_service()
    data = await supabase.load_user_preferences(uid)
    return JSONResponse(data or {})

@app.post("/api/user/preferences")
async def save_user_preferences_endpoint(request: Request, prefs: Dict[str, Any] = Body(...), x_firebase_uid: Optional[str] = Header(None, alias="X-Firebase-UID")):
    uid = x_firebase_uid or request.headers.get("X-Firebase-UID")
    if not uid:
        return JSONResponse({"error": "Missing X-Firebase-UID header"}, status_code=401)
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

@app.get("/preferences", response_class=HTMLResponse)
@app.get("/preferences/", response_class=HTMLResponse)
async def serve_preferences():
    pref_file = os.path.join(STATIC_DIR, "preferences.html")
    if os.path.exists(pref_file):
        with open(pref_file, "r", encoding="utf-8") as f:
            return f.read()
    return "<h1>getArole Preferences</h1>"

