import asyncio
import io
import json
import re
import zipfile
import xml.etree.ElementTree as ET
import fitz  # PyMuPDF
from typing import Dict, Any, List, Tuple
from services.llm_service import NvidiaLLMService

class ResumeParserService:
    """
    Dedicated domain service for parsing PDF/Word resumes (Single Responsibility Principle).
    Handles binary PDF/DOCX text extraction, hyperlink annotation parsing, structured LLM extraction,
    and universal fallback section classification.
    """

    def parse_docx_bytes(self, docx_bytes: bytes) -> str:
        """Extracts plain text from standard OpenXML .docx binaries without external dependencies."""
        try:
            with zipfile.ZipFile(io.BytesIO(docx_bytes)) as zf:
                if "word/document.xml" in zf.namelist():
                    xml_content = zf.read("word/document.xml")
                    tree = ET.fromstring(xml_content)
                    texts = [elem.text for elem in tree.iter() if elem.text and elem.tag.endswith('}t')]
                    return "\n".join(texts).strip()
        except Exception as e:
            print(f"[ResumeParserService DOCX Extraction Notice] {e}")
        return ""

    def parse_pdf_bytes(self, pdf_bytes: bytes) -> Tuple[str, List[str]]:
        """Extracts plain text and link annotation URIs from raw PDF bytes safely using context manager."""
        pages_text = []
        pdf_links = []
        try:
            with fitz.open(stream=pdf_bytes, filetype="pdf") as doc:
                for p in doc:
                    pages_text.append(p.get_text())
                    for l in p.get_links():
                        if l.get("uri"):
                            pdf_links.append(l.get("uri"))
        except Exception as e:
            print(f"[ResumeParserService PDF Parse Notice] {e}")
            # Fallback to DOCX parser if user provided a docx renamed as .pdf
            docx_text = self.parse_docx_bytes(pdf_bytes)
            if docx_text:
                return docx_text, []
        
        text = "\n".join(pages_text).strip()
        if pdf_links:
            text += "\n\n=== EXTRACTED PDF ANNOTATION LINKS ===\n" + "\n".join(set(pdf_links))
        return text, pdf_links

    def parse_document_bytes(self, file_bytes: bytes, filename: str) -> Tuple[str, List[str]]:
        """Extracts text based on document file type."""
        lower_name = (filename or "").lower()
        if lower_name.endswith(".docx") or lower_name.endswith(".doc"):
            docx_text = self.parse_docx_bytes(file_bytes)
            if docx_text:
                return docx_text, []
        return self.parse_pdf_bytes(file_bytes)

    def _is_safe_url(self, url: str) -> bool:
        """Validates that a URL uses safe HTTP/HTTPS schemes and is not an internal or SSRF target."""
        if not url:
            return False
        lower = url.lower().strip()
        if any(lower.startswith(bad) for bad in ["javascript:", "data:", "file:", "ftp:", "blob:", "about:"]):
            return False
        if any(ip in lower for ip in ["127.0.0.1", "localhost", "169.254.169.254", "0.0.0.0", "::1", "10.0.", "192.168."]):
            return False
        return lower.startswith("http://") or lower.startswith("https://")

    def extract_links(self, text: str, pdf_links: List[str], llm_parsed: Dict[str, Any]) -> Dict[str, str]:
        """Extracts LinkedIn, GitHub, and Portfolio URLs using annotations and regex securely."""
        links = {
            "linkedin": llm_parsed.get("linkedin_url", "") if self._is_safe_url(llm_parsed.get("linkedin_url", "")) else "",
            "github": llm_parsed.get("github_url", "") if self._is_safe_url(llm_parsed.get("github_url", "")) else "",
            "portfolio": llm_parsed.get("portfolio_url", "") if self._is_safe_url(llm_parsed.get("portfolio_url", "")) else "",
            "other": llm_parsed.get("other_url", "") if self._is_safe_url(llm_parsed.get("other_url", "")) else ""
        }

        raw_urls = pdf_links + re.findall(r'(?:https?://)?(?:www\.)?([a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+(?:/[^\s,)]*)?)', text)
        for url_str in raw_urls:
            url_clean = url_str.replace("mailto:", "").strip()
            full_url = url_clean if url_clean.startswith("http://") or url_clean.startswith("https://") else f"https://{url_clean}"
            if not self._is_safe_url(full_url):
                continue
            lower_u = full_url.lower()
            if "linkedin.com" in lower_u and not links["linkedin"]:
                links["linkedin"] = full_url
            elif "github.com" in lower_u and not links["github"]:
                if not any(sub in lower_u for sub in ["/mithra", "/vitap"]):
                    links["github"] = full_url
            elif not links["portfolio"] and not any(ignore in lower_u for ignore in ["google.com", "schema.org", "w3.org", "fonts.googleapis", "gmail.com"]):
                if any(ext in lower_u for ext in [".dev", ".io", ".me", "portfolio", "vercel.app", "github.io", "lifeos.com", "mithra"]):
                    links["portfolio"] = full_url
        return links

    def _parse_experience_lines(self, lines: List[str]) -> List[Dict[str, Any]]:
        """Helper to parse experience section lines into structured objects."""
        fb_exp = []
        curr_exp = None
        month_pattern = re.compile(r'(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|Present)\b.*(\d{4}|Present)', re.IGNORECASE)
        date_pattern = re.compile(r'\d{4}\s*[-–—]\s*(\d{4}|Present)', re.IGNORECASE)
        company_indicators = ["ltd", "inc", "corp", "llc", "pvt", "gmbh", "technologies", "solutions", "laboratory", "labs", "lab", "organization", "foundation", "company", "group", "services", "systems", "agency", "studio", "studios", "ventures", "partners", "global", "co."]
        role_indicators = ["intern", "engineer", "developer", "manager", "lead", "architect", "analyst", "designer", "consultant", "director", "officer", "specialist", "associate", "head", "cto", "ceo", "vp", "founder"]

        for l in lines:
            is_bullet = l.startswith("•") or l.startswith("-") or l.startswith("·") or l.startswith("*")
            has_date = bool(month_pattern.search(l)) or bool(date_pattern.search(l))
            lower_l = l.lower()
            is_company = any(ci in lower_l for ci in company_indicators) and len(l) < 120
            is_role = any(ri in lower_l for ri in role_indicators) and len(l) < 120
            
            if is_bullet:
                bullet = l.lstrip("•-·* ").strip()
                if curr_exp and bullet:
                    curr_exp["bullets"].append(bullet)
            elif is_company and not is_bullet:
                curr_exp = {"company": l, "title": "", "dates": "", "bullets": []}
                fb_exp.append(curr_exp)
            elif not curr_exp and not is_bullet and len(l) < 120:
                curr_exp = {"company": l, "title": "", "dates": "", "bullets": []}
                fb_exp.append(curr_exp)
            elif has_date and curr_exp and not curr_exp.get("dates"):
                curr_exp["dates"] = l
            elif is_role and curr_exp and not curr_exp.get("title"):
                curr_exp["title"] = l
            elif curr_exp and not curr_exp.get("title") and not is_bullet and len(l) < 100:
                curr_exp["title"] = l
        return fb_exp

    def _parse_projects_lines(self, lines: List[str]) -> List[Dict[str, Any]]:
        """Helper to parse projects section lines into structured objects."""
        fb_proj = []
        curr_proj = None
        noise_words = {"Live", "GitHub", "Demo", "Link", "Source", "Code", "View", "Website", "Repo", "App"}
        
        for l in lines:
            is_bullet = l.startswith("•") or l.startswith("-") or l.startswith("·") or l.startswith("*")
            is_url = l.startswith("http") or l.startswith("www.") or "://" in l
            is_noise = l.strip() in noise_words
            is_year_only = bool(re.match(r'^\d{4}(\s*[-–—]\s*(Present|\d{4}))?$', l.strip()))
            is_tech_stack = "·" in l and len(l.split("·")) >= 3
            
            if is_bullet:
                bullet = l.lstrip("•-·* ").strip()
                if curr_proj and bullet:
                    curr_proj["bullets"].append(bullet)
                    if not curr_proj["description"]:
                        curr_proj["description"] = bullet
            elif is_noise or is_year_only or is_url:
                if is_url and curr_proj and not curr_proj.get("link"):
                    curr_proj["link"] = l
                continue
            elif is_tech_stack and curr_proj:
                curr_proj["tech"] = l
                continue
            elif not is_bullet and not is_noise and not is_year_only and not is_tech_stack:
                l_stripped = l.strip()
                word_count = len(l_stripped.split())
                starts_upper = l_stripped[0].isupper() if l_stripped else False
                if word_count <= 6 and starts_upper and not l_stripped.endswith(".") and not l_stripped.startswith("for ") and not l_stripped.startswith("and "):
                    if curr_proj and len(curr_proj["bullets"]) > 0:
                        curr_proj = {"name": l_stripped, "description": "", "link": "", "bullets": []}
                        fb_proj.append(curr_proj)
                    elif not curr_proj:
                        curr_proj = {"name": l_stripped, "description": "", "link": "", "bullets": []}
                        fb_proj.append(curr_proj)
                    else:
                        curr_proj["description"] = (curr_proj["description"] + " " + l_stripped).strip()
                else:
                    if curr_proj:
                        curr_proj["description"] = (curr_proj["description"] + " " + l_stripped).strip()
        return fb_proj

    def _parse_education_lines(self, lines: List[str]) -> List[Dict[str, Any]]:
        """Helper to parse education section lines into structured objects."""
        fb_edu = []
        curr_edu = None
        school_keywords = ["university", "institute", "institution", "college", "school", "academy", "polytechnic", "conservatory", "faculty"]
        degree_keywords = ["b.tech", "b.e", "b.s", "b.a", "m.tech", "m.s", "m.a", "ph.d", "phd", "bachelor", "master", "doctorate", "diploma", "degree", "major"]
        
        for l in lines:
            if l.startswith("http") or l.startswith("mailto:") or "://" in l or l.startswith("==="):
                continue
            
            lower_l = l.lower()
            is_school = any(k in lower_l for k in school_keywords)
            is_degree = any(k in lower_l for k in degree_keywords)
            has_year = bool(re.search(r'20\d{2}', l))
            
            if is_school:
                curr_edu = {"school": l, "degree": "", "year": ""}
                fb_edu.append(curr_edu)
            elif not curr_edu and (is_degree or has_year) and len(l) < 120:
                curr_edu = {"school": l, "degree": "", "year": ""}
                fb_edu.append(curr_edu)
            elif curr_edu:
                if has_year and not curr_edu["year"]:
                    curr_edu["year"] = l
                elif not curr_edu["degree"]:
                    curr_edu["degree"] = l
                elif len(l) > 5 and not l.startswith("http"):
                    curr_edu["degree"] += " · " + l
        return fb_edu

    def parse_sections_fallback(self, text: str) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]], List[Dict[str, Any]]]:
        """Universal section fallback classifier split into modular helpers."""
        sec_lines = [l.strip() for l in text.splitlines() if l.strip()]
        sections = {}
        curr_sec = "HEADER"
        sections[curr_sec] = []

        for l in sec_lines:
            u = l.upper().strip(":")
            if u in ["EXPERIENCE", "WORK EXPERIENCE", "EMPLOYMENT", "EMPLOYMENT HISTORY", "WORK HISTORY"]:
                curr_sec = "EXPERIENCE"
                sections[curr_sec] = []
            elif u in ["PROJECTS", "KEY PROJECTS", "PERSONAL PROJECTS", "PROJECTS & OUTSIDE EXPERIENCE"]:
                curr_sec = "PROJECTS"
                sections[curr_sec] = []
            elif u in ["EDUCATION", "ACADEMIC BACKGROUND", "QUALIFICATIONS"]:
                curr_sec = "EDUCATION"
                sections[curr_sec] = []
            elif u in ["SKILLS", "TECHNICAL SKILLS", "SUMMARY", "ACHIEVEMENTS", "CERTIFICATIONS", "LANGUAGES"]:
                curr_sec = "OTHER_" + u
                sections[curr_sec] = []
            else:
                sections.setdefault(curr_sec, []).append(l)

        fb_exp = self._parse_experience_lines(sections.get("EXPERIENCE", []))
        fb_proj = self._parse_projects_lines(sections.get("PROJECTS", []))
        fb_edu = self._parse_education_lines(sections.get("EDUCATION", []))
        return fb_exp, fb_edu, fb_proj

    async def _call_llm_parser(self, text: str) -> Dict[str, Any]:
        """Helper to invoke LLM parser safely with dedicated 30s timeout and payload extraction."""
        try:
            from services.llm_service import get_llm_service
            llm = get_llm_service()
            prompt = f"""You are an elite technical resume parser. Extract structured candidate profile from this resume:

Resume Text:
{text[:6000]}

Return valid JSON with exact structure:
{{
  "first_name": "First Name",
  "last_name": "Last Name",
  "name": "Full Name",
  "headline": "Target Title e.g. Senior Software Engineer",
  "email": "email@example.com",
  "phone": "+1234567890",
  "location": "City, Country",
  "summary": "2-3 sentence executive summary",
  "linkedin_url": "https://linkedin.com/in/username",
  "github_url": "https://github.com/username",
  "portfolio_url": "https://portfolio.dev",
  "other_url": "",
  "skills": ["Python", "React", "AWS", "FastAPI"],
  "experience": [
    {{
      "company": "Company Name",
      "title": "Role Title",
      "dates": "Jan 2024 - Present",
      "bullets": ["Built high-throughput API...", "Reduced latency by 40%..."]
    }}
  ],
  "education": [
    {{
      "school": "University Name",
      "degree": "B.Tech Computer Science",
      "year": "2025"
    }}
  ],
  "projects": [
    {{
      "name": "Project Name",
      "description": "Full stack real-time application using FastAPI and React.",
      "link": "https://github.com/user/project"
    }}
  ]
}}"""
            resp = await llm.a_call_chat([{"role": "user", "content": prompt}], max_tokens=900, timeout_secs=30.0)
            parsed = NvidiaLLMService.extract_json_payload(resp)
            if isinstance(parsed, dict):
                return parsed
        except Exception as e:
            print(f"[ResumeParserService LLM Notice] {e}")
        return {}

    async def process_resume_bytes(self, file_bytes: bytes, filename: str) -> Dict[str, Any]:
        """Main orchestrator for resume parsing supporting PDF and DOCX."""
        text, pdf_links = await asyncio.to_thread(self.parse_document_bytes, file_bytes, filename)

        common_tech = [
            "python", "java", "c++", "c#", "c", "rust", "golang", "go", "typescript", "javascript",
            "swift", "kotlin", "ruby", "rails", "php", "scala", "dart", "flutter",
            "react", "next.js", "vue", "angular", "node.js", "express", "fastapi", "django", "flask",
            "spring boot", "spring", "aws", "gcp", "azure", "docker", "kubernetes", "k8s", "terraform",
            "ansible", "ci/cd", "github actions", "sql", "postgresql", "mysql", "mongodb", "redis",
            "elasticsearch", "kafka", "spark", "hadoop", "graphql", "grpc", "rest api", "pytorch",
            "tensorflow", "scikit-learn", "git", "linux", "html5", "css3", "tailwind", "figma",
            "jira", "agile", "scrum"
        ]
        lower = text.lower()
        extracted_skills = [s for s in common_tech if s in lower]

        email_match = re.search(r'[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+', text)
        phone_match = re.search(r'(?:(?:\+|00)\d{1,3}[-\s.]*)?(?:\(?\d{2,5}\)?[-\s.]*)?\d{3,5}[-\s.]*\d{4,5}', text)
        lines = [line.strip() for line in text.splitlines() if line.strip()]
        
        # Heuristic candidate name ignoring common headers/watermarks
        ignore_names = {"resume", "curriculum vitae", "cv", "confidential", "profile", "page 1", "contact", "summary", "experience", "education"}
        candidate_name = "Candidate"
        for l in lines[:5]:
            l_clean = l.strip()
            if l_clean.lower() not in ignore_names and len(l_clean.split()) <= 4 and re.match(r'^[A-Za-z\s.\'-]+$', l_clean) and len(l_clean) >= 3:
                candidate_name = l_clean
                break
        
        email = email_match.group(0) if email_match else ""
        raw_phone = phone_match.group(0).strip() if phone_match else ""
        phone = raw_phone if sum(c.isdigit() for c in raw_phone) >= 10 else ""
        headline = "Software Engineer"
        summary = " ".join(lines[1:4]) if len(lines) > 1 else ""

        llm_parsed = await self._call_llm_parser(text)

        first_name = llm_parsed.get("first_name", "")
        last_name = llm_parsed.get("last_name", "")
        if llm_parsed.get("name") and llm_parsed["name"] != "Candidate Full Name":
            candidate_name = llm_parsed["name"]
        
        if not first_name or not last_name:
            name_parts = candidate_name.split()
            if len(name_parts) >= 2:
                first_name = first_name or name_parts[0]
                last_name = last_name or " ".join(name_parts[1:])
            elif len(name_parts) == 1:
                first_name = first_name or name_parts[0]

        if llm_parsed.get("headline"): headline = llm_parsed["headline"]
        if llm_parsed.get("summary"): summary = llm_parsed["summary"]
        if llm_parsed.get("email"): email = llm_parsed["email"]
        if llm_parsed.get("phone"): phone = llm_parsed["phone"]
        if llm_parsed.get("skills"):
            extracted_skills = sorted(list(set(extracted_skills + [s for s in llm_parsed["skills"] if isinstance(s, str)])))

        links = self.extract_links(text, pdf_links, llm_parsed)
        experience_list = llm_parsed.get("experience") or []
        education_list = llm_parsed.get("education") or []
        projects_list = llm_parsed.get("projects") or []

        fb_exp, fb_edu, fb_proj = await asyncio.to_thread(self.parse_sections_fallback, text)
        if not experience_list and fb_exp: experience_list = fb_exp
        if not education_list and fb_edu: education_list = fb_edu
        if not projects_list and fb_proj: projects_list = fb_proj

        candidate_profile = {
            "first_name": first_name,
            "last_name": last_name,
            "first": first_name,
            "last": last_name,
            "name": candidate_name,
            "email": email,
            "phone": phone,
            "headline": headline,
            "location": llm_parsed.get("location", "India"),
            "skills": extracted_skills,
            "summary": summary,
            "experience": experience_list,
            "education": education_list,
            "projects": projects_list,
            "links": links
        }

        resume_data = {
            "header": {
                "name": candidate_name,
                "first_name": first_name,
                "last_name": last_name,
                "email": email,
                "phone": phone,
                "location": llm_parsed.get("location", "India"),
                "title": headline
            },
            "summary": {"text": summary},
            "skills": {
                "languages": ", ".join(extracted_skills[:10]),
                "all": ", ".join(extracted_skills)
            },
            "experience": experience_list,
            "education": education_list,
            "projects": projects_list,
            "links": links,
            "raw_text": text
        }

        return {
            "success": True,
            "filename": filename,
            "resume_text": text,
            "candidate_profile": candidate_profile,
            "resume_data": resume_data
        }

def get_resume_parser_service() -> ResumeParserService:
    return ResumeParserService()
