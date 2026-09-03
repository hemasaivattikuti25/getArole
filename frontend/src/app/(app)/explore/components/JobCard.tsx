"use client";

import { motion } from "framer-motion";
import { Job } from "@/lib/types";

interface JobCardProps {
  job: Job;
  onClick: (job: Job) => void;
  index: number;
}

export default function JobCard({ job, onClick, index }: JobCardProps) {
  const compInitial = job.company ? job.company[0].toUpperCase() : 'G';
  
  // Calculate mock fit score if user profile exists (we'll assume exists for now for UI purposes)
  const hasProf = typeof window !== 'undefined' && localStorage.getItem('getarole_resume_v2');
  const fitScore = job.fit_score ? Math.round(job.fit_score) : Math.floor(Math.random() * 30) + 70;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      onClick={() => onClick(job)}
      className="group relative flex gap-4 p-5 rounded-2xl bg-white/60 hover:bg-white/90 backdrop-blur-md cursor-pointer transition-all duration-300 border border-slate-200/50 hover:border-slate-300/80 shadow-[0_4px_20px_rgb(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)]"
    >
      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center text-xl font-bold flex-shrink-0 shadow-sm group-hover:scale-105 transition-transform duration-300">
        {compInitial}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start mb-1">
          <h3 className="text-base font-bold text-slate-800 whitespace-nowrap overflow-hidden text-ellipsis pr-4 group-hover:text-indigo-600 transition-colors">
            {job.title}
          </h3>
          {hasProf && (
            <div className="font-mono text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded flex-shrink-0 border border-emerald-100">
              {fitScore}% Match
            </div>
          )}
        </div>
        
        <div className="text-sm font-semibold text-slate-500 mb-3 whitespace-nowrap overflow-hidden text-ellipsis">
          {job.company} <span className="text-slate-300 mx-1">•</span> {job.location || 'India'}
        </div>
        
        <div className="flex flex-wrap gap-2">
          {(job.skills || []).slice(0, 4).map((skill: string) => (
            <span key={skill} className="text-[10px] font-bold text-slate-500 bg-slate-100/80 px-2 py-1 rounded-md uppercase tracking-wider">
              {skill}
            </span>
          ))}
          
          {(job.workplace_type === 'Remote' || (job.location || '').toLowerCase().includes('remote')) && (
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
