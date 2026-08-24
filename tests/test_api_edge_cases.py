import asyncio
import concurrent.futures
from fastapi.testclient import TestClient
from web.server import app

client = TestClient(app)

# ── 1. GET /api/jobs Edge Cases ─────────────────────────────────────────────

def test_get_jobs_empty_query():
    """Test empty string query parameters."""
    response = client.get("/api/jobs?query=&location=")
    assert response.status_code == 200
    assert "jobs" in response.json()

def test_get_jobs_extremely_long_query():
    """Test 10,000+ character string in query parameters."""
    long_str = "a" * 10500
    response = client.get(f"/api/jobs?query={long_str}&location=remote")
    assert response.status_code == 200

import urllib.parse

def test_get_jobs_special_characters_sql_xss_path_traversal():
    """Test XSS tags, SQL injection, null bytes, and path traversal strings."""
    payloads = [
        "<script>alert(1)</script>",
        "' OR '1'='1",
        "'; DROP TABLE jobs; --",
        "NULL\0bytes",
        "../../../../etc/passwd",
        "UNION SELECT * FROM user_profiles --"
    ]
    for p in payloads:
        safe_p = urllib.parse.quote(p)
        response = client.get(f"/api/jobs?query={safe_p}&location={safe_p}")
        assert response.status_code == 200
        assert isinstance(response.json().get("jobs"), list)

def test_get_jobs_negative_and_zero_limits():
    """Test negative numbers and zero for pagination/limit parameters."""
    response_neg = client.get("/api/jobs?limit=-50")
    assert response_neg.status_code in [200, 422]
    
    response_zero = client.get("/api/jobs?limit=0")
    assert response_zero.status_code in [200, 422]


# ── 2. POST /api/match-resume Edge Cases ────────────────────────────────────

def test_match_resume_missing_file():
    """Test request with missing required file field."""
    response = client.post("/api/match-resume")
    assert response.status_code == 422  # Unprocessable Entity validation error

def test_match_resume_empty_file():
    """Test uploading an empty (0-byte) PDF/file."""
    response = client.post(
        "/api/match-resume",
        files={"file": ("empty.pdf", b"", "application/pdf")}
    )
    assert response.status_code in [200, 400, 422, 500]

def test_match_resume_special_char_filename():
    """Test file uploads with XSS and path traversal filenames."""
    bad_filename = "../../../<script>alert('xss')</script>_test.pdf"
    content = b"%PDF-1.4 %Dummy PDF content for testing edge cases\n%%EOF"
    response = client.post(
        "/api/match-resume",
        files={"file": (bad_filename, content, "application/pdf")}
    )
    assert response.status_code in [200, 500]


# ── 3. POST /api/enhance-bullet Edge Cases ──────────────────────────────────

def test_enhance_bullet_empty_payload():
    """Test empty string and missing fields."""
    response = client.post("/api/enhance-bullet", json={"bullet": ""})
    assert response.status_code in [200, 422, 500]

def test_enhance_bullet_extremely_long_string():
    """Test 10,000+ character bullet input."""
    huge_bullet = "Engineered scalable service. " * 400
    response = client.post("/api/enhance-bullet", json={"bullet": huge_bullet})
    assert response.status_code in [200, 500]

def test_enhance_bullet_special_characters():
    """Test injection payload strings in bullet text."""
    payload = "<script>alert('xss')</script>'; DROP TABLE users; -- \0 ../../../"
    response = client.post("/api/enhance-bullet", json={"bullet": payload, "custom_instruction": payload})
    assert response.status_code in [200, 500]

def test_enhance_bullet_extra_unexpected_fields():
    """Test sending extra unexpected JSON keys."""
    response = client.post("/api/enhance-bullet", json={
        "bullet": "Built high-throughput API with FastAPI.",
        "unexpected_key_1": "random_value",
        "unexpected_key_2": 12345
    })
    assert response.status_code in [200, 500]


