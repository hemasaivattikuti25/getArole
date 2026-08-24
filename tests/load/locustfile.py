"""
==============================================================================
getArole AI — Google SRE Locust Load Testing Engine
==============================================================================

To Run with Web UI:
    locust -f tests/load/locustfile.py --host=http://localhost:8000

To Run Headless CLI (1000 users ramped up over 10m):
    locust -f tests/load/locustfile.py --headless -u 1000 -r 10 --run-time 10m --host=http://localhost:8000 --html=load_test_report.html
"""

import random
import uuid
from locust import HttpUser, task, between, tag

class CandidateUser(HttpUser):
    # Simulates realistic human think time between 1 and 3 seconds
    wait_time = between(1.0, 3.0)

    def on_start(self):
        """Generates a dedicated session token for each simulated user."""
        self.uid = f"locust_user_{uuid.uuid4().hex[:10]}"
        self.auth_headers = {
            "Authorization": f"Bearer {self.uid}",
            "Content-Type": "application/json"
        }

    @tag('baseline', 'homepage')
    @task(5)
    def view_homepage(self):
        """Task 1: Baseline Homepage & Static Asset Fetch"""
        with self.client.get("/", catch_response=True) as resp:
            if resp.status_code == 200:
                resp.success()
            else:
                resp.failure(f"Homepage failed with status {resp.status_code}")

    @tag('heavy_read', 'search')
    @task(10)
    def search_jobs(self):
        """Task 2: Heavy Read API Queries with Keyword and Workplace Filters"""
        keywords = ["python", "react", "fastapi", "machine learning", "backend", "fullstack", "devops"]
        locations = ["Bengaluru", "Remote", "Hyderabad", "Chennai", "Pune"]
        q = random.choice(keywords)
        loc = random.choice(locations)
        
        with self.client.get(f"/api/jobs?query={q}&location={loc}&limit=20", catch_response=True) as resp:
            if resp.status_code == 200:
                resp.success()
            else:
                resp.failure(f"Search query failed with status {resp.status_code}")

    @tag('heavy_write', 'forms')
    @task(3)
    def update_profile_and_preferences(self):
        """Task 3: Heavy Write User Profile & Career Preferences Forms"""
        profile_data = {
            "first": "Load",
            "last": "Tester",
            "headline": "Fullstack Python Performance Engineer",
            "skills": ["Python", "FastAPI", "React", "PostgreSQL", "Docker", "SRE"],
            "experience": [
                {"company": "Google", "title": "Staff Site Reliability Engineer", "duration": "4 years"}
            ]
        }
        with self.client.post("/api/user/profile", json=profile_data, headers=self.auth_headers, catch_response=True) as resp:
            if resp.status_code == 200:
                resp.success()
            else:
                resp.failure(f"Profile update failed with status {resp.status_code}")

    @tag('ai_gen')
    @task(1)
    def enhance_resume_bullet(self):
        """Task 4: AI Resume Bullet Enhancement with Rate Limit Handling"""
        bullets = [
            "Built scalable microservices in Python.",
            "Optimized SQL database query latency by 40%.",
            "Led frontend React migration for 1M daily active users."
        ]
        payload = {
            "bullet": random.choice(bullets),
            "target_role": "Senior Software Engineer",
            "context": "Cloud Infrastructure"
        }
        with self.client.post("/api/enhance-bullet", json=payload, headers=self.auth_headers, catch_response=True) as resp:
            if resp.status_code in [200, 429]:
                # 429 is expected and handled gracefully by rate limiter
                resp.success()
            else:
                resp.failure(f"Bullet enhancer failed with unexpected status {resp.status_code}")
