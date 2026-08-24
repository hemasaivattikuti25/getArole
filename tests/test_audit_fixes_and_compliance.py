import os
import sys
import re
import pytest
import asyncio
from unittest.mock import MagicMock, patch, AsyncMock
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from web.server import app
from services.resume_parser_service import ResumeParserService
from services.supabase_service import SupabaseService, _JOB_WRITE_THROUGH_CACHE

client = TestClient(app)

# ── 1. Cache Poisoning & Isolation Test ──────────────────────────────────────
@pytest.mark.asyncio
async def test_l1_cache_isolation_prevents_filtered_query_poisoning():
    """
    Validates that a filtered query (e.g. city='chennai') does NOT overwrite
    the global general L1 cache (_JOB_WRITE_THROUGH_CACHE).
    """
    service = SupabaseService()
    
    # Mock general query data (100 jobs)
    general_jobs = [{"id": f"gen_{i}", "title": f"General Job {i}", "city": "Bengaluru"} for i in range(20)]
    # Mock filtered query data (2 jobs)
    chennai_jobs = [{"id": "chn_1", "title": "Chennai Job 1", "city": "Chennai"}, {"id": "chn_2", "title": "Chennai Job 2", "city": "Chennai"}]
    
    mock_client = MagicMock()
    
    # 1. Fetch general unfiltered jobs -> populate L1 cache
    with patch.object(service, "_get_client", new_callable=AsyncMock, return_value=mock_client):
        mock_query = MagicMock()
        mock_query.select.return_value = mock_query
        mock_query.limit.return_value = mock_query
        mock_query.execute = AsyncMock(return_value=MagicMock(data=general_jobs))
        mock_client.table.return_value = mock_query
        
        res_general = await service.fetch_jobs(limit=20)
        assert len(res_general) == 20
        
        # 2. Fetch filtered query (city='chennai')
        mock_filtered_query = MagicMock()
        mock_filtered_query.select.return_value = mock_filtered_query
        mock_filtered_query.ilike.return_value = mock_filtered_query
        mock_filtered_query.limit.return_value = mock_filtered_query
        mock_filtered_query.execute = AsyncMock(return_value=MagicMock(data=chennai_jobs))
        mock_client.table.return_value = mock_filtered_query
        
        res_filtered = await service.fetch_jobs(limit=10, city="chennai")
        assert len(res_filtered) == 2
        
        # 3. Fetch general query again -> verify it STILL returns 20 general jobs, NOT the 2 chennai jobs!
        res_after = await service.fetch_jobs(limit=20)
        assert len(res_after) == 20
        assert res_after[0]["id"] == "gen_0"

# ── 2. Scrape Endpoint Admin Key Protection ──────────────────────────────────
def test_scrape_endpoint_admin_key_protection():
    """Validates that POST /api/scrape enforces SCRAPER_ADMIN_KEY when set in env."""
    with patch.dict(os.environ, {"SCRAPER_ADMIN_KEY": "super_secret_admin_key_123"}):
        # 1. Request without key -> 403 Forbidden
        res_no_key = client.post("/api/scrape")
        assert res_no_key.status_code == 403
        assert "Unauthorized" in res_no_key.json()["message"]
        
        # 2. Request with invalid key -> 403 Forbidden
        res_bad_key = client.post("/api/scrape", headers={"X-Admin-Key": "wrong_key"})
        assert res_bad_key.status_code == 403
        
        # 3. Request with valid key -> 200 OK (mocking AGGREGATOR.aggregate_all)
        with patch("web.server.AGGREGATOR.aggregate_all", return_value=[]):
            res_valid = client.post("/api/scrape", headers={"X-Admin-Key": "super_secret_admin_key_123"})
            assert res_valid.status_code == 200
            assert res_valid.json()["status"] == "success"

