"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  User,
  Edit3,
  Save,
  Briefcase,
  GraduationCap,
  FolderGit2,
  Sparkles,
  Plus,
  Trash2,
  ExternalLink,
  FileText,
  UploadCloud,
  Eye,
  CheckCircle2,
  Globe,
  X,
  ChevronRight,
  MapPin,
  Mail,
  Phone,
  ShieldAlert,
  Sliders,
  DollarSign,
  Building,
} from "lucide-react";
import { apiClient } from "@/lib/api-client";

interface ExperienceItem {
  company: string;
  title: string;
  location?: string;
  start?: string;
  end?: string;
  desc?: string;
}

interface ProjectItem {
  title: string;
  demo?: string;
  github?: string;
  tags?: string[] | string;
  desc?: string;
}

interface EducationItem {
  school: string;
  degree: string;
  year?: string;
  grade?: string;
  coursework?: string;
}

interface ProfileData {
  name: string;
  headline: string;
  email: string;
  phone: string;
  city: string;
  location: string;
  summary: string;
  skills_languages: string[];
  skills_frameworks: string[];
  skills_cloud: string[];
  skills_tools: string[];
  skills: string[];
  experience: ExperienceItem[];
  projects: ProjectItem[];
  education: EducationItem[];
  certifications: unknown[];
  achievements: unknown[];
  links: {
    github: string;
    linkedin: string;
    portfolio: string;
    leetcode?: string;
    twitter?: string;
  };
}

