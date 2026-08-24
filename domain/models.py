from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class Job(BaseModel):
    id: str = Field(..., description="Unique deterministic identifier")
    title: str = Field(..., description="Job role title")
    company: str = Field(..., description="Company name")
    location: str = Field(..., description="Full location string")
    city: Optional[str] = Field(None, description="Normalized city e.g. Hyderabad, Bengaluru, Chennai, Remote")
    platform: str = Field(..., description="Greenhouse, Lever, Ashby, LinkedIn, Internshala")
    url: str = Field(..., description="Direct application link")
    workplace_type: str = Field("Onsite", description="Remote, Hybrid, or Onsite")
    employment_type: str = Field("Full-time", description="Internship, Full-time, Contract")
    stipend_or_salary: Optional[str] = Field(None, description="Stated compensation string")
    stipend_amount_min: Optional[int] = Field(None, description="Extracted numerical monthly compensation")
    description: str = Field("", description="Job description text")
    requirements: List[str] = Field(default_factory=list, description="Extracted requirements")
    date_posted: Optional[str] = Field(None, description="Posting date")
    scraped_at: datetime = Field(default_factory=datetime.utcnow)
    fit_score: Optional[float] = Field(None, description="Cosine similarity fit percentage (0-100%)")
    matched_skills: List[str] = Field(default_factory=list)
    missing_skills: List[str] = Field(default_factory=list)

class CandidateProfile(BaseModel):
    name: str = "Candidate"
    email: Optional[str] = None
    phone: Optional[str] = None
    education: List[str] = Field(default_factory=list)
    skills: List[str] = Field(default_factory=list)
    experience: List[str] = Field(default_factory=list)
    projects: List[str] = Field(default_factory=list)
    raw_text: str = ""

class RubricScore(BaseModel):
    technical_skills: float = Field(..., ge=0, le=10)
    experience_depth: float = Field(..., ge=0, le=10)
    prerequisite_coverage: float = Field(..., ge=0, le=10)

class CandidateScreeningReport(BaseModel):
    candidate_name: str
    file_name: str
    score_10: float = Field(..., ge=0, le=10, description="Calibrated fit score on 1-10 scale")
    verdict: str = Field(..., description="Shortlisted, Review, or Reject")
    rubric_breakdown: RubricScore
    strengths: List[str] = Field(default_factory=list)
    missing_skills: List[str] = Field(default_factory=list)
    justification: str = Field(..., description="Clear hiring justification")
    extracted_skills: List[str] = Field(default_factory=list)
    raw_summary: str = ""

class ApiResponse(BaseModel):
    success: bool = True
    message: str = "Operation completed successfully"
    data: Any = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class UserProfileModel(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    headline: Optional[str] = None
    skills: List[str] = Field(default_factory=list)
    experience: List[Dict[str, Any]] = Field(default_factory=list)
    education: List[Dict[str, Any]] = Field(default_factory=list)
    projects: List[Dict[str, Any]] = Field(default_factory=list)
    links: Dict[str, str] = Field(default_factory=dict)

class UserPreferencesModel(BaseModel):
    roles: List[str] = Field(default_factory=list)
    cities: List[str] = Field(default_factory=list)
    workplace_types: List[str] = Field(default_factory=list)
    min_salary: Optional[int] = None
    exp_levels: List[str] = Field(default_factory=list)
    auto_apply: bool = False

class ParsedResumeModel(BaseModel):
    name: str = "Candidate"
    email: str = ""
    phone: str = ""
    skills: List[str] = Field(default_factory=list)
    experience: List[Dict[str, Any]] = Field(default_factory=list)
    education: List[Dict[str, Any]] = Field(default_factory=list)
    projects: List[Dict[str, Any]] = Field(default_factory=list)
    links: Dict[str, str] = Field(default_factory=dict)
    summary: str = ""
    sha256: str = ""