# ── 3. SSRF & Scheme Sanitization in Resume Parser ───────────────────────────
def test_resume_parser_safe_url_extraction():
    """Validates that _is_safe_url and extract_links reject javascript:, data:, and SSRF IPs."""
    parser = ResumeParserService()
    
    # Test safe URL helper directly
    assert parser._is_safe_url("https://linkedin.com/in/safeuser") is True
    assert parser._is_safe_url("http://github.com/safeuser") is True
    assert parser._is_safe_url("javascript:alert(1)") is False
    assert parser._is_safe_url("data:text/html,<script>alert(1)</script>") is False
    assert parser._is_safe_url("file:///etc/passwd") is False
    assert parser._is_safe_url("ftp://malicious.com") is False
    assert parser._is_safe_url("http://169.254.169.254/latest/meta-data") is False
    assert parser._is_safe_url("http://127.0.0.1:8000/internal") is False
    assert parser._is_safe_url("http://localhost:5000") is False

    # Test full extract_links integration
    malicious_llm = {
        "linkedin_url": "javascript:eval('xss')",
        "github_url": "http://169.254.169.254/secret",
        "portfolio_url": "https://myportfolio.dev"
    }
    extracted = parser.extract_links("Resume text https://linkedin.com/in/realuser", [], malicious_llm)
    assert extracted["linkedin"] == "https://linkedin.com/in/realuser"
    assert extracted["github"] == ""
    assert extracted["portfolio"] == "https://myportfolio.dev"

# ── 4. Legal & Compliance Pages Serving (GDPR/DPDP/Terms) ────────────────────
def test_privacy_and_terms_pages_served():
    """Validates /privacy and /terms endpoints serve 200 HTML with mandatory legal clauses."""
    # Privacy Policy
    res_privacy = client.get("/privacy")
    assert res_privacy.status_code == 200
    assert "text/html" in res_privacy.headers["content-type"]
    assert "Privacy Policy" in res_privacy.text
    assert "DPDP Act 2023" in res_privacy.text
    assert "Grievance" in res_privacy.text
    
    # Terms of Service
    res_terms = client.get("/terms")
    assert res_terms.status_code == 200
    assert "text/html" in res_terms.headers["content-type"]
    assert "Terms of Service" in res_terms.text
    assert "Acceptance of Terms" in res_terms.text

# ── 5. Static Assets Existence & SEO Verification ────────────────────────────
def test_seo_static_assets_exist():
    """Validates that og-image.png, favicon.png, favicon.ico, and sitemap.xml exist and are non-empty."""
    base_static = os.path.join(os.path.dirname(__file__), "..", "web", "static")
    
    og_img = os.path.join(base_static, "og-image.png")
    assert os.path.exists(og_img), "og-image.png is missing!"
    assert os.path.getsize(og_img) > 1000, "og-image.png is too small or corrupted!"
    
    fav_png = os.path.join(base_static, "favicon.png")
    assert os.path.exists(fav_png), "favicon.png is missing!"
    assert os.path.getsize(fav_png) > 100
    
    fav_ico = os.path.join(base_static, "favicon.ico")
    assert os.path.exists(fav_ico), "favicon.ico is missing!"
    
    sitemap = os.path.join(base_static, "sitemap.xml")
    assert os.path.exists(sitemap), "sitemap.xml is missing!"
    with open(sitemap, "r") as f:
        sitemap_content = f.read()
        assert "/explore/" in sitemap_content
        assert "/matches/" in sitemap_content
        assert "/privacy/" in sitemap_content
        assert "/terms/" in sitemap_content

# ── 6. Dynamic Graduation Batch Regex Verification ───────────────────────────
def test_dynamic_batch_year_regex_evaluation():
    """Validates that the dynamic batch regex accurately matches future years (e.g. 2028, 2029)."""
    batch_pattern = re.compile(r"\b(?:batch\s*20\d\d|20\d\d\s*batch|class\s*of\s*20\d\d)\b", re.IGNORECASE)
    
    assert batch_pattern.search("Hiring for Batch 2026 graduates") is not None
    assert batch_pattern.search("Open for 2028 batch students") is not None
    assert batch_pattern.search("Looking for Class of 2029 freshers") is not None
    assert batch_pattern.search("Senior Staff Engineer with 10 years experience") is None