interface PreferencesData {
  roles: string[];
  locations: string[];
  workplaceType: string;
  salary_amt: number;
  salary_curr: string;
  status: string;
  seniority: string;
  companySize: string;
  urgency?: string;
}

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<"profile" | "personal" | "preferences">("profile");

  const [profile, setProfile] = useState<ProfileData>({
    name: "",
    headline: "",
    email: "",
    phone: "",
    city: "",
    location: "",
    summary: "",
    skills_languages: [],
    skills_frameworks: [],
    skills_cloud: [],
    skills_tools: [],
    skills: [],
    experience: [],
    projects: [],
    education: [],
    certifications: [],
    achievements: [],
    links: {
      github: "",
      linkedin: "",
      portfolio: "",
    },
  });

  const [prefs, setPrefs] = useState<PreferencesData>({
    roles: [],
    locations: [],
    workplaceType: "Hybrid",
    salary_amt: 1500000,
    salary_curr: "INR",
    status: "Actively looking",
    seniority: "Mid-Level",
    companySize: "Any",
    urgency: "Immediate",
  });

  const [resumeFileName, setResumeFileName] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Quick inputs for skills
  const [newLang, setNewLang] = useState("");
  const [newFw, setNewFw] = useState("");
  const [newCloud, setNewCloud] = useState("");
  const [newTool, setNewTool] = useState("");

  // Quick inputs for preferences
  const [newPrefRole, setNewPrefRole] = useState("");
  const [newPrefLoc, setNewPrefLoc] = useState("");

  // Modals for adding items
  const [isExpModalOpen, setIsExpModalOpen] = useState(false);
  const [newExp, setNewExp] = useState<ExperienceItem>({ company: "", title: "", location: "", start: "", end: "", desc: "" });

  const [isProjModalOpen, setIsProjModalOpen] = useState(false);
  const [newProj, setNewProj] = useState<ProjectItem>({ title: "", demo: "", github: "", tags: "", desc: "" });

  const [isEduModalOpen, setIsEduModalOpen] = useState(false);
  const [newEdu, setNewEdu] = useState<EducationItem>({ school: "", degree: "", year: "", grade: "", coursework: "" });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const heroFileInputRef = useRef<HTMLInputElement>(null);

  // Hydrate from localStorage on initial render
  useEffect(() => {
    try {
      const localProf = localStorage.getItem("getarole_profile");
      const localPrefs = localStorage.getItem("getarole_prefs");
      const userObj = localStorage.getItem("getarole_user");
      const resumeV2 = localStorage.getItem("getarole_resume_v2");

      let resolvedName = "";
      let resolvedEmail = "";
      let resolvedPhone = "";
      let resolvedHeadline = "";
      let resolvedSummary = "";
      let resolvedLocation = "";

      if (userObj) {
        try {
          const u = JSON.parse(userObj);
          resolvedName = u.displayName || u.name || "";
          resolvedEmail = u.email || "";
        } catch {}
      }

      if (resumeV2) {
        try {
          const r = JSON.parse(resumeV2);
          if (r.header?.name && !resolvedName) resolvedName = r.header.name;
          if (r.header?.email && !resolvedEmail) resolvedEmail = r.header.email;
          if (r.header?.phone) resolvedPhone = r.header.phone;
          if (r.header?.title) resolvedHeadline = r.header.title;
          if (r.header?.location) resolvedLocation = r.header.location;
          if (r.summary?.text) resolvedSummary = r.summary.text;
        } catch {}
      }

      if (localProf) {
        try {
          const parsed = JSON.parse(localProf);
          if (parsed.phone === "+91 98765 43210" || parsed.phone === "+91 9876543210") {
            parsed.phone = "";
          }
          setProfile((prev) => ({
            ...prev,
            ...parsed,
            name: parsed.name || resolvedName || prev.name,
            email: parsed.email || resolvedEmail || prev.email,
            phone: parsed.phone || resolvedPhone || prev.phone,
            headline: parsed.headline || resolvedHeadline || prev.headline,
            location: parsed.location || parsed.city || resolvedLocation || prev.location,
            summary: parsed.summary || resolvedSummary || prev.summary,
          }));
        } catch {}
      } else {
        setProfile((prev) => ({
          ...prev,
          name: resolvedName || prev.name,
          email: resolvedEmail || prev.email,
          phone: resolvedPhone || prev.phone,
          headline: resolvedHeadline || prev.headline,
          location: resolvedLocation || prev.location,
          summary: resolvedSummary || prev.summary,
        }));
      }

      if (localPrefs) {
        try {
          setPrefs((prev) => ({ ...prev, ...JSON.parse(localPrefs) }));
        } catch {}
      }

      const storedFileName = localStorage.getItem("getarole_resume_filename");
      if (storedFileName) {
        setResumeFileName(storedFileName);
      }
    } catch (e) {
      console.warn("Error loading profile from storage:", e);
    }
  }, []);

  // Compute profile strength score dynamically
  const strengthScore = useMemo(() => {
    let score = 0;
    const hasIdentity = Boolean(profile.name && profile.email);
    const hasSkills = Boolean(
      (profile.skills_languages?.length || 0) +
      (profile.skills_frameworks?.length || 0) +
      (profile.skills_cloud?.length || 0) +
      (profile.skills_tools?.length || 0) > 0
    );
    const hasExp = Boolean(profile.experience?.length);
    const hasProj = Boolean(profile.projects?.length);
    const hasEdu = Boolean(profile.education?.length);
    const hasResume = Boolean(resumeFileName || profile.skills?.length);

    if (hasIdentity) score += 20;
    if (hasSkills) score += 20;
    if (hasExp) score += 20;
    if (hasProj) score += 15;
    if (hasEdu) score += 15;
    if (hasResume) score += 10;

    return Math.min(100, score);
  }, [profile, resumeFileName]);

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    try {
      const allSkills = Array.from(
        new Set([
          ...(profile.skills_languages || []),
          ...(profile.skills_frameworks || []),
          ...(profile.skills_cloud || []),
          ...(profile.skills_tools || []),
        ])
      );

      const updatedProfile = { ...profile, skills: allSkills };
      setProfile(updatedProfile);

      localStorage.setItem("getarole_profile", JSON.stringify(updatedProfile));
      localStorage.setItem("getarole_prefs", JSON.stringify(prefs));

      // Synchronize with getarole_resume_v2 for LaTeX Resume Builder & Cover Letter
      try {
        const R = JSON.parse(localStorage.getItem("getarole_resume_v2") || "{}");
        if (!R.header) R.header = {};
        if (!R.summary) R.summary = {};

        const nameParts = (updatedProfile.name || "").split(" ");
        R.header.name = updatedProfile.name;
        R.header.first_name = nameParts[0] || "";
        R.header.last_name = nameParts.slice(1).join(" ") || "";
        R.header.title = updatedProfile.headline;
        R.header.email = updatedProfile.email;
        R.header.phone = updatedProfile.phone;
        R.header.location = updatedProfile.location || updatedProfile.city;
        if (updatedProfile.links) {
          R.header.linkedin = updatedProfile.links.linkedin || "";
          R.header.github = updatedProfile.links.github || "";
          R.header.portfolio = updatedProfile.links.portfolio || "";
        }
        R.summary.text = updatedProfile.summary;
        R.skills = [
          { label: "Programming Languages", items: (updatedProfile.skills_languages || []).join(", ") },
          { label: "Frameworks & Libraries", items: (updatedProfile.skills_frameworks || []).join(", ") },
          { label: "Cloud & Databases", items: (updatedProfile.skills_cloud || []).join(", ") },
          { label: "Developer Tools", items: (updatedProfile.skills_tools || []).join(", ") },
        ].filter((g) => g.items && g.items.trim());

        R.experience = (updatedProfile.experience || []).map((exp) => ({
          company: exp.company || "",
          title: exp.title || "",
          location: exp.location || "",
          dates: `${exp.start || ""} - ${exp.end || "Present"}`,
          bullets: exp.desc
            ? exp.desc.split("\n").filter((b) => b.trim()).map((b) => b.replace(/^•\s*/, ""))
            : [],
        }));

        R.projects = (updatedProfile.projects || []).map((p) => ({
          name: p.title || "",
          liveLink: p.demo || "",
          githubLink: p.github || "",
          stack: Array.isArray(p.tags) ? p.tags.join(", ") : p.tags || "",
          bullets: p.desc
            ? p.desc.split("\n").filter((b) => b.trim()).map((b) => b.replace(/^•\s*/, ""))
            : [],
        }));

        R.education = (updatedProfile.education || []).map((ed) => ({
          school: ed.school || "",
          degree: ed.degree || "",
          dates: ed.year || "",
          grade: ed.grade || "",
          coursework: ed.coursework || "",
        }));

        localStorage.setItem("getarole_resume_v2", JSON.stringify(R));
      } catch {}

      try {
        await apiClient.post("/user/profile", updatedProfile);
        await apiClient.post("/user/preferences", prefs);
      } catch {}

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3500);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setResumeFileName(file.name);
    localStorage.setItem("getarole_resume_filename", file.name);

    // Auto-populate target name from file if empty
    if (!profile.name) {
      const cleanName = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
      if (cleanName && cleanName.length > 3) {
        setProfile((prev) => ({ ...prev, name: cleanName }));
      }
    }
  };

  // Skill Management Helpers
  const addSkill = (category: "skills_languages" | "skills_frameworks" | "skills_cloud" | "skills_tools", value: string, setter: (v: string) => void) => {
    if (!value.trim()) return;
    const current = profile[category] || [];
    if (!current.includes(value.trim())) {
      setProfile({ ...profile, [category]: [...current, value.trim()] });
    }
    setter("");
  };

  const removeSkill = (category: "skills_languages" | "skills_frameworks" | "skills_cloud" | "skills_tools", item: string) => {
    const current = profile[category] || [];
    setProfile({ ...profile, [category]: current.filter((x) => x !== item) });
  };

  // Add Item to Timeline / Grid
  const handleAddExperience = () => {
    if (!newExp.company || !newExp.title) return;
    setProfile({ ...profile, experience: [...(profile.experience || []), newExp] });
    setNewExp({ company: "", title: "", location: "", start: "", end: "", desc: "" });
    setIsExpModalOpen(false);
  };

  const handleAddProject = () => {
    if (!newProj.title) return;
    setProfile({ ...profile, projects: [...(profile.projects || []), newProj] });
    setNewProj({ title: "", demo: "", github: "", tags: "", desc: "" });
    setIsProjModalOpen(false);
  };

  const handleAddEducation = () => {
    if (!newEdu.school || !newEdu.degree) return;
    setProfile({ ...profile, education: [...(profile.education || []), newEdu] });
    setNewEdu({ school: "", degree: "", year: "", grade: "", coursework: "" });
    setIsEduModalOpen(false);
  };

  const handleDeleteAllData = () => {
    if (window.confirm("Are you sure you want to reset all profile data? This will clear all stored skills and dossier information.")) {
      localStorage.removeItem("getarole_profile");
      localStorage.removeItem("getarole_prefs");
      localStorage.removeItem("getarole_resume_v2");
      localStorage.removeItem("getarole_resume_filename");
      setProfile({
        name: "",
        headline: "",
        email: "",
        phone: "",
        city: "",
        location: "",
        summary: "",
        skills_languages: [],
        skills_frameworks: [],
        skills_cloud: [],
        skills_tools: [],
        skills: [],
        experience: [],
        projects: [],
        education: [],
        certifications: [],
        achievements: [],
        links: { github: "", linkedin: "", portfolio: "" },
      });
      setResumeFileName("");
      alert("All local profile and dossier data have been reset.");
    }
  };

  const candidateInitial = (profile.name || "User").trim().charAt(0).toUpperCase();

  return (
    <div className="relative min-h-screen pt-24 pb-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* ════════════════════ TWO-COLUMN DOSSIER WORKSPACE ════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-[300px_minmax(0,1fr)] gap-8 items-start">
        
        {/* ── LEFT SIDEBAR: QUICK NAVIGATION & DEVELOPER LINKS ── */}
        <aside className="space-y-6 lg:sticky lg:top-24">
          
          {/* UNIFIED PROFILE & CAREER HUB CARD (Authentic Old Style) */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col items-center text-center relative overflow-hidden">
            <button
              type="button"
              onClick={() => setActiveTab("personal")}
              className="absolute top-4 right-4 w-8 h-8 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-900 flex items-center justify-center transition-colors shadow-2xs"
              title="Edit Profile Demographics"
            >
              <Edit3 className="w-4 h-4" />
            </button>

            {/* Avatar Box with Teal/Cyan Background */}
            <div className="w-20 h-20 rounded-2xl bg-[#22b8cf] text-white text-3xl font-extrabold flex items-center justify-center shadow-[0_8px_20px_rgba(34,184,207,0.3)] mb-3 mt-2">
              {candidateInitial}
            </div>

            <h2 className="text-xl font-extrabold text-slate-800 tracking-tight mb-2">
              {profile.name || "Candidate Profile"}
            </h2>

            <div className="text-[11.5px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Job Search Status
            </div>

            <div className="w-full mb-5">
              <select
                value={prefs.status}
                onChange={(e) => setPrefs({ ...prefs, status: e.target.value })}
                className="w-full text-xs font-bold px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 outline-none cursor-pointer text-center"
              >
                <option value="Actively looking">🟢 Actively looking for roles</option>
                <option value="Open to offers">🟡 Open to offers</option>
                <option value="Closed to offers">⚪ Closed to offers</option>
              </select>
            </div>

            <div className="w-full h-px bg-slate-100 mb-5" />

            {/* My Career Hub Navigation Buttons */}
            <h3 className="w-full text-xs font-extrabold text-slate-800 uppercase tracking-wider text-left mb-3">
              My Career Hub
            </h3>

            <div className="w-full space-y-2.5">
              {/* Hub Button 1: Personal Info */}
              <button
                type="button"
                onClick={() => setActiveTab("personal")}
                className={`w-full flex items-center justify-between p-3.5 rounded-xl border transition-all text-left ${
                  activeTab === "personal"
                    ? "bg-[#14b8a6] border-[#14b8a6] text-white shadow-[0_8px_20px_rgba(20,184,166,0.25)] scale-101"
                    : "bg-white border-slate-200 hover:border-slate-300 text-slate-800 hover:bg-slate-50/70"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">📊</span>
                  <div className="flex flex-col">
                    <span className={`text-sm font-extrabold leading-tight ${activeTab === "personal" ? "text-white" : "text-slate-800"}`}>
                      Personal Info
                    </span>
                    <span className={`text-xs ${activeTab === "personal" ? "text-teal-50 font-medium" : "text-slate-500 font-normal"}`}>
                      Edit demographic data
                    </span>
                  </div>
                </div>
                <span className={`text-base font-bold ${activeTab === "personal" ? "text-white" : "text-slate-400"}`}>→</span>
              </button>

              {/* Hub Button 2: Profile (Default Active) */}
              <button
                type="button"
                onClick={() => setActiveTab("profile")}
                className={`w-full flex items-center justify-between p-3.5 rounded-xl border transition-all text-left ${
                  activeTab === "profile"
                    ? "bg-[#14b8a6] border-[#14b8a6] text-white shadow-[0_8px_20px_rgba(20,184,166,0.25)] scale-101"
                    : "bg-white border-slate-200 hover:border-slate-300 text-slate-800 hover:bg-slate-50/70"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">✏️</span>
                  <div className="flex flex-col">
                    <span className={`text-sm font-extrabold leading-tight ${activeTab === "profile" ? "text-white" : "text-slate-800"}`}>
                      Profile
                    </span>
                    <span className={`text-xs ${activeTab === "profile" ? "text-teal-50 font-medium" : "text-slate-500 font-normal"}`}>
                      Edit autofill information
                    </span>
                  </div>
                </div>
                <span className={`text-base font-bold ${activeTab === "profile" ? "text-white" : "text-slate-400"}`}>→</span>
              </button>

              {/* Hub Button 3: Job Preferences */}
              <button
                type="button"
                onClick={() => setActiveTab("preferences")}
                className={`w-full flex items-center justify-between p-3.5 rounded-xl border transition-all text-left ${
                  activeTab === "preferences"
                    ? "bg-[#14b8a6] border-[#14b8a6] text-white shadow-[0_8px_20px_rgba(20,184,166,0.25)] scale-101"
                    : "bg-white border-slate-200 hover:border-slate-300 text-slate-800 hover:bg-slate-50/70"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">💼</span>
                  <div className="flex flex-col">
                    <span className={`text-sm font-extrabold leading-tight ${activeTab === "preferences" ? "text-white" : "text-slate-800"}`}>
                      Job Preferences
                    </span>
                    <span className={`text-xs ${activeTab === "preferences" ? "text-teal-50 font-medium" : "text-slate-500 font-normal"}`}>
                      Refine your job search
                    </span>
                  </div>
                </div>
                <span className={`text-base font-bold ${activeTab === "preferences" ? "text-white" : "text-slate-400"}`}>→</span>
              </button>
            </div>
          </div>

          {/* Profile Strength Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                Profile Strength
              </span>
              <span className="text-sm font-extrabold text-blue-600 font-mono">
                {strengthScore}%
              </span>
            </div>

            {/* Gradient progress bar */}
            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden mb-4">
              <div
                className="h-full rounded-full transition-all duration-700 ease-out bg-gradient-to-r from-sky-500 to-indigo-600"
                style={{ width: `${strengthScore}%` }}
              />
            </div>

            {/* Checklist tags */}
            <div className="space-y-1.5 text-xs font-medium text-slate-600">
              <div className={`flex items-center gap-2 ${profile.name && profile.email ? "text-emerald-700 font-bold" : "text-slate-400"}`}>
                <span>{profile.name && profile.email ? "✓" : "○"}</span>
                <span>Contact & Identity</span>
              </div>
              <div className={`flex items-center gap-2 ${(profile.skills_languages?.length || 0) + (profile.skills_frameworks?.length || 0) > 0 ? "text-emerald-700 font-bold" : "text-slate-400"}`}>
                <span>{(profile.skills_languages?.length || 0) + (profile.skills_frameworks?.length || 0) > 0 ? "✓" : "○"}</span>
                <span>Categorized Skills</span>
              </div>
              <div className={`flex items-center gap-2 ${profile.experience?.length ? "text-emerald-700 font-bold" : "text-slate-400"}`}>
                <span>{profile.experience?.length ? "✓" : "○"}</span>
                <span>Experience & Bullets</span>
              </div>
              <div className={`flex items-center gap-2 ${profile.projects?.length ? "text-emerald-700 font-bold" : "text-slate-400"}`}>
                <span>{profile.projects?.length ? "✓" : "○"}</span>
                <span>Projects</span>
              </div>
              <div className={`flex items-center gap-2 ${profile.education?.length ? "text-emerald-700 font-bold" : "text-slate-400"}`}>
                <span>{profile.education?.length ? "✓" : "○"}</span>
                <span>Education</span>
              </div>
              <div className={`flex items-center gap-2 ${resumeFileName ? "text-emerald-700 font-bold" : "text-slate-400"}`}>
                <span>{resumeFileName ? "✓" : "○"}</span>
                <span>Resume Synced</span>
              </div>
            </div>
          </div>

          {/* ATS Resume Status Widget */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
            <input
              type="file"
              ref={fileInputRef}
              accept=".pdf,.docx,.doc,.txt"
              onChange={handleFileUpload}
              className="hidden"
            />
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-lg flex-shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-extrabold text-slate-800">Resume Dossier</div>
                <div className="text-xs text-slate-500 truncate">
                  {resumeFileName || "No file uploaded yet"}
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs transition-all cursor-pointer"
              >
                <UploadCloud className="w-3.5 h-3.5" />
                <span>Upload</span>
              </button>
              <button
                type="button"
                onClick={() => setIsPreviewOpen(true)}
                className="flex-1 py-2 px-3 rounded-xl bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-50 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Preview</span>
              </button>
            </div>
          </div>

          {/* Save Action Trigger in Sidebar */}
          <button
            type="button"
            onClick={() => handleSave()}
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
          >
            <Save className="w-4 h-4" />
            <span>{loading ? "Saving Dossier..." : "Save Profile & Resume"}</span>
          </button>

          {savedSuccess && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Profile & LaTeX resume synchronized!</span>
            </div>
          )}
        </aside>

        {/* ── RIGHT COLUMN: DETAILED DOSSIER SECTIONS ── */}
        <div className="space-y-6">

          {/* ════════════════════ HERO ATS RESUME UPLOAD CARD ════════════════════ */}
          <div className="bg-gradient-to-br from-sky-50 via-indigo-50 to-purple-50 border-2 border-dashed border-indigo-400 rounded-2xl p-6 sm:p-7 shadow-xs relative overflow-hidden">
            <input
              type="file"
              ref={heroFileInputRef}
              accept=".pdf,.docx,.doc,.txt"
              onChange={handleFileUpload}
              className="hidden"
            />
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-600 to-sky-500 text-white flex items-center justify-center text-2xl shadow-md flex-shrink-0">
                  <FileText className="w-7 h-7" />
                </div>
                <div>
                  <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
                    <h2 className="text-xl font-extrabold text-slate-900 tracking-tight font-outfit">
                      Resume
                    </h2>
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100/90 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                      ✓ {resumeFileName ? `Synced: ${resumeFileName}` : "Ready to upload"}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 max-w-xl leading-relaxed">
                    Upload your resume in PDF or Word format to automatically populate your profile details, skills, and matched opportunities.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:items-end gap-2 w-full sm:w-auto">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => heroFileInputRef.current?.click()}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>Upload Resume</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsPreviewOpen(true)}
                    className="px-4 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Preview</span>
                  </button>
                </div>
                <span className="text-[11px] text-slate-400 font-medium">
                  or drag and drop your file here
                </span>
              </div>
            </div>
          </div>

          {/* ════════════════════ TAB 1: PROFILE (Autofill & Experience) ════════════════════ */}
          {activeTab === "profile" && (
            <div className="space-y-6">
              
              {/* SECTION: CATEGORIZED TECHNICAL SKILLS */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-7">
                <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl">🛠️</span>
                    <h2 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight font-outfit">
                      Categorized Technical Skills (Resume Formats)
                    </h2>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Category 1: Languages */}
                  <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-4">
                    <div className="text-xs font-extrabold text-slate-600 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                      <span>💻</span> Programming Languages
                    </div>
                    <div className="flex flex-wrap gap-1.5 mb-3 min-h-[32px]">
                      {(profile.skills_languages || []).map((lang) => (
                        <span key={lang} className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 shadow-2xs">
                          {lang}
                          <button type="button" onClick={() => removeSkill("skills_languages", lang)} className="text-slate-400 hover:text-rose-500 text-sm">×</button>
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newLang}
                        onChange={(e) => setNewLang(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill("skills_languages", newLang, setNewLang))}
                        placeholder="Add language..."
                        className="flex-1 text-xs px-3 py-1.5 rounded-lg border border-slate-200 bg-white outline-none focus:border-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => addSkill("skills_languages", newLang, setNewLang)}
                        className="px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs"
                      >
                        + Add
                      </button>
                    </div>
                  </div>

                  {/* Category 2: Frameworks */}
                  <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-4">
                    <div className="text-xs font-extrabold text-slate-600 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                      <span>⚡</span> Frameworks & Libraries
                    </div>
                    <div className="flex flex-wrap gap-1.5 mb-3 min-h-[32px]">
                      {(profile.skills_frameworks || []).map((fw) => (
                        <span key={fw} className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 shadow-2xs">
                          {fw}
                          <button type="button" onClick={() => removeSkill("skills_frameworks", fw)} className="text-slate-400 hover:text-rose-500 text-sm">×</button>
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newFw}
                        onChange={(e) => setNewFw(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill("skills_frameworks", newFw, setNewFw))}
                        placeholder="Add framework..."
                        className="flex-1 text-xs px-3 py-1.5 rounded-lg border border-slate-200 bg-white outline-none focus:border-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => addSkill("skills_frameworks", newFw, setNewFw)}
                        className="px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs"
                      >
                        + Add
                      </button>
                    </div>
                  </div>

                  {/* Category 3: Cloud & DB */}
                  <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-4">
                    <div className="text-xs font-extrabold text-slate-600 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                      <span>☁️</span> Cloud, DevOps & Databases
                    </div>
                    <div className="flex flex-wrap gap-1.5 mb-3 min-h-[32px]">
                      {(profile.skills_cloud || []).map((c) => (
                        <span key={c} className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 shadow-2xs">
                          {c}
                          <button type="button" onClick={() => removeSkill("skills_cloud", c)} className="text-slate-400 hover:text-rose-500 text-sm">×</button>
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newCloud}
                        onChange={(e) => setNewCloud(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill("skills_cloud", newCloud, setNewCloud))}
                        placeholder="Add cloud/db..."
                        className="flex-1 text-xs px-3 py-1.5 rounded-lg border border-slate-200 bg-white outline-none focus:border-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => addSkill("skills_cloud", newCloud, setNewCloud)}
                        className="px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs"
                      >
                        + Add
                      </button>
                    </div>
                  </div>

                  {/* Category 4: Tools */}
                  <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-4">
                    <div className="text-xs font-extrabold text-slate-600 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                      <span>🔧</span> Developer Tools & Platforms
                    </div>
                    <div className="flex flex-wrap gap-1.5 mb-3 min-h-[32px]">
                      {(profile.skills_tools || []).map((t) => (
                        <span key={t} className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 shadow-2xs">
                          {t}
                          <button type="button" onClick={() => removeSkill("skills_tools", t)} className="text-slate-400 hover:text-rose-500 text-sm">×</button>
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newTool}
                        onChange={(e) => setNewTool(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill("skills_tools", newTool, setNewTool))}
                        placeholder="Add tool..."
                        className="flex-1 text-xs px-3 py-1.5 rounded-lg border border-slate-200 bg-white outline-none focus:border-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => addSkill("skills_tools", newTool, setNewTool)}
                        className="px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs"
                      >
                        + Add
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION: WORK EXPERIENCE */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-7">
                <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl">💼</span>
                    <h2 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight font-outfit">
                      Work Experience & Impact
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsExpModalOpen(true)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Position</span>
                  </button>
                </div>

                {(!profile.experience || profile.experience.length === 0) ? (
                  <div className="text-center py-8 text-slate-400 text-xs font-medium bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                    No work experience listed yet. Click &quot;Add Position&quot; to include internships or full-time roles.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {profile.experience.map((exp, idx) => (
                      <div key={idx} className="p-4 rounded-xl border border-slate-200/90 bg-slate-50/40 hover:bg-white transition-colors flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3.5">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-extrabold flex items-center justify-center text-sm flex-shrink-0">
                            {exp.company ? exp.company.charAt(0).toUpperCase() : "W"}
                          </div>
                          <div>
                            <div className="text-sm font-extrabold text-slate-800">{exp.title}</div>
                            <div className="text-xs font-bold text-slate-500 flex items-center gap-2 mt-0.5">
                              <span>{exp.company}</span>
                              {exp.location && <span>• {exp.location}</span>}
                              {(exp.start || exp.end) && (
                                <span className="font-mono text-[11px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                                  {exp.start || ""} - {exp.end || "Present"}
                                </span>
                              )}
                            </div>
                            {exp.desc && (
                              <p className="text-xs text-slate-600 mt-2 leading-relaxed whitespace-pre-line">
                                {exp.desc}
                              </p>
                            )}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setProfile({ ...profile, experience: profile.experience.filter((_, i) => i !== idx) })}
                          className="text-slate-400 hover:text-rose-600 p-1 transition-colors"
                          title="Remove position"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* SECTION: FEATURED PROJECTS */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-7">
                <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl">📁</span>
                    <h2 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight font-outfit">
                      Featured Projects
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsProjModalOpen(true)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Project</span>
                  </button>
                </div>

                {(!profile.projects || profile.projects.length === 0) ? (
                  <div className="text-center py-8 text-slate-400 text-xs font-medium bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                    No projects added yet. Showcase your open-source, full-stack, or AI repositories.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {profile.projects.map((proj, idx) => (
                      <div key={idx} className="p-4 rounded-xl border border-slate-200/90 bg-slate-50/40 hover:bg-white transition-colors flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="text-sm font-extrabold text-slate-800">{proj.title}</h4>
                            <button
                              type="button"
                              onClick={() => setProfile({ ...profile, projects: profile.projects.filter((_, i) => i !== idx) })}
                              className="text-slate-400 hover:text-rose-600 p-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          {proj.desc && (
                            <p className="text-xs text-slate-600 mb-3 leading-relaxed">
                              {proj.desc}
                            </p>
                          )}
                          {proj.tags && (
                            <div className="flex flex-wrap gap-1 mb-3">
                              {(Array.isArray(proj.tags) ? proj.tags : String(proj.tags).split(",")).map((t, tidx) => (
                                <span key={tidx} className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700">
                                  {String(t).trim()}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-3 pt-2 border-t border-slate-100 text-xs font-bold text-blue-600">
                          {proj.demo && (
                            <a href={proj.demo} target="_blank" rel="noreferrer" className="hover:underline flex items-center gap-1">
                              <span>Live Demo</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                          {proj.github && (
                            <a href={proj.github} target="_blank" rel="noreferrer" className="hover:underline flex items-center gap-1">
                              <span>GitHub</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* SECTION: EDUCATION */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-7">
                <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl">🎓</span>
                    <h2 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight font-outfit">
                      Education & Coursework
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsEduModalOpen(true)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Education</span>
                  </button>
                </div>

                {(!profile.education || profile.education.length === 0) ? (
                  <div className="text-center py-8 text-slate-400 text-xs font-medium bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                    No education recorded. Add your university, degree, or relevant coursework.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {profile.education.map((edu, idx) => (
                      <div key={idx} className="p-4 rounded-xl border border-slate-200/90 bg-slate-50/40 hover:bg-white transition-colors flex items-center justify-between">
                        <div>
                          <div className="text-sm font-extrabold text-slate-800">{edu.school}</div>
                          <div className="text-xs font-medium text-slate-600 mt-0.5">
                            {edu.degree} {edu.year && <span className="text-slate-400">({edu.year})</span>}
                          </div>
                          {edu.coursework && (
                            <div className="text-[11px] text-slate-500 mt-1 font-medium">
                              Coursework: {edu.coursework}
                            </div>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => setProfile({ ...profile, education: profile.education.filter((_, i) => i !== idx) })}
                          className="text-slate-400 hover:text-rose-600 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ════════════════════ TAB 2: PERSONAL INFO ════════════════════ */}
          {activeTab === "personal" && (
            <div className="space-y-6">
              {/* Core Demographics Form */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-7">
                <div className="flex items-center gap-2.5 mb-5 pb-3 border-b border-slate-100">
                  <span className="text-xl">👤</span>
                  <h2 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight font-outfit">
                    Personal Information & Summary
                  </h2>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={profile.name || ""}
                        onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                        className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600 bg-white"
                        placeholder="Candidate Full Name"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                        Headline / Target Title
                      </label>
                      <input
                        type="text"
                        value={profile.headline || ""}
                        onChange={(e) => setProfile({ ...profile, headline: e.target.value })}
                        className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600 bg-white"
                        placeholder="e.g. Full Stack Engineer | Python & React"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={profile.email || ""}
                        onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                        className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600 bg-white"
                        placeholder="you@email.com"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={profile.phone || ""}
                        onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                        className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600 bg-white"
                        placeholder="Contact number"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                        Location / City
                      </label>
                      <input
                        type="text"
                        value={profile.location || profile.city || ""}
                        onChange={(e) => setProfile({ ...profile, location: e.target.value, city: e.target.value })}
                        className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600 bg-white"
                        placeholder="Bengaluru, Remote, etc."
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                      Professional Executive Summary
                    </label>
                    <textarea
                      rows={4}
                      value={profile.summary || ""}
                      onChange={(e) => setProfile({ ...profile, summary: e.target.value })}
                      className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600 bg-white leading-relaxed"
                      placeholder="Briefly describe your core engineering strengths, experience level, and key passions..."
                    />
                  </div>
                </div>
              </div>

              {/* Online Presence & Social Profiles */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-7">
                <div className="flex items-center gap-2.5 mb-5 pb-3 border-b border-slate-100">
                  <span className="text-xl">🌐</span>
                  <h2 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight font-outfit">
                    Online Presence & Resume Header Links
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                      💼 LinkedIn Profile
                    </label>
                    <input
                      type="url"
                      value={profile.links?.linkedin || ""}
                      onChange={(e) => setProfile({ ...profile, links: { ...(profile.links || {}), linkedin: e.target.value } })}
                      className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600 bg-white"
                      placeholder="https://linkedin.com/in/..."
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                      🐙 GitHub Profile
                    </label>
                    <input
                      type="url"
                      value={profile.links?.github || ""}
                      onChange={(e) => setProfile({ ...profile, links: { ...(profile.links || {}), github: e.target.value } })}
                      className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600 bg-white"
                      placeholder="https://github.com/..."
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                      🌐 Portfolio Website
                    </label>
                    <input
                      type="url"
                      value={profile.links?.portfolio || ""}
                      onChange={(e) => setProfile({ ...profile, links: { ...(profile.links || {}), portfolio: e.target.value } })}
                      className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600 bg-white"
                      placeholder="https://..."
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                      ⚡ LeetCode Profile
                    </label>
                    <input
                      type="url"
                      value={profile.links?.leetcode || ""}
                      onChange={(e) => setProfile({ ...profile, links: { ...(profile.links || {}), leetcode: e.target.value } })}
                      className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600 bg-white"
                      placeholder="https://leetcode.com/u/..."
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                      🐦 Twitter / X
                    </label>
                    <input
                      type="url"
                      value={profile.links?.twitter || ""}
                      onChange={(e) => setProfile({ ...profile, links: { ...(profile.links || {}), twitter: e.target.value } })}
                      className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600 bg-white"
                      placeholder="https://x.com/..."
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ════════════════════ TAB 3: JOB PREFERENCES ════════════════════ */}
          {activeTab === "preferences" && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-7">
                <div className="flex items-center gap-2.5 mb-5 pb-3 border-b border-slate-100">
                  <span className="text-xl">🎯</span>
                  <h2 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight font-outfit">
                    Career Targets & Compensation
                  </h2>
                </div>

                <div className="space-y-5">
                  {/* Target Roles */}
                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2">
                      Target Role Titles
                    </label>
                    <div className="flex flex-wrap gap-1.5 mb-2.5 min-h-[32px]">
                      {(prefs.roles || []).map((r) => (
                        <span key={r} className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 text-blue-700">
                          {r}
                          <button
                            type="button"
                            onClick={() => setPrefs({ ...prefs, roles: prefs.roles.filter((x) => x !== r) })}
                            className="text-blue-400 hover:text-rose-500 text-sm"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-2 max-w-md">
                      <input
                        type="text"
                        value={newPrefRole}
                        onChange={(e) => setNewPrefRole(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && newPrefRole.trim()) {
                            e.preventDefault();
                            if (!prefs.roles.includes(newPrefRole.trim())) {
                              setPrefs({ ...prefs, roles: [...(prefs.roles || []), newPrefRole.trim()] });
                            }
                            setNewPrefRole("");
                          }
                        }}
                        placeholder="e.g. SDE 1, Frontend Developer..."
                        className="flex-1 text-xs px-3 py-2 rounded-xl border border-slate-200 outline-none focus:border-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (newPrefRole.trim() && !prefs.roles.includes(newPrefRole.trim())) {
                            setPrefs({ ...prefs, roles: [...(prefs.roles || []), newPrefRole.trim()] });
                            setNewPrefRole("");
                          }
                        }}
                        className="px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold"
                      >
                        + Add Role
                      </button>
                    </div>
                  </div>

                  {/* Preferred Locations */}
                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2">
                      Preferred Locations
                    </label>
                    <div className="flex flex-wrap gap-1.5 mb-2.5 min-h-[32px]">
                      {(prefs.locations || []).map((l) => (
                        <span key={l} className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700">
                          {l}
                          <button
                            type="button"
                            onClick={() => setPrefs({ ...prefs, locations: prefs.locations.filter((x) => x !== l) })}
                            className="text-emerald-400 hover:text-rose-500 text-sm"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-2 max-w-md">
                      <input
                        type="text"
                        value={newPrefLoc}
                        onChange={(e) => setNewPrefLoc(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && newPrefLoc.trim()) {
                            e.preventDefault();
                            if (!prefs.locations.includes(newPrefLoc.trim())) {
                              setPrefs({ ...prefs, locations: [...(prefs.locations || []), newPrefLoc.trim()] });
                            }
                            setNewPrefLoc("");
                          }
                        }}
                        placeholder="e.g. Bengaluru, Hyderabad, Remote..."
                        className="flex-1 text-xs px-3 py-2 rounded-xl border border-slate-200 outline-none focus:border-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (newPrefLoc.trim() && !prefs.locations.includes(newPrefLoc.trim())) {
                            setPrefs({ ...prefs, locations: [...(prefs.locations || []), newPrefLoc.trim()] });
                            setNewPrefLoc("");
                          }
                        }}
                        className="px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold"
                      >
                        + Add Location
                      </button>
                    </div>
                  </div>

                  {/* Workplace Mode & Seniority */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                        Workplace Mode
                      </label>
                      <select
                        value={prefs.workplaceType || "Hybrid"}
                        onChange={(e) => setPrefs({ ...prefs, workplaceType: e.target.value })}
                        className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white outline-none focus:border-blue-500 font-medium text-slate-800"
                      >
                        <option value="Remote">🌐 Remote Only</option>
                        <option value="Hybrid">🏢 Hybrid</option>
                        <option value="On-site">🏙️ On-site Only</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                        Seniority Level
                      </label>
                      <select
                        value={prefs.seniority || "Mid-Level"}
                        onChange={(e) => setPrefs({ ...prefs, seniority: e.target.value })}
                        className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white outline-none focus:border-blue-500 font-medium text-slate-800"
                      >
                        <option value="Entry-Level">Entry-Level / Fresher (0-1 yrs)</option>
                        <option value="Mid-Level">Mid-Level (2-4 yrs)</option>
                        <option value="Senior">Senior (5-8 yrs)</option>
                        <option value="Lead/Manager">Staff / Lead / Manager (8+ yrs)</option>
                      </select>
                    </div>
                  </div>

                  {/* Minimum Expected Salary */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                        Minimum Expected Salary
                      </label>
                      <span className="text-sm font-extrabold text-blue-600 font-mono">
                        {prefs.salary_curr === "INR"
                          ? `₹${((prefs.salary_amt || 0) / 100000).toFixed(1)} LPA+`
                          : `$${((prefs.salary_amt || 0) / 1000).toFixed(0)}k/yr`}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <select
                        value={prefs.salary_curr || "INR"}
                        onChange={(e) => setPrefs({ ...prefs, salary_curr: e.target.value })}
                        className="text-xs font-bold px-3 py-2.5 rounded-xl border border-slate-200 bg-white outline-none focus:border-blue-500"
                      >
                        <option value="INR">INR (₹)</option>
                        <option value="USD">USD ($)</option>
                      </select>
                      <input
                        type="number"
                        value={prefs.salary_amt || 0}
                        onChange={(e) => setPrefs({ ...prefs, salary_amt: Number(e.target.value) || 0 })}
                        className="flex-1 text-sm font-mono font-bold text-slate-800 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white outline-none focus:border-blue-500"
                        step={50000}
                        min={0}
                      />
                    </div>
                  </div>

                  {/* Company Size */}
                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                      Company Stage Preference
                    </label>
                    <select
                      value={prefs.companySize || "Any"}
                      onChange={(e) => setPrefs({ ...prefs, companySize: e.target.value })}
                      className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white outline-none focus:border-blue-500 font-medium text-slate-800"
                    >
                      <option value="Any">Any Company Size</option>
                      <option value="Startup">Early Stage Startup (1-50)</option>
                      <option value="Mid-Size">Growth Mid-Size (51-500)</option>
                      <option value="Enterprise">Enterprise (500+)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ════════════════════ RESUME PREVIEW MODAL ════════════════════ */}
      {isPreviewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-scaleUp">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
              <div className="flex items-center gap-2.5">
                <FileText className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-extrabold text-slate-900 font-outfit">
                  Compiled Resume Dossier
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsPreviewOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 text-sm text-slate-700">
              {/* Header block */}
              <div className="text-center pb-4 border-b border-slate-100">
                <h2 className="text-2xl font-extrabold text-slate-900">{profile.name || "Candidate Name"}</h2>
                <div className="text-sm font-bold text-blue-600 mt-0.5">{profile.headline}</div>
                <div className="text-xs text-slate-500 flex flex-wrap justify-center gap-3 mt-2">
                  {profile.email && <span>{profile.email}</span>}
                  {profile.phone && <span>• {profile.phone}</span>}
                  {(profile.location || profile.city) && <span>• {profile.location || profile.city}</span>}
                </div>
              </div>

              {/* Summary */}
              {profile.summary && (
                <div>
                  <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">Executive Summary</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">{profile.summary}</p>
                </div>
              )}

              {/* Skills */}
              <div>
                <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-2">Technical Skills</h4>
                <div className="space-y-1.5 text-xs">
                  {profile.skills_languages?.length > 0 && (
                    <div><span className="font-bold text-slate-800">Languages:</span> {profile.skills_languages.join(", ")}</div>
                  )}
                  {profile.skills_frameworks?.length > 0 && (
                    <div><span className="font-bold text-slate-800">Frameworks:</span> {profile.skills_frameworks.join(", ")}</div>
                  )}
                  {profile.skills_cloud?.length > 0 && (
                    <div><span className="font-bold text-slate-800">Cloud/DB:</span> {profile.skills_cloud.join(", ")}</div>
                  )}
                  {profile.skills_tools?.length > 0 && (
                    <div><span className="font-bold text-slate-800">Tools:</span> {profile.skills_tools.join(", ")}</div>
                  )}
                </div>
              </div>

              {/* Experience */}
              {profile.experience?.length > 0 && (
                <div>
                  <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-2">Experience</h4>
                  <div className="space-y-3">
                    {profile.experience.map((exp, i) => (
                      <div key={i} className="text-xs">
                        <div className="flex justify-between font-bold text-slate-800">
                          <span>{exp.title} • {exp.company}</span>
                          <span className="font-mono text-slate-500">{exp.start} - {exp.end || "Present"}</span>
                        </div>
                        {exp.desc && <p className="text-slate-600 mt-1 whitespace-pre-line">{exp.desc}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Education */}
              {profile.education?.length > 0 && (
                <div>
                  <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-2">Education</h4>
                  <div className="space-y-2">
                    {profile.education.map((edu, i) => (
                      <div key={i} className="text-xs flex justify-between">
                        <div>
                          <span className="font-bold text-slate-800">{edu.school}</span>
                          <span className="text-slate-600"> — {edu.degree}</span>
                        </div>
                        <span className="font-mono text-slate-500">{edu.year}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsPreviewOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════ ADD EXPERIENCE MODAL ════════════════════ */}
      {isExpModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-extrabold text-slate-900 font-outfit">Add Work Position</h3>
              <button onClick={() => setIsExpModalOpen(false)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Company</label>
                <input
                  type="text"
                  value={newExp.company}
                  onChange={(e) => setNewExp({ ...newExp, company: e.target.value })}
                  placeholder="Company Name"
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Role Title</label>
                <input
                  type="text"
                  value={newExp.title}
                  onChange={(e) => setNewExp({ ...newExp, title: e.target.value })}
                  placeholder="Software Engineer Intern / Fullstack Developer"
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Start Date</label>
                  <input
                    type="text"
                    value={newExp.start}
                    onChange={(e) => setNewExp({ ...newExp, start: e.target.value })}
                    placeholder="e.g. Jan 2024"
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">End Date</label>
                  <input
                    type="text"
                    value={newExp.end}
                    onChange={(e) => setNewExp({ ...newExp, end: e.target.value })}
                    placeholder="e.g. Present"
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Location</label>
                <input
                  type="text"
                  value={newExp.location}
                  onChange={(e) => setNewExp({ ...newExp, location: e.target.value })}
                  placeholder="Bengaluru / Remote"
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description & Bullet Points</label>
                <textarea
                  rows={3}
                  value={newExp.desc}
                  onChange={(e) => setNewExp({ ...newExp, desc: e.target.value })}
                  placeholder="Key contributions and achievements..."
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsExpModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddExperience}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold"
              >
                Add Position
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════ ADD PROJECT MODAL ════════════════════ */}
      {isProjModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-extrabold text-slate-900 font-outfit">Add Project</h3>
              <button onClick={() => setIsProjModalOpen(false)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Project Name</label>
                <input
                  type="text"
                  value={newProj.title}
                  onChange={(e) => setNewProj({ ...newProj, title: e.target.value })}
                  placeholder="Project Name"
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tech Stack (comma-separated)</label>
                <input
                  type="text"
                  value={typeof newProj.tags === "string" ? newProj.tags : (newProj.tags || []).join(", ")}
                  onChange={(e) => setNewProj({ ...newProj, tags: e.target.value })}
                  placeholder="Next.js, Python, PostgreSQL"
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Live URL (Optional)</label>
                  <input
                    type="url"
                    value={newProj.demo}
                    onChange={(e) => setNewProj({ ...newProj, demo: e.target.value })}
                    placeholder="https://..."
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">GitHub URL (Optional)</label>
                  <input
                    type="url"
                    value={newProj.github}
                    onChange={(e) => setNewProj({ ...newProj, github: e.target.value })}
                    placeholder="https://github.com/..."
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={newProj.desc}
                  onChange={(e) => setNewProj({ ...newProj, desc: e.target.value })}
                  placeholder="Brief description of the project..."
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsProjModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddProject}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold"
              >
                Add Project
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════ ADD EDUCATION MODAL ════════════════════ */}
      {isEduModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-extrabold text-slate-900 font-outfit">Add Education</h3>
              <button onClick={() => setIsEduModalOpen(false)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">School / University</label>
                <input
                  type="text"
                  value={newEdu.school}
                  onChange={(e) => setNewEdu({ ...newEdu, school: e.target.value })}
                  placeholder="University Name"
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Degree & Field</label>
                <input
                  type="text"
                  value={newEdu.degree}
                  onChange={(e) => setNewEdu({ ...newEdu, degree: e.target.value })}
                  placeholder="B.Tech in Computer Science"
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Graduation Year</label>
                  <input
                    type="text"
                    value={newEdu.year}
                    onChange={(e) => setNewEdu({ ...newEdu, year: e.target.value })}
                    placeholder="2025"
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">CGPA / Grade (Optional)</label>
                  <input
                    type="text"
                    value={newEdu.grade}
                    onChange={(e) => setNewEdu({ ...newEdu, grade: e.target.value })}
                    placeholder="8.5 / 10"
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Coursework (Optional)</label>
                <input
                  type="text"
                  value={newEdu.coursework}
                  onChange={(e) => setNewEdu({ ...newEdu, coursework: e.target.value })}
                  placeholder="Data Structures, Algorithms, DBMS, Operating Systems"
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsEduModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddEducation}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold"
              >
                Add Education
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
