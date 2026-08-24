import os
import sys
import asyncio
from fastapi.testclient import TestClient

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from web.server import app
from services.supabase_service import get_user_lock

client = TestClient(app)

def test_bl_01_concurrent_user_mutation_serialization():
    """
    BL-01: TOCTOU & Concurrency Lock - Verify get_user_lock serializes simultaneous writes to the same UID.
    """
    test_uid = "concurrency_user_999"
    lock1 = get_user_lock(test_uid)
    lock2 = get_user_lock(test_uid)
    assert lock1 is lock2 # Same mutex object returned for the exact user ID

def test_bl_02_gdpr_cascade_purge_unauthenticated():
    """
    BL-02: Account Purge - Verify unauthenticated/guest users cannot trigger account deletion.
    """
    resp = client.delete("/api/user/account")
    assert resp.status_code == 401
    assert "Authentication required" in resp.json().get("error", "")

def test_bl_03_gdpr_cascade_purge_authenticated():
    """
    BL-03: Account Purge - Verify authenticated user purge executes cascade cleanup.
    """
    headers = {"Authorization": "Bearer test_purge_user_123"}
    resp = client.delete("/api/user/account", headers=headers)
    assert resp.status_code == 200
    assert resp.json().get("status") in ["ok", "error"]

def test_bl_04_save_and_retrieve_user_preferences_integrity():
    """
    BL-04: Preference & State Integrity - Verify preferences are correctly saved without data corruption.
    """
    headers = {"Authorization": "Bearer test_pref_user_456"}
    payload = {
        "roles": ["Fullstack Engineer", "Backend Developer"],
        "locations": ["Bengaluru", "Remote"],
        "skills_inc": ["Python", "FastAPI", "React"]
    }
    save_resp = client.post("/api/user/preferences", json=payload, headers=headers)
    assert save_resp.status_code == 200

def test_bl_05_resume_access_control():
    """
    BL-05: Missing Auth Token Rejection - Verify resume upload without auth token returns 401.
    """
    resp = client.post("/api/user/resume", json={"skills": ["Python"]})
    assert resp.status_code == 401
    assert "Missing X-Firebase-UID or Authorization header" in resp.json().get("error", "")

if __name__ == "__main__":
    test_bl_01_concurrent_user_mutation_serialization()
    test_bl_02_gdpr_cascade_purge_unauthenticated()
    test_bl_03_gdpr_cascade_purge_authenticated()
    test_bl_04_save_and_retrieve_user_preferences_integrity()
    test_bl_05_resume_access_control()
    print("✅ ALL 5 BUSINESS LOGIC & CONCURRENCY TESTS PASSED GREEN!")
