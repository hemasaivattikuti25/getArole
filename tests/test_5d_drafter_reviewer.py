import os
import sys
import pytest
from unittest.mock import patch, AsyncMock
from fastapi.testclient import TestClient

# Ensure workspace root is in sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from web.server import app
from services.llm_service import get_llm_service, NvidiaLLMService
from services.screening_service import ScreeningService

client = TestClient(app)

@pytest.mark.asyncio
async def test_5d_match_scoring_dimensions_and_composite():
    """Validates that 5D candidate evaluation returns all 5 dimensions and weighted composite."""
    llm = NvidiaLLMService()
    mock_llm_output = """{
        "verdict": "Shortlisted",
        "rubric_breakdown": {
            "skills_match": 9.0,
            "experience_alignment": 8.0,
            "culture_workplace_fit": 8.5,
            "location_synergy": 9.0,
            "career_growth": 8.5
        },
        "strengths": ["Strong Python/FastAPI experience", "Deep microservices design"],
        "missing_skills": ["Kubernetes production deployment"],
        "improvement_roadmap": [
            "Add CKA certification or mention container orchestration metrics",
            "Quantify API throughput improvements"
        ],
        "justification": "Exceptional match with deep domain overlap."
    }"""

    with patch.object(llm, "a_call_chat", new_callable=AsyncMock, return_value=mock_llm_output):
        res = await llm.a_evaluate_candidate_match(
            resume_text="Senior Python and FastAPI Engineer with 5 years experience.",
            job_title="Senior Backend Engineer",
            company="TechCorp",
            job_description="Looking for Senior Python/FastAPI engineer with distributed systems experience."
        )

        assert "rubric_breakdown" in res
        rubric = res["rubric_breakdown"]
        
        # 5 Dimensions check
        assert rubric["skills_match"] == 9.0
        assert rubric["experience_alignment"] == 8.0
        assert rubric["culture_workplace_fit"] == 8.5
        assert rubric["location_synergy"] == 9.0
        assert rubric["career_growth"] == 8.5

        # Backward compatibility check
        assert "technical_skills" in rubric
        assert "experience_relevance" in rubric

        # Weighted composite score check: 0.30*9 + 0.25*8 + 0.15*8.5 + 0.15*9 + 0.15*8.5 = 2.7 + 2.0 + 1.275 + 1.35 + 1.275 = 8.6
        assert res["composite_score"] == 8.6
        assert res["score_10"] == 8.6
        assert res["verdict"] == "Shortlisted"
        assert len(res["improvement_roadmap"]) >= 2

@pytest.mark.asyncio
async def test_drafter_reviewer_two_pass_pipeline():
    """Validates the two-pass Drafter-Reviewer pipeline."""
    llm = NvidiaLLMService()

    draft_pass1 = "### 🎯 ATS Highlights\n- Built scalable APIs\n\n### ✉️ Cover Letter\nDear Hiring Manager,\nI am applying for the role."
    review_pass2 = """{
        "critique_notes": [
            "Replaced passive wording with quantifiable 40% latency reduction metrics",
            "Targeted distributed systems keywords"
        ],
        "final_refined": "### 🎯 ATS Highlights\n- Engineered high-throughput FastAPI services cutting latency by 40%\n\n### ✉️ Cover Letter\nDear TechCorp Hiring Team,\nI am eager to contribute my distributed systems expertise."
    }"""

    with patch.object(llm, "a_call_chat", new_callable=AsyncMock, side_effect=[draft_pass1, review_pass2]):
        result = await llm.a_generate_tailored_application_dual_pass(
            resume_text="Experienced backend engineer with Python expertise.",
            job_title="Backend Lead",
            company="TechCorp",
            job_description="Seeking a Backend Lead to scale our core APIs."
        )

        assert "draft_v1" in result
        assert "critique_notes" in result
        assert "final_refined" in result
        assert len(result["critique_notes"]) == 2
        assert "FastAPI services" in result["final_refined"]

def test_api_deep_evaluate_endpoint():
    """Validates POST /api/ai/deep-evaluate endpoint returns complete 5D evaluation."""
    mock_llm_output = """{
        "verdict": "Review",
        "rubric_breakdown": {
            "skills_match": 8.0,
            "experience_alignment": 7.0,
            "culture_workplace_fit": 8.0,
            "location_synergy": 8.5,
            "career_growth": 7.5
        },
        "strengths": ["Solid core engineering skills"],
        "missing_skills": ["GraphQL"],
        "improvement_roadmap": ["Build a small GraphQL production prototype"],
        "justification": "Good baseline competency."
    }"""

    with patch("services.llm_service.NvidiaLLMService.a_call_chat", new_callable=AsyncMock, return_value=mock_llm_output):
        resp = client.post("/api/ai/deep-evaluate", json={
            "resume_text": "Software Engineer with React and Node.js skills.",
            "job_title": "Full Stack Engineer",
            "company": "NextGen AI",
            "job_description": "Full stack engineer proficient in React, Node, and GraphQL.",
            "workplace_preference": "Remote",
            "location_preference": "Bengaluru"
        })

        assert resp.status_code == 200
        data = resp.json()
        assert "rubric_breakdown" in data
        assert data["rubric_breakdown"]["skills_match"] == 8.0
        assert data["rubric_breakdown"]["career_growth"] == 7.5
        assert "composite_score" in data
        assert "improvement_roadmap" in data

def test_api_tailor_application_drafter_reviewer_endpoint():
    """Validates POST /api/ai/tailor-application-drafter-reviewer endpoint."""
    draft_v1 = "Draft highlights and letter."
    review_v2 = """{
        "critique_notes": ["Refined metrics and tone"],
        "final_refined": "Final polished letter."
    }"""

    with patch("services.llm_service.NvidiaLLMService.a_call_chat", new_callable=AsyncMock, side_effect=[draft_v1, review_v2]):
        resp = client.post("/api/ai/tailor-application-drafter-reviewer", json={
            "resume_text": "Frontend developer with 3 years in React.",
            "job_title": "Senior Frontend Engineer",
            "company": "Stripe",
            "job_description": "Senior frontend engineer for design systems."
        })

        assert resp.status_code == 200
        data = resp.json()
        assert "draft_v1" in data
        assert "critique_notes" in data
        assert "final_refined" in data
        assert data["final_refined"] == "Final polished letter."

@pytest.mark.asyncio
async def test_5d_fallback_on_llm_error():
    """Validates that if LLM call raises an exception, the fallback preserves 5D structure."""
    llm = NvidiaLLMService()
    with patch.object(llm, "a_call_chat", new_callable=AsyncMock, side_effect=Exception("API Timeout")):
        res = await llm.a_evaluate_candidate_match(
            resume_text="Developer text",
            job_title="Engineer",
            company="Company",
            job_description="Job description"
        )
        assert res["composite_score"] == 7.5
        assert "skills_match" in res["rubric_breakdown"]
        assert "career_growth" in res["rubric_breakdown"]
        assert len(res["improvement_roadmap"]) >= 1
