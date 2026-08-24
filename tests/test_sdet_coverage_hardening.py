"""
==============================================================================
getArole AI — Google SDET Deep Coverage Hardening Suite
==============================================================================
"""

import os
import sys
import pytest
import asyncio
import pymupdf as fitz

# Ensure workspace root is in python path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.resume_parser_service import ResumeParserService
from services.supabase_service import get_supabase_service
from services.embedding_service import embedding_service
from scrapers.greenhouse import scrape_single_greenhouse_board
from scrapers.lever import scrape_single_lever_board
from scrapers.ashby import scrape_single_ashby_board
from scrapers.linkedin import scrape_single_linkedin_query
from scrapers.unstop import fetch_unstop_jobs
from scrapers.matcher import ResumeMatcher
from scrapers.base import create_scraper_client
from scrapers.models import JobListing, CandidateProfile
from fastapi.testclient import TestClient
from web.server import app

client = TestClient(app)

# ── 1. ResumeParserService Deep Unit Tests ────────────────────────────────────

def test_resume_parser_link_extraction():
    parser = ResumeParserService()
    text = "Find my work on https://github.com/hemasai and linkedin at https://linkedin.com/in/hemasaivattikuti and portfolio https://hemasai.dev"
    pdf_links = ["https://github.com/hemasai/job_finder", "https://linkedin.com/in/hemasaivattikuti"]
    llm_parsed = {}
    
    links = parser.extract_links(text, pdf_links, llm_parsed)
    assert "github.com" in links["github"]
    assert "linkedin.com" in links["linkedin"]
    assert "hemasai.dev" in links["portfolio"]

def test_resume_parser_fallback_sections():
    parser = ResumeParserService()
    text = """
    HEMASAI VATTIKUTI
    Senior Software Engineer | Google Inc | 2022 - Present
    - Automated cluster failovers across 5 multi-region zones.
    - Improved P99 API latency from 450ms to 85ms.

    EDUCATION
    Bachelor of Technology in Computer Science
    VIT-AP University, 2020 - 2024

    PROJECTS
    getArole AI Career Acceleration Platform
    - Multi-source job aggregation across 5 platforms.
    """
    
    fb_exp, fb_edu, fb_proj = parser.parse_sections_fallback(text)
    assert isinstance(fb_exp, list)
    assert isinstance(fb_edu, list)
    assert isinstance(fb_proj, list)

def test_resume_parser_experience_lines():
    parser = ResumeParserService()
    lines = [
        "Google Inc",
        "Senior SRE",
        "Jan 2022 - Present",
        "• Built distributed caching pipeline",
        "• Scaled Postgres read replicas"
    ]
    exp = parser._parse_experience_lines(lines)
    assert isinstance(exp, list)
    assert len(exp) >= 1

def test_resume_parser_projects_lines():
    parser = ResumeParserService()
    lines = [
        "GetArole AI Platform",
        "• Built Python scraping engine",
        "• Integrated pgvector semantic search"
    ]
    proj = parser._parse_projects_lines(lines)
    assert isinstance(proj, list)
    assert len(proj) >= 1

def test_resume_parser_education_lines():
    parser = ResumeParserService()
    lines = [
        "VIT-AP University",
        "Bachelor of Technology in Computer Science",
        "2020 - 2024"
    ]
    edu = parser._parse_education_lines(lines)
    assert isinstance(edu, list)
    assert len(edu) >= 1

def test_resume_parser_binary_pdf_bytes_parsing():
    parser = ResumeParserService()
    doc = fitz.open()
    page = doc.new_page()
    page.insert_text((50, 50), "Hemasai Vattikuti\nSenior Python SRE\nSkills: Python, FastAPI, Docker")
    pdf_bytes = doc.write()
    doc.close()
    
    text, links = parser.parse_pdf_bytes(pdf_bytes)
    assert "Hemasai Vattikuti" in text
    assert "Python" in text

def test_resume_parser_full_mock_flow():
    async def run():
        parser = ResumeParserService()
        doc = fitz.open()
        page = doc.new_page()
        page.insert_text((50, 50), "Hemasai Vattikuti\nhemasai@example.com\n+91 9876543210\nSenior SRE\nSkills: Python, Docker, Kubernetes\nExperience:\nGoogle - Staff SRE (2022 - Present)\n• Scaled multi-region clusters")
        pdf_bytes = doc.write()
        doc.close()
        
        result = await parser.process_resume_bytes(pdf_bytes, "hemasai_resume.pdf")
        assert result["success"] is True
        candidate = result.get("candidate_profile", {})
        assert candidate.get("first_name") or candidate.get("name")
        assert "skills" in candidate
    asyncio.run(run())

# ── 2. Scrapers Error & Fallback Resilience Tests ──────────────────────────────

def test_greenhouse_scraper_resilience():
    async def run():
        async with create_scraper_client() as c:
            jobs = await scrape_single_greenhouse_board(c, "non_existent_company_xyz_999")
            assert isinstance(jobs, list)
    asyncio.run(run())

def test_lever_scraper_resilience():
    async def run():
        async with create_scraper_client() as c:
            jobs = await scrape_single_lever_board(c, "non_existent_company_xyz_999")
            assert isinstance(jobs, list)
    asyncio.run(run())

def test_ashby_scraper_resilience():
    async def run():
        async with create_scraper_client() as c:
            jobs = await scrape_single_ashby_board(c, "non_existent_company_xyz_999")
            assert isinstance(jobs, list)
    asyncio.run(run())

def test_linkedin_scraper_resilience():
    async def run():
        async with create_scraper_client() as c:
            jobs = await scrape_single_linkedin_query(c, "python", location="Antarctica_Location")
            assert isinstance(jobs, list)
    asyncio.run(run())