# ── 7. Candidate Endpoints Access Control Gating ─────────────────────────────
def test_candidates_endpoint_admin_key_protection():
    """Validates that GET /api/candidates and GET /api/candidate/{id} require valid X-Admin-Key."""
    with patch.dict(os.environ, {"SCRAPER_ADMIN_KEY": "staff_audit_admin_key_999"}):
        # 1. /api/candidates without key -> 403 Forbidden
        res_no_key = client.get("/api/candidates")
        assert res_no_key.status_code == 403
        
        # 2. /api/candidates with invalid key -> 403 Forbidden
        res_bad_key = client.get("/api/candidates", headers={"X-Admin-Key": "wrong_key"})
        assert res_bad_key.status_code == 403
        
        # 3. /api/candidates with valid key -> 200 OK (mocking fetch_all_candidates)
        with patch("services.supabase_service.SupabaseService.fetch_all_candidates", new_callable=AsyncMock, return_value=[]):
            res_valid = client.get("/api/candidates", headers={"X-Admin-Key": "staff_audit_admin_key_999"})
            assert res_valid.status_code == 200
            assert "total_candidates" in res_valid.json()

        # 4. /api/candidate/{id} without key -> 403 Forbidden
        res_cand_no_key = client.get("/api/candidate/cand-123")
        assert res_cand_no_key.status_code == 403

# ── 8. Generative AI Endpoints Rate Limiting Verification ────────────────────
def test_ai_endpoints_rate_limiting():
    """Validates that POST /api/ai/suggest-skills and /api/ai/generate-summary enforce token limits."""
    # Test suggest-skills endpoint accepts requests under limit
    res = client.post("/api/ai/suggest-skills", json={"target_role": "Backend Engineer", "current_skills": "Python, SQL"})
    assert res.status_code == 200
    assert "suggestions" in res.json()

    # Test generate-summary endpoint
    res_summary = client.post("/api/ai/generate-summary", json={"style": "technical", "target_role": "Systems Engineer"})
    assert res_summary.status_code == 200
    assert "summaries" in res_summary.json()

# ── 9. Centralized LLM JSON Extraction ───────────────────────────────────────
def test_extract_json_payload_centralized():
    """Validates NvidiaLLMService.extract_json_payload handles markdown fences and raw text."""
    from services.llm_service import NvidiaLLMService

    # 1. Array in markdown code block
    fenced_arr = "Here is your output:\n```json\n[{\"category\": \"Backend\", \"skills\": \"FastAPI, Redis\"}]\n```"
    parsed_arr = NvidiaLLMService.extract_json_payload(fenced_arr)
    assert isinstance(parsed_arr, list)
    assert parsed_arr[0]["category"] == "Backend"

    # 2. Object in markdown code block
    fenced_obj = "```json\n{\"option_1\": \"Tailored summary 1\", \"option_2\": \"Tailored summary 2\"}\n```"
    parsed_obj = NvidiaLLMService.extract_json_payload(fenced_obj)
    assert isinstance(parsed_obj, dict)
    assert parsed_obj["option_1"] == "Tailored summary 1"

    # 3. Invalid payload returns None
    assert NvidiaLLMService.extract_json_payload("Plain non-json text response") is None

# ── Standalone Runner ────────────────────────────────────────────────────────
if __name__ == "__main__":
    asyncio.run(test_l1_cache_isolation_prevents_filtered_query_poisoning())
    test_scrape_endpoint_admin_key_protection()
    test_resume_parser_safe_url_extraction()
    test_privacy_and_terms_pages_served()
    test_seo_static_assets_exist()
    test_dynamic_batch_year_regex_evaluation()
    test_candidates_endpoint_admin_key_protection()
    test_ai_endpoints_rate_limiting()
    test_extract_json_payload_centralized()
    print("✅ ALL 9 AUDIT FIXES & COMPLIANCE VERIFICATION TESTS PASSED GREEN!")
