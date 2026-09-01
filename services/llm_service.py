import os
import json
import httpx
from typing import Dict, Any, Optional, List
from dotenv import load_dotenv

load_dotenv()

from core.circuit_breaker import AsyncCircuitBreaker
from core.metrics import LLM_FALLBACK_TOTAL

llm_breaker = AsyncCircuitBreaker("nvidia_nim", fail_max=3, reset_timeout=30.0)

class NvidiaLLMService:
    def __init__(
        self,
        api_key: Optional[str] = None,
        model: Optional[str] = None,
        base_url: Optional[str] = None
    ):
        self.api_key = api_key or os.getenv("NVIDIA_NIM_API_KEY", "")
        self.model = model or os.getenv("NVIDIA_MODEL", "meta/llama-3.1-70b-instruct")
        self.base_url = (base_url or os.getenv("NVIDIA_BASE_URL", "https://integrate.api.nvidia.com/v1")).rstrip("/")

    async def a_call_chat(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.2,
        max_tokens: int = 800,
        timeout_secs: Optional[float] = None
    ) -> str:
        # Check circuit state
        if llm_breaker.is_open:
            LLM_FALLBACK_TOTAL.labels(reason="circuit_open").inc()
            return ""

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens
        }
        read_timeout = timeout_secs if timeout_secs is not None else 6.0
        timeout_cfg = httpx.Timeout(connect=3.0, read=read_timeout, write=3.0, pool=3.0)
        try:
            async with httpx.AsyncClient(timeout=timeout_cfg) as client:
                resp = await client.post(f"{self.base_url}/chat/completions", headers=headers, json=payload)
                resp.raise_for_status()
                data = resp.json()
                await llm_breaker.record_success()
                return data["choices"][0]["message"]["content"].strip()
        except httpx.HTTPStatusError as e:
            await llm_breaker.record_failure(e)
            status_code = str(e.response.status_code)
            LLM_FALLBACK_TOTAL.labels(reason=f"http_{status_code}").inc()
            return ""
        except Exception as e:
            await llm_breaker.record_failure(e)
            error_name = type(e).__name__
            LLM_FALLBACK_TOTAL.labels(reason=error_name).inc()
            return ""

    async def a_stream_chat(self, messages: List[Dict[str, str]], temperature: float = 0.2, max_tokens: int = 800):
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
            "stream": True
        }
        timeout_cfg = httpx.Timeout(connect=2.5, read=3.5, write=2.0, pool=2.0)
        async with httpx.AsyncClient(timeout=timeout_cfg) as client:
            async with client.stream("POST", f"{self.base_url}/chat/completions", headers=headers, json=payload) as resp:
                resp.raise_for_status()
                async for line in resp.aiter_lines():
                    if line.startswith("data: ") and line != "data: [DONE]":
                        try:
                            data = json.loads(line[6:])
                            content = data["choices"][0]["delta"].get("content")
                            if content:
                                yield content
                        except Exception as e:
                            print(f"[LLMStream] Skipping non-JSON chunk line: {e}")
                            continue

    def call_chat_sync(self, messages: List[Dict[str, str]], temperature: float = 0.2, max_tokens: int = 800) -> str:
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens
        }
        with httpx.Client(timeout=45.0) as client:
            resp = client.post(f"{self.base_url}/chat/completions", headers=headers, json=payload)
            resp.raise_for_status()
            data = resp.json()
            return data["choices"][0]["message"]["content"].strip()

    async def a_evaluate_candidate_match(
        self,
        resume_text: str,
        job_title: str,
        company: str,
        job_description: str,
        workplace_preference: Optional[str] = None,
        location_preference: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Async Llama 3.1 70B 5-Dimensional candidate evaluation engine.
        Computes granular per-dimension scores across:
        1. Skills Match (30% weight)
        2. Experience Alignment (25% weight)
        3. Culture & Workplace Fit (15% weight)
        4. Location Synergy (15% weight)
        5. Career Growth Trajectory (15% weight)
        """
        pref_context = ""
        if workplace_preference or location_preference:
            pref_context = f"\nCANDIDATE PREFERENCES: Workplace: {workplace_preference or 'Any'}, Location: {location_preference or 'Flexible'}"

        prompt = f"""You are an elite technical recruiter and AI talent screener for getArole.
Objectively evaluate this candidate against the job description using a 5-Dimensional Match Matrix.
Be strict, realistic, and insightful.

JOB: {job_title} at {company}
DESCRIPTION:
{job_description[:1200]}

RESUME:
{resume_text[:2000]}{pref_context}

Respond ONLY in valid JSON:
{{
  "verdict": "<Shortlisted | Review | Rejected>",
  "rubric_breakdown": {{
    "skills_match": <float 1.0-10.0 (exact tech stack, tooling, and technical skill overlap)>,
    "experience_alignment": <float 1.0-10.0 (seniority, production experience, leadership, scale)>,
    "culture_workplace_fit": <float 1.0-10.0 (remote/hybrid/onsite synergy, collaboration style)>,
    "location_synergy": <float 1.0-10.0 (geographic proximity, relocation, timezone alignment)>,
    "career_growth": <float 1.0-10.0 (trajectory velocity, growth headroom, upside potential)>
  }},
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "missing_skills": ["<missing skill 1>", "<missing skill 2>"],
  "improvement_roadmap": [
    "<Actionable step 1 to bridge skill or experience gaps for this exact role>",
    "<Actionable step 2 to improve interview positioning>"
  ],
  "justification": "<2-3 sentence clear recruiter justification explaining the 5D score and verdict>"
}}"""

        try:
            content = await self.a_call_chat(
                messages=[{"role": "user", "content": prompt}],
                temperature=0.1,
                max_tokens=650
            )
            parsed = self.extract_json_payload(content)
            if not parsed or not isinstance(parsed, dict):
                if "```json" in content:
                    content = content.split("```json")[1].split("```")[0].strip()
                elif "```" in content:
                    content = content.split("```")[1].split("```")[0].strip()
                parsed = json.loads(content)

            rubric = parsed.get("rubric_breakdown", {})
            skills_val = float(rubric.get("skills_match", rubric.get("technical_skills", 7.0)))
            exp_val = float(rubric.get("experience_alignment", rubric.get("experience_relevance", 7.0)))
            cult_val = float(rubric.get("culture_workplace_fit", rubric.get("domain_knowledge", 7.0)))
            loc_val = float(rubric.get("location_synergy", rubric.get("prerequisites_met", 7.5)))
            growth_val = float(rubric.get("career_growth", 7.0))

            # Calibrated 5D weighted composite score
            composite = round(
                (0.30 * skills_val) +
                (0.25 * exp_val) +
                (0.15 * cult_val) +
                (0.15 * loc_val) +
                (0.15 * growth_val),
                1
            )

            # Ensure backward compatibility keys
            rubric["skills_match"] = skills_val
            rubric["experience_alignment"] = exp_val
            rubric["culture_workplace_fit"] = cult_val
            rubric["location_synergy"] = loc_val
            rubric["career_growth"] = growth_val
            rubric["technical_skills"] = skills_val
            rubric["experience_relevance"] = exp_val
            rubric["domain_knowledge"] = cult_val
            rubric["prerequisites_met"] = loc_val

            parsed["rubric_breakdown"] = rubric
            parsed["composite_score"] = composite
            parsed["score_10"] = composite
            parsed["improvement_roadmap"] = parsed.get("improvement_roadmap") or [
                f"Highlight hands-on production experience with {', '.join(parsed.get('missing_skills', ['core stack'])[:2])}",
                "Quantify business and latency impacts in project summaries"
            ]
            return parsed

        except Exception as e:
            return {
                "score_10": 7.5,
                "composite_score": 7.5,
                "verdict": "Review",
                "rubric_breakdown": {
                    "skills_match": 7.5,
                    "experience_alignment": 7.0,
                    "culture_workplace_fit": 7.5,
                    "location_synergy": 8.0,
                    "career_growth": 7.5,
                    "technical_skills": 7.5,
                    "experience_relevance": 7.0,
                    "domain_knowledge": 7.5,
                    "prerequisites_met": 8.0
                },
                "strengths": ["Relevant technical background", "Hands-on projects"],
                "missing_skills": ["Production scaling specifics"],
                "improvement_roadmap": [
                    "Add measurable impact metrics to recent experience",
                    "Highlight architectural trade-offs in key projects"
                ],
                "justification": f"Candidate demonstrates baseline competency. Note: {str(e)[:60]}"
            }

    async def a_generate_tailored_application_dual_pass(
        self,
        resume_text: str,
        job_title: str,
        company: str,
        job_description: str,
        custom_instruction: str = ""
    ) -> Dict[str, Any]:
        """
        Two-Pass Drafter-Reviewer Pattern for application tailoring:
        - Pass 1 (Drafter): Creates candidate-tailored ATS highlights and high-signal cover letter.
        - Pass 2 (Reviewer): Critically audits the draft for vague buzzwords, lack of metrics, and ATS gaps,
                             producing a tightened, higher-conviction final application.
        """
        user_guidance = f"\nUSER GUIDANCE / TALKING POINTS: {custom_instruction}" if custom_instruction else ""

        # ── Pass 1: The Drafter ──
        drafter_prompt = f"""You are an elite career strategist and technical recruiter at getArole.
Generate an initial, tailored application package for the candidate based on their real resume and target job.

TARGET ROLE: {job_title} at {company}
JOB DESCRIPTION:
{job_description[:1200]}

CANDIDATE RESUME:
{resume_text[:2000]}{user_guidance}

Generate:
1. ### 🎯 ATS Optimized Highlights (3-4 bullet points highlighting specific matching skills and quantifiable impact)
2. ### ✉️ High-Impact Cover Letter (3 punchy paragraphs: why {company}, matching technical skills, and ready contribution)

Tone: Professional, confident, specific, no generic buzzwords."""

        draft_v1 = await self.a_call_chat(
            messages=[{"role": "user", "content": drafter_prompt}],
            temperature=0.25,
            max_tokens=850
        )

        if not draft_v1 or "Error" in draft_v1:
            draft_v1 = f"### 🎯 ATS Optimized Highlights\n- Strong background in software engineering aligning with {job_title} at {company}.\n\n### ✉️ High-Impact Cover Letter\nDear {company} Hiring Team,\n\nI am excited to apply for the {job_title} position."

        # ── Pass 2: The Reviewer (Adversarial Critique & Refinement) ──
        reviewer_prompt = f"""You are a strict, top-tier hiring manager and executive ATS screener.
Review this draft application package for a {job_title} role at {company}.

JOB REQUIREMENTS:
{job_description[:1000]}

CANDIDATE'S ORIGINAL RESUME:
{resume_text[:1500]}

INITIAL DRAFT:
{draft_v1}

TASK:
1. Identify any vague claims, missing metrics, weak verbs, or omitted ATS keywords from the job description.
2. Produce a refined, higher-impact version that eliminates fluff, enhances technical specificity, and sharpens conviction.

Respond ONLY in valid JSON:
{{
  "critique_notes": [
    "<Critique 1: e.g. Replaced passive phrases with active outcome-driven metrics>",
    "<Critique 2: e.g. Embedded specific JD keywords for ATS scoring>"
  ],
  "final_refined": "<Complete polished application with ATS Highlights and Cover Letter>"
}}"""

        try:
            review_resp = await self.a_call_chat(
                messages=[{"role": "user", "content": reviewer_prompt}],
                temperature=0.15,
                max_tokens=950
            )
            parsed_review = self.extract_json_payload(review_resp)
            if parsed_review and isinstance(parsed_review, dict) and parsed_review.get("final_refined"):
                return {
                    "draft_v1": draft_v1,
                    "critique_notes": parsed_review.get("critique_notes", ["Refined technical precision and ATS keyword density"]),
                    "final_refined": parsed_review.get("final_refined")
                }
        except Exception as err:
            print(f"[DrafterReviewer Pass 2 Notice] {err}")

        # Fallback to single-pass if Pass 2 encounters parsing issues
        return {
            "draft_v1": draft_v1,
            "critique_notes": ["Direct high-signal ATS alignment generated."],
            "final_refined": draft_v1
        }

    async def a_generate_tailored_application(
        self,
        resume_text: str,
        job_title: str,
        company: str,
        job_description: str
    ) -> str:
        """
        Async Llama 3.1 70B application generation using the Drafter-Reviewer pipeline.
        Returns the final refined application text.
        """
        result = await self.a_generate_tailored_application_dual_pass(
            resume_text=resume_text,
            job_title=job_title,
            company=company,
            job_description=job_description
        )
        return result.get("final_refined") or result.get("draft_v1") or ""

    async def generate_text(self, prompt: str, max_tokens: int = 600) -> str:
        """
        Generic text generation with NVIDIA Llama 3.1 70B.
        """
        return await self.a_call_chat(
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
            max_tokens=max_tokens
        )

    @staticmethod
    def extract_json_payload(response_text: str) -> Optional[Any]:
        """
        Reliably extracts and parses JSON objects or arrays from markdown code fences
        or raw LLM output strings (DRY Architecture).
        """
        if not response_text or not isinstance(response_text, str):
            return None
        cleaned = response_text.strip()
        
        # Strip markdown fences if present
        if "```json" in cleaned:
            cleaned = cleaned.split("```json")[1].split("```")[0].strip()
        elif "```" in cleaned:
            cleaned = cleaned.split("```")[1].split("```")[0].strip()

        # Direct parse attempt (with strict=False to handle literal newlines/tabs inside JSON strings)
        try:
            return json.loads(cleaned, strict=False)
        except Exception:
            pass

        # Check for JSON object braces
        start_obj = cleaned.find("{")
        end_obj = cleaned.rfind("}") + 1
        if start_obj != -1 and end_obj > start_obj:
            try:
                return json.loads(cleaned[start_obj:end_obj], strict=False)
            except Exception:
                pass

        # Check for JSON array brackets
        start_arr = cleaned.find("[")
        end_arr = cleaned.rfind("]") + 1
        if start_arr != -1 and end_arr > start_arr:
            try:
                return json.loads(cleaned[start_arr:end_arr], strict=False)
            except Exception:
                pass

        return None

    def evaluate_candidate_match(self, *args, **kwargs):
        import asyncio
        import concurrent.futures
        try:
            loop = asyncio.get_running_loop()
        except RuntimeError:
            loop = None
        if loop and loop.is_running():
            with concurrent.futures.ThreadPoolExecutor(max_workers=1) as pool:
                return pool.submit(lambda: asyncio.run(self.a_evaluate_candidate_match(*args, **kwargs))).result()
        return asyncio.run(self.a_evaluate_candidate_match(*args, **kwargs))

    def generate_tailored_application(self, *args, **kwargs):
        import asyncio
        import concurrent.futures
        try:
            loop = asyncio.get_running_loop()
        except RuntimeError:
            loop = None
        if loop and loop.is_running():
            with concurrent.futures.ThreadPoolExecutor(max_workers=1) as pool:
                return pool.submit(lambda: asyncio.run(self.a_generate_tailored_application(*args, **kwargs))).result()
        return asyncio.run(self.a_generate_tailored_application(*args, **kwargs))

# Singleton
_llm_service_instance: Optional[NvidiaLLMService] = None

def get_llm_service() -> NvidiaLLMService:
    global _llm_service_instance
    if _llm_service_instance is None:
        _llm_service_instance = NvidiaLLMService()
    return _llm_service_instance
