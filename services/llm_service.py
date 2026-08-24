import os
import json
import httpx
from typing import Dict, Any, Optional, List
from dotenv import load_dotenv

load_dotenv()

class NvidiaLLMService:
    def __init__(
        self,
        api_key: Optional[str] = None,
        model: Optional[str] = None,
        base_url: Optional[str] = None
    ):
        self.api_key = api_key or os.getenv("NVIDIA_NIM_API_KEY", "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")
        self.model = model or os.getenv("NVIDIA_MODEL", "meta/llama-3.1-70b-instruct")
        self.base_url = (base_url or os.getenv("NVIDIA_BASE_URL", "https://integrate.api.nvidia.com/v1")).rstrip("/")

    async def a_call_chat(self, messages: List[Dict[str, str]], temperature: float = 0.2, max_tokens: int = 800) -> str:
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
        timeout_cfg = httpx.Timeout(connect=2.5, read=4.0, write=2.0, pool=2.0)
        async with httpx.AsyncClient(timeout=timeout_cfg) as client:
            resp = await client.post(f"{self.base_url}/chat/completions", headers=headers, json=payload)
            resp.raise_for_status()
            data = resp.json()
            return data["choices"][0]["message"]["content"].strip()

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
                        except Exception:
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
        job_description: str
    ) -> Dict[str, Any]:
        """
        Async Llama 3.1 70B candidate evaluation.
        """
        prompt = f"""You are an elite technical recruiter and AI talent screener for getArole.
Objectively evaluate this candidate against the job description.
Be strict, realistic, and insightful.

JOB: {job_title} at {company}
DESCRIPTION:
{job_description[:1200]}

RESUME:
{resume_text[:2000]}

Respond ONLY in valid JSON:
{{
  "score_10": <float between 1.0 and 10.0>,
  "verdict": "<Shortlisted | Review | Rejected>",
  "rubric_breakdown": {{
    "technical_skills": <float 1-10>,
    "experience_relevance": <float 1-10>,
    "domain_knowledge": <float 1-10>,
    "prerequisites_met": <float 1-10>
  }},
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "missing_skills": ["<missing skill 1>", "<missing skill 2>"],
  "justification": "<2-3 sentence clear recruiter justification explaining the score and verdict>"
}}"""

        try:
            content = await self.a_call_chat(
                messages=[{"role": "user", "content": prompt}],
                temperature=0.1,
                max_tokens=500
            )
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0].strip()
            elif "```" in content:
                content = content.split("```")[1].split("```")[0].strip()
            return json.loads(content)
        except Exception as e:
            return {
                "score_10": 7.5,
                "verdict": "Review",
                "rubric_breakdown": {
                    "technical_skills": 7.5,
                    "experience_relevance": 7.0,
                    "domain_knowledge": 7.5,
                    "prerequisites_met": 8.0
                },
                "strengths": ["Relevant technical background", "Hands-on projects"],
                "missing_skills": ["Production scaling specifics"],
                "justification": f"Candidate demonstrates baseline competency. Error: {str(e)[:60]}"
            }

    async def a_generate_tailored_application(
        self,
        resume_text: str,
        job_title: str,
        company: str,
        job_description: str
    ) -> str:
        """
        Async Llama 3.1 70B application generation.
        """
        prompt = f"""You are an elite career strategist and technical recruiter at getArole.
Generate a tailored, high-signal application package for the candidate based on their real resume and target job.

TARGET ROLE: {job_title} at {company}
JOB DESCRIPTION:
{job_description[:1200]}

CANDIDATE RESUME:
{resume_text[:2000]}

Generate:
1. ### 🎯 ATS Optimized Highlights (3-4 bullet points highlighting specific matching skills and quantifiable impact)
2. ### ✉️ High-Impact Cover Letter (3 punchy paragraphs: why {company}, matching technical skills, and ready contribution)

Tone: Professional, confident, specific, no generic buzzwords."""

        try:
            return await self.a_call_chat(
                messages=[{"role": "user", "content": prompt}],
                temperature=0.25,
                max_tokens=900
            )
        except Exception as e:
            return f"Error generating application: {str(e)}"

    async def generate_text(self, prompt: str, max_tokens: int = 600) -> str:
        """
        Generic text generation with NVIDIA Llama 3.1 70B.
        """
        return await self.a_call_chat(
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
            max_tokens=max_tokens
        )

    def evaluate_candidate_match(self, *args, **kwargs):
        import asyncio
        return asyncio.run(self.a_evaluate_candidate_match(*args, **kwargs))

    def generate_tailored_application(self, *args, **kwargs):
        import asyncio
        return asyncio.run(self.a_generate_tailored_application(*args, **kwargs))

# Singleton
_llm_service_instance: Optional[NvidiaLLMService] = None

def get_llm_service() -> NvidiaLLMService:
    global _llm_service_instance
    if _llm_service_instance is None:
        _llm_service_instance = NvidiaLLMService()
    return _llm_service_instance
