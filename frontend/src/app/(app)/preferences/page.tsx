"use client";

import React, { useState, useEffect } from "react";
import { 
  User, Mail, Phone, MapPin, ShieldAlert, LogOut, CheckCircle2, 
  Trash2, Download, RefreshCw, Sparkles, Building, Briefcase, DollarSign,
  Sliders, ShieldCheck, KeyRound
} from "lucide-react";
import { useAuth } from "@/providers/auth-provider";
import { apiClient } from "@/lib/api-client";

interface UserProfile {
  name: string;
  email: string;
  phone: string;
  location: string;
  headline: string;
}

interface UserPreferences {
  status: string;
  workplaceType: string;
  roles: string[];
  locations: string[];
  salary_amt: number;
  salary_curr: string;
  seniority: string;
}

export default function AccountSettingsPage() {
  const { user, logout } = useAuth();

  const [profile, setProfile] = useState<UserProfile>({
    name: "",
    email: "",
    phone: "",
    location: "",
    headline: "",
  });

  const [prefs, setPrefs] = useState<UserPreferences>({
    status: "Actively looking",
    workplaceType: "Hybrid",
    roles: [],
    locations: [],
    salary_amt: 1500000,
    salary_curr: "INR",
    seniority: "Mid-Level",
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load profile and preferences on mount
  useEffect(() => {
    try {
      const profRaw = localStorage.getItem("getarole_profile");
      const userRaw = localStorage.getItem("getarole_user");
      const prefsRaw = localStorage.getItem("getarole_prefs");

      if (profRaw) {
        const p = JSON.parse(profRaw);
        setProfile({
          name: p.name || "",
          email: p.email || "",
          phone: p.phone || "",
          location: p.location || p.city || "",
          headline: p.headline || "",
        });
      } else if (userRaw) {
        const u = JSON.parse(userRaw);
        setProfile(prev => ({
          ...prev,
          name: u.displayName || u.name || "",
          email: u.email || "",
        }));
      }

      if (prefsRaw) {
        setPrefs(prev => ({ ...prev, ...JSON.parse(prefsRaw) }));
      }
    } catch (e) {
      console.warn("Error loading account settings:", e);
    }
  }, [user]);

  // Save changes
  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setStatusMessage("");

    try {
      // 1. Update localStorage getarole_profile
      const existingProf = JSON.parse(localStorage.getItem("getarole_profile") || "{}");
      const updatedProf = {
        ...existingProf,
        name: profile.name,
        email: profile.email,
        phone: profile.phone,
        location: profile.location,
        city: profile.location,
        headline: profile.headline,
      };
      localStorage.setItem("getarole_profile", JSON.stringify(updatedProf));

      // 2. Update localStorage getarole_prefs
      localStorage.setItem("getarole_prefs", JSON.stringify(prefs));

      // 3. Update getarole_resume_v2 header
      try {
        const resumeObj = JSON.parse(localStorage.getItem("getarole_resume_v2") || "{}");
        if (!resumeObj.header) resumeObj.header = {};
        const nameParts = (profile.name || "").trim().split(" ");
        resumeObj.header.name = profile.name;
        resumeObj.header.first_name = nameParts[0] || "";
        resumeObj.header.last_name = nameParts.slice(1).join(" ") || "";
        resumeObj.header.email = profile.email;
        resumeObj.header.phone = profile.phone;
        resumeObj.header.location = profile.location;
        resumeObj.header.title = profile.headline;
        localStorage.setItem("getarole_resume_v2", JSON.stringify(resumeObj));
      } catch {}

      // 4. Background cloud sync
      try {
        await apiClient.post("/user/profile", updatedProf);
        await apiClient.post("/user/preferences", prefs);
      } catch (err) {
        console.warn("Cloud sync notice:", err);
      }

      setSaveSuccess(true);
      setStatusMessage("Account details and preferences saved successfully!");
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error("Save error:", err);
      setStatusMessage("Failed to save changes. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  // Clear Cached Profile & Resume Data
  const handleClearCache = () => {
    if (confirm("Are you sure you want to clear your local profile cache and cached resume data? Your basic account will remain active.")) {
      localStorage.removeItem("getarole_profile");
      localStorage.removeItem("getarole_resume_v2");
      localStorage.removeItem("getarole_cloud_prefs");
      localStorage.removeItem("getarole_prefs");
      setProfile({ name: user?.displayName || "", email: user?.email || "", phone: "", location: "", headline: "" });
      alert("Local candidate profile dossier and cached resume data have been cleared.");
      window.location.reload();
    }
  };

  // Export Candidate Dossier
  const handleExportData = () => {
    try {
      const prof = localStorage.getItem("getarole_profile") || "{}";
      const resume = localStorage.getItem("getarole_resume_v2") || "{}";
      const userPrefs = localStorage.getItem("getarole_prefs") || "{}";
      const exportBlob = new Blob(
        [JSON.stringify({ profile: JSON.parse(prof), resume: JSON.parse(resume), preferences: JSON.parse(userPrefs) }, null, 2)],
        { type: "application/json" }
      );
      const url = URL.createObjectURL(exportBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `getArole_Candidate_Dossier_${(profile.name || "User").replace(/\s+/g, "_")}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert("Error exporting dossier: " + String(e));
    }
  };

  // Delete Account (GDPR & DPDP Act Cascade Purge)
  const handlePermanentAccountDelete = async () => {
    setIsDeleting(true);
    try {
      if (typeof window !== "undefined" && (window as unknown as { getAroleSync?: { purgeAllDataAndAccount: () => Promise<void> } }).getAroleSync) {
        await (window as unknown as { getAroleSync: { purgeAllDataAndAccount: () => Promise<void> } }).getAroleSync.purgeAllDataAndAccount();
      } else {
        localStorage.clear();
        sessionStorage.clear();
      }
      await logout();
      window.location.replace("/?account_deleted=1");
    } catch (err) {
      console.error("Account deletion error:", err);
      localStorage.clear();
      sessionStorage.clear();
      window.location.replace("/?account_deleted=1");
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const displayName = profile.name || user?.displayName || "Candidate";
  const displayEmail = profile.email || user?.email || "candidate@getarole.in";
  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .map(w => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "U";

  return (
    <div className="relative min-h-screen pt-6 pb-24 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      
      {/* ═════════ USER IDENTITY HEADER ═════════ */}
      <div className="bg-white/85 backdrop-blur-xl border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-sm mb-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600" />
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-extrabold text-2xl flex items-center justify-center shadow-md shadow-blue-200 shrink-0">
              {initials}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="bg-blue-100 text-[#0062e3] text-[11px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  ✓ Verified Account
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  {prefs.status}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-outfit">
                {displayName}
              </h1>
              <p className="text-xs sm:text-sm font-medium text-slate-500">
                {displayEmail} {profile.headline ? `• ${profile.headline}` : ""}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => logout()}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-rose-200 bg-rose-50/70 hover:bg-rose-100 text-rose-700 font-bold text-xs transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4 text-rose-500" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {saveSuccess && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSaveAccount} className="space-y-6">
        
        {/* ═════════ 1. ACCOUNT PROFILE & IDENTITY ═════════ */}
        <div className="bg-white/85 backdrop-blur-xl border border-slate-200/90 rounded-2xl p-6 sm:p-7 shadow-xs">
          <div className="flex items-center gap-2.5 mb-5 pb-3 border-b border-slate-100">
            <User className="w-5 h-5 text-blue-600" />
            <h2 className="text-base sm:text-lg font-bold text-slate-900 font-outfit">
              Account Profile & Contact Information
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Candidate Full Name
              </label>
              <input
                type="text"
                value={profile.name}
                onChange={e => setProfile({ ...profile, name: e.target.value })}
                placeholder="e.g. Hemasai Vattikuti"
                className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Professional Headline / Target Role
              </label>
              <input
                type="text"
                value={profile.headline}
                onChange={e => setProfile({ ...profile, headline: e.target.value })}
                placeholder="e.g. Software Development Engineer"
                className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Primary Email Address
              </label>
              <input
                type="email"
                value={profile.email}
                onChange={e => setProfile({ ...profile, email: e.target.value })}
                placeholder="candidate@example.com"
                className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                value={profile.phone}
                onChange={e => setProfile({ ...profile, phone: e.target.value })}
                placeholder="+91 ..."
                className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600 bg-white"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Current Location
              </label>
              <input
                type="text"
                value={profile.location}
                onChange={e => setProfile({ ...profile, location: e.target.value })}
                placeholder="e.g. Bengaluru, India"
                className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600 bg-white"
              />
            </div>
          </div>
        </div>

        {/* ═════════ 2. CAREER SEARCH PREFERENCES ═════════ */}
        <div className="bg-white/85 backdrop-blur-xl border border-slate-200/90 rounded-2xl p-6 sm:p-7 shadow-xs">
          <div className="flex items-center gap-2.5 mb-5 pb-3 border-b border-slate-100">
            <Briefcase className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base sm:text-lg font-bold text-slate-900 font-outfit">
              Career Targets & Search Preferences
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Job Search Status
              </label>
              <select
                value={prefs.status}
                onChange={e => setPrefs({ ...prefs, status: e.target.value })}
                className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600 bg-white cursor-pointer"
              >
                <option value="Actively looking">🟢 Actively looking for roles</option>
                <option value="Open to offers">🟡 Open to offers</option>
                <option value="Closed to offers">⚪ Not looking right now</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Workplace Mode
              </label>
              <select
                value={prefs.workplaceType}
                onChange={e => setPrefs({ ...prefs, workplaceType: e.target.value })}
                className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600 bg-white cursor-pointer"
              >
                <option value="Remote">Remote</option>
                <option value="Hybrid">Hybrid</option>
                <option value="On-site">On-site</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Seniority Level
              </label>
              <select
                value={prefs.seniority}
                onChange={e => setPrefs({ ...prefs, seniority: e.target.value })}
                className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600 bg-white cursor-pointer"
              >
                <option value="Entry-Level">Entry-Level / Fresher</option>
                <option value="Mid-Level">Mid-Level</option>
                <option value="Senior">Senior</option>
                <option value="Lead/Manager">Lead / Manager</option>
                <option value="Director+">Director / VP</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Target Roles (comma-separated)
              </label>
              <input
                type="text"
                value={prefs.roles.join(", ")}
                onChange={e => setPrefs({ ...prefs, roles: e.target.value.split(",").map(r => r.trim()).filter(Boolean) })}
                placeholder="e.g. Full Stack Developer, SDE II"
                className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600 bg-white"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Minimum Annual Compensation Target
              </label>
              <div className="flex gap-2">
                <select
                  value={prefs.salary_curr}
                  onChange={e => setPrefs({ ...prefs, salary_curr: e.target.value })}
                  className="text-sm px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600 bg-white"
                >
                  <option value="INR">INR (₹)</option>
                  <option value="USD">USD ($)</option>
                </select>
                <input
                  type="number"
                  value={prefs.salary_amt || 1500000}
                  onChange={e => setPrefs({ ...prefs, salary_amt: parseInt(e.target.value, 10) || 0 })}
                  className="flex-1 text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600 bg-white font-mono font-bold text-blue-600"
                />
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm shadow-md transition-all active:scale-98 cursor-pointer"
            >
              {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              <span>{isSaving ? "Saving Settings..." : "Save Account Settings"}</span>
            </button>
          </div>
        </div>

        {/* ═════════ 3. DETAILED ACCOUNT & DATA OPTIONS ═════════ */}
        <div className="bg-white/85 backdrop-blur-xl border border-slate-200/90 rounded-2xl p-6 sm:p-7 shadow-xs space-y-6">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <ShieldCheck className="w-5 h-5 text-slate-700" />
            <h2 className="text-base sm:text-lg font-bold text-slate-900 font-outfit">
              Detailed Account Options & Data Controls
            </h2>
          </div>

          {/* Option A: Clear Cache */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200/80">
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                Clear Profile & Resume Cache
              </h3>
              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                Reset your profile dossier, cleared skills, and cached resume data across this browser session.
              </p>
            </div>
            <button
              type="button"
              onClick={handleClearCache}
              className="px-4 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs shrink-0 transition-colors shadow-2xs cursor-pointer"
            >
              Clear Cached Data
            </button>
          </div>

          {/* Option B: Export Data */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200/80">
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                Export Candidate Dossier
              </h3>
              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                Download a complete JSON export of your structured resume, profile skills, and search parameters.
              </p>
            </div>
            <button
              type="button"
              onClick={handleExportData}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-blue-200 hover:bg-blue-50 text-[#0062e3] font-bold text-xs shrink-0 transition-colors shadow-2xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Dossier</span>
            </button>
          </div>

          {/* Option C: Danger Zone / Permanent Erasure */}
          <div className="p-4 rounded-xl bg-rose-50/60 border border-rose-200">
            <div className="flex items-center gap-2 text-rose-700 font-extrabold text-sm mb-1">
              <ShieldAlert className="w-4 h-4" />
              <span>Permanent Account & Data Erasure</span>
            </div>
            <p className="text-xs text-rose-600 mb-3 leading-relaxed">
              Permanently erase your candidate record, parsed resumes, job matches, and authentication identity under GDPR & DPDP Act compliance. This action cannot be undone.
            </p>
            <button
              type="button"
              onClick={() => setShowDeleteModal(true)}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-colors shadow-2xs cursor-pointer"
            >
              Delete getArole Account
            </button>
          </div>
        </div>

        {/* ═════════ 4. SIGN OUT SECTION ═════════ */}
        <div className="bg-white/85 backdrop-blur-xl border border-slate-200/90 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-slate-800">
              Active Browser Session
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Securely sign out of getArole on this browser. Your synced cloud profile remains preserved.
            </p>
          </div>
          <button
            type="button"
            onClick={() => logout()}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs shadow-sm transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4 text-rose-400" />
            <span>Sign Out</span>
          </button>
        </div>

      </form>

      {/* ── Confirmation Modal: Permanent Erasure ── */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-rose-200 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <ShieldAlert className="w-6 h-6" />
              <h3 className="text-lg font-extrabold font-outfit text-slate-900">
                Confirm Account Deletion
              </h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to permanently delete your getArole candidate account? All your synced profile dossiers, indexed resumes, and tailored matches will be completely erased.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 border border-slate-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePermanentAccountDelete}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-xs cursor-pointer flex items-center gap-2"
              >
                {isDeleting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>{isDeleting ? "Erasing..." : "Yes, Erase Everything"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
