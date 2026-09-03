'use client';

import { JobListing } from '@/lib/types';
import { useDashboardStore } from '@/lib/store/dashboard-store';
import { Building2, MapPin, Clock, Bookmark } from 'lucide-react';
import clsx from 'clsx';
import { motion } from 'framer-motion';

export default function SavedJobsList({ jobs }: { jobs: JobListing[] }) {
  const { selectedJobId, setSelectedJobId } = useDashboardStore();

  return (
    <div className="flex flex-col gap-3 overflow-y-auto h-[calc(100vh-220px)] pr-2 pb-12 custom-scrollbar">
      {jobs.map((job, idx) => {
        const isSelected = selectedJobId === job.id;
        
        return (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.05 }}
            key={job.id}
            data-job-id={job.id}
            onClick={() => setSelectedJobId(job.id)}
            className={clsx(
              "p-4 rounded-xl border transition-all duration-200 cursor-pointer relative overflow-hidden group",
              isSelected 
                ? "bg-white border-sky-300 shadow-md ring-1 ring-sky-200"
                : "bg-white/60 border-slate-200 hover:bg-white hover:border-sky-200 hover:shadow-sm"
            )}
          >
            {isSelected && (
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-sky-400 to-purple-500" />
            )}
            
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700">
                  {job.company.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 group-hover:text-sky-600 transition-colors line-clamp-1">{job.title}</h3>
                  <p className="text-sm font-semibold text-slate-500">{job.company}</p>
                </div>
              </div>
              <Bookmark className={clsx("w-5 h-5", job.status === 'saved' ? "fill-sky-500 text-sky-500" : "text-slate-300")} />
            </div>

            <div className="flex items-center gap-3 mt-3 text-xs font-medium text-slate-500">
              <div className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                {job.location}
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {job.posted_at}
              </div>
            </div>

            {/* Tags */}
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="px-2 py-1 rounded-md bg-slate-100 text-slate-600 text-xs font-semibold">
                {job.type}
              </span>
              {job.match_score && (
                <span className="px-2 py-1 rounded-md bg-emerald-50 text-emerald-600 text-xs font-bold ring-1 ring-emerald-200 ring-inset">
                  {job.match_score}% Match
                </span>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
