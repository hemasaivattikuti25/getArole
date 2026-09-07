"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Sparkles, 
  Building2, 
  MapPin, 
  CheckCircle2, 
  ExternalLink,
  Filter,
  FileText,
  Search,
  Eye
} from "lucide-react";
import { useJobs } from "../explore/hooks/useJobs";
import { extractSkillStrings } from "@/lib/skills-utils";
import { Job } from "@/lib/types";
import JobDrawer from "../explore/components/JobDrawer";

export default function MatchesPage() {
  const { jobs, loading } = useJobs();
  const [minScore, setMinScore] = useState<number>(75);
  const [userSkills, setUserSkills] = useState<string[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        let loadedSkills: string[] = [];
        const savedResume = localStorage.getItem("getarole_resume_v2");
        if (savedResume) {
          try {
            const parsed = JSON.parse(savedResume);
            if (parsed.skills) {
              loadedSkills = extractSkillStrings(parsed.skills);
            }
          } catch {}
        }

        if (loadedSkills.length === 0) {
          const savedProfile = localStorage.getItem("getarole_profile");
          if (savedProfile) {
            try {
              const prof = JSON.parse(savedProfile);
              const profSkills = [
                ...(prof.skills || []),
                ...(prof.skills_languages || []),
                ...(prof.skills_frameworks || []),
                ...(prof.skills_cloud || []),
                ...(prof.skills_tools || []),
              ];
              loadedSkills = extractSkillStrings(profSkills);
            } catch {}
          }
        }

        if (loadedSkills.length > 0) {
          setUserSkills(loadedSkills);
        }
      } catch (err) {
        console.warn("Skill load warning:", err);
      }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // Compute match score and skills for each job defensively
  const matchedJobs = (jobs || []).map((job) => {
    const jobTitle = typeof job.title === "string" ? job.title : "";
    const jobDesc = typeof job.description === "string" ? job.description : "";
    const jobSkills = extractSkillStrings(job.skills);
    const jobText = `${jobTitle} ${jobDesc} ${jobSkills.join(" ")}`.toLowerCase();

    if (userSkills.length === 0) {
      return {
        ...job,
        title: jobTitle || "Developer Opportunity",
        company: typeof job.company === "string" ? job.company : "Tech Enterprise",
        description: jobDesc,
        fit_score: null,
        matched_skills: [],
        missing_skills: [],
      };
    }

    const matched = userSkills.filter(
      (s) => typeof s === "string" && s.trim().length > 0 && jobText.includes(s.toLowerCase())
    );
    const missing = userSkills
      .filter((s) => typeof s === "string" && s.trim().length > 0 && !jobText.includes(s.toLowerCase()))
      .slice(0, 3);

    const relevantTargetCount = jobSkills.length > 0 ? jobSkills.length : Math.min(5, userSkills.length);
    const calculatedScore = matched.length === 0 
      ? 0 
      : Math.min(99, Math.round((matched.length / relevantTargetCount) * 100));

    return {
      ...job,
      title: jobTitle || "Developer Opportunity",
      company: typeof job.company === "string" ? job.company : "Tech Enterprise",
      description: jobDesc,
      fit_score: calculatedScore,
      matched_skills: matched,
      missing_skills: missing,
    };
  });

  const filteredMatches = userSkills.length === 0
    ? matchedJobs
    : matchedJobs.filter((j) => (j.fit_score || 0) >= minScore);

  return (
    <div className="relative min-h-screen pt-8 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* ── Page Header ── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/80 text-[#0062e3] text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Semantic Match Engine</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight font-outfit">
            Explore Resume Matches
          </h1>
          <p className="text-slate-500 text-sm sm:text-base max-w-2xl mt-1">
            Real-time competency screening comparing your verified profile skills against 1,000+ open developer roles.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/explore"
            className="inline-flex items-center gap-2 bg-[#0062e3] hover:bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-xs transition-colors"
          >
            <Search className="w-4 h-4" />
            <span>Explore All Jobs</span>
          </Link>
          <Link
            href="/resume-builder"
            className="inline-flex items-center gap-2 bg-white text-slate-700 border border-slate-200/80 hover:bg-slate-50 px-4 py-2 rounded-xl text-sm font-semibold shadow-2xs transition-colors"
          >
            <FileText className="w-4 h-4 text-slate-400" />
            <span>Update Resume</span>
          </Link>
        </div>
      </div>

      {/* ── Profile Skills Banner / Setup Prompt ── */}
      {userSkills.length > 0 ? (
        <div className="bg-white/70 backdrop-blur-xl border border-slate-200/80 rounded-2xl p-5 mb-8 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Active Screening Skills ({userSkills.length}):
              </span>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {userSkills.map((skill, idx) => (
                  <span
                    key={`${skill}-${idx}`}
                    className="px-2.5 py-1 bg-white text-slate-700 rounded-lg border border-slate-200 text-xs font-semibold shadow-2xs"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <span className="text-xs text-slate-400">Screening Status</span>
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full mt-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Live Synced</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-gradient-to-r from-blue-50/80 via-indigo-50/60 to-purple-50/80 border border-blue-200/80 rounded-2xl p-5 mb-8 shadow-xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-[#0062e3] text-white flex items-center justify-center shrink-0 shadow-xs">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 font-outfit">
                  Add Skills or Upload Resume to Activate Match Scoring
                </h3>
                <p className="text-xs text-slate-600 mt-0.5 max-w-xl">
                  Set your verified technical skills to calculate precision match scores and missing keyword gaps across 1,000+ live roles.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 shrink-0">
              <Link
                href="/profile"
                className="px-3.5 py-2 bg-[#0062e3] hover:bg-blue-600 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
              >
                Set Profile Skills
              </Link>
              <Link
                href="/resume-builder"
                className="px-3.5 py-2 bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold shadow-2xs transition-colors"
              >
                Upload Resume
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ── Filters & Threshold ── */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 bg-white/50 backdrop-blur-md p-4 rounded-xl border border-slate-200/60">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
          <Filter className="w-4 h-4 text-slate-400" />
          <span>Showing {filteredMatches.length} high-fit roles</span>
        </div>

        <div className="flex items-center gap-3 text-xs font-semibold text-slate-600">
          <span>Minimum Match:</span>
          {[75, 85, 90].map((score) => (
            <button
              key={score}
              onClick={() => setMinScore(score)}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                minScore === score
                  ? "bg-[#0062e3] text-white shadow-xs"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              {score}%+
            </button>
          ))}
        </div>
      </div>

      {/* ── Matches Feed ── */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-44 bg-white/40 rounded-2xl border border-slate-200/60 animate-pulse" />
          ))}
        </div>
      ) : filteredMatches.length === 0 ? (
        <div className="text-center py-16 bg-white/60 backdrop-blur-md rounded-2xl border border-slate-200">
          <Sparkles className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <h3 className="text-base font-bold text-slate-700">No roles meet the {minScore}% match threshold</h3>
          <p className="text-xs text-slate-500 mt-1">Try lowering the threshold to 75% or updating your resume skills.</p>
          <button
            onClick={() => setMinScore(75)}
            className="mt-4 px-4 py-2 bg-blue-50 text-[#0062e3] text-xs font-bold rounded-xl hover:bg-blue-100 transition-colors"
          >
            Reset Threshold
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredMatches.map((job) => (
            <div
              key={job.id}
              onClick={() => setSelectedJob(job)}
              className="bg-white/80 backdrop-blur-xl border border-slate-200/80 hover:border-blue-400 hover:shadow-lg rounded-2xl p-5 transition-all flex flex-col justify-between group cursor-pointer"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-2.5">
                  <div>
                    <h3 className="font-bold text-slate-900 text-base leading-snug group-hover:text-[#0062e3] transition-colors">
                      {job.title}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                      <span className="font-semibold text-slate-700 flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5" />
                        {job.company}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        {job.location || job.city || "Remote"}
                      </span>
                      <span>•</span>
                      <span className="capitalize">{job.workplace_type || "Full-time"}</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end flex-shrink-0">
                    {typeof job.fit_score === "number" ? (
                      <>
                        <span className="font-mono text-sm font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 shadow-2xs">
                          {job.fit_score}%
                        </span>
                        <span className="text-[10px] text-slate-400 font-semibold mt-0.5">Match Fit</span>
                      </>
                    ) : (
                      <span className="text-[11px] font-bold text-[#0062e3] bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200/80 shadow-2xs">
                        Verified Live
                      </span>
                    )}
                  </div>
                </div>

                {/* Matched Competencies or Required Stack */}
                <div className="mt-3.5 pt-3 border-t border-slate-100">
                  {typeof job.fit_score === "number" && job.matched_skills && job.matched_skills.length > 0 ? (
                    <>
                      <div className="flex items-center gap-1 text-xs font-semibold text-emerald-700 mb-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Matched Competencies:</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {job.matched_skills.map((s, sIdx) => {
                          const sLabel = typeof s === "string" ? s : String(s || "");
                          return (
                            <span
                              key={`${job.id}-${sLabel}-${sIdx}`}
                              className="text-xs bg-emerald-50 text-emerald-800 font-medium px-2 py-0.5 rounded border border-emerald-200/80"
                            >
                              {sLabel}
                            </span>
                          );
                        })}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="text-xs font-semibold text-slate-500 mb-1.5">
                        <span>Required Stack:</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {extractSkillStrings(job.skills).length > 0 ? (
                          extractSkillStrings(job.skills).slice(0, 4).map((s, sIdx) => (
                            <span
                              key={`${job.id}-${s}-${sIdx}`}
                              className="text-xs bg-slate-100 text-slate-700 font-medium px-2 py-0.5 rounded border border-slate-200/80"
                            >
                              {s}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-slate-400">Software Engineering</span>
                        )}
                      </div>
                    </>
                  )}
                </div>

                {/* Job Description (JD) Sneak Peek */}
                {job.description && (
                  <div className="mt-3.5 bg-slate-50/70 p-3 rounded-xl border border-slate-100/90">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      <span>Job Description Overview</span>
                      <span className="text-[#0062e3] font-semibold lowercase tracking-normal flex items-center gap-1">
                        <Eye className="w-3 h-3" /> View full JD
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed font-normal">
                      {job.description}
                    </p>
                  </div>
                )}
              </div>

              {/* Bottom Actions */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-400 font-medium">Source: {job.platform || "Direct ATS"}</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedJob(job);
                    }}
                    className="inline-flex items-center gap-1.5 bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg font-bold shadow-2xs transition-colors cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5 text-slate-400" />
                    <span>View JD</span>
                  </button>
                  <a
                    href={job.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="btn-sweep inline-flex items-center gap-1.5 bg-[#0062e3] text-white px-3.5 py-1.5 rounded-lg font-bold shadow-xs hover:shadow-sm transition-all"
                  >
                    <span>Apply Now</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Rich Job Drawer with Full JD & Match Evaluation ── */}
      <JobDrawer
        job={selectedJob}
        isOpen={!!selectedJob}
        onClose={() => setSelectedJob(null)}
      />
    </div>
  );
}
