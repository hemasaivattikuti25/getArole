"use client";

import { useState } from "react";
import { Job } from "@/lib/types";
import ExploreFilters, { ExploreFiltersState } from "./components/ExploreFilters";
import JobCard from "./components/JobCard";
import JobDrawer from "./components/JobDrawer";
import { useJobs } from "./hooks/useJobs";
import BackgroundAurora from "@/components/BackgroundAurora"; // Ensure aurora shines through if layout doesn't provide it

export default function ExplorePage() {
  const [filters, setFilters] = useState<ExploreFiltersState>({
    locations: [],
    roles: [],
    experience: [],
    workplaceType: [],
  });

  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  const { jobs, loading, error } = useJobs(filters);

  return (
    <div className="relative min-h-screen pt-24 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      
      {/* Header section */}
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-800 tracking-tight font-outfit mb-2">
          Discover Opportunities
        </h1>
        <p className="text-slate-500 text-sm sm:text-base max-w-2xl">
          Browse verified roles from top tech companies. Our AI matches your profile to the best fit.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Left Sidebar - Filters */}
        <div className="w-full lg:w-1/4 flex-shrink-0">
          <ExploreFilters filters={filters} setFilters={setFilters} />
        </div>

        {/* Right Content - Job Feed */}
        <div className="w-full lg:w-3/4 flex flex-col gap-4">
          
          {/* Active Filters Summary (Optional, good for UX) */}
          <div className="flex items-center justify-between bg-white/40 backdrop-blur-md border border-slate-200/50 rounded-xl p-4 mb-2 shadow-[0_2px_10px_rgb(0,0,0,0.01)]">
            <div className="text-sm font-semibold text-slate-600">
              Showing {jobs.length} {jobs.length === 1 ? 'role' : 'roles'}
            </div>
            <div className="flex gap-2">
              <select className="bg-transparent text-sm font-bold text-slate-600 outline-none cursor-pointer">
                <option>Sort by: Best Match</option>
                <option>Sort by: Newest</option>
              </select>
            </div>
          </div>

          {/* Loading / Error / Feed */}
          {loading ? (
            <div className="flex flex-col gap-4 mt-4">
              {[1,2,3,4].map(i => (
                <div key={i} className="h-32 w-full bg-white/40 backdrop-blur-md rounded-2xl border border-slate-200/50 animate-pulse"></div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-12 text-rose-500 font-semibold bg-rose-50/50 rounded-2xl border border-rose-100">
              {error}
            </div>
          ) : jobs.length === 0 ? (
            <div className="text-center py-16 bg-white/40 backdrop-blur-md rounded-2xl border border-slate-200/50">
              <div className="text-4xl mb-4">🔍</div>
              <h3 className="text-lg font-bold text-slate-700 mb-2">No roles found</h3>
              <p className="text-slate-500 text-sm">Try adjusting your filters to see more results.</p>
              <button 
                onClick={() => setFilters({ locations: [], roles: [], experience: [], workplaceType: [] })}
                className="mt-6 px-4 py-2 bg-indigo-50 text-indigo-700 font-bold text-sm rounded-lg hover:bg-indigo-100 transition-colors"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {jobs.map((job, idx) => (
                <JobCard 
                  key={job.id} 
                  job={job} 
                  index={idx}
                  onClick={(j) => setSelectedJob(j)} 
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <JobDrawer 
        job={selectedJob} 
        isOpen={!!selectedJob} 
        onClose={() => setSelectedJob(null)} 
      />
    </div>
  );
}
