'use client';

import React from 'react';
import DashboardStats from '@/components/features/dashboard/DashboardStats';
import Link from 'next/link';
import { ArrowRight, Sparkles, Building2, MapPin } from 'lucide-react';

export default function DashboardPage() {
  return (
    <div className="w-full px-4 md:px-6 py-8">
      {/* ── Dashboard Content (Stats, Hero, 4-Step Widget) ── */}
      <DashboardStats />

      {/* ── Top AI Matches Preview Section ── */}
      <div className="bg-gradient-to-br from-white to-slate-50 border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 pb-6 border-b border-slate-200 gap-4">
          <div>
            <h2 className="text-[22px] font-extrabold text-slate-900 flex items-center gap-2 font-outfit">
              <Sparkles className="w-5 h-5 text-indigo-500" />
              Recommended Opportunities
            </h2>
            <p className="text-[14px] text-slate-500 font-medium mt-1">
              Roles that match your skills and preferences.
            </p>
          </div>
          <Link 
            href="/matches"
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 rounded-xl text-[13px] font-bold transition-colors"
          >
            View All Matches <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Mock Matches Grid for Preview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[
            { role: 'Frontend Engineer', company: 'TechCorp', location: 'Remote', score: 95 },
            { role: 'React Developer', company: 'InnovateSpace', location: 'New York, NY', score: 92 },
            { role: 'Full Stack Dev', company: 'GlobalWeb', location: 'San Francisco, CA', score: 88 },
          ].map((job, idx) => (
            <div key={idx} className="bg-white border border-slate-200 rounded-xl p-5 hover:border-indigo-300 hover:shadow-lg hover:-translate-y-1 transition-all duration-200 cursor-pointer group">
              <div className="flex justify-between items-start mb-3">
                <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center font-bold text-indigo-700">
                  {job.company[0]}
                </div>
                <div className="bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-md text-xs font-bold font-mono">
                  {job.score}% Match
                </div>
              </div>
              <h3 className="text-[16px] font-extrabold text-slate-900 mb-1 group-hover:text-indigo-600 transition-colors font-outfit">
                {job.role}
              </h3>
              <div className="flex items-center gap-3 text-[13px] text-slate-500 font-medium">
                <span className="flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5" /> {job.company}</span>
                <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> {job.location}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
