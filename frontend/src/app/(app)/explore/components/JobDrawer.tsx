"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Job } from "@/lib/types";
import { useEffect } from "react";

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
            className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full max-w-xl bg-white/95 backdrop-blur-2xl shadow-2xl z-50 overflow-y-auto border-l border-slate-200/60"
          >
            <div className="p-8">
              {/* Header */}
              <div className="flex items-start justify-between mb-8">
                <div className="flex gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center text-3xl font-bold flex-shrink-0 shadow-sm">
                    {job.company ? job.company[0].toUpperCase() : 'G'}
                  </div>
                  <div>
                    <h2 className="text-2xl font-extrabold text-slate-800 leading-tight mb-2 font-outfit">
                      {job.title}
                    </h2>
                    <div className="text-base font-semibold text-indigo-600 flex items-center gap-2">
                      {job.company} 
                      <span className="text-slate-300">•</span>
                      <span className="text-slate-600">{job.location || 'India'}</span>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={onClose}
                  className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
              </div>

              {/* Action Bar */}
              <div className="flex flex-wrap gap-4 mb-10 pb-8 border-b border-slate-200/60">
                <a 
                  href={job.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex-1 py-3 px-6 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-center rounded-xl font-bold text-sm shadow-md transition-all hover:-translate-y-0.5"
                >
                  Apply Now →
                </a>
                <button className="py-3 px-6 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl font-bold text-sm border border-emerald-200 transition-colors">
                  ✉️ Tailor Cover Letter
                </button>
              </div>

              {/* Metadata Grid */}
              <div className="grid grid-cols-2 gap-6 mb-10">
                <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Workplace Model</div>
                  <div className="font-semibold text-slate-700">{job.workplace_type || 'On-site'}</div>
                </div>
                <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Compensation</div>
                  <div className="font-semibold text-slate-700">{job.stipend_or_salary || 'Not Disclosed'}</div>
                </div>
                <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Platform</div>
                  <div className="font-semibold text-slate-700 capitalize">{job.platform || 'Direct'}</div>
                </div>
                <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Job ID</div>
                  <div className="font-mono text-xs font-bold text-slate-500">{job.id.substring(0,8)}...</div>
                </div>
              </div>

              {/* Skills */}
              {job.skills && job.skills.length > 0 && (
                <div className="mb-10">
                  <h3 className="text-[13px] font-bold text-slate-800 uppercase tracking-wider mb-4">Required Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {job.skills.map(skill => (
                      <span key={skill} className="px-3 py-1.5 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-lg text-xs font-bold tracking-wide">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Description */}
              <div>
                <h3 className="text-[13px] font-bold text-slate-800 uppercase tracking-wider mb-4">Role Overview</h3>
                <div className="prose prose-slate prose-sm max-w-none text-slate-600 leading-relaxed">
                  {job.description ? (
                    <div dangerouslySetInnerHTML={{ __html: job.description.replace(/\n/g, '<br/>') }} />
                  ) : (
                    <p className="italic text-slate-400">No detailed description provided for this role.</p>
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
