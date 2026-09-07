/**
 * LinkedIn Referral & Job Search Utility
 * Generates verified Boolean search queries for company HR, engineering peers, and alumni on LinkedIn.
 */

export function openLinkedInReferralSearch(company: string, type: "hr" | "eng" | "alumni" | "all") {
  const decodedComp = decodeURIComponent(company || "").trim();
  if (!decodedComp) return;

  let keywords = `"${decodedComp}"`;

  if (type === "hr") {
    keywords += ' AND (HR OR Recruiter OR "Talent Acquisition" OR "Human Resources" OR "Hiring Manager")';
  } else if (type === "eng") {
    keywords += ' AND ("Software Engineer" OR Developer OR "Engineering Manager" OR "Tech Lead" OR "Data Scientist")';
  } else if (type === "alumni") {
    let school = "";
    if (typeof window !== "undefined") {
      try {
        const prof = JSON.parse(localStorage.getItem("getarole_profile") || "{}");
        school = prof.education?.[0]?.school || "";
        if (!school) {
          const resume = JSON.parse(localStorage.getItem("getarole_resume_v2") || "{}");
          school = resume.education?.[0]?.school || "";
        }
      } catch {}
    }

    if (school) {
      keywords += ` AND "${school.trim()}"`;
    } else {
      keywords += ' AND (Alumni OR Graduate)';
    }
  }

  const linkedInUrl = `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(keywords)}`;
  window.open(linkedInUrl, "_blank", "noopener,noreferrer");
}

export function openLinkedInJobSearch(
  role: string,
  company?: string | null,
  location?: string | null
) {
  let query = role;
  if (company) query += ` ${company}`;
  const loc = location && !location.toLowerCase().includes("remote") ? location : "India";
  const url = `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(query)}&location=${encodeURIComponent(loc)}`;
  window.open(url, "_blank", "noopener,noreferrer");
}

/**
 * Intelligent Synonym Dictionary for Tech & Role Search
 * Expands search terms with tech synonyms and equivalent industry roles.
 */
export const SYNONYM_MAP: Record<string, string[]> = {
  python: ["python", "django", "fastapi", "flask", "pandas", "numpy"],
  react: ["react", "reactjs", "nextjs", "next.js", "redux"],
  sde: ["sde", "software engineer", "software development engineer", "developer", "programmer"],
  backend: ["backend", "back end", "node", "fastapi", "express", "django", "golang", "java", "spring"],
  frontend: ["frontend", "front end", "react", "vue", "angular", "html", "css", "nextjs"],
  fullstack: ["fullstack", "full stack", "mern", "mean", "frontend", "backend"],
  ai: ["ai", "artificial intelligence", "ml", "machine learning", "deep learning", "nlp", "llm", "genai"],
  ml: ["ml", "machine learning", "deep learning", "ai", "artificial intelligence", "data science"],
  wfh: ["wfh", "work from home", "remote"],
  remote: ["remote", "wfh", "work from home", "anywhere"],
  intern: ["intern", "internship", "trainee", "co-op", "apprentice"],
  internship: ["intern", "internship", "trainee", "co-op", "apprentice"],
  fresher: ["fresher", "entry level", "graduate", "batch 2024", "batch 2025", "batch 2026", "0-1"],
};
