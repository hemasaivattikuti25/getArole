"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
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
  Search
} from "lucide-react";
import { useJobs } from "../explore/hooks/useJobs";
import { Job } from "@/lib/types";

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

const DEFAULT_APPLICATIONS: TrackedApplication[] = [
  {
    id: "app-1",
    title: "Senior Frontend Engineer",
    company: "Razorpay",
    location: "Bengaluru (Hybrid)",
    status: "Interview",
    date: "Sep 2, 2026",
    url: "https://razorpay.com/jobs",
  },
  {
    id: "app-2",
    title: "Full Stack Developer",
    company: "Swiggy",
    location: "Bengaluru",
    status: "Applied",
    date: "Aug 29, 2026",
    url: "https://swiggy.com/careers",
  },
  {
    id: "app-3",
    title: "Software Engineer III - Cloud",
    company: "Google India",
    location: "Hyderabad",
    status: "Saved",
    date: "Aug 28, 2026",
    url: "https://careers.google.com",
  },
];

export default function DashboardPage() {
  const [applications, setApplications] = useState<TrackedApplication[]>([]);
  const [activeTab, setActiveTab] = useState<string>("All");
  const [newJobModal, setNewJobModal] = useState(false);
  const [newRole, setNewRole] = useState({ title: "", company: "", location: "", status: "Saved" as TrackedApplication["status"] });

  // Fetch real jobs from backend API
  const { jobs: apiJobs, loading: jobsLoading } = useJobs();

  // Load applications from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("getarole_tracked_apps");
      if (saved) {
        setApplications(JSON.parse(saved));
      } else {
        setApplications(DEFAULT_APPLICATIONS);
        localStorage.setItem("getarole_tracked_apps", JSON.stringify(DEFAULT_APPLICATIONS));
      }
    } catch {
      setApplications(DEFAULT_APPLICATIONS);
    }
  }, []);

  const saveApplications = (newApps: TrackedApplication[]) => {
    setApplications(newApps);
    localStorage.setItem("getarole_tracked_apps", JSON.stringify(newApps));
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
    if (!newRole.title || !newRole.company) return;
    const newApp: TrackedApplication = {
      id: "custom-" + Date.now(),
      title: newRole.title,
      company: newRole.company,
      location: newRole.location || "Remote",
      status: newRole.status,
      date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    };
    saveApplications([newApp, ...applications]);
    setNewRole({ title: "", company: "", location: "", status: "Saved" });
    setNewJobModal(false);
  };

  const filteredApps = activeTab === "All" 
    ? applications 
    : applications.filter((app) => app.status === activeTab);

  const stats = {
    total: applications.length,
    interview: applications.filter((a) => a.status === "Interview").length,
    applied: applications.filter((a) => a.status === "Applied").length,
    offers: applications.filter((a) => a.status === "Offer").length,
  };

  // Recommended roles from API
  const recommendedRoles: Job[] = apiJobs.slice(0, 4);

  return (
    <div className="relative min-h-screen pt-8 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* ── Page Header ── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight font-outfit mb-1.5">
            Applications Dashboard
          </h1>
          <p className="text-slate-500 text-sm sm:text-base">
            Track your pipeline, monitor active interview rounds, and manage your job discovery.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/explore"
            className="inline-flex items-center gap-2 bg-white text-slate-700 border border-slate-200/80 hover:bg-slate-50 px-4 py-2 rounded-xl text-sm font-semibold shadow-2xs transition-colors"
          >
            <Search className="w-4 h-4 text-slate-400" />
            <span>Discover Roles</span>
          </Link>
          <button
            onClick={() => setNewJobModal(true)}
            className="btn-sweep inline-flex items-center gap-2 bg-[#0062e3] text-white px-4.5 py-2 rounded-xl text-sm font-semibold shadow-xs hover:shadow-md transition-shadow"
          >
            <Plus className="w-4 h-4" />
            <span>Track Application</span>
          </button>
        </div>
      </div>

      {/* ── Metrics Grid ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Active Pipeline", value: stats.total, icon: Bookmark, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Submitted", value: stats.applied, icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
          { label: "Interviews", value: stats.interview, icon: TrendingUp, color: "text-purple-600", bg: "bg-purple-50" },
          { label: "Offers", value: stats.offers, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" },
        ].map((item) => (
          <div
            key={item.label}
            className="bg-white/70 backdrop-blur-xl border border-slate-200/80 rounded-2xl p-5 shadow-xs flex items-center justify-between"
          >
            <div>
              <p className="text-xs font-semibold text-slate-400 mb-1">{item.label}</p>
              <h3 className="text-2xl font-extrabold text-slate-900 font-outfit">{item.value}</h3>
            </div>
            <div className={`w-10 h-10 rounded-xl ${item.bg} ${item.color} flex items-center justify-center font-bold`}>
              <item.icon className="w-5 h-5" />
            </div>
          </div>
        ))}
      </div>

      {/* ── Applications Pipeline Tracker ── */}
      <div className="bg-white/70 backdrop-blur-xl border border-slate-200/80 rounded-2xl p-6 shadow-xs mb-10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h2 className="text-xl font-bold text-slate-900 font-outfit flex items-center gap-2">
            <span>Pipeline Roles</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
              {filteredApps.length}
            </span>
          </h2>

          {/* Stage Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-xl overflow-x-auto text-xs font-semibold text-slate-600">
            {["All", "Saved", "Applied", "Interview", "Offer"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeTab === tab
                    ? "bg-white text-[#0062e3] shadow-xs"
                    : "hover:text-slate-900"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Application Cards List */}
        {filteredApps.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-slate-200 rounded-xl">
            <p className="text-sm text-slate-500 font-medium">No roles currently in &ldquo;{activeTab}&rdquo; stage.</p>
            <button
              onClick={() => setNewJobModal(true)}
              className="mt-3 text-xs font-bold text-[#0062e3] hover:underline"
            >
              + Track an application
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredApps.map((app) => (
              <div
                key={app.id}
                className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 px-3 rounded-xl transition-colors group"
              >
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 border border-slate-200 flex items-center justify-center font-bold text-slate-700 text-sm flex-shrink-0">
                    {app.company[0]}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-snug">
                      {app.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-1">
                      <span className="font-semibold text-slate-700">{app.company}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        {app.location || "Remote"}
                      </span>
                      <span>•</span>
                      <span>Tracked on {app.date}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center">
                  {/* Status Dropdown */}
                  <select
                    value={app.status}
                    onChange={(e) => handleStatusChange(app.id, e.target.value as TrackedApplication["status"])}
                    className={`text-xs font-bold px-2.5 py-1.5 rounded-lg border cursor-pointer outline-none transition-colors ${
                      app.status === "Interview"
                        ? "bg-purple-50 text-purple-700 border-purple-200"
                        : app.status === "Offer"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : app.status === "Applied"
                        ? "bg-amber-50 text-amber-700 border-amber-200"
                        : "bg-slate-50 text-slate-700 border-slate-200"
                    }`}
                  >
                    <option value="Saved">Saved</option>
                    <option value="Applied">Applied</option>
                    <option value="Interview">Interviewing</option>
                    <option value="Offer">Offered</option>
                  </select>

                  {app.url && (
                    <a
                      href={app.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
                      title="Open Job URL"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}

                  <button
                    onClick={() => handleDelete(app.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                    title="Delete Application"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Live AI Recommended Roles (From API) ── */}
      <div className="bg-white/70 backdrop-blur-xl border border-slate-200/80 rounded-2xl p-6 shadow-xs">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-bold text-slate-900 font-outfit flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#0062e3]" />
              Live Matched Openings
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Verified openings fetched directly from our scraper engine
            </p>
          </div>
          <Link
            href="/explore"
            className="text-xs font-bold text-[#0062e3] hover:underline flex items-center gap-1"
          >
            Explore all {apiJobs.length} roles <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {jobsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 bg-slate-100/60 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recommendedRoles.map((job) => (
              <div
                key={job.id}
                className="bg-white p-4 rounded-xl border border-slate-200/80 hover:border-blue-300 hover:shadow-xs transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h4 className="font-bold text-slate-900 text-sm leading-snug line-clamp-1">
                      {job.title}
                    </h4>
                    <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex-shrink-0">
                      {job.fit_score || 94}%
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mb-3">
                    <span className="font-semibold text-slate-700 flex items-center gap-1">
                      <Building2 className="w-3 h-3" />
                      {job.company}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {job.location || job.city || "Remote"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                  <span className="text-slate-400 capitalize">
                    {job.workplace_type || "Full-time"}
                  </span>
                  <a
                    href={job.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold text-[#0062e3] hover:underline inline-flex items-center gap-1"
                  >
                    Apply on {job.platform || "Direct"} →
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Track Application Modal ── */}
      {newJobModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-1 font-outfit">Track a New Application</h3>
            <p className="text-xs text-slate-500 mb-4">Add a role from LinkedIn, Naukri, or direct careers portals to your pipeline.</p>
            <form onSubmit={handleAddJob} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Job Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Senior Frontend Developer"
                  value={newRole.title}
                  onChange={(e) => setNewRole({ ...newRole, title: e.target.value })}
                  className="w-full text-sm px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-[#0062e3]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Company Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Stripe, Razorpay"
                  value={newRole.company}
                  onChange={(e) => setNewRole({ ...newRole, company: e.target.value })}
                  className="w-full text-sm px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-[#0062e3]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Location</label>
                <input
                  type="text"
                  placeholder="e.g. Bengaluru, Remote"
                  value={newRole.location}
                  onChange={(e) => setNewRole({ ...newRole, location: e.target.value })}
                  className="w-full text-sm px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-[#0062e3]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
                <select
                  value={newRole.status}
                  onChange={(e) => setNewRole({ ...newRole, status: e.target.value as TrackedApplication["status"] })}
                  className="w-full text-sm px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-[#0062e3]"
                >
                  <option value="Saved">Saved</option>
                  <option value="Applied">Applied</option>
                  <option value="Interview">Interviewing</option>
                  <option value="Offer">Offered</option>
                </select>
              </div>
              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setNewJobModal(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-semibold text-white bg-[#0062e3] rounded-xl shadow-xs hover:bg-blue-600 transition-colors"
                >
                  Add to Pipeline
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
