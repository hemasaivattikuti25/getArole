"use client";

import { useState } from "react";
import { CheckCircle2, MapPin, Sparkles, ExternalLink } from "lucide-react";

interface JobMatch {
  id: string;
  company: string;
  logoColor: string;
  logoLetters: string;
  title: string;
  location: string;
  type: string;
  fitScore: number;
  matchedCompetencies: string[];
  recommendation: string;
}

const SAMPLE_JOBS: JobMatch[] = [
  {
    id: "rzp-1",
    company: "Razorpay",
    logoColor: "bg-blue-600",
    logoLetters: "RZ",
    title: "Software Development Engineer - Payments",
    location: "Bengaluru",
    type: "Hybrid",
    fitScore: 96,
    matchedCompetencies: ["FastAPI", "React.js", "Docker", "PostgreSQL"],
    recommendation: "Strong alignment in backend services, asynchronous tasks, and API integration.",
  },
  {
    id: "goog-2",
    company: "Google India",
    logoColor: "bg-amber-600",
    logoLetters: "GO",
    title: "Software Engineer III - Cloud Infrastructure",
    location: "Hyderabad",
    type: "On-site",
    fitScore: 92,
    matchedCompetencies: ["Distributed Systems", "TypeScript", "Microservices"],
    recommendation: "Solid system design alignment. Highlights your experience in high-availability APIs.",
  },
  {
    id: "swig-3",
    company: "Swiggy",
    logoColor: "bg-orange-500",
    logoLetters: "SW",
    title: "Senior Backend Developer - Core Logistics",
    location: "Bengaluru",
    type: "Remote Available",
    fitScore: 89,
    matchedCompetencies: ["Python", "Redis Cache", "SQL Optimization"],
    recommendation: "Great fit for high-concurrency systems and data caching architectures.",
  },
];

export default function HeroPreview() {
  const [activeJobId, setActiveJobId] = useState<string>("rzp-1");
  const selectedJob = SAMPLE_JOBS.find((j) => j.id === activeJobId) || SAMPLE_JOBS[0];

  return (
    <div className="w-full max-w-4xl mx-auto mt-7 md:mt-9">
      {/* ═════════ MACOS WINDOW FRAME ═════════ */}
      <div className="bg-white/95 backdrop-blur-xl rounded-2xl border border-slate-200/90 shadow-xl shadow-slate-200/40 overflow-hidden text-left">
        {/* Window Topbar */}
        <div className="bg-slate-50/90 border-b border-slate-200/70 px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f56] inline-block"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e] inline-block"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-[#27c93f] inline-block"></span>
            <span className="ml-2 text-xs font-mono text-slate-500 hidden sm:inline">
              getarole.in / skill-alignment
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Live Fit Screener</span>
          </div>
        </div>

        {/* Window Body */}
        <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-100 bg-white">
          {/* Left Column: Candidate Profile (5 cols) */}
          <div className="lg:col-span-5 p-4 sm:p-5 bg-slate-50/50">
            <div className="text-[11px] font-mono uppercase tracking-wider font-semibold text-slate-400 mb-3">
              Your Profile Skills
            </div>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-sm shadow-xs flex-shrink-0">
                AJ
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm leading-tight">Alex Johnson</h4>
                <p className="text-xs text-slate-500 font-medium">Software Engineer • 2.5 yrs exp</p>
                <div className="flex items-center gap-1 text-slate-400 text-[11px] mt-0.5">
                  <MapPin className="w-3 h-3" />
                  <span>Bengaluru, India</span>
                </div>
              </div>
            </div>

            {/* Candidate Key Verified Competencies */}
            <div className="mb-4">
              <div className="text-xs font-semibold text-slate-700 mb-2">
                Indexed Competencies:
              </div>
              <div className="flex flex-wrap gap-1.5">
                {["FastAPI", "React.js", "TypeScript", "PostgreSQL", "Docker", "Redis"].map(
                  (skill) => (
                    <span
                      key={skill}
                      className="text-xs bg-white text-slate-700 font-medium px-2 py-0.5 rounded-md border border-slate-200 shadow-2xs"
                    >
                      {skill}
                    </span>
                  )
                )}
              </div>
            </div>

            {/* Selected Alignment Summary Box */}
            <div className="bg-white rounded-xl p-3.5 border border-slate-200/80 shadow-2xs">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-slate-800">
                  Fit for {selectedJob.company}
                </span>
                <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  {selectedJob.fitScore}%
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                {selectedJob.recommendation}
              </p>
            </div>
          </div>

          {/* Right Column: Roles Stream (7 cols) */}
          <div className="lg:col-span-7 p-4 sm:p-5 bg-white flex flex-col justify-between">
            <div>
              <div className="text-[11px] font-mono uppercase tracking-wider font-semibold text-slate-400 mb-3">
                Matching Openings
              </div>

              {/* Job Cards List */}
              <div className="space-y-2.5">
                {SAMPLE_JOBS.map((job) => {
                  const isSelected = job.id === activeJobId;
                  return (
                    <div
                      key={job.id}
                      onClick={() => setActiveJobId(job.id)}
                      className={`cursor-pointer rounded-xl p-3 border transition-all ${
                        isSelected
                          ? "bg-blue-50/40 border-[#0062e3] ring-1 ring-[#0062e3]/20 shadow-xs"
                          : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/40"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2.5">
                        <div className="flex items-start gap-2.5">
                          <div
                            className={`w-9 h-9 rounded-lg ${job.logoColor} text-white flex items-center justify-center font-bold text-xs flex-shrink-0 shadow-2xs`}
                          >
                            {job.logoLetters}
                          </div>
                          <div>
                            <h5 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
                              {job.title}
                            </h5>
                            <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                              <span className="font-semibold text-slate-700">{job.company}</span>
                              <span>•</span>
                              <span>{job.location}</span>
                              <span>•</span>
                              <span className="text-slate-500">{job.type}</span>
                            </div>
                          </div>
                        </div>

                        {/* Match Score Badge */}
                        <span
                          className={`font-mono font-bold text-xs px-2 py-0.5 rounded-full border ${
                            job.fitScore >= 90
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-blue-50 text-blue-700 border-blue-200"
                          }`}
                        >
                          {job.fitScore}%
                        </span>
                      </div>

                      {/* Expanded Preview on Active Item */}
                      {isSelected && (
                        <div className="mt-2.5 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1 text-emerald-700 font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Matches: {job.matchedCompetencies.join(", ")}</span>
                          </div>
                          <a
                            href="/explore"
                            className="text-[#0062e3] font-bold hover:underline inline-flex items-center gap-1"
                          >
                            <span>View Details</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
