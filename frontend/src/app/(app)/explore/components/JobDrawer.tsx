"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Job } from "@/lib/types";
import { useEffect } from "react";
import { extractSkillStrings } from "@/lib/skills-utils";

import Link from "next/link";
import { Sparkles, CheckCircle2, AlertCircle, Building2, MapPin, ExternalLink, X } from "lucide-react";

interface JobDrawerProps {
  job: Job | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function JobDrawer({ job, isOpen, onClose }: JobDrawerProps) {
  // Prevent scrolling when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

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
              <div className="flex items-start justify-between mb-6">
                <div className="flex gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-[#0062e3] text-white flex items-center justify-center text-2xl font-bold flex-shrink-0 shadow-sm font-outfit">
                    {job.company ? job.company[0].toUpperCase() : 'G'}
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
                        {job.location || job.city || 'Remote'}
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

              {/* Match Fit Score Banner (if available) */}
              {typeof job.fit_score === 'number' && (
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

              {/* Action Bar */}
              <div className="flex flex-wrap gap-3 mb-8 pb-6 border-b border-slate-200/80">
                <a 
                  href={job.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex-1 min-w-[160px] py-3 px-5 bg-[#0062e3] hover:bg-blue-600 text-white text-center rounded-xl font-bold text-sm shadow-md transition-all inline-flex items-center justify-center gap-2"
                >
                  <span>Apply on Official Portal</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
                <Link
                  href={`/cover-letter?role=${encodeURIComponent(job.title)}&company=${encodeURIComponent(job.company)}`}
                  className="py-3 px-5 bg-white hover:bg-slate-50 text-slate-700 rounded-xl font-bold text-sm border border-slate-200 shadow-2xs transition-colors inline-flex items-center gap-1.5"
                >
                  <span>✉️ Tailor Cover Letter</span>
                </Link>
              </div>

              {/* Metadata Grid */}
              <div className="grid grid-cols-2 gap-3 mb-8">
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/70">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Workplace Model</div>
                  <div className="font-bold text-slate-800 text-sm">{job.workplace_type || 'Hybrid'}</div>
                </div>
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/70">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Compensation</div>
                  <div className="font-bold text-slate-800 text-sm">{job.stipend_or_salary || 'Competitive / Market Standard'}</div>
                </div>
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/70">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Application Source</div>
                  <div className="font-bold text-slate-800 text-sm capitalize">{job.platform || 'Direct ATS'}</div>
                </div>
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/70">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Job Verification</div>
                  <div className="font-mono text-xs font-bold text-emerald-700 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Verified Active
                  </div>
                </div>
              </div>

              {/* Required Skills */}
              {extractSkillStrings(job.skills).length > 0 && (
                <div className="mb-8">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Target Technical Stack</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {extractSkillStrings(job.skills).map((skill, sIdx) => (
                      <span key={`${skill}-${sIdx}`} className="px-3 py-1 bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold">
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
                  <span className="text-[11px] font-semibold text-slate-400">Official Employer Posting</span>
                </div>
                <div className="text-sm text-slate-700 leading-relaxed space-y-3 font-normal">
                  {job.description ? (
                    <div className="whitespace-pre-line font-sans">{job.description}</div>
                  ) : (
                    <p className="italic text-slate-400">No extended job description provided by employer.</p>
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
