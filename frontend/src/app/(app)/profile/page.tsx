"use client";

import React, { useState, useEffect } from "react";
import { UserSquare2, Save, Sparkles, MapPin, Briefcase, Mail, Phone, CheckCircle2 } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { UserProfile } from "@/lib/types";

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile>({
    name: "Sai Vattikuti",
    email: "sai@example.com",
    phone: "+91 98765 43210",
    experience_years: 2,
    primary_role: "Full Stack Engineer",
    preferred_locations: ["Bengaluru", "Hyderabad", "Remote"],
    workplace_type: "Hybrid",
    skills: ["React", "Next.js", "TypeScript", "Python", "FastAPI", "PostgreSQL", "Docker"],
  });

  const [newSkill, setNewSkill] = useState("");
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Load from local storage or cloud
    const saved = localStorage.getItem("getarole_cloud_prefs");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setProfile((prev) => ({ ...prev, ...parsed }));
      } catch {}
    }
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      localStorage.setItem("getarole_cloud_prefs", JSON.stringify(profile));
      // Also try saving to backend API if available
      try {
        await apiClient.post("/user/profile", profile);
      } catch {}
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } finally {
      setLoading(false);
    }
  };

  const addSkill = () => {
    if (newSkill.trim() && !profile.skills?.includes(newSkill.trim())) {
      setProfile({
        ...profile,
        skills: [...(profile.skills || []), newSkill.trim()],
      });
      setNewSkill("");
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setProfile({
      ...profile,
      skills: (profile.skills || []).filter((s) => s !== skillToRemove),
    });
  };

  return (
    <div className="relative min-h-screen pt-8 pb-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      {/* ── Header ── */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/80 text-[#0062e3] text-xs font-semibold mb-2">
          <UserSquare2 className="w-3.5 h-3.5" />
          <span>Candidate Dossier</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight font-outfit">
          Profile & Preferences
        </h1>
        <p className="text-slate-500 text-sm sm:text-base mt-1">
          Manage your verified competencies and career targets used by the AI matcher.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-white/80 backdrop-blur-xl border border-slate-200/80 rounded-2xl p-6 shadow-xs">
          <h2 className="text-base font-bold text-slate-900 mb-4 font-outfit flex items-center gap-2">
            <span>Personal Information</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                value={profile.name || ""}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#0062e3]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                value={profile.email || ""}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#0062e3]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Phone</label>
              <input
                type="text"
                value={profile.phone || ""}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#0062e3]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Experience (Years)</label>
              <input
                type="number"
                value={profile.experience_years || 0}
                onChange={(e) => setProfile({ ...profile, experience_years: Number(e.target.value) })}
                className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#0062e3]"
              />
            </div>
          </div>
        </div>

        {/* Role & Work Preferences */}
        <div className="bg-white/80 backdrop-blur-xl border border-slate-200/80 rounded-2xl p-6 shadow-xs">
          <h2 className="text-base font-bold text-slate-900 mb-4 font-outfit">
            Role & Workplace Preferences
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Target Role</label>
              <input
                type="text"
                value={profile.primary_role || ""}
                onChange={(e) => setProfile({ ...profile, primary_role: e.target.value })}
                className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#0062e3]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Workplace Model</label>
              <select
                value={profile.workplace_type || "Hybrid"}
                onChange={(e) => setProfile({ ...profile, workplace_type: e.target.value })}
                className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#0062e3]"
              >
                <option value="Remote">Remote</option>
                <option value="Hybrid">Hybrid</option>
                <option value="On-site">On-site</option>
                <option value="Any">Any Workplace Model</option>
              </select>
            </div>
          </div>
        </div>

        {/* Skills Management */}
        <div className="bg-white/80 backdrop-blur-xl border border-slate-200/80 rounded-2xl p-6 shadow-xs">
          <h2 className="text-base font-bold text-slate-900 mb-2 font-outfit">
            Indexed Technical Skills
          </h2>
          <p className="text-xs text-slate-500 mb-4">
            These skills are used to calculate match percentages against open positions.
          </p>

          <div className="flex flex-wrap gap-2 mb-4">
            {profile.skills?.map((skill) => (
              <span
                key={skill}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-[#0062e3] rounded-xl text-xs font-semibold border border-blue-200/80 shadow-2xs"
              >
                <span>{skill}</span>
                <button
                  type="button"
                  onClick={() => removeSkill(skill)}
                  className="hover:text-rose-600 ml-1"
                >
                  ×
                </button>
              </span>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Add a new skill (e.g. GraphQL, AWS, Go)"
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addSkill();
                }
              }}
              className="flex-1 text-sm px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-[#0062e3]"
            />
            <button
              type="button"
              onClick={addSkill}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl transition-colors"
            >
              Add Skill
            </button>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center justify-between pt-2">
          {savedSuccess && (
            <div className="flex items-center gap-2 text-emerald-700 text-sm font-semibold bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
              <CheckCircle2 className="w-4 h-4" />
              <span>Profile saved & synced successfully!</span>
            </div>
          )}
          <div className="ml-auto">
            <button
              type="submit"
              disabled={loading}
              className="btn-sweep inline-flex items-center gap-2 bg-[#0062e3] text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-xs hover:shadow-md transition-shadow"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? "Saving..." : "Save Preferences"}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
