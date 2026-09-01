from typing import List, Tuple
from domain.models import CandidateScreeningReport, RubricScore, CandidateProfile
from .parser_service import ParserService, COMMON_TECH_SKILLS
from .embedding_service import embedding_service
from .llm_service import get_llm_service

class ScreeningService:
    @staticmethod
    def screen_single_resume(
        pdf_path: str,
        file_name: str,
        job_description: str,
        job_title: str = "Software Engineer",
        company: str = "Target Company"
    ) -> CandidateScreeningReport:
        # Stage 1: Fast PyMuPDF Extraction
        candidate = ParserService.parse_candidate_profile(pdf_path)
        
        # Stage 2: Fast Local Dense Vector Embedding (bge-small ONNX)
        jd_emb = embedding_service.embed_texts([job_description[:1500]])[0]
        res_emb = embedding_service.embed_texts([candidate.raw_text[:1500]])[0]
        similarity = embedding_service.compute_cosine_similarity(jd_emb, res_emb)
        vector_score = round(max(1.0, min(10.0, ((similarity - 0.25) / 0.65) * 10)), 1)
        
        # Stage 3: Deep Neural Reasoning with Llama 3.1 70B (NVIDIA NIM)
        llm_service = get_llm_service()
        llm_eval = llm_service.evaluate_candidate_match(
            resume_text=candidate.raw_text,
            job_title=job_title,
            company=company,
            job_description=job_description
        )
        
        # Combined calibrated score: 40% Vector Similarity + 60% 70B Neural Rubric Reasoning
        llm_score = float(llm_eval.get("score_10", vector_score))
        final_score = round(0.4 * vector_score + 0.6 * llm_score, 1)
        
        verdict = llm_eval.get("verdict", "Review")
        if "shortlist" in verdict.lower():
            verdict = "Shortlisted ✅"
        elif "reject" in verdict.lower() or "unmatch" in verdict.lower():
            verdict = "Unmatched ❌"
        else:
            verdict = "Review / Follow-up ⚠️"
            
        rubric_raw = llm_eval.get("rubric_breakdown", {})
        skills_m = float(rubric_raw.get("skills_match", rubric_raw.get("technical_skills", final_score)))
        exp_m = float(rubric_raw.get("experience_alignment", rubric_raw.get("experience_relevance", final_score)))
        cult_m = float(rubric_raw.get("culture_workplace_fit", rubric_raw.get("domain_knowledge", final_score)))
        loc_m = float(rubric_raw.get("location_synergy", rubric_raw.get("prerequisites_met", final_score)))
        growth_m = float(rubric_raw.get("career_growth", final_score))

        rubric = RubricScore(
            technical_skills=skills_m,
            experience_depth=exp_m,
            prerequisite_coverage=loc_m,
            skills_match=skills_m,
            experience_alignment=exp_m,
            culture_workplace_fit=cult_m,
            location_synergy=loc_m,
            career_growth=growth_m
        )
        
        match_5d_dict = {
            "skills_match": skills_m,
            "experience_alignment": exp_m,
            "culture_workplace_fit": cult_m,
            "location_synergy": loc_m,
            "career_growth": growth_m
        }

        return CandidateScreeningReport(
            candidate_name=candidate.name if candidate.name != "Candidate" else file_name.replace(".pdf", ""),
            file_name=file_name,
            score_10=final_score,
            verdict=verdict,
            rubric_breakdown=rubric,
            match_5d=match_5d_dict,
            strengths=llm_eval.get("strengths", candidate.skills[:4]),
            missing_skills=llm_eval.get("missing_skills", []),
            improvement_roadmap=llm_eval.get("improvement_roadmap", [
                "Quantify technical deliverables in previous roles",
                f"Highlight expertise in {', '.join(llm_eval.get('missing_skills', ['core tools'])[:2])}"
            ]),
            justification=llm_eval.get("justification", f"Calibrated match score: {final_score}/10 based on candidate background and job requirements."),
            extracted_skills=candidate.skills,
            raw_summary=candidate.raw_text[:300] + "..."
        )

    @staticmethod
    def screen_bulk_resumes(
        pdf_tuples: List[Tuple[str, str]],  # (file_path, file_name)
        job_description: str,
        job_title: str = "Software Engineer",
        company: str = "Target Company"
    ) -> List[CandidateScreeningReport]:
        reports = [
            ScreeningService.screen_single_resume(path, name, job_description, job_title, company)
            for path, name in pdf_tuples
        ]
        # Rank descending by calibrated fit score
        reports.sort(key=lambda r: r.score_10, reverse=True)
        return reports
