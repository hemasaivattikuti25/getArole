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


def test_observability_middleware_request_id_and_tracing():
    """Test that X-Request-ID correlation headers are generated and propagated."""
    # 1. Automatic generation
    res1 = client.get("/healthz")
    assert res1.status_code == 200
    assert "x-request-id" in res1.headers or "X-Request-ID" in res1.headers
    req_id1 = res1.headers.get("x-request-id") or res1.headers.get("X-Request-ID")
    assert len(req_id1) > 10

    # 2. Client-provided trace ID propagation
    custom_trace_id = "trace-custom-uuid-987654321"
    res2 = client.get("/healthz", headers={"X-Request-ID": custom_trace_id})
    assert res2.status_code == 200
    assert (res2.headers.get("x-request-id") or res2.headers.get("X-Request-ID")) == custom_trace_id


# ── 8. PII Redaction & Sensitive Field Scrubbing ──────────────────────────────

def test_comprehensive_pii_redaction_and_field_blocking():
    """Test that all 6 PII patterns and blocked fields are redacted from logs."""
    import logging
    from core.logging_config import PIIRedactionFilter

    filt = PIIRedactionFilter()

    # 1. Email Redaction
    r1 = logging.LogRecord("test", logging.INFO, "test.py", 1, "Contact me at candidate.john.doe@company.org for details", (), None)
    filt.filter(r1)
    assert "***@redacted.email" in r1.msg
    assert "candidate.john.doe@company.org" not in r1.msg

    # 2. Phone Redaction
    r2 = logging.LogRecord("test", logging.INFO, "test.py", 1, "Phone number: (415) 555-2671", (), None)
    filt.filter(r2)
    assert "***-PHONE-REDACTED" in r2.msg

    # 3. SSN Redaction
    r3 = logging.LogRecord("test", logging.INFO, "test.py", 1, "SSN: 123-45-6789", (), None)
    filt.filter(r3)
    assert "***-SSN-REDACTED" in r3.msg

    # 4. LinkedIn URL Redaction
    r4 = logging.LogRecord("test", logging.INFO, "test.py", 1, "Profile: https://www.linkedin.com/in/john-doe-tech", (), None)
    filt.filter(r4)
    assert "https://linkedin.com/in/[REDACTED]" in r4.msg

    # 5. Street Address Redaction
    r5 = logging.LogRecord("test", logging.INFO, "test.py", 1, "Home at 1600 Amphitheatre Parkway Boulevard", (), None)
    filt.filter(r5)
    assert "[ADDRESS REDACTED]" in r5.msg

    # 6. Bearer Token Redaction
    r6 = logging.LogRecord("test", logging.INFO, "test.py", 1, "Auth: Bearer secret_jwt_token_payload_xyz==", (), None)
    filt.filter(r6)
    assert "Bearer [REDACTED]" in r6.msg

    # 7. Blocked Fields in extra dictionary
    r7 = logging.LogRecord("test", logging.INFO, "test.py", 1, "Parsing completed", (), None)
    r7.extra = {"resume_text": "Secret confidential experience at Apple", "user_id": "u123"}
    filt.filter(r7)
    assert r7.extra["resume_text"] == "[RESUME_TEXT_BLOCKED]"
    assert r7.extra["user_id"] == "u123"


# ── 9. Service Worker & Cache-Control Policies ───────────────────────────────

def test_service_worker_and_cache_control_headers():
    """Test that /sw.js is served and Cache-Control headers match file hashing state."""
    # 1. Test /sw.js
    res_sw = client.get("/sw.js")
    assert res_sw.status_code == 200
    assert "Service Worker" in res_sw.text
    assert "no-cache" in res_sw.headers.get("cache-control", "")

    # 2. Test API no-store policy
    res_api = client.get("/api/jobs")
    assert res_api.status_code == 200
    assert "no-cache, no-store" in res_api.headers.get("cache-control", "")

    # 3. Test Static fixed-name revalidation policy
    res_static = client.get("/static/js/getarole-core.js")
    assert res_static.status_code == 200
    assert "max-age=3600" in res_static.headers.get("cache-control", "")
    assert "immutable" not in res_static.headers.get("cache-control", "")


# ── 10. Frontend Enterprise Security Headers (OWASP & W3C) ───────────────────

def test_enterprise_frontend_security_headers():
    """Test that enterprise frontend security headers are attached to responses."""
    res = client.get("/dashboard")
    assert res.status_code == 200
    assert res.headers.get("x-frame-options") == "DENY"
    assert res.headers.get("x-content-type-options") == "nosniff"
    assert res.headers.get("referrer-policy") == "strict-origin-when-cross-origin"
    assert "camera=()" in res.headers.get("permissions-policy", "")
    assert "max-age=31536000" in res.headers.get("strict-transport-security", "")
    assert "default-src 'self'" in res.headers.get("content-security-policy", "")
    assert "frame-ancestors 'none'" in res.headers.get("content-security-policy", "")