# ── 4. POST /api/ai/tailor-resume Edge Cases ────────────────────────────────

def test_tailor_resume_null_and_empty_inputs():
    """Test empty job description and null resume data."""
    response = client.post("/api/ai/tailor-resume", json={
        "job_description": "",
        "resume_data": {}
    })
    assert response.status_code == 200

def test_tailor_resume_extremely_large_arrays():
    """Test arrays with 10,000 elements in resume_data."""
    huge_skills = [f"Skill_{i}" for i in range(10000)]
    response = client.post("/api/ai/tailor-resume", json={
        "job_description": "Seeking Python Engineer",
        "resume_data": {"skills": huge_skills}
    })
    assert response.status_code == 200

def test_tailor_resume_invalid_dates_and_special_chars():
    """Test invalid date formats (Feb 29 non-leap year) and special chars."""
    invalid_date_resume = {
        "experience": [
            {
                "company": "<script>alert('corp')</script>",
                "dates": "Feb 29, 2023 - Nov 31, 2023",  # Non-leap year & invalid date
                "bullets": ["'; DROP TABLE exp; --"]
            }
        ]
    }
    response = client.post("/api/ai/tailor-resume", json={
        "job_description": "Senior Software Engineer",
        "resume_data": invalid_date_resume
    })
    assert response.status_code == 200


# ── 5. POST /api/user/profile Edge Cases ─────────────────────────────────────

def test_user_profile_missing_header():
    """Test profile save with missing X-Firebase-UID header."""
    response = client.post("/api/user/profile", json={"name": "Test Candidate"})
    assert response.status_code == 200  # Falls back to guest_user cleanly

def test_user_profile_empty_and_huge_arrays():
    """Test profile update with 0 elements, 1 element, and 10,000 array elements."""
    # 0 elements
    res_0 = client.post("/api/user/profile", json={"skills": [], "experience": []})
    assert res_0.status_code == 200
    
    # 1 element
    res_1 = client.post("/api/user/profile", json={"skills": ["Python"]})
    assert res_1.status_code == 200

    # 10,000 elements
    huge_skills = [f"Skill_{i}" for i in range(10000)]
    res_10k = client.post("/api/user/profile", json={"skills": huge_skills})
    assert res_10k.status_code == 200

def test_user_profile_special_char_xss_header():
    """Test XSS injection in X-Firebase-UID header."""
    xss_uid = "<script>alert('uid')</script>';--\0"
    response = client.post(
        "/api/user/profile",
        headers={"X-Firebase-UID": xss_uid},
        json={"name": "Jane Doe", "email": "jane@example.com"}
    )
    assert response.status_code == 200


# ── 6. Idempotency & Concurrent Duplicate Requests ──────────────────────────

def test_concurrent_duplicate_profile_updates():
    """Test sending 10 simultaneous duplicate requests to test idempotency & concurrency."""
    payload = {"name": "Concurrent Candidate", "headline": "Staff Engineer"}
    headers = {"X-Firebase-UID": "test_concurrent_uid_100"}

    def send_request():
        return client.post("/api/user/profile", headers=headers, json=payload)

    with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
        futures = [executor.submit(send_request) for _ in range(10)]
        results = [f.result() for f in concurrent.futures.as_completed(futures)]

    for res in results:
        assert res.status_code == 200
        assert res.json().get("status") == "ok"


# ── 7. Prometheus Metrics & Kubernetes Health Probes ─────────────────────────

def test_prometheus_metrics_and_health_probes():
    """Test /metrics, /healthz, and /readyz SRE endpoints."""
    res_healthz = client.get("/healthz")
    assert res_healthz.status_code == 200
    assert res_healthz.json().get("status") == "alive"

    res_readyz = client.get("/readyz")
    assert res_readyz.status_code in [200, 503]

    res_metrics = client.get("/metrics")
    assert res_metrics.status_code == 200
    assert "http_request_duration_seconds" in res_metrics.text or "circuit_breaker_state" in res_metrics.text
