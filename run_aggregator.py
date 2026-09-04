import asyncio
import json
import os
import sys
from datetime import datetime
from scrapers.aggregator import JobAggregator
from scrapers.matcher import ResumeMatcher

async def main():
    print("=" * 70)
    print("🚀 JOB FINDER ENGINE — MULTI-PLATFORM AGGREGATOR & MATCHER")
    print("=" * 70)
    
    default_pdf = os.path.join(os.path.dirname(os.path.abspath(__file__)), "resume.pdf")
    resume_path = os.getenv("RESUME_PATH", default_pdf)
    if len(sys.argv) > 1:
        resume_path = sys.argv[1]
        
    print(f"\n📄 Loading candidate resume: {resume_path}")
    matcher = ResumeMatcher()
    resume_text = matcher.extract_text_from_pdf(resume_path)
    profile = matcher.parse_profile(resume_path)
    print(f"✅ Extracted resume skills: {', '.join(profile.skills[:10])}...")
    
    print("\n🌐 Starting Multi-Platform Scraping...")
    print("   • Greenhouse Public APIs (CloudSEK, Postman, Razorpay, Zepto, etc.)")
    print("   • Lever Public APIs (Swiggy, Zomato, MPL, Cred, etc.)")
    print("   • Ashby Public APIs (Sanas, Linear, Perplexity, etc.)")
    print("   • Internshala India (Python, AI/ML, Backend internships in Hyd/Blr/Che/Remote)")
    print("   • LinkedIn Guest API (Live job search)")
    
    aggregator = JobAggregator()
    jobs = await aggregator.aggregate_all()
    print(f"\n🎯 Total unique jobs aggregated across India: {len(jobs)}")
    
    print("\n🧠 Running Local Zero-Cost Vector Matching Engine (FastEmbed ONNX)...")
    ranked_jobs = matcher.rank_jobs_by_fit(resume_text, jobs)
    print(f"✅ Ranked {len(ranked_jobs)} jobs by semantic fit score!")
    
    # Save full JSON database
    output_json = "/Users/sai2005/Downloads/gitprojects/job_finder/scraped_jobs.json"
    with open(output_json, "w", encoding="utf-8") as f:
        json.dump([j.model_dump(mode="json") for j in ranked_jobs], f, indent=2)
    print(f"💾 Full job database saved to: {output_json}")
    
    # Display Top Matches
    print("\n" + "=" * 70)
    print("🏆 TOP 10 HIGHEST FIT MATCHES ACROSS ALL PLATFORMS")
    print("=" * 70)
    
    for i, job in enumerate(ranked_jobs[:10], 1):
        stipend_str = f" | Stipend: {job.stipend_or_salary}" if job.stipend_or_salary else ""
        print(f"\n#{i} [{job.fit_score}% Match] {job.title}")
        print(f"   🏢 Company: {job.company} | 📍 Location: {job.location} ({job.workplace_type})")
        print(f"   🌐 Platform: {job.platform} | 💼 Type: {job.employment_type}{stipend_str}")
        print(f"   🔗 URL: {job.url}")
        if job.matched_skills:
            print(f"   ✨ Matched Skills: {', '.join(job.matched_skills)}")

if __name__ == "__main__":
    asyncio.run(main())
