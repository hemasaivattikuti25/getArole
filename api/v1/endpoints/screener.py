import os
import shutil
import tempfile
import uuid
import asyncio
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
        temp_dir = tempfile.gettempdir()
        for file in files:
            safe_filename = os.path.basename(file.filename or f"resume_{uuid.uuid4().hex[:8]}.pdf")
            temp_path = os.path.join(temp_dir, f"enterprise_screen_{uuid.uuid4().hex[:8]}_{safe_filename}")
            with open(temp_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            temp_files.append(temp_path)
            pdf_tuples.append((temp_path, safe_filename))
            
        reports: List[CandidateScreeningReport] = await asyncio.to_thread(
            ScreeningService.screen_bulk_resumes,
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
                try:
                    os.remove(p)
                except Exception:
                    pass
