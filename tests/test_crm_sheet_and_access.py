import os
import sys
from unittest.mock import patch, AsyncMock
from fastapi.testclient import TestClient

# Ensure workspace root is in sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from web.server import app

client = TestClient(app)

def test_crm_unauthorized_access_rejected():
    """Validates that unauthorized callers receive 403 Forbidden when requesting CRM data."""
    # 1. Anonymous request without headers
    res_anon = client.get("/api/admin/crm/users")
    assert res_anon.status_code == 403
    assert "Access Denied" in res_anon.json()["detail"]

    # 2. Non-admin email
    res_fake = client.get("/api/admin/crm/users", headers={"X-User-Email": "unauthorized_user@gmail.com"})
    assert res_fake.status_code == 403

    # 3. Unauthorized CSV export attempt
    res_csv = client.get("/api/admin/crm/export.csv", headers={"X-User-Email": "other_person@gmail.com"})
    assert res_csv.status_code == 403

def test_crm_authorized_owner_access_granted():
    """Validates that hemasaivattikuti2727@gmail.com is granted access to the CRM endpoints."""
    mock_users = [
        {
            "id": "usr_001",
            "firebase_uid": "usr_001",
            "name": "Jane Developer",
            "email": "jane@example.com",
            "phone": "+91 9876543210",
            "location": "Bengaluru",
            "headline": "Senior Fullstack Engineer",
            "roles": ["Full Stack Developer"],
            "target_role": "Full Stack Developer",
            "skills": ["Python", "FastAPI", "React"],
            "experience": [{"role": "Senior Dev", "company": "Acme Corp"}],
            "education": [{"degree": "B.Tech Computer Science"}],
            "projects": [{"title": "Job Aggregator"}],
            "has_resume": True,
            "resume_filename": "jane_resume.pdf",
            "resume_raw_text": "Experienced Python and React developer.",
            "updated_at": "2026-08-31T12:00:00Z"
        }
    ]

    with patch("services.supabase_service.SupabaseService.fetch_crm_all_users", new_callable=AsyncMock, return_value=mock_users):
        # 1. Header auth
        res_header = client.get("/api/admin/crm/users", headers={"X-User-Email": "hemasaivattikuti2727@gmail.com"})
        assert res_header.status_code == 200
        data = res_header.json()
        assert data["status"] == "ok"
        assert data["total_users"] == 1
        assert data["users"][0]["name"] == "Jane Developer"
        assert data["metrics"]["resumes_count"] == 1

        # 2. Query param auth
        res_query = client.get("/api/admin/crm/users?email=hemasaivattikuti2727@gmail.com")
        assert res_query.status_code == 200

def test_crm_csv_export_endpoint():
    """Validates the CSV export endpoint formats and streams data properly."""
    mock_users = [
        {
            "id": "cand_1",
            "firebase_uid": "cand_1",
            "name": "Test Candidate",
            "email": "candidate@test.com",
            "phone": "+91 9999999999",
            "location": "Hyderabad",
            "headline": "Backend Engineer",
            "target_role": "Backend Engineer",
            "skills": ["Python", "Docker"],
            "experience": [{}],
            "education": [{}],
            "projects": [],
            "has_resume": True,
            "resume_filename": "test.pdf",
            "linkedin": "https://linkedin.com/in/test",
            "github": "https://github.com/test",
            "portfolio": "",
            "updated_at": "2026-08-31T10:00:00Z",
            "resume_raw_text": "Python backend engineer with Docker skills."
        }
    ]

    with patch("services.supabase_service.SupabaseService.fetch_crm_all_users", new_callable=AsyncMock, return_value=mock_users):
        res = client.get("/api/admin/crm/export.csv", headers={"X-User-Email": "hemasaivattikuti2727@gmail.com"})
        assert res.status_code == 200
        assert res.headers["content-type"].startswith("text/csv")
        assert "getArole_CRM_Candidates_Export.csv" in res.headers["content-disposition"]
        csv_text = res.content.decode("utf-8-sig")
        assert "Candidate ID,Name,Email,Phone,Location" in csv_text
        assert "Test Candidate" in csv_text
        assert "candidate@test.com" in csv_text

def test_crm_html_route_serving():
    """Validates that /crm and /admin/crm routes return 200 OK with HTML content."""
    res_crm = client.get("/crm")
    assert res_crm.status_code == 200
    assert "getArole CRM Sheet" in res_crm.text

    res_admin = client.get("/admin/crm/")
    assert res_admin.status_code == 200
    assert "hemasaivattikuti2727@gmail.com" in res_admin.text
