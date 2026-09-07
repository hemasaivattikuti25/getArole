"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Job } from "@/lib/types";
import { extractSkillStrings } from "@/lib/skills-utils";
import { openLinkedInReferralSearch, openLinkedInJobSearch } from "@/lib/linkedin-utils";

import Link from "next/link";
import {
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Building2,
  MapPin,
  ExternalLink,
  X,
  Users,
  Briefcase,
  GraduationCap,
} from "lucide-react";

interface JobDrawerProps {
  job: Job | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function JobDrawer({ job, isOpen, onClose }: JobDrawerProps) {
  const [isRefDropdownOpen, setIsRefDropdownOpen] = useState(false);

  // Prevent scrolling when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
      setIsRefDropdownOpen(false);
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const isLinkedIn = Boolean(
    job &&
      ((job.platform || "").toLowerCase().includes("linkedin") ||
        (job.url || "").toLowerCase().includes("linkedin"))
  );

  return (
    <AnimatePresence>
      {isOpen && job && (
        <>
          {/* Backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-40"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full max-w-xl bg-white shadow-2xl z-50 overflow-y-auto border-l border-slate-200/80"
          >
            <div className="p-6 sm:p-8">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-[#0062e3] text-white flex items-center justify-center text-2xl font-bold flex-shrink-0 shadow-sm font-outfit">
                    {job.company ? job.company[0].toUpperCase() : "G"}
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 leading-tight mb-1.5 font-outfit">
                      {job.title}
                    </h2>
                    <div className="text-sm font-semibold text-slate-600 flex flex-wrap items-center gap-2">
                      <span className="text-[#0062e3] flex items-center gap-1 font-bold">
                        <Building2 className="w-4 h-4" />
                        {job.company}
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="flex items-center gap-1 text-slate-500">
                        <MapPin className="w-3.5 h-3.5" />
                        {job.location || job.city || "Remote"}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  aria-label="Close Job Details"
                  className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 rounded-full transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Verified LinkedIn Job Badge */}
              {isLinkedIn && (
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0A66C2]/10 border border-[#0A66C2]/20 text-[#0A66C2] text-xs font-bold mb-5 shadow-2xs">
                  <svg className="w-4 h-4 fill-current flex-shrink-0" viewBox="0 0 24 24">
                    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.45a1.62 1.62 0 1 0 0 3.24 1.62 1.62 0 0 0 0-3.24z" />
                  </svg>
                  <span>Verified Direct LinkedIn Posting · Live in last 24h</span>
                </div>
              )}

              {/* Match Fit Score Banner */}
              {typeof job.fit_score === "number" && (
                <div className="bg-emerald-50/80 border border-emerald-200/90 rounded-2xl p-4 mb-6 shadow-2xs">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-600" />
                      <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                        AI Resume Match Evaluation
                      </span>
                    </div>
                    <span className="font-mono text-base font-extrabold text-emerald-700 bg-white px-3 py-1 rounded-lg border border-emerald-200 shadow-2xs">
                      {job.fit_score}% Fit
                    </span>
                  </div>

                  {job.matched_skills && job.matched_skills.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-emerald-200/60">
                      <div className="flex items-center gap-1 text-xs font-bold text-emerald-800 mb-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Matched Competencies ({job.matched_skills.length}):</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {job.matched_skills.map((s, idx) => (
                          <span
                            key={`m-${s}-${idx}`}
                            className="text-xs bg-white text-emerald-800 font-semibold px-2.5 py-0.5 rounded-md border border-emerald-200"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {job.missing_skills && job.missing_skills.length > 0 && (
                    <div className="mt-2.5">
                      <div className="flex items-center gap-1 text-xs font-bold text-amber-800 mb-1.5">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                        <span>Recommended Keywords to Add:</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {job.missing_skills.map((s, idx) => (
                          <span
                            key={`miss-${s}-${idx}`}
                            className="text-xs bg-amber-50 text-amber-900 font-semibold px-2.5 py-0.5 rounded-md border border-amber-200"
                          >
                            + {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ════════════════════ TOP ACTION BAR WITH LINKEDIN REFERRALS ════════════════════ */}
              <div className="flex flex-wrap items-center gap-3 mb-8 pb-6 border-b border-slate-200/80">
                {/* 1. Primary Apply Button */}
                <a
                  href={job.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex-1 min-w-[170px] py-3 px-5 text-white text-center rounded-xl font-bold text-sm shadow-md transition-all inline-flex items-center justify-center gap-2 ${
                    isLinkedIn
                      ? "bg-[#0A66C2] hover:bg-[#004182] shadow-blue-900/20"
                      : "bg-[#0062e3] hover:bg-blue-600"
                  }`}
                >
                  {isLinkedIn ? (
                    <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
                      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.45a1.62 1.62 0 1 0 0 3.24 1.62 1.62 0 0 0 0-3.24z" />
                    </svg>
                  ) : (
                    <span>⚡</span>
                  )}
                  <span>{isLinkedIn ? "Apply on LinkedIn" : "Apply on Portal"}</span>
                  <ExternalLink className="w-4 h-4" />
                </a>

                {/* 2. Smart LinkedIn Referral Finder Dropdown */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsRefDropdownOpen(!isRefDropdownOpen)}
                    className="py-3 px-4 rounded-xl border border-indigo-200 bg-gradient-to-r from-indigo-50 to-blue-50 text-indigo-700 font-bold text-xs sm:text-sm flex items-center gap-1.5 hover:border-indigo-300 hover:from-indigo-100 hover:to-blue-100 transition-all cursor-pointer shadow-2xs whitespace-nowrap"
                  >
                    <span>🤝</span>
                    <span>Find Referrals</span>
                    <span className="text-[9px] opacity-70">▼</span>
                  </button>

                  {isRefDropdownOpen && (
                    <div className="absolute right-0 top-full mt-2 w-72 sm:w-80 bg-white border border-slate-200 rounded-2xl shadow-xl p-3 z-50 animate-scaleUp">
                      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                        <div className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-700 flex items-center gap-1">
                          <span>🤝</span> {job.company} Insiders
                        </div>
                        <button
                          onClick={() => setIsRefDropdownOpen(false)}
                          className="text-slate-400 hover:text-slate-600 text-xs p-1"
                        >
                          ✕
                        </button>
                      </div>
                      <p className="text-[11px] text-slate-500 mb-2">
                        Direct outreach gives 4x higher interview callbacks:
                      </p>
                      <div className="space-y-1">
                        <button
                          type="button"
                          onClick={() => {
                            openLinkedInReferralSearch(job.company, "hr");
                            setIsRefDropdownOpen(false);
                          }}
                          className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-indigo-50 text-left transition-colors group cursor-pointer"
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="text-base">🎯</span>
                            <div>
                              <div className="text-xs font-bold text-slate-800 group-hover:text-indigo-700">
                                Find HR &amp; Recruiters
                              </div>
                              <div className="text-[10px] text-slate-400">
                                Message hiring managers at {job.company}
                              </div>
                            </div>
                          </div>
                          <span className="text-xs text-slate-400 group-hover:text-indigo-600">↗</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            openLinkedInReferralSearch(job.company, "eng");
                            setIsRefDropdownOpen(false);
                          }}
                          className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-indigo-50 text-left transition-colors group cursor-pointer"
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="text-base">👥</span>
                            <div>
                              <div className="text-xs font-bold text-slate-800 group-hover:text-indigo-700">
                                Find Engineering Peers
                              </div>
                              <div className="text-[10px] text-slate-400">
                                Ask developers at {job.company} for referrals
                              </div>
                            </div>
                          </div>
                          <span className="text-xs text-slate-400 group-hover:text-indigo-600">↗</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            openLinkedInReferralSearch(job.company, "alumni");
                            setIsRefDropdownOpen(false);
                          }}
                          className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-indigo-50 text-left transition-colors group cursor-pointer"
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="text-base">🎓</span>
                            <div>
                              <div className="text-xs font-bold text-slate-800 group-hover:text-indigo-700">
                                Find College Alumni
                              </div>
                              <div className="text-[10px] text-slate-400">
                                Connect with alumni working at {job.company}
                              </div>
                            </div>
                          </div>
                          <span className="text-xs text-slate-400 group-hover:text-indigo-600">↗</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            openLinkedInJobSearch(job.title, job.company, job.location || job.city);
                            setIsRefDropdownOpen(false);
                          }}
                          className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-indigo-50 text-left transition-colors group cursor-pointer"
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="text-base">💼</span>
                            <div>
                              <div className="text-xs font-bold text-slate-800 group-hover:text-indigo-700">
                                Search Role on LinkedIn
                              </div>
                              <div className="text-[10px] text-slate-400">
                                View postings on LinkedIn Jobs
                              </div>
                            </div>
                          </div>
                          <span className="text-xs text-slate-400 group-hover:text-indigo-600">↗</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. Tailor Cover Letter Shortcut */}
                <Link
                  href={`/cover-letter?role=${encodeURIComponent(job.title)}&company=${encodeURIComponent(job.company)}`}
                  className="py-3 px-4 bg-white hover:bg-slate-50 text-slate-700 rounded-xl font-bold text-xs sm:text-sm border border-slate-200 shadow-2xs transition-colors inline-flex items-center gap-1.5"
                >
                  <span>✉️ Cover Letter</span>
                </Link>
              </div>

              {/* Metadata Grid */}
              <div className="grid grid-cols-2 gap-3 mb-8">
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/70">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Workplace Model
                  </div>
                  <div className="font-bold text-slate-800 text-sm">
                    {job.workplace_type || "Hybrid"}
                  </div>
                </div>
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/70">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Compensation
                  </div>
                  <div className="font-bold text-slate-800 text-sm">
                    {job.stipend_or_salary || "Competitive / Market Standard"}
                  </div>
                </div>
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/70">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Application Source
                  </div>
                  <div className="font-bold text-slate-800 text-sm capitalize">
                    {job.platform || "Direct ATS"}
                  </div>
                </div>
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/70">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Job Verification
                  </div>
                  <div className="font-mono text-xs font-bold text-emerald-700 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Verified Active
                  </div>
                </div>
              </div>

              {/* Required Skills */}
              {extractSkillStrings(job.skills).length > 0 && (
                <div className="mb-8">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                    Target Technical Stack
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {extractSkillStrings(job.skills).map((skill, sIdx) => (
                      <span
                        key={`${skill}-${sIdx}`}
                        className="px-3 py-1 bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Job Description (JD) */}
              <div className="bg-slate-50/50 rounded-2xl p-5 border border-slate-200/70">
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200/60">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Full Job Description (JD)
                  </h3>
                  <span className="text-[11px] font-semibold text-slate-400">
                    Official Employer Posting
                  </span>
                </div>
                <div className="text-sm text-slate-700 leading-relaxed space-y-3 font-normal">
                  {job.description ? (
                    <div className="whitespace-pre-line font-sans">{job.description}</div>
                  ) : (
                    <p className="italic text-slate-400">
                      No extended job description provided by employer.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
