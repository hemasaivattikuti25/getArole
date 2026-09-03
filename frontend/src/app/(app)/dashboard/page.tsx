'use client';

import { useEffect, useState } from 'react';
import DashboardStats from '@/components/features/dashboard/DashboardStats';
import SavedJobsList from '@/components/features/dashboard/SavedJobsList';
import JobDetailPane from '@/components/features/dashboard/JobDetailPane';
import { mockSavedJobs } from '@/lib/mock-data';
import { useDashboardStore } from '@/lib/store/dashboard-store';
import { JobListing } from '@/lib/types';

export default function DashboardPage() {
  const { selectedJobId, setSelectedJobId } = useDashboardStore();
  const [isMobilePaneOpen, setIsMobilePaneOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
    // Select the first job by default on desktop
    if (mockSavedJobs.length > 0 && !selectedJobId) {
      setSelectedJobId(mockSavedJobs[0].id);
    }
  }, [selectedJobId, setSelectedJobId]);

  if (!mounted) return null;

  const selectedJob = mockSavedJobs.find(job => job.id === selectedJobId) || null;

  // Intercept the store setter to also open the mobile pane when a job is clicked
  const handleJobSelect = (id: string) => {
    setSelectedJobId(id);
    setIsMobilePaneOpen(true);
  };

  return (
    <div className="p-6 h-screen flex flex-col max-w-[1600px] mx-auto w-full">
      {/* Welcome Hero Card */}
      <div className="mb-8 relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-blue-600 to-sky-500 p-8 text-white shadow-xl shadow-blue-900/10 border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        {/* Abstract Background Glow */}
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-indigo-900/20 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10">
          <h1 className="text-3xl font-extrabold font-outfit tracking-tight mb-2">
            Welcome back, <span className="text-sky-200">Hemasai Vattikuti</span>
          </h1>
          <p className="text-blue-100 font-medium max-w-2xl leading-relaxed text-sm">
            Your personalized AI job matcher and application pipeline across India and global remote tech hubs.
          </p>
        </div>
        
        <div className="relative z-10 shrink-0">
          <a 
            href="/profile" 
            className="inline-flex items-center gap-2 bg-white text-indigo-600 px-6 py-3 rounded-xl font-bold text-sm shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200"
          >
            My Profile & Preferences <span>&rarr;</span>
          </a>
        </div>
      </div>

      <DashboardStats />

      {/* Split Pane View */}
      <div className="flex-1 min-h-0 flex gap-6">
        {/* Left Pane: Job List */}
        <div className="w-full lg:w-[450px] shrink-0 h-full flex flex-col">
          <div className="flex items-center justify-between mb-4 px-1">
            <h2 className="font-bold text-slate-900">Saved Jobs</h2>
            <span className="text-xs font-bold text-sky-600 bg-sky-100 px-2 py-1 rounded-md">{mockSavedJobs.length} active</span>
          </div>
          <div className="flex-1 min-h-0">
            {/* Custom wrapper to intercept click for mobile pane */}
            <div className="h-full relative" onClick={(e) => {
               // Find the closest job card click
               const card = (e.target as Element).closest('[data-job-id]');
               if (card) {
                 const id = card.getAttribute('data-job-id');
                 if (id) handleJobSelect(id);
               }
            }}>
               <SavedJobsList jobs={mockSavedJobs} />
            </div>
          </div>
        </div>

        {/* Right Pane: Details (Desktop) */}
        <div className="hidden lg:block flex-1 min-w-0 h-[calc(100vh-220px)]">
          <JobDetailPane job={selectedJob} />
        </div>
      </div>

      {/* Mobile Details Bottom Sheet / Overlay */}
      {isMobilePaneOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex flex-col justify-end">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsMobilePaneOpen(false)} />
          <div className="relative w-full h-[90vh] bg-slate-50 rounded-t-3xl shadow-2xl overflow-hidden flex flex-col translate-y-0 transition-transform">
            <div className="p-4 flex justify-center bg-white border-b border-slate-100 shrink-0">
              <div className="w-12 h-1.5 bg-slate-200 rounded-full" />
            </div>
            <div className="flex-1 overflow-hidden p-4">
              <JobDetailPane job={selectedJob} />
            </div>
            <button 
              onClick={() => setIsMobilePaneOpen(false)}
              className="absolute top-4 right-4 p-2 bg-slate-100 rounded-full text-slate-500 font-bold text-xs"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
