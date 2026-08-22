import os
import shutil
from typing import List
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from domain.models import ApiResponse, CandidateScreeningReport
from services.screening_service import ScreeningService

router = APIRouter(prefix="/screener", tags=["Recruiter Smart Screener"])

@router.post("/screen", response_model=ApiResponse)
async def screen_resumes(
    job_description: str = Form(..., description="Target Job Description text"),
    files: List[UploadFile] = File(..., description="1 to 50 Candidate Resume PDFs")
):
    if not files:
        raise HTTPException(status_code=400, detail="Please upload at least one resume PDF.")
        
    temp_files = []
    try:
        pdf_tuples = []
        for file in files:
            temp_path = f"/tmp/enterprise_screen_{file.filename}"
            with open(temp_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            temp_files.append(temp_path)
            pdf_tuples.append((temp_path, file.filename))
            
        reports: List[CandidateScreeningReport] = ScreeningService.screen_bulk_resumes(
            pdf_tuples=pdf_tuples,
            job_description=job_description
        )
        
        shortlisted = len([r for r in reports if "Shortlisted" in r.verdict])
        
        return ApiResponse(
            success=True,
            message=f"Successfully screened {len(reports)} candidate(s)",
            data={
                "total_screened": len(reports),
                "shortlisted_count": shortlisted,
                "leaderboard": [r.model_dump() for r in reports]
            }
        )
    finally:
        for p in temp_files:
            if os.path.exists(p):
                os.remove(p)
