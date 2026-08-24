import os
import pymupdf as fitz  # PyMuPDF
import numpy as np
from typing import List, Tuple, Dict, Any
from fastembed import TextEmbedding
from .models import JobListing, CandidateProfile

import tempfile

class ResumeMatcher:
    def __init__(self, model_name: str = "BAAI/bge-small-en-v1.5"):
        # Fast, lightweight ONNX embedding model (runs completely local on CPU)
        default_cache = os.path.join(tempfile.gettempdir(), "fastembed_cache")
        cache_dir = os.environ.get("FASTEMBED_CACHE_DIR", default_cache)
        try:
            self.embed_model = TextEmbedding(model_name=model_name, cache_dir=cache_dir)
        except Exception:
            self.embed_model = TextEmbedding(model_name=model_name)

    def extract_text_from_pdf(self, pdf_path: str) -> str:
        if not os.path.exists(pdf_path):
            raise FileNotFoundError(f"Resume PDF not found at: {pdf_path}")
        
        full_text = []
        with fitz.open(pdf_path) as doc:
            for page in doc:
                full_text.append(page.get_text())
        return "\n".join(full_text).strip()

    def parse_profile(self, pdf_path: str) -> CandidateProfile:
        text = self.extract_text_from_pdf(pdf_path)
        
        # Global multi-domain skill taxonomy (Backend, Frontend, AI/ML, Cloud/DevOps, Mobile, Data, Systems)
        common_tech_skills = [
            # Languages
            "python", "java", "c++", "c#", "c", "rust", "golang", "go", "typescript", "javascript",
            "kotlin", "swift", "php", "ruby", "scala", "sql", "r", "dart", "bash", "shell",
            # Frontend & Mobile
            "react", "react.js", "next.js", "vue", "vue.js", "angular", "svelte", "react native",
            "flutter", "ios", "android", "tailwind css", "tailwind", "html5", "css3", "redux", "webpack", "vite",
            # Backend & APIs
            "fastapi", "flask", "django", "node.js", "express", "express.js", "spring boot", "spring",
            "asp.net", ".net", "nest.js", "graphql", "rest api", "restful apis", "grpc", "microservices",
            # AI, ML, Data & LLMs
            "pytorch", "tensorflow", "keras", "scikit-learn", "langchain", "llamaindex", "rag",
            "hugging face", "transformers", "nlp", "computer vision", "llm", "large language models",
            "pandas", "numpy", "apache spark", "spark", "kafka", "apache kafka", "airflow", "snowflake", "databricks",
            # Databases & Vector DBs
            "postgresql", "postgres", "mysql", "mongodb", "redis", "cassandra", "dynamodb",
            "qdrant", "pinecone", "milvus", "chromadb", "pgvector", "elasticsearch", "supabase", "sqlite",
            # Cloud, DevOps & Infrastructure
            "aws", "amazon web services", "gcp", "google cloud", "azure", "docker", "kubernetes", "k8s",
            "terraform", "ansible", "ci/cd", "github actions", "gitlab ci", "linux", "nginx", "prometheus", "grafana",
            # Architecture & Security
            "distributed systems", "high availability", "system design", "zero-trust", "jwt", "oauth",
            "cybersecurity", "rbac", "agile", "scrum", "git", "unit testing"
        ]
        
        lower_text = text.lower()
        extracted_skills = [s for s in common_tech_skills if s in lower_text]
        
        # Deduplicate and sort
        extracted_skills = sorted(list(set(extracted_skills)))
        
        return CandidateProfile(
            name="Candidate",
            skills=extracted_skills,
            raw_text=text
        )

    def compute_similarity(self, vec1: np.ndarray, vec2: np.ndarray) -> float:
        dot_product = np.dot(vec1, vec2)
        norm1 = np.linalg.norm(vec1)
        norm2 = np.linalg.norm(vec2)
        if norm1 == 0 or norm2 == 0:
            return 0.0
        return float(dot_product / (norm1 * norm2))

    def rank_jobs_by_fit(self, resume_text: str, jobs: List[JobListing]) -> List[JobListing]:
        if not jobs:
            return []
        
        # Generate resume embedding
        resume_emb = list(self.embed_model.embed([resume_text]))[0]
        
        # Prepare job texts
        job_texts = []
        for j in jobs:
            j_text = f"{j.title} at {j.company}. Location: {j.location}. {j.description}"
            job_texts.append(j_text[:1000])  # first 1000 chars is sufficient for high accuracy
            
        # Batch embed all jobs in one fast local pass
        job_embs = list(self.embed_model.embed(job_texts))
        
        lower_resume = resume_text.lower()
        
        ranked_jobs = []
        for i, job in enumerate(jobs):
            sim = self.compute_similarity(resume_emb, job_embs[i])
            # Scale to 0-100% score (bge-small cosine values typically range 0.4 to 0.9 for relevant texts)
            fit_pct = round(max(0.0, min(100.0, ((sim - 0.3) / 0.6) * 100)), 1)
            
            # Extract matching & missing keywords
            import re
            job_words = set(re.findall(r"\b[a-zA-Z0-9_\-\.]+\b", f"{job.title} {job.description}".lower()))
            resume_words = set(re.findall(r"\b[a-zA-Z0-9_\-\.]+\b", lower_resume))
            tech_keywords = [
                "python", "fastapi", "django", "react", "next.js", "sql", "postgresql",
                "mongodb", "docker", "aws", "qdrant", "rag", "onnx", "linux", "git", "jwt", "kubernetes"
            ]
            
            matched = [k for k in tech_keywords if k in job_words and k in resume_words]
            missing = [k for k in tech_keywords if k in job_words and k not in resume_words]
            
            job.fit_score = fit_pct
            job.matched_skills = matched
            job.missing_skills = missing
            ranked_jobs.append(job)
            
        # Sort descending by fit score
        ranked_jobs.sort(key=lambda x: x.fit_score or 0.0, reverse=True)
        return ranked_jobs
