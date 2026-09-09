import os
import re
import pymupdf  # Fast PDF parsing
from domain.models import CandidateProfile

COMMON_TECH_SKILLS = [
    "python", "fastapi", "django", "flask", "javascript", "typescript",
    "react", "next.js", "node.js", "sql", "postgresql", "mongodb",
    "redis", "qdrant", "chroma", "docker", "kubernetes", "aws", "gcp",
    "azure", "git", "linux", "onnx", "fastembed", "rag", "langchain",
    "llamaindex", "machine learning", "deep learning", "nlp", "rest api",
    "graphql", "jwt", "system design", "microservices", "c++", "java"
]

class ParserService:
    @staticmethod
    def extract_text_from_pdf(pdf_path: str) -> str:
        if not os.path.exists(pdf_path):
            raise FileNotFoundError(f"File not found: {pdf_path}")
            
        with pymupdf.open(pdf_path) as doc:
            pages_text = [page.get_text() for page in doc]
        return "\n".join(pages_text).strip()

    @staticmethod
    def parse_candidate_profile(pdf_path: str) -> CandidateProfile:
        text = ParserService.extract_text_from_pdf(pdf_path)
        lower_text = text.lower()
        
        # Boundary-safe skill extraction
        extracted_skills = []
        for s in COMMON_TECH_SKILLS:
            if s in ("c", "r"):
                pattern = rf"(?<![a-zA-Z0-9_#+]){s}(?![a-zA-Z0-9_#+])"
            elif s == "c++":
                pattern = r"(?<![a-zA-Z0-9_])c\+\+(?![a-zA-Z0-9_])"
            elif s == "c#":
                pattern = r"(?<![a-zA-Z0-9_])c#(?![a-zA-Z0-9_])"
            elif s == ".net":
                pattern = r"(?<![a-zA-Z0-9_])\.net(?![a-zA-Z0-9_])"
            else:
                escaped = re.escape(s)
                pattern = rf"(?<![a-zA-Z0-9_]){escaped}(?![a-zA-Z0-9_])"
            if re.search(pattern, lower_text):
                extracted_skills.append(s)
        
        # Name heuristic: skip generic headers like 'CURRICULUM VITAE', 'RESUME', etc.
        lines = [line.strip() for line in text.split("\n") if line.strip()]
        GENERIC_HEADERS = {
            "curriculum vitae", "resume", "cv", "page 1", "page 2", "personal details",
            "contact information", "profile", "summary", "about me", "bio"
        }
        name = "Candidate"
        for line in lines[:8]:
            clean_l = re.sub(r'[^a-zA-Z\s\.]', '', line).strip()
            lower_l = clean_l.lower()
            if (
                clean_l
                and 3 <= len(clean_l) <= 35
                and lower_l not in GENERIC_HEADERS
                and not any(h in lower_l for h in ["curriculum", "resume", "page ", "@", "http"])
                and len(clean_l.split()) <= 4
            ):
                name = clean_l
                break
        
        # Email & Phone heuristic extraction
        emails = re.findall(r'[\w\.-]+@[\w\.-]+\.\w+', text)
        phones = re.findall(r'(\+?\d[\d\s-]{8,14}\d)', text)
        
        return CandidateProfile(
            name=name,
            email=emails[0] if emails else None,
            phone=phones[0] if phones else None,
            skills=sorted(list(set(extracted_skills))),
            raw_text=text
        )
