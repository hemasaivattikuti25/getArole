"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Sparkles, 
  Building2, 
  MapPin, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  Bookmark, 
  ExternalLink,
  Plus,
  Trash2,
  TrendingUp,
  Search,
  FileText,
  Compass,
  User,
  Check,
  X,
  ChevronRight,
  Briefcase
} from "lucide-react";
import { useJobs } from "../explore/hooks/useJobs";
import { Job } from "@/lib/types";
import { extractSkillStrings } from "@/lib/skills-utils";
import JobDrawer from "../explore/components/JobDrawer";

interface TrackedApplication {
  id: string;
  title: string;
  company: string;
  location?: string;
  status: "Saved" | "Applied" | "Interview" | "Offer";
  date: string;
  url?: string;
  notes?: string;
}

const TRENDING_PILLS = [
  { label: "🐍 Python", kw: "Python" },
  { label: "⚛️ React", kw: "React" },
  { label: "🚀 SDE Intern", kw: "Intern" },
  { label: "🌐 Remote", kw: "Remote" },
  { label: "🏙️ Bengaluru", kw: "Bengaluru" },
  { label: "🤖 AI / ML", kw: "AI" },
  { label: "⚙️ Backend", kw: "Backend" },
];

export default function DashboardPage() {
  const router = useRouter();
  const [applications, setApplications] = useState<TrackedApplication[]>([]);
  const [activeTab, setActiveTab] = useState<string>("All");
  const [newJobModal, setNewJobModal] = useState(false);
  const [newRole, setNewRole] = useState({ 
    title: "", 
    company: "", 
    location: "", 
    status: "Saved" as TrackedApplication["status"] 
  });

  const [greeting, setGreeting] = useState("day");
  const [currentDateTime, setCurrentDateTime] = useState("");
  const [userName, setUserName] = useState("Engineer");
  const [userSkills, setUserSkills] = useState<string[]>([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [activePill, setActivePill] = useState<string | null>(null);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  // Fetch live jobs
  const { jobs: apiJobs, loading: jobsLoading } = useJobs();

  // Load user info, skills, and applications
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        // Greeting & Time
        const now = new Date();
        const hour = now.getHours();
        if (hour >= 4 && hour < 12) setGreeting("morning");
        else if (hour >= 12 && hour < 17) setGreeting("afternoon");
        else setGreeting("evening");

        setCurrentDateTime("● " + now.toLocaleDateString("en-US", { 
          weekday: "short", 
          month: "short", 
          day: "numeric", 
          hour: "2-digit", 
          minute: "2-digit" 
        }));

        // User name
        const profRaw = localStorage.getItem("getarole_profile");
        const userRaw = localStorage.getItem("getarole_user");
        let skillsFound: string[] = [];

        if (profRaw) {
          const p = JSON.parse(profRaw);
          if (p.name) setUserName(p.name.split(" ")[0]);
          skillsFound = [
            ...(p.skills || []),
            ...(p.skills_languages || []),
            ...(p.skills_frameworks || []),
            ...(p.skills_cloud || []),
            ...(p.skills_tools || [])
          ];
        } else if (userRaw) {
          const u = JSON.parse(userRaw);
          if (u.displayName || u.name) setUserName((u.displayName || u.name).split(" ")[0]);
        }

        // Resume skills
        const resumeRaw = localStorage.getItem("getarole_resume_v2");
        if (resumeRaw) {
          try {
            const r = JSON.parse(resumeRaw);
            if (r.skills) {
              const resSkills = extractSkillStrings(r.skills);
              if (resSkills.length > 0) skillsFound = [...skillsFound, ...resSkills];
            }
          } catch {}
        }
        setUserSkills(Array.from(new Set(extractSkillStrings(skillsFound))));

        // Tracked applications
        const savedApps = localStorage.getItem("getarole_tracked_apps");
        if (savedApps) {
          const parsed = JSON.parse(savedApps);
          const realApps = Array.isArray(parsed) 
            ? parsed.filter((a) => a && a.id !== "app-1" && a.id !== "app-2" && a.id !== "app-3")
            : [];
          setApplications(realApps);
        } else {
          setApplications([]);
        }
      } catch {
        setApplications([]);
      }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const saveApplications = (newApps: TrackedApplication[]) => {
    setApplications(newApps);
    try {
      localStorage.setItem("getarole_tracked_apps", JSON.stringify(newApps));
    } catch {}
  };

  const handleStatusChange = (id: string, newStatus: TrackedApplication["status"]) => {
    const updated = applications.map((app) => (app.id === id ? { ...app, status: newStatus } : app));
    saveApplications(updated);
  };

  const handleDelete = (id: string) => {
    const updated = applications.filter((app) => app.id !== id);
    saveApplications(updated);
  };

  const handleAddJob = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRole.title.trim() || !newRole.company.trim()) return;
    const newApp: TrackedApplication = {
      id: "custom-" + Date.now(),
      title: newRole.title.trim(),
      company: newRole.company.trim(),
      location: newRole.location.trim() || "Remote",
      status: newRole.status,
      date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    };
    saveApplications([newApp, ...applications]);
    setNewRole({ title: "", company: "", location: "", status: "Saved" });
    setNewJobModal(false);
  };

  // Quick track from recommendations
  const handleTrackFromJob = (job: Job) => {
    if (applications.some(a => a.id === job.id || (a.title === job.title && a.company === job.company))) {
      return;
    }
    const newApp: TrackedApplication = {
      id: job.id,
      title: job.title,
      company: job.company,
      location: job.location || job.city || "Remote",
      status: "Saved",
      date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      url: job.url,
    };
    saveApplications([newApp, ...applications]);
  };

  // Search filter
  const handlePillClick = (kw: string) => {
    if (activePill === kw) {
      setActivePill(null);
      setSearchQuery("");
    } else {
      setActivePill(kw);
      setSearchQuery(kw);
    }
  };

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const q = searchQuery.trim();
    if (q) {
      router.push(`/explore?q=${encodeURIComponent(q)}`);
    } else {
      router.push("/explore");
    }
  };

  // Filtered recommendations
  const filteredRecommendations = useMemo(() => {
    let pool = apiJobs || [];
    const q = searchQuery.trim().toLowerCase();

    if (q) {
      pool = pool.filter(j => 
        (j.title || "").toLowerCase().includes(q) ||
        (j.company || "").toLowerCase().includes(q) ||
        (j.location || "").toLowerCase().includes(q) ||
        (j.skills || []).some(s => typeof s === "string" && s.toLowerCase().includes(q)) ||
        (j.description || "").toLowerCase().includes(q)
      );
    } else if (userSkills.length > 0) {
      // Sort by skill overlap
      pool = [...pool].sort((a, b) => {
        const aMatches = (a.skills || []).filter(s => typeof s === "string" && userSkills.some(u => u.toLowerCase() === s.toLowerCase())).length;
        const bMatches = (b.skills || []).filter(s => typeof s === "string" && userSkills.some(u => u.toLowerCase() === s.toLowerCase())).length;
        return bMatches - aMatches;
      });
    }

    return pool.slice(0, 5);
  }, [apiJobs, searchQuery, userSkills]);

  // Compute matched jobs count
  const highFitCount = useMemo(() => {
    if (userSkills.length === 0) return apiJobs.length;
    return apiJobs.filter(j => {
      const jSkills = extractSkillStrings(j.skills);
      return jSkills.some(s => userSkills.some(u => u.toLowerCase() === s.toLowerCase()));
    }).length;
  }, [apiJobs, userSkills]);

  // Getting started progress
  const hasProf = Boolean(userSkills.length > 0);
  const hasMatches = Boolean(highFitCount > 0);
  const hasApplied = Boolean(applications.some(a => a.status === "Applied" || a.status === "Interview" || a.status === "Offer"));
  const hasTracked = Boolean(applications.length > 0);
  const completedSteps = [hasProf, hasMatches, hasApplied, hasTracked].filter(Boolean).length;

  const filteredApps = activeTab === "All" 
    ? applications 
    : applications.filter((app) => app.status === activeTab);

  const stats = {
    matches: highFitCount,
    saved: applications.filter((a) => a.status === "Saved").length,
    pipeline: applications.length,
    liveTotal: "1,000+"
  };

  return (
    <div className="relative min-h-screen pt-6 pb-20 px-3 sm:px-6 lg:px-8 max-w-[1400px] mx-auto">
      
      {/* ── 1. Personalized Welcome Card ── */}
      <div className="mb-5 bg-white/80 backdrop-blur-xl border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5 text-xs font-mono font-bold text-slate-400">
              <span>{currentDateTime}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-outfit">
              Good {greeting}, <span className="text-[#0071e3]">{userName}</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
              Your AI matching engine is active. Verified developer opportunities synced directly from career platforms.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              href="/profile"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all"
            >
              <User className="w-3.5 h-3.5 text-slate-500" />
              <span>Profile Dossier</span>
            </Link>
            <Link
              href="/matches"
              className="btn-sweep inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0071e3] hover:bg-blue-600 text-white text-xs font-bold shadow-xs transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>View Matches</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ── 2. Real-Time Search Bar & Trending Pills ── */}
      <div className="mb-6">
        <form 
          onSubmit={handleSearchSubmit}
          className="flex items-center justify-between gap-2.5 bg-white/90 backdrop-blur-xl border border-slate-200/90 rounded-2xl p-2 sm:p-2.5 shadow-sm hover:border-[#0071e3]/60 transition-all"
        >
          <div className="flex items-center gap-2.5 flex-1 px-2">
            <Search className="w-5 h-5 text-slate-400 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search roles, tech stack, or companies (e.g. Python, React, SDE, Google)..."
              className="w-full text-sm font-medium text-slate-900 placeholder:text-slate-400 bg-transparent border-none outline-none focus:ring-0"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => { setSearchQuery(""); setActivePill(null); }}
                className="p-1 text-slate-400 hover:text-slate-600 text-xs font-bold rounded-full"
                title="Clear search"
              >
                ✕
              </button>
            )}
          </div>
          <button
            type="submit"
            className="btn-sweep inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#0071e3] hover:bg-blue-600 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-all shrink-0 cursor-pointer"
          >
            <span>Explore All</span>
            <span>→</span>
          </button>
        </form>

        {/* Trending Pills */}
        <div className="flex items-center gap-2 flex-wrap mt-3 px-1">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mr-1 flex items-center gap-1">
            ⚡ Trending:
          </span>
          {TRENDING_PILLS.map((pill) => {
            const isActive = activePill === pill.kw;
            return (
              <button
                key={pill.kw}
                type="button"
                onClick={() => handlePillClick(pill.kw)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all border ${
                  isActive
                    ? "bg-[#0071e3] text-white border-[#0071e3] shadow-xs"
                    : "bg-white/90 text-slate-600 border-slate-200/90 hover:border-[#0071e3] hover:text-[#0071e3]"
                }`}
              >
                {pill.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 3. Overview Stats Strip (KPI Telemetry Grid) ── */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2.5 px-1">
          <h2 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
            Overview Stats
          </h2>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Card 1: High-Fit Matches */}
          <div className="bg-white/85 backdrop-blur-md border border-slate-200/80 rounded-2xl p-4 sm:p-5 relative overflow-hidden shadow-xs hover:shadow-sm transition-all">
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500" />
            <div className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
              <span>High-Fit Matches</span>
              <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono tracking-tight">
              {jobsLoading ? "..." : stats.matches}
            </div>
          </div>

          {/* Card 2: Tracked Applications */}
          <div className="bg-white/85 backdrop-blur-md border border-slate-200/80 rounded-2xl p-4 sm:p-5 relative overflow-hidden shadow-xs hover:shadow-sm transition-all">
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#0071e3]" />
            <div className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
              <span>Active Pipeline</span>
              <Bookmark className="w-3.5 h-3.5 text-[#0071e3]" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono tracking-tight">
              {stats.pipeline}
            </div>
          </div>

          {/* Card 3: Saved Opportunities */}
          <div className="bg-white/85 backdrop-blur-md border border-slate-200/80 rounded-2xl p-4 sm:p-5 relative overflow-hidden shadow-xs hover:shadow-sm transition-all">
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-amber-500" />
            <div className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
              <span>Saved Roles</span>
              <Clock className="w-3.5 h-3.5 text-amber-500" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono tracking-tight">
              {stats.saved}
            </div>
          </div>

          {/* Card 4: Live Verified Roles */}
          <div className="bg-white/85 backdrop-blur-md border border-slate-200/80 rounded-2xl p-4 sm:p-5 relative overflow-hidden shadow-xs hover:shadow-sm transition-all">
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-purple-500" />
            <div className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
              <span>Verified Direct Postings</span>
              <Building2 className="w-3.5 h-3.5 text-purple-500" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono tracking-tight">
              {stats.liveTotal}
            </div>
          </div>
        </div>
      </div>

      {/* ── 4. Search Pipeline Sequence (4-Step Journey) ── */}
      <div className="mb-7 bg-white/80 backdrop-blur-xl border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs">
        <div className="flex justify-between items-center mb-3 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="text-amber-500 text-sm">⚡</span>
            <h2 className="text-xs sm:text-sm font-extrabold text-slate-900 font-outfit uppercase tracking-wider">
              Search Pipeline Sequence
            </h2>
          </div>
          <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200/60">
            {completedSteps} of 4 Completed
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {/* Step 1: Configure Profile */}
          <Link
            href="/profile"
            className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
              hasProf 
                ? "bg-emerald-50/70 border-emerald-200 text-emerald-950"
                : "bg-white border-slate-200 hover:border-[#0071e3] text-slate-800"
            }`}
          >
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
              hasProf ? "bg-emerald-600 text-white" : "bg-indigo-600 text-white"
            }`}>
              {hasProf ? "✓" : "1"}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold truncate">Configure Profile</div>
              <div className="text-[10px] text-slate-500">Target roles &amp; tech stack</div>
            </div>
          </Link>

          {/* Step 2: Review Matches */}
          <Link
            href="/matches"
            className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
              hasMatches 
                ? "bg-emerald-50/70 border-emerald-200 text-emerald-950"
                : "bg-white border-slate-200 hover:border-[#0071e3] text-slate-800"
            }`}
          >
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
              hasMatches ? "bg-emerald-600 text-white" : "border-2 border-slate-300 text-slate-500"
            }`}>
              {hasMatches ? "✓" : "2"}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold truncate">Review Matches</div>
              <div className="text-[10px] text-slate-500">Real skill-correlated roles</div>
            </div>
          </Link>

          {/* Step 3: Apply to Roles */}
          <Link
            href="/explore"
            className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
              hasApplied 
                ? "bg-emerald-50/70 border-emerald-200 text-emerald-950"
                : "bg-white border-slate-200 hover:border-[#0071e3] text-slate-800"
            }`}
          >
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
              hasApplied ? "bg-emerald-600 text-white" : "border-2 border-slate-300 text-slate-500"
            }`}>
              {hasApplied ? "✓" : "3"}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold truncate">Apply to Roles</div>
              <div className="text-[10px] text-slate-500">Direct employer dispatch</div>
            </div>
          </Link>

          {/* Step 4: Monitor Pipeline */}
          <div
            className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
              hasTracked 
                ? "bg-emerald-50/70 border-emerald-200 text-emerald-950"
                : "bg-white border-slate-200 text-slate-800"
            }`}
          >
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
              hasTracked ? "bg-emerald-600 text-white" : "border-2 border-slate-300 text-slate-500"
            }`}>
              {hasTracked ? "✓" : "4"}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold truncate">Monitor Pipeline</div>
              <div className="text-[10px] text-slate-500">Track interviews &amp; offers</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 5. Main Desktop Layout Grid (2 Columns) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ── Left Column: Top AI Recommendations (7 cols) ── */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span className="text-amber-500">✨</span>
              <h2 className="text-xs sm:text-sm font-extrabold text-slate-900 font-outfit uppercase tracking-wider">
                Top AI Recommendations
              </h2>
            </div>
            <Link
              href="/matches"
              className="text-xs font-bold text-[#0071e3] hover:underline flex items-center gap-1"
            >
              <span>View All Matches</span>
              <span>→</span>
            </Link>
          </div>

          <div className="bg-white/80 backdrop-blur-xl border border-slate-200/90 rounded-2xl p-3.5 sm:p-4 shadow-xs space-y-2.5">
            {jobsLoading ? (
              <div className="py-16 text-center text-xs font-medium text-slate-400">
                Loading verified opportunities...
              </div>
            ) : filteredRecommendations.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs">
                No matching opportunities found for your criteria.
                <div className="mt-2">
                  <Link href="/explore" className="text-[#0071e3] font-bold hover:underline">
                    Browse All 1,000+ Jobs →
                  </Link>
                </div>
              </div>
            ) : (
              filteredRecommendations.map((job) => {
                const compInitial = (job.company || "C")[0].toUpperCase();
                const jobSkills = extractSkillStrings(job.skills);
                const matchedSkills = userSkills.filter(u => jobSkills.some(j => j.toLowerCase() === u.toLowerCase()));
                const fitScore = userSkills.length > 0 && matchedSkills.length > 0
                  ? Math.min(99, Math.round((matchedSkills.length / Math.min(userSkills.length, 5)) * 100))
                  : null;

                const isAlreadyTracked = applications.some(a => a.id === job.id || (a.title === job.title && a.company === job.company));

                return (
                  <div
                    key={job.id}
                    onClick={() => setSelectedJob(job)}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:p-4 rounded-xl border border-slate-100 bg-white/70 hover:bg-white hover:border-slate-300 hover:shadow-xs transition-all cursor-pointer group"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-extrabold flex items-center justify-center text-sm shrink-0 shadow-2xs">
                        {compInitial}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                          <h3 className="text-sm font-bold text-slate-900 truncate group-hover:text-[#0071e3] transition-colors">
                            {job.title}
                          </h3>
                          {fitScore !== null ? (
                            <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                              {fitScore}% Match
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 shrink-0">
                              Verified Live
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 text-xs text-slate-500 flex-wrap">
                          <span className="font-semibold text-slate-700">{job.company}</span>
                          <span>•</span>
                          <span>{job.location || job.city || "Remote"}</span>
                          {job.workplace_type && (
                            <>
                              <span>•</span>
                              <span className="text-slate-400">{job.workplace_type}</span>
                            </>
                          )}
                        </div>

                        {/* Matched skills */}
                        <div className="flex flex-wrap gap-1 mt-2">
                          {jobSkills.slice(0, 3).map((s) => {
                            const isMatch = userSkills.some(u => u.toLowerCase() === s.toLowerCase());
                            return (
                              <span
                                key={s}
                                className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                                  isMatch 
                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200" 
                                    : "bg-slate-100 text-slate-600"
                                }`}
                              >
                                {s}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0" onClick={e => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => handleTrackFromJob(job)}
                        disabled={isAlreadyTracked}
                        className={`p-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          isAlreadyTracked 
                            ? "bg-emerald-50 text-emerald-600" 
                            : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                        }`}
                        title={isAlreadyTracked ? "Tracked in Pipeline" : "Save to Pipeline"}
                      >
                        {isAlreadyTracked ? <Check className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedJob(job)}
                        className="p-2 text-slate-400 group-hover:text-[#0071e3] transition-colors"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ── Right Column: Pipeline Tracker & Career Launchpad (5 cols) ── */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* ── Card 1: Applications Pipeline Tracker ── */}
          <div className="bg-white/80 backdrop-blur-xl border border-slate-200/90 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Bookmark className="w-4 h-4 text-[#0071e3]" />
                <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 font-outfit uppercase tracking-wider">
                  Application Pipeline
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setNewJobModal(true)}
                className="inline-flex items-center gap-1 text-xs font-bold text-[#0071e3] hover:underline cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Track Role</span>
              </button>
            </div>

            {/* Stage Filter Tabs */}
            <div className="flex items-center gap-1 p-1 bg-slate-100/90 rounded-xl mb-3 text-[11px] font-bold text-slate-600 overflow-x-auto">
              {["All", "Saved", "Applied", "Interview", "Offer"].map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`px-2.5 py-1 rounded-lg transition-all shrink-0 cursor-pointer ${
                    activeTab === tab
                      ? "bg-white text-[#0071e3] shadow-xs font-extrabold"
                      : "hover:text-slate-900"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Applications List */}
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-0.5">
              {filteredApps.length === 0 ? (
                <div className="text-center py-8 border border-dashed border-slate-200 rounded-xl text-slate-400">
                  <p className="text-xs font-semibold">No applications in &ldquo;{activeTab}&rdquo; stage.</p>
                  <button
                    type="button"
                    onClick={() => setNewJobModal(true)}
                    className="mt-2 text-xs font-bold text-[#0071e3] hover:underline cursor-pointer"
                  >
                    + Add an application
                  </button>
                </div>
              ) : (
                filteredApps.map((app) => (
                  <div
                    key={app.id}
                    className="p-3 bg-white rounded-xl border border-slate-200/90 flex items-center justify-between gap-3 shadow-2xs hover:border-slate-300 transition-all"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-slate-900 truncate">
                        {app.title}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate">
                        {app.company} {app.location ? `• ${app.location}` : ""}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <select
                        value={app.status}
                        onChange={(e) => handleStatusChange(app.id, e.target.value as TrackedApplication["status"])}
                        className={`text-[10px] font-bold px-2 py-1 rounded-lg border focus:outline-none cursor-pointer ${
                          app.status === "Offer" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                          app.status === "Interview" ? "bg-purple-50 text-purple-700 border-purple-200" :
                          app.status === "Applied" ? "bg-blue-50 text-blue-700 border-blue-200" :
                          "bg-slate-50 text-slate-700 border-slate-200"
                        }`}
                      >
                        <option value="Saved">Saved</option>
                        <option value="Applied">Applied</option>
                        <option value="Interview">Interview</option>
                        <option value="Offer">Offer</option>
                      </select>

                      <button
                        type="button"
                        onClick={() => handleDelete(app.id)}
                        className="text-slate-400 hover:text-rose-500 p-1 rounded transition-colors cursor-pointer"
                        title="Remove"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* ── Card 2: Career Launchpad ── */}
          <div className="bg-white/80 backdrop-blur-xl border border-slate-200/90 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center gap-2 mb-3.5">
              <span className="text-amber-500 text-sm">⚡</span>
              <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 font-outfit uppercase tracking-wider">
                Career Launchpad
              </h3>
            </div>

            <div className="space-y-2.5">
              {/* Tool 1: ATS Resume Architect */}
              <Link
                href="/resume-builder"
                className="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-200 hover:border-[#0071e3] hover:-translate-y-0.5 transition-all shadow-2xs group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-base shrink-0">
                    📄
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 group-hover:text-[#0071e3] transition-colors">
                      ATS Resume Architect
                    </div>
                    <div className="text-[10.5px] text-slate-400">
                      Real-time scoring &amp; LaTeX PDF export
                    </div>
                  </div>
                </div>
                <span className="text-xs font-bold text-[#0071e3]">Open →</span>
              </Link>

              {/* Tool 2: AI Cover Letter Generator */}
              <Link
                href="/cover-letter"
                className="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-200 hover:border-[#0071e3] hover:-translate-y-0.5 transition-all shadow-2xs group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center text-base shrink-0">
                    ✉️
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 group-hover:text-[#0071e3] transition-colors">
                      AI Cover Letter Generator
                    </div>
                    <div className="text-[10.5px] text-slate-400">
                      Role-tailored application letters
                    </div>
                  </div>
                </div>
                <span className="text-xs font-bold text-[#0071e3]">Generate →</span>
              </Link>

              {/* Tool 3: Explore All Live Roles */}
              <Link
                href="/explore"
                className="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-200 hover:border-[#0071e3] hover:-translate-y-0.5 transition-all shadow-2xs group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-base shrink-0">
                    🧭
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 group-hover:text-[#0071e3] transition-colors">
                      Explore All Live Roles
                    </div>
                    <div className="text-[10.5px] text-slate-400">
                      1,000+ verified listings catalog
                    </div>
                  </div>
                </div>
                <span className="text-xs font-bold text-[#0071e3]">Browse →</span>
              </Link>

              {/* Tool 4: Candidate Profile & Dossier */}
              <Link
                href="/profile"
                className="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-200 hover:border-[#0071e3] hover:-translate-y-0.5 transition-all shadow-2xs group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center text-base shrink-0">
                    👤
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 group-hover:text-[#0071e3] transition-colors">
                      Candidate Dossier &amp; Profile
                    </div>
                    <div className="text-[10.5px] text-slate-400">
                      Manage skills, target roles &amp; salary
                    </div>
                  </div>
                </div>
                <span className="text-xs font-bold text-[#0071e3]">Edit →</span>
              </Link>
            </div>
          </div>

        </div>

      </div>

      {/* ── Slide-Over Job Description Drawer ── */}
      <JobDrawer
        job={selectedJob}
        isOpen={!!selectedJob}
        onClose={() => setSelectedJob(null)}
      />

      {/* ── Modal: Manual Application Tracking ── */}
      {newJobModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-slate-200 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setNewJobModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1"
            >
              ✕
            </button>

            <h2 className="text-xl font-extrabold text-slate-900 font-outfit mb-1">
              Track Application
            </h2>
            <p className="text-xs text-slate-500 mb-5">
              Add external applications to organize and manage your interview stages.
            </p>

            <form onSubmit={handleAddJob} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Job Title *
                </label>
                <input
                  type="text"
                  required
                  value={newRole.title}
                  onChange={(e) => setNewRole({ ...newRole, title: e.target.value })}
                  placeholder="Job Title"
                  className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#0071e3] bg-white font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Company Name *
                </label>
                <input
                  type="text"
                  required
                  value={newRole.company}
                  onChange={(e) => setNewRole({ ...newRole, company: e.target.value })}
                  placeholder="Company Name"
                  className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#0071e3] bg-white font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Location (Optional)
                </label>
                <input
                  type="text"
                  value={newRole.location}
                  onChange={(e) => setNewRole({ ...newRole, location: e.target.value })}
                  placeholder="Location"
                  className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#0071e3] bg-white font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Initial Status
                </label>
                <select
                  value={newRole.status}
                  onChange={(e) => setNewRole({ ...newRole, status: e.target.value as TrackedApplication["status"] })}
                  className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#0071e3] bg-white font-medium cursor-pointer"
                >
                  <option value="Saved">Saved</option>
                  <option value="Applied">Applied</option>
                  <option value="Interview">Interviewing</option>
                  <option value="Offer">Offer</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setNewJobModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-sweep px-5 py-2.5 rounded-xl bg-[#0071e3] hover:bg-blue-600 text-white text-xs font-bold shadow-xs cursor-pointer"
                >
                  Save Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
