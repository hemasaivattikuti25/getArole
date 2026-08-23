import json
from typing import Dict, Any, Optional
from domain.models import CandidateScreeningReport, RubricScore
from services.llm_service import get_llm_service

class ApplicationAgent:
    """
    Universal Candidate AI Agent.
    Encapsulates candidate state (resume) and orchestrates LLM evaluation and generation tasks.
    """
    def __init__(self, name: str, resume_text: str, skills: list[str] = None):
        self.name = name
        self.resume_text = resume_text
        self.skills = skills or []
        self.llm = get_llm_service()

    async def match_against(self, job_title: str, company: str, job_description: str) -> CandidateScreeningReport:
        """
        Evaluates the candidate against a specific job and returns a structured report.
        """
        raw_dict = await self.llm.a_evaluate_candidate_match(
            resume_text=self.resume_text,
            job_title=job_title,
            company=company,
            job_description=job_description
        )
        
        # Parse the raw dict from LLM into the robust domain model
        try:
            rubric = raw_dict.get("rubric_breakdown", {})
            return CandidateScreeningReport(
                candidate_name=self.name,
                file_name=f"{self.name.replace(' ', '_')}_resume.pdf",
                score_10=float(raw_dict.get("score_10", 7.0)),
                verdict=raw_dict.get("verdict", "Review"),
                rubric_breakdown=RubricScore(
                    technical_skills=float(rubric.get("technical_skills", 7.0)),
                    experience_depth=float(rubric.get("experience_relevance", 7.0)),
                    prerequisite_coverage=float(rubric.get("prerequisites_met", 7.0))
                ),
                strengths=raw_dict.get("strengths", []),
                missing_skills=raw_dict.get("missing_skills", []),
                justification=raw_dict.get("justification", "Evaluated by AI."),
                extracted_skills=self.skills
            )
        except Exception as e:
            # Fallback for parsing errors
            return CandidateScreeningReport(
                candidate_name=self.name,
                file_name=f"{self.name.replace(' ', '_')}_resume.pdf",
                score_10=5.0,
                verdict="Review",
                rubric_breakdown=RubricScore(technical_skills=5.0, experience_depth=5.0, prerequisite_coverage=5.0),
                strengths=["Unknown (Parsing Error)"],
                missing_skills=[],
                justification=f"Error parsing LLM response: {e}",
                extracted_skills=self.skills
            )

    async def generate_application(self, job_title: str, company: str, job_description: str) -> str:
        """
        Generates tailored application materials for the candidate.
        """
        return await self.llm.a_generate_tailored_application(
            resume_text=self.resume_text,
            job_title=job_title,
            company=company,
            job_description=job_description
        )
