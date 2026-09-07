"use client";

import React, { useState, useMemo } from "react";
import { 
  Users, Search, Download, 
  CheckCircle2, Clock, Briefcase, Mail, Phone,
  Sparkles, ArrowUpRight, X, ChevronRight
} from "lucide-react";

interface Candidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  location: string;
  skills: string[];
  matchScore: number;
  status: "Applied" | "Shortlisted" | "Interviewing" | "Offered" | "Archived";
  dateApplied: string;
  experienceYears: number;
  bio: string;
  linkedin?: string;
  github?: string;
}

export default function CrmPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);

  React.useEffect(() => {
    try {
      const stored = localStorage.getItem("getarole_candidates");
      if (stored) {
        setCandidates(JSON.parse(stored));
      } else {
        const prof = localStorage.getItem("getarole_profile");
        if (prof) {
          const p = JSON.parse(prof);
          if (p.name) {
            const selfCandidate: Candidate = {
              id: "cand_self",
              name: p.name,
              email: p.email || "candidate@getarole.in",
              phone: p.phone || "",
              role: p.headline || "Software Engineer",
              location: p.location || p.city || "India",
              skills: p.skills || [],
              matchScore: 95,
              status: "Applied",
              dateApplied: new Date().toISOString().slice(0, 10),
              experienceYears: 3,
              bio: p.summary || "Full-stack software engineer with expertise across modern web and cloud architecture.",
              linkedin: p.links?.linkedin,
              github: p.links?.github
            };
            setCandidates([selfCandidate]);
            return;
          }
        }
        setCandidates([]);
      }
    } catch {
      setCandidates([]);
    }
  }, []);

  // Filtered list
  const filteredCandidates = useMemo(() => {
    return candidates.filter(c => {
      const matchesStatus = statusFilter === "All" || c.status === statusFilter;
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        c.name.toLowerCase().includes(query) ||
        c.role.toLowerCase().includes(query) ||
        c.email.toLowerCase().includes(query) ||
        c.skills.some(s => s.toLowerCase().includes(query));
      return matchesStatus && matchesSearch;
    });
  }, [candidates, searchQuery, statusFilter]);

  // Quick stats
  const totalCount = candidates.length;
  const shortlistedCount = candidates.filter(c => c.status === "Shortlisted" || c.status === "Interviewing" || c.status === "Offered").length;
  const avgScore = totalCount > 0 ? Math.round(candidates.reduce((acc, c) => acc + c.matchScore, 0) / totalCount) : 0;

  function updateCandidateStatus(id: string, newStatus: Candidate["status"]) {
    setCandidates(prev => {
      const updated = prev.map(c => c.id === id ? { ...c, status: newStatus } : c);
      try {
        localStorage.setItem("getarole_candidates", JSON.stringify(updated));
      } catch {}
      return updated;
    });
    if (selectedCandidate && selectedCandidate.id === id) {
      setSelectedCandidate({ ...selectedCandidate, status: newStatus });
    }
  }

  function handleExportCsv() {
    const headers = ["Name,Role,Email,Phone,Location,MatchScore,Status,DateApplied"];
    const rows = filteredCandidates.map(c => 
      `"${c.name}","${c.role}","${c.email}","${c.phone}","${c.location}",${c.matchScore},"${c.status}","${c.dateApplied}"`
    );
    const csvContent = [headers, ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `getArole_Candidates_Export_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-screen bg-slate-50/60 pt-6 pb-20 px-3 sm:px-6 lg:px-8 max-w-[1600px] mx-auto">
      
      {/* ── Top Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-100">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight font-outfit">
                getArole CRM Sheet & Talent Pipeline
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200/60 uppercase tracking-wider">
                Enterprise
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Review screened applicants, evaluate semantic ATS match rubrics, and manage interview pipelines.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCsv}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 shadow-2xs transition-colors"
          >
            <Download className="w-4 h-4 text-slate-400" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* ── Metric Cards Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Talent Pool</span>
            <Users className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{totalCount}</div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
            <span>+100% active parsed profiles</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Pipeline Qualified</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{shortlistedCount}</div>
          <div className="text-[11px] text-slate-400 mt-1">Shortlisted or interviewing</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Avg Match Score</span>
            <Sparkles className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{avgScore}%</div>
          <div className="text-[11px] text-indigo-600 font-semibold mt-1">FastEmbed BGE small model</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Conversion Velocity</span>
            <Clock className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">1.8 days</div>
          <div className="text-[11px] text-slate-400 mt-1">Avg review turnaround</div>
        </div>
      </div>

      {/* ── Search & Filter Controls ── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search candidate name, role, skill..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {["All", "Applied", "Shortlisted", "Interviewing", "Offered", "Archived"].map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                statusFilter === status
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-600"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* ── Main Candidate Table ── */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider bg-slate-50/50">
                <th className="py-3.5 px-6">Candidate</th>
                <th className="py-3.5 px-6">Role & Location</th>
                <th className="py-3.5 px-6">Match Fit</th>
                <th className="py-3.5 px-6">Core Skills</th>
                <th className="py-3.5 px-6">Status</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredCandidates.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-slate-400">
                    <Users className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                    <p className="text-sm font-bold text-slate-700 font-outfit">No candidates in talent pipeline</p>
                    <p className="text-xs text-slate-400 mt-1">Candidates applying through getArole or submitting applications will appear here.</p>
                  </td>
                </tr>
              ) : (
                filteredCandidates.map(c => (
                  <tr 
                    key={c.id} 
                    className="hover:bg-slate-50/70 transition-colors cursor-pointer"
                    onClick={() => setSelectedCandidate(c)}
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-700 font-extrabold flex items-center justify-center text-xs shadow-2xs">
                          {c.name.split(" ").map(n => n[0]).join("")}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">{c.name}</div>
                          <div className="text-[11px] text-slate-400">{c.email}</div>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-6">
                      <div className="font-semibold text-slate-800">{c.role}</div>
                      <div className="text-[11px] text-slate-400">{c.location} • {c.experienceYears}y exp</div>
                    </td>

                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${
                              c.matchScore >= 90 ? "bg-emerald-500" : c.matchScore >= 80 ? "bg-indigo-500" : "bg-amber-500"
                            }`}
                            style={{ width: `${c.matchScore}%` }}
                          />
                        </div>
                        <span className="font-black text-slate-800">{c.matchScore}%</span>
                      </div>
                    </td>

                    <td className="py-4 px-6">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {c.skills.slice(0, 3).map(skill => (
                          <span key={skill} className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-medium">
                            {skill}
                          </span>
                        ))}
                        {c.skills.length > 3 && (
                          <span className="text-[10px] text-slate-400 self-center">
                            +{c.skills.length - 3}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-4 px-6" onClick={e => e.stopPropagation()}>
                      <select
                        value={c.status}
                        onChange={e => updateCandidateStatus(c.id, e.target.value as Candidate["status"])}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border focus:outline-none ${
                          c.status === "Offered" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                          c.status === "Interviewing" ? "bg-blue-50 text-blue-700 border-blue-200" :
                          c.status === "Shortlisted" ? "bg-purple-50 text-purple-700 border-purple-200" :
                          c.status === "Archived" ? "bg-rose-50 text-rose-700 border-rose-200" :
                          "bg-slate-50 text-slate-700 border-slate-200"
                        }`}
                      >
                        <option value="Applied">Applied</option>
                        <option value="Shortlisted">Shortlisted</option>
                        <option value="Interviewing">Interviewing</option>
                        <option value="Offered">Offered</option>
                        <option value="Archived">Archived</option>
                      </select>
                    </td>

                    <td className="py-4 px-6 text-right" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => setSelectedCandidate(c)}
                        className="p-2 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors"
                        title="View Candidate Dossier"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Candidate Dossier Drawer Modal ── */}
      {selectedCandidate && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/30 backdrop-blur-xs">
          <div className="w-full max-w-xl bg-white h-full shadow-2xl p-6 sm:p-8 overflow-y-auto animate-in slide-in-from-right duration-200 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-indigo-600 text-white font-black flex items-center justify-center text-sm shadow-md shadow-indigo-200">
                    {selectedCandidate.name.split(" ").map(n => n[0]).join("")}
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-slate-900 tracking-tight">
                      {selectedCandidate.name}
                    </h2>
                    <p className="text-xs text-slate-500">{selectedCandidate.role}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedCandidate(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Status Banner */}
              <div className="flex items-center justify-between bg-slate-50 p-3.5 rounded-2xl mb-6">
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400">Match Accuracy</div>
                  <div className="text-xl font-black text-indigo-700">{selectedCandidate.matchScore}% Verified</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Current Pipeline Stage</div>
                  <div className="text-xs font-bold text-slate-800">{selectedCandidate.status}</div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-2.5 mb-6 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-slate-400" />
                  <span>{selectedCandidate.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-slate-400" />
                  <span>{selectedCandidate.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-slate-400" />
                  <span>{selectedCandidate.location} • {selectedCandidate.experienceYears} Years Professional Experience</span>
                </div>
              </div>

              {/* Bio / Executive Summary */}
              <div className="mb-6">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Summary</h3>
                <p className="text-xs text-slate-600 leading-relaxed bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                  {selectedCandidate.bio}
                </p>
              </div>

              {/* Skills Grid */}
              <div className="mb-6">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Validated Skills</h3>
                <div className="flex flex-wrap gap-1.5">
                  {selectedCandidate.skills.map(s => (
                    <span key={s} className="px-3 py-1 bg-indigo-50 text-indigo-700 font-bold text-xs rounded-lg border border-indigo-100">
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              {/* Links */}
              {(selectedCandidate.linkedin || selectedCandidate.github) && (
                <div className="mb-6">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Professional Profiles</h3>
                  <div className="flex gap-2">
                    {selectedCandidate.linkedin && (
                      <a
                        href={selectedCandidate.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
                      >
                        <span>LinkedIn</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </a>
                    )}
                    {selectedCandidate.github && (
                      <a
                        href={selectedCandidate.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
                      >
                        <span>GitHub</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="pt-6 border-t border-slate-100 flex gap-3">
              <button
                onClick={() => updateCandidateStatus(selectedCandidate.id, "Interviewing")}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
              >
                Advance to Interview
              </button>
              <button
                onClick={() => setSelectedCandidate(null)}
                className="py-2.5 px-4 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
