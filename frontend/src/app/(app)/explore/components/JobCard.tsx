"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Job } from "@/lib/types";
import { extractSkillStrings } from "@/lib/skills-utils";
import { openLinkedInReferralSearch } from "@/lib/linkedin-utils";

interface JobCardProps {
  job: Job;
  onClick: (job: Job) => void;
  index: number;
}

export default function JobCard({ job, onClick, index }: JobCardProps) {
  const [showRefMenu, setShowRefMenu] = useState(false);
  const compInitial = job.company ? job.company[0].toUpperCase() : "G";

  const isLinkedIn = Boolean(
    (job.platform || "").toLowerCase().includes("linkedin") ||
      (job.url || "").toLowerCase().includes("linkedin")
  );

  // Calculate real match score based on user's actual profile skills (zero fake/mock values)
  const realScore = useMemo(() => {
    if (typeof job.fit_score === "number") return Math.round(job.fit_score);
    if (typeof window === "undefined") return null;

    let userSkills: string[] = [];
    try {
      const savedResume = localStorage.getItem("getarole_resume_v2");
      if (savedResume) {
        const parsed = JSON.parse(savedResume);
        if (parsed.skills) userSkills = extractSkillStrings(parsed.skills);
      }
      if (userSkills.length === 0) {
        const savedProfile = localStorage.getItem("getarole_profile");
        if (savedProfile) {
          const prof = JSON.parse(savedProfile);
          const profSkills = [
            ...(prof.skills || []),
            ...(prof.skills_languages || []),
            ...(prof.skills_frameworks || []),
            ...(prof.skills_cloud || []),
            ...(prof.skills_tools || []),
          ];
          userSkills = extractSkillStrings(profSkills);
        }
      }
    } catch {}

    if (userSkills.length === 0) return null;

    const jobTitle = typeof job.title === "string" ? job.title : "";
    const jobDesc = typeof job.description === "string" ? job.description : "";
    const jobSkills = extractSkillStrings(job.skills);
    const jobText = `${jobTitle} ${jobDesc} ${jobSkills.join(" ")}`.toLowerCase();

    const matched = userSkills.filter(
      (s) => typeof s === "string" && s.trim().length > 0 && jobText.includes(s.toLowerCase())
    );
    if (matched.length === 0) return null;

    return Math.min(98, Math.max(65, Math.round(65 + (matched.length / (userSkills.length || 1)) * 33)));
  }, [job]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      onClick={() => onClick(job)}
      className="group relative flex gap-4 p-5 rounded-2xl bg-white/60 hover:bg-white/95 backdrop-blur-md cursor-pointer transition-all duration-300 border border-slate-200/60 hover:border-slate-300 shadow-[0_4px_20px_rgb(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)]"
    >
      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center text-xl font-bold flex-shrink-0 shadow-sm group-hover:scale-105 transition-transform duration-300 font-outfit">
        {compInitial}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start mb-1">
          <div className="flex items-center gap-2 min-w-0">
            <h3 className="text-base font-bold text-slate-800 whitespace-nowrap overflow-hidden text-ellipsis group-hover:text-indigo-600 transition-colors">
              {job.title}
            </h3>
            {isLinkedIn && (
              <span
                className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-[#0A66C2]/10 text-[#0A66C2] text-[10px] font-extrabold flex-shrink-0"
                title="Verified LinkedIn Posting"
              >
                in
              </span>
            )}
          </div>
          {realScore !== null && (
            <div className="font-mono text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded flex-shrink-0 border border-emerald-100 ml-2">
              {realScore}% Match
            </div>
          )}
        </div>

        <div className="text-sm font-semibold text-slate-500 mb-3 whitespace-nowrap overflow-hidden text-ellipsis flex items-center justify-between">
          <span>
            {job.company} <span className="text-slate-300 mx-1">•</span> {job.location || "India"}
          </span>

          {/* Quick LinkedIn Referral Action on Card */}
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setShowRefMenu(!showRefMenu)}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 bg-indigo-50/90 hover:bg-indigo-100 px-2.5 py-0.5 rounded-md border border-indigo-200/70 transition-colors"
              title="Connect with recruiters and engineers at this company"
            >
              <span>🤝 Referrals</span>
              <span className="text-[8px] opacity-70">▼</span>
            </button>

            {showRefMenu && (
              <div
                className="absolute right-0 top-full mt-1.5 w-56 bg-white border border-slate-200 rounded-xl shadow-lg p-2 z-30 animate-scaleUp text-left"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 px-2 py-1 border-b border-slate-100 mb-1">
                  LinkedIn Outreach
                </div>
                <button
                  type="button"
                  onClick={() => {
                    openLinkedInReferralSearch(job.company, "hr");
                    setShowRefMenu(false);
                  }}
                  className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-indigo-50 text-xs font-bold text-slate-700 transition-colors text-left"
                >
                  <span className="flex items-center gap-1.5">
                    <span>🎯</span> Find HR / Recruiters
                  </span>
                  <span className="text-[10px] text-slate-400">↗</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    openLinkedInReferralSearch(job.company, "eng");
                    setShowRefMenu(false);
                  }}
                  className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-indigo-50 text-xs font-bold text-slate-700 transition-colors text-left"
                >
                  <span className="flex items-center gap-1.5">
                    <span>👥</span> Find Engineering Peers
                  </span>
                  <span className="text-[10px] text-slate-400">↗</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    openLinkedInReferralSearch(job.company, "alumni");
                    setShowRefMenu(false);
                  }}
                  className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-indigo-50 text-xs font-bold text-slate-700 transition-colors text-left"
                >
                  <span className="flex items-center gap-1.5">
                    <span>🎓</span> Find College Alumni
                  </span>
                  <span className="text-[10px] text-slate-400">↗</span>
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {extractSkillStrings(job.skills).slice(0, 4).map((skill, sIdx) => (
            <span key={`${skill}-${sIdx}`} className="text-[10px] font-bold text-slate-500 bg-slate-100/80 px-2 py-1 rounded-md uppercase tracking-wider">
              {skill}
            </span>
          ))}

          {(job.workplace_type === "Remote" || (job.location || "").toLowerCase().includes("remote")) && (
            <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-1 rounded-md uppercase tracking-wider border border-purple-100">
              Remote
            </span>
          )}

          {job.stipend_or_salary && (
            <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-md uppercase tracking-wider border border-amber-100">
              {job.stipend_or_salary}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
