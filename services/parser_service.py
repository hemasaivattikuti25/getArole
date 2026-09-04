import os
import re
import pymupdf  # Fast PDF parsing
from typing import List
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
        
        # Skill extraction
        extracted_skills = [s for s in COMMON_TECH_SKILLS if s in lower_text]
        
        # Name heuristic (first clean line)
        lines = [l.strip() for l in text.split("\n") if l.strip()]
        name = lines[0] if lines and len(lines[0]) < 35 else "Candidate"
        
        # Email & Phone heuristic extraction
        emails = re.findall(r'[\w\.-]+@[\w\.-]+\.\w+', text)
        phones = re.findall(r'(\+?\d[\d\s-]{8,14}\d)', text)
        
        return CandidateProfile(
            name=name,
            email=emails[0] if emails else None,
            phone=phones[0] if phones else None,
            skills=extracted_skills,
            raw_text=text
        )
