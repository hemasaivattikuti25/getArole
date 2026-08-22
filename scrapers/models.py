from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field

class JobListing(BaseModel):
    id: str = Field(..., description="Unique hash or platform ID for the job")
    title: str = Field(..., description="Job role title")
    company: str = Field(..., description="Company name")
    location: str = Field(..., description="Location string e.g. Bengaluru, Karnataka, India")
    city: Optional[str] = Field(None, description="Normalized city e.g. Hyderabad, Bengaluru, Chennai, Remote")
    platform: str = Field(..., description="Platform name: Greenhouse, Lever, Ashby, LinkedIn, Internshala, etc.")
    url: str = Field(..., description="Direct link to apply or view posting")
    workplace_type: Optional[str] = Field("Onsite", description="Remote, Hybrid, or Onsite")
    employment_type: Optional[str] = Field("Internship", description="Internship, Full-time, Contract")
    stipend_or_salary: Optional[str] = Field(None, description="Stated compensation string")
    stipend_amount_min: Optional[int] = Field(None, description="Extracted minimum monthly stipend if available")
    description: str = Field("", description="Full job description or summary")
    requirements: List[str] = Field(default_factory=list, description="Key skills/requirements extracted")
    date_posted: Optional[str] = Field(None, description="Date or relative time posted")
    scraped_at: datetime = Field(default_factory=datetime.utcnow, description="Scrape timestamp")
    fit_score: Optional[float] = Field(None, description="Calculated 0-100 fit score")
    matched_skills: List[str] = Field(default_factory=list, description="Skills matched with user resume")
    missing_skills: List[str] = Field(default_factory=list, description="Skills missing from user resume")

class CandidateProfile(BaseModel):
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    education: List[str] = Field(default_factory=list)
    skills: List[str] = Field(default_factory=list)
    experience: List[str] = Field(default_factory=list)
    projects: List[str] = Field(default_factory=list)
    raw_text: str = ""
