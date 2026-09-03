'use client';

import { JobListing } from '@/lib/types';
import AIMatchRing from './AIMatchRing';
import { Sparkles, MapPin, Building2, ExternalLink, FileText, Bot } from 'lucide-react';
import { motion } from 'framer-motion';

export default function JobDetailPane({ job }: { job: JobListing | null }) {
  if (!job) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-400 bg-white/40 rounded-2xl border border-slate-200/50">
        <Bot className="w-12 h-12 mb-4 opacity-50" />
        <p className="font-medium">Select a job to view details and AI insights</p>
      </div>
    );
  }

  return (
    <motion.div 
      key={job.id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="h-full bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col"
    >
      {/* Header */}
      <div className="p-6 border-b border-slate-100">
        <div className="flex justify-between items-start gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2 font-outfit">{job.title}</h1>
            <div className="flex items-center gap-4 text-sm font-semibold text-slate-500">
              <span className="flex items-center gap-1.5"><Building2 className="w-4 h-4" /> {job.company}</span>
              <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" /> {job.location}</span>
            </div>
          </div>
          <button className="px-4 py-2 bg-slate-900 text-white rounded-lg font-bold text-sm hover:bg-slate-800 transition-colors flex items-center gap-2">
            Apply Now <ExternalLink className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
        {/* AI Match Card */}
        {job.match_score && job.match_details && (
          <div className="bg-slate-50 rounded-xl p-6 border border-slate-200 mb-8 flex items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <AIMatchRing score={job.match_score} />
              <div>
                <h3 className="font-bold text-slate-900 text-lg mb-1 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-sky-500" /> AI Resume Match
                </h3>
                <p className="text-sm text-slate-600">Your profile is a strong fit for this role. You hit key requirements like {job.match_details.strengths[0]} and {job.match_details.strengths[1]}.</p>
              </div>
            </div>
            <div className="flex flex-col gap-2 shrink-0">
              <button className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-bold shadow-sm hover:bg-slate-50 transition-colors flex items-center gap-2">
                <FileText className="w-4 h-4 text-sky-500" /> Tailor Resume
              </button>
            </div>
          </div>
        )}

        {/* Missing Skills Alert */}
        {job.match_details && job.match_details.missing.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-8">
            <h4 className="font-bold text-amber-800 mb-2 text-sm">Skills to highlight or learn</h4>
            <div className="flex flex-wrap gap-2">
              {job.match_details.missing.map(skill => (
                <span key={skill} className="px-2 py-1 bg-white text-amber-700 text-xs font-bold rounded-md border border-amber-200">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Job Description (Mocked Markdown styling) */}
        <div>
          <h2 className="text-lg font-bold text-slate-900 mb-4 font-outfit">Job Description</h2>
          <div className="prose prose-slate prose-sm max-w-none whitespace-pre-wrap">
            {job.description}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
