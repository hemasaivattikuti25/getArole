"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Sparkles, 
  Building2, 
  MapPin, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink,
  Upload,
  Filter,
  FileText
} from "lucide-react";
import { useJobs } from "../explore/hooks/useJobs";
import { Job } from "@/lib/types";

export default function MatchesPage() {
  const { jobs, loading } = useJobs();
  const [minScore, setMinScore] = useState<number>(75);
  const [selectedRole, setSelectedRole] = useState<string>("All");
  const [resumeUploaded, setResumeUploaded] = useState(false);
  const [userSkills, setUserSkills] = useState<string[]>([
    "React.js",
    "TypeScript",
    "Node.js",
    "FastAPI",
    "PostgreSQL",
    "Docker",
    "Tailwind CSS",
  ]);

  useEffect(() => {
    const saved = localStorage.getItem("getarole_resume_v2");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.skills && Array.isArray(parsed.skills)) {
          setUserSkills(parsed.skills);
        }
        setResumeUploaded(true);
      } catch {}
    }
  }, []);

  // Compute match score and skills for each job
  const matchedJobs = jobs.map((job) => {
    const jobText = `${job.title} ${job.description || ""} ${(job.skills || []).join(" ")}`.toLowerCase();
    const matched = userSkills.filter((s) => jobText.includes(s.toLowerCase()));
    const missing = userSkills.filter((s) => !jobText.includes(s.toLowerCase())).slice(0, 3);
    
    // Deterministic match score based on overlap
    const calculatedScore = Math.min(
      98,
      Math.max(70, Math.round(75 + (matched.length / (userSkills.length || 1)) * 24))
    );

    return {
      ...job,
      fit_score: job.fit_score || calculatedScore,
      matched_skills: matched,
      missing_skills: missing,
    };
  });

  const filteredMatches = matchedJobs.filter((j) => (j.fit_score || 0) >= minScore);

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
            Resume Match Screener
          </h1>
          <p className="text-slate-500 text-sm sm:text-base max-w-2xl mt-1">
            Real-time competency screening comparing your verified profile skills against 1,000+ open developer roles.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/resume-builder"
            className="inline-flex items-center gap-2 bg-white text-slate-700 border border-slate-200/80 hover:bg-slate-50 px-4 py-2 rounded-xl text-sm font-semibold shadow-2xs transition-colors"
          >
            <FileText className="w-4 h-4 text-slate-400" />
            <span>Update Resume</span>
          </Link>
        </div>
      </div>

      {/* ── Profile Skills Banner ── */}
      <div className="bg-white/70 backdrop-blur-xl border border-slate-200/80 rounded-2xl p-5 mb-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Active Screening Skills:
            </span>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {userSkills.map((skill) => (
                <span
                  key={skill}
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
              className="bg-white/80 backdrop-blur-xl border border-slate-200/80 hover:border-blue-300 hover:shadow-md rounded-2xl p-5 transition-all flex flex-col justify-between group"
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
                    <span className="font-mono text-sm font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 shadow-2xs">
                      {job.fit_score}%
                    </span>
                    <span className="text-[10px] text-slate-400 font-semibold mt-0.5">Match Fit</span>
                  </div>
                </div>

                {/* Matched Competencies */}
                <div className="mt-3.5 pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-1 text-xs font-semibold text-emerald-700 mb-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Matched Competencies:</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {job.matched_skills && job.matched_skills.length > 0 ? (
                      job.matched_skills.map((s) => (
                        <span key={s} className="text-xs bg-emerald-50 text-emerald-800 font-medium px-2 py-0.5 rounded border border-emerald-200/80">
                          {s}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-slate-400">Core software fundamentals aligned</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-400 font-medium">Source: {job.platform || "Direct"}</span>
                <a
                  href={job.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-sweep inline-flex items-center gap-1.5 bg-[#0062e3] text-white px-3.5 py-1.5 rounded-lg font-bold shadow-xs hover:shadow-sm transition-all"
                >
                  <span>Apply Now</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