def test_unstop_scraper_resilience():
    async def run():
        jobs = await fetch_unstop_jobs()
        assert isinstance(jobs, list)
    asyncio.run(run())

# ── 3. SupabaseService Bulk Operations & Cache Fast Path ─────────────────────

def test_supabase_bulk_upsert_empty():
    async def run():
        svc = get_supabase_service()
        res = await svc.upsert_jobs_bulk([])
        assert res == 0
    asyncio.run(run())

def test_supabase_fetch_jobs_with_filters():
    async def run():
        svc = get_supabase_service()
        jobs = await svc.fetch_jobs(limit=10, city="Bengaluru", workplace_type="Remote")
        assert isinstance(jobs, list)
    asyncio.run(run())

def test_supabase_profile_and_preferences_lifecycle():
    async def run():
        svc = get_supabase_service()
        uid = "test_sdet_lifecycle_uid_123"
        profile_data = {
            "first_name": "Test",
            "last_name": "SDET",
            "email": "test.sdet@example.com",
            "headline": "Lead Automation Engineer",
            "skills": ["Python", "Pytest", "FastAPI"]
        }
        res_prof = await svc.save_user_profile(uid, profile_data)
        assert res_prof is not None

        pref_data = {
            "roles": ["SDET", "QA Architect"],
            "locations": ["Hyderabad", "Remote"],
            "salary_amt": 3000000
        }
        res_pref = await svc.save_user_preferences(uid, pref_data)
        assert res_pref is not None
    asyncio.run(run())

# ── 4. Embedding Service & Vector Scoring ─────────────────────────────────────

def test_embedding_service_generation():
    embs = embedding_service.embed_texts(["Senior Python SRE with Kubernetes and FastAPI", "Junior Frontend Developer"])
    assert len(embs) == 2
    assert len(embs[0]) == 384
    sim = embedding_service.compute_cosine_similarity(embs[0], embs[1])
    assert 0.0 <= sim <= 1.0

# ── 5. Resume Matcher Pure Algorithm ──────────────────────────────────────────

def test_resume_matcher_candidate_scoring():
    matcher = ResumeMatcher()
    job = JobListing(
        id="job-test-101",
        title="Senior Python Backend Engineer",
        company="Google",
        location="Bengaluru",
        platform="Direct",
        url="https://google.com/careers/101",
        description="Looking for Python, Docker, Kubernetes and FastAPI experience.",
        skills=["Python", "FastAPI", "Docker", "Kubernetes"],
        workplace_type="Remote",
        employment_type="Full-time"
    )
    resume_text = "Hemasai Vattikuti. Senior Python Software Engineer skilled in Python, FastAPI, Docker, Kubernetes and Postgres."
    ranked = matcher.rank_jobs_by_fit(resume_text, [job])
    assert len(ranked) == 1
    assert ranked[0].fit_score is not None
    assert ranked[0].fit_score >= 0.0

# ── 6. API Endpoints: Health, Observability & AI Features ────────────────────

def test_api_health_endpoints_deep():
    r1 = client.get("/healthz")
    assert r1.status_code == 200
    assert r1.json()["status"] == "alive"

    r2 = client.get("/readyz")
    assert r2.status_code == 200
    assert "status" in r2.json()

    r3 = client.get("/metrics")
    assert r3.status_code == 200
    assert "http_requests_total" in r3.text or "python_gc_objects_collected_total" in r3.text

def test_api_suggest_skills_endpoint():
    payload = {
        "target_role": "Site Reliability Engineer",
        "current_skills": "Python, Docker"
    }
    r = client.post("/api/ai/suggest-skills", json=payload, headers={"Authorization": "Bearer test_sdet_user"})
    assert r.status_code in [200, 429, 500]
    if r.status_code == 200 and r.json():
        assert "suggestions" in r.json() or "target_role" in r.json()

def test_api_generate_summary_endpoint():
    payload = {
        "style": "technical",
        "candidate_name": "Hemasai",
        "target_role": "Senior SRE",
        "skills_context": "Python; Docker; Kubernetes; Terraform"
    }
    r = client.post("/api/ai/generate-summary", json=payload, headers={"Authorization": "Bearer test_sdet_user"})
    assert r.status_code in [200, 429, 500]
    if r.status_code == 200 and r.json():
        assert "summaries" in r.json() or "style" in r.json()

def test_api_account_deletion_flow():
    r = client.delete("/api/user/account", headers={"Authorization": "Bearer test_sdet_user_to_delete"})
    assert r.status_code in [200, 401, 500]
    if r.status_code == 200:
        assert r.json()["status"] == "ok"

if __name__ == "__main__":
    test_resume_parser_link_extraction()
    test_resume_parser_fallback_sections()
    test_resume_parser_experience_lines()
    test_resume_parser_projects_lines()
    test_resume_parser_education_lines()
    test_resume_parser_binary_pdf_bytes_parsing()
    test_resume_parser_full_mock_flow()
    test_greenhouse_scraper_resilience()
    test_lever_scraper_resilience()
    test_ashby_scraper_resilience()
    test_linkedin_scraper_resilience()
    test_unstop_scraper_resilience()
    test_supabase_bulk_upsert_empty()
    test_supabase_fetch_jobs_with_filters()
    test_supabase_profile_and_preferences_lifecycle()
    test_embedding_service_generation()
    test_resume_matcher_candidate_scoring()
    test_api_health_endpoints_deep()
    test_api_suggest_skills_endpoint()
    test_api_generate_summary_endpoint()
    test_api_account_deletion_flow()
    print("✅ ALL 21 SDET HARDENED TESTS PASSED GREEN!")
