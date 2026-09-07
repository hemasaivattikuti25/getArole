"use client";

import { useState, useMemo } from "react";
import { Search, X, Bookmark, RotateCcw } from "lucide-react";
import { Job } from "@/lib/types";
import ExploreFilters, { ExploreFiltersState } from "./components/ExploreFilters";
import JobCard from "./components/JobCard";
import JobDrawer from "./components/JobDrawer";
import { useJobs } from "./hooks/useJobs";

const POPULAR_TAGS = [
  { label: "Python", icon: "🐍", query: "Python" },
  { label: "React", icon: "⚛️", query: "React" },
  { label: "SDE", icon: "🚀", query: "SDE" },
  { label: "Internship", icon: "⚡", query: "Intern" },
  { label: "Remote", icon: "🌐", query: "Remote" },
  { label: "AI / ML", icon: "🤖", query: "AI" },
  { label: "Fullstack", icon: "💻", query: "Fullstack" },
];

export default function ExplorePage() {
  const [filters, setFilters] = useState<ExploreFiltersState>({
    locations: [],
    roles: [],
    experience: [],
    workplaceType: [],
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"match" | "newest" | "company">("match");
  const [savedNotice, setSavedNotice] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  const { jobs, loading, error } = useJobs(filters);

  // Real-time client search and sorting
  const filteredJobs = useMemo(() => {
    let result = [...jobs];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((j) => {
        const inTitle = (j.title || "").toLowerCase().includes(q);
        const inCompany = (j.company || "").toLowerCase().includes(q);
        const inLocation = (j.location || j.city || "").toLowerCase().includes(q);
        const inDesc = (j.description || "").toLowerCase().includes(q);
        const inSkills =
          Array.isArray(j.skills) &&
          j.skills.some((s) => String(s).toLowerCase().includes(q));
        return inTitle || inCompany || inLocation || inDesc || inSkills;
      });
    }

    if (sortBy === "company") {
      result.sort((a, b) => (a.company || "").localeCompare(b.company || ""));
    } else if (sortBy === "newest") {
      result.sort((a, b) => {
        const da = a.date_posted ? new Date(a.date_posted).getTime() : 0;
        const db = b.date_posted ? new Date(b.date_posted).getTime() : 0;
        return db - da;
      });
    } else {
      // Default: Best match
      result.sort((a, b) => (b.fit_score ?? 0) - (a.fit_score ?? 0));
    }

    return result;
  }, [jobs, searchQuery, sortBy]);

  const handleTagClick = (tagQuery: string) => {
    if (searchQuery.toLowerCase() === tagQuery.toLowerCase()) {
      setSearchQuery("");
    } else {
      setSearchQuery(tagQuery);
    }
  };

  const handleSaveSearch = () => {
    if (searchQuery.trim()) {
      try {
        const saved = JSON.parse(localStorage.getItem("getarole_saved_searches") || "[]");
        if (!saved.includes(searchQuery.trim())) {
          saved.push(searchQuery.trim());
          localStorage.setItem("getarole_saved_searches", JSON.stringify(saved));
        }
      } catch {}
    }
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  const handleClearAll = () => {
    setSearchQuery("");
    setFilters({
      locations: [],
      roles: [],
      experience: [],
      workplaceType: [],
    });
  };

  return (
    <div className="relative min-h-screen pt-24 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Header section */}
      <div className="mb-6">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-800 tracking-tight font-outfit mb-2">
          Explore Jobs & Opportunities
        </h1>
        <p className="text-slate-500 text-sm sm:text-base max-w-2xl">
          Browse verified roles from top tech companies. Our AI matches your profile to the best fit.
        </p>
      </div>

      {/* ════════════════════ 2-ROW SEARCH & QUICK FILTER BAR ════════════════════ */}
      <div className="bg-white/85 backdrop-blur-xl border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs mb-8 space-y-3.5">
        {/* TOP ROW: SEARCH BAR + SAVE + CLEAR */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1 flex items-center">
            <Search className="w-5 h-5 text-slate-400 absolute left-3.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search roles, skills, or companies (e.g. Python, React, SDE, Bengaluru)..."
              className="w-full text-sm pl-11 pr-10 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600 bg-white/90 shadow-2xs font-medium text-slate-800 placeholder:text-slate-400 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                title="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={handleSaveSearch}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-blue-200 bg-blue-50/70 hover:bg-blue-100 text-blue-700 font-bold text-xs transition-colors shadow-2xs cursor-pointer whitespace-nowrap"
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>Save Search</span>
            </button>
            <button
              type="button"
              onClick={handleClearAll}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 font-bold text-xs transition-colors shadow-2xs cursor-pointer whitespace-nowrap"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Clear Filters</span>
            </button>
          </div>
        </div>

        {savedNotice && (
          <div className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5 animate-fadeIn">
            ✓ Search preference saved successfully!
          </div>
        )}

        {/* QUICK POPULAR CHIPS ROW */}
        <div className="flex items-center gap-2 flex-wrap pt-0.5">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1">
            <span>⚡</span> Popular:
          </span>
          {POPULAR_TAGS.map((tag) => {
            const isActive = searchQuery.toLowerCase().includes(tag.query.toLowerCase());
            return (
              <button
                key={tag.label}
                type="button"
                onClick={() => handleTagClick(tag.query)}
                className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                  isActive
                    ? "bg-blue-600 text-white border-blue-600 shadow-xs scale-102"
                    : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                <span>{tag.icon}</span>
                <span>{tag.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Left Sidebar - Filters */}
        <div className="w-full lg:w-1/4 flex-shrink-0">
          <ExploreFilters filters={filters} setFilters={setFilters} />
        </div>

        {/* Right Content - Job Feed */}
        <div className="w-full lg:w-3/4 flex flex-col gap-4">
          {/* Active Filters Summary */}
          <div className="flex items-center justify-between bg-white/70 backdrop-blur-md border border-slate-200/60 rounded-xl px-4 py-3 shadow-2xs">
            <div className="text-xs sm:text-sm font-semibold text-slate-600 flex items-center gap-2">
              <span>Showing</span>
              <span className="bg-blue-50 text-blue-700 font-extrabold px-2 py-0.5 rounded-md border border-blue-100">
                {filteredJobs.length} {filteredJobs.length === 1 ? "role" : "roles"}
              </span>
              {searchQuery && (
                <span className="text-xs text-slate-400 truncate max-w-[200px]">
                  for &quot;{searchQuery}&quot;
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as "match" | "newest" | "company")}
                className="bg-white text-xs font-bold text-slate-700 border border-slate-200 px-3 py-1.5 rounded-lg outline-none cursor-pointer focus:border-blue-500 shadow-2xs"
              >
                <option value="match">Sort by: Best Match</option>
                <option value="newest">Sort by: Newest</option>
                <option value="company">Sort by: Company (A-Z)</option>
              </select>
            </div>
          </div>

          {/* Loading / Error / Feed */}
          {loading ? (
            <div className="flex flex-col gap-4 mt-2">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-32 w-full bg-white/60 backdrop-blur-md rounded-2xl border border-slate-200/60 animate-pulse"
                />
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-12 text-rose-500 font-semibold bg-rose-50/50 rounded-2xl border border-rose-100">
              {error}
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="text-center py-16 bg-white/60 backdrop-blur-md rounded-2xl border border-slate-200/60">
              <div className="text-4xl mb-3">🔍</div>
              <h3 className="text-lg font-bold text-slate-700 mb-1">No roles matched your search</h3>
              <p className="text-slate-500 text-sm max-w-sm mx-auto">
                {searchQuery
                  ? `No roles found matching "${searchQuery}". Try modifying your search term or clearing filters.`
                  : "Try adjusting your filters to see more results."}
              </p>
              <button
                onClick={handleClearAll}
                className="mt-5 px-4 py-2 bg-blue-50 text-blue-700 font-bold text-sm rounded-xl hover:bg-blue-100 transition-colors border border-blue-200"
              >
                Clear all filters & search
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {filteredJobs.map((job, idx) => (
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
