"use client";

import React, { useState, useEffect } from "react";
import { 
  UserSquare2, 
  Save, 
  Sparkles, 
  MapPin, 
  Briefcase, 
  Mail, 
  Phone, 
  CheckCircle2, 
  Plus, 
  Trash2, 
  ExternalLink,
  GraduationCap,
  Award,
  Scroll,
  Globe,
  Share2,
  FileText
} from "lucide-react";
import { apiClient } from "@/lib/api-client";

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>({
    name: "Hemasai Vattikuti",
    headline: "Full Stack Engineer • 2+ Years Experience",
    email: "hemasai@getarole.in",
    phone: "+91 98765 43210",
    city: "Bengaluru",
    location: "Bengaluru, India",
    summary: "Passionate software engineer focused on building robust, scalable applications. Experienced with modern frontend and backend architectures, microservices, and AI workflow integration.",
    skills_languages: ["Python", "TypeScript", "JavaScript", "SQL", "C++", "Java"],
    skills_frameworks: ["React", "Next.js", "Node.js", "FastAPI", "Express", "TailwindCSS"],
    skills_cloud: ["AWS", "Docker", "PostgreSQL", "Supabase", "Redis", "MongoDB"],
    skills_tools: ["Git", "Linux", "Postman", "CI/CD", "Vite", "Figma"],
    skills: ["Python", "TypeScript", "React", "Next.js", "FastAPI", "PostgreSQL", "AWS", "Docker"],
    experience: [
      {
        title: "Full Stack Engineer",
        company: "getArole",
        type: "Full-time",
        location: "Bengaluru, India",
        start: "Jan 2023",
        end: "Present",
        desc: "• Architected high-performance developer job discovery engine with real-time vector semantic matching\n• Engineered sub-50ms API endpoints and automated web scrapers across 5+ major ATS portals\n• Reduced database read latency by 45% through write-through cache layering and Supabase REST optimization"
      }
    ],
    projects: [
      {
        title: "getArole AI Career Suite",
        desc: "• Intelligent career acceleration engine featuring automated ATS LaTeX resume generation and live job pipeline\n• Built bidirectional synchronization across client storage and cloud Supabase database with sub-second reactivity",
        tags: ["Next.js", "FastAPI", "Supabase", "TypeScript", "TailwindCSS"],
        demo: "https://getarole.in",
        github: "https://github.com/hemasaivattikuti25/getArole"
      }
    ],
    education: [
      {
        school: "Engineering & Technology Institute",
        degree: "B.Tech in Computer Science & Engineering",
        year: "2020 - 2024",
        grade: "8.8 / 10.0 CGPA",
        coursework: "Data Structures & Algorithms, Operating Systems, DBMS, System Design, Computer Networks"
      }
    ],
    certifications: [
      {
        name: "AWS Certified Solutions Architect – Associate",
        issuer: "Amazon Web Services",
        year: "2024",
        link: "https://aws.amazon.com/certification/"
      }
    ],
    achievements: [
      {
        title: "1st Place – AI Hackathon 2024",
        issuer: "Developer Community",
        year: "2024",
        desc: "Ranked #1 among 300+ teams nationwide for building an autonomous recruiter screening engine."
      }
    ],
    links: {
      github: "https://github.com/hemasaivattikuti25",
      linkedin: "https://linkedin.com/in/hemasai",
      portfolio: "https://getarole.in"
    }
  });

  const [prefs, setPrefs] = useState<any>({
    roles: ["Full Stack Engineer", "Software Engineer", "Backend Developer"],
    locations: ["Bengaluru", "Hyderabad", "Remote in India", "Global Remote"],
    workplaceType: "Hybrid",
    salary_amt: 1500000,
    salary_curr: "INR",
    status: "Actively looking"
  });

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    try {
      const localProf = localStorage.getItem("getarole_profile");
      const localPrefs = localStorage.getItem("getarole_prefs");
      const userObj = localStorage.getItem("getarole_user");
      
      if (localProf) {
        const parsed = JSON.parse(localProf);
        setProfile((prev: any) => ({ ...prev, ...parsed }));
      } else if (userObj) {
        const u = JSON.parse(userObj);
        if (u.displayName || u.name) {
          setProfile((prev: any) => ({ ...prev, name: u.displayName || u.name, email: u.email || prev.email }));
        }
      }

      if (localPrefs) {
        setPrefs((prev: any) => ({ ...prev, ...JSON.parse(localPrefs) }));
      }
    } catch (e) {
      console.warn("Storage load error:", e);
    }
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Consolidate skills
      const allSkills = Array.from(new Set([
        ...(profile.skills_languages || []),
        ...(profile.skills_frameworks || []),
        ...(profile.skills_cloud || []),
        ...(profile.skills_tools || [])
      ]));

      const updatedProfile = { ...profile, skills: allSkills };
      setProfile(updatedProfile);

      localStorage.setItem("getarole_profile", JSON.stringify(updatedProfile));
      localStorage.setItem("getarole_prefs", JSON.stringify(prefs));

      // Also compile directly to getarole_resume_v2 for LaTeX Resume Builder
      try {
        let R = JSON.parse(localStorage.getItem("getarole_resume_v2") || "{}");
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
          { label: "Developer Tools", items: (updatedProfile.skills_tools || []).join(", ") }
        ].filter(g => g.items && g.items.trim());

        R.experience = (updatedProfile.experience || []).map((exp: any) => ({
          company: exp.company || "",
          title: exp.title || "",
          location: exp.location || "",
          dates: `${exp.start || ""} - ${exp.end || "Present"}`,
          bullets: exp.desc ? exp.desc.split("\n").filter((b: string) => b.trim()).map((b: string) => b.replace(/^•\s*/, "")) : []
        }));

        R.projects = (updatedProfile.projects || []).map((p: any) => ({
          name: p.title || "",
          liveLink: p.demo || "",
          githubLink: p.github || "",
          stack: Array.isArray(p.tags) ? p.tags.join(", ") : (p.tags || ""),
          bullets: p.desc ? p.desc.split("\n").filter((b: string) => b.trim()).map((b: string) => b.replace(/^•\s*/, "")) : []
        }));

        R.education = (updatedProfile.education || []).map((ed: any) => ({
          school: ed.school || "",
          degree: ed.degree || "",
          dates: ed.year || "",
          grade: ed.grade || "",
          coursework: ed.coursework || ""
        }));

        R.certifications = updatedProfile.certifications || [];
        R.achievements = updatedProfile.achievements || [];

        localStorage.setItem("getarole_resume_v2", JSON.stringify(R));
      } catch (err) {}

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

  return (
    <div className="relative min-h-screen pt-8 pb-24 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
      {/* ── Candidate Hero Command Card ── */}
      <div className="bg-white/85 backdrop-blur-xl border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-sm mb-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-sky-500 via-purple-500 to-emerald-500" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-sky-500 to-indigo-600 text-white font-extrabold text-2xl flex items-center justify-center font-outfit shadow-md border-2 border-white">
                {profile.name ? profile.name.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase() : "HV"}
              </div>
              <div className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-outfit">
                  {profile.name}
                </h1>
                <span className="bg-blue-100 text-blue-700 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  ✓ Verified
                </span>
              </div>
              <p className="text-sm font-semibold text-slate-500 mt-1">
                {profile.headline}
              </p>
              <div className="flex flex-wrap items-center gap-3 mt-3 text-xs font-medium text-slate-600">
                <span className="flex items-center gap-1 bg-slate-100/80 px-2.5 py-1 rounded-md">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {profile.location || profile.city || "Bengaluru, India"}
                </span>
                <span className="flex items-center gap-1 bg-slate-100/80 px-2.5 py-1 rounded-md">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  {profile.email}
                </span>
                <span className="flex items-center gap-1 bg-slate-100/80 px-2.5 py-1 rounded-md">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  {profile.phone}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end gap-3 w-full sm:w-auto">
            <select
              value={prefs.status}
              onChange={(e) => setPrefs({ ...prefs, status: e.target.value })}
              className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold px-3 py-1.5 rounded-full focus:outline-none cursor-pointer"
            >
              <option value="Actively looking">🟢 Actively looking for roles</option>
              <option value="Open to offers">🟡 Open to offers</option>
              <option value="Closed to offers">⚪ Not looking right now</option>
            </select>

            <button
              onClick={handleSave}
              disabled={loading}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm shadow-md transition-all active:scale-98"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? "Saving..." : "Save Dossier & Resume"}</span>
            </button>
          </div>
        </div>

        {savedSuccess && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Profile and complete LaTeX resume successfully compiled and synchronized!</span>
          </div>
        )}
      </div>

      {/* ── Form Sections ── */}
      <form onSubmit={handleSave} className="space-y-6">
        
        {/* Section 1: Personal & Bio */}
        <div className="bg-white/85 backdrop-blur-xl border border-slate-200/90 rounded-2xl p-6 shadow-xs">
          <h2 className="text-lg font-bold text-slate-900 mb-4 font-outfit flex items-center gap-2">
            <UserSquare2 className="w-5 h-5 text-blue-600" />
            <span>Personal Information & Executive Summary</span>
          </h2>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={profile.name || ""}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600 bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Headline / Target Title</label>
                <input
                  type="text"
                  value={profile.headline || ""}
                  onChange={(e) => setProfile({ ...profile, headline: e.target.value })}
                  className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600 bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  value={profile.email || ""}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600 bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Phone</label>
                <input
                  type="tel"
                  value={profile.phone || ""}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600 bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Location</label>
                <input
                  type="text"
                  value={profile.location || profile.city || ""}
                  onChange={(e) => setProfile({ ...profile, location: e.target.value, city: e.target.value })}
                  className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600 bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Professional Summary (Resume Section)</label>
              <textarea
                rows={3}
                value={profile.summary || ""}
                onChange={(e) => setProfile({ ...profile, summary: e.target.value })}
                className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600 bg-white"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Categorized Skills */}
        <div className="bg-white/85 backdrop-blur-xl border border-slate-200/90 rounded-2xl p-6 shadow-xs">
          <h2 className="text-lg font-bold text-slate-900 mb-4 font-outfit flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-600" />
            <span>Categorized Technical Skills (Resume Format)</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Programming Languages</label>
              <input
                type="text"
                value={(profile.skills_languages || []).join(", ")}
                onChange={(e) => setProfile({ ...profile, skills_languages: e.target.value.split(",").map((s: string) => s.trim()).filter(Boolean) })}
                className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600 bg-white"
                placeholder="Python, TypeScript, JavaScript, SQL, C++, Java"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Frameworks & Libraries</label>
              <input
                type="text"
                value={(profile.skills_frameworks || []).join(", ")}
                onChange={(e) => setProfile({ ...profile, skills_frameworks: e.target.value.split(",").map((s: string) => s.trim()).filter(Boolean) })}
                className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600 bg-white"
                placeholder="React, Next.js, Node.js, FastAPI, Express, TailwindCSS"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Cloud, DevOps & Databases</label>
              <input
                type="text"
                value={(profile.skills_cloud || []).join(", ")}
                onChange={(e) => setProfile({ ...profile, skills_cloud: e.target.value.split(",").map((s: string) => s.trim()).filter(Boolean) })}
                className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600 bg-white"
                placeholder="AWS, Docker, PostgreSQL, Supabase, Redis, MongoDB"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Developer Tools & Platforms</label>
              <input
                type="text"
                value={(profile.skills_tools || []).join(", ")}
                onChange={(e) => setProfile({ ...profile, skills_tools: e.target.value.split(",").map((s: string) => s.trim()).filter(Boolean) })}
                className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600 bg-white"
                placeholder="Git, Linux, Postman, CI/CD, Vite, Figma"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Social & Resume Links */}
        <div className="bg-white/85 backdrop-blur-xl border border-slate-200/90 rounded-2xl p-6 shadow-xs">
          <h2 className="text-lg font-bold text-slate-900 mb-4 font-outfit flex items-center gap-2">
            <Globe className="w-5 h-5 text-blue-600" />
            <span>Online Presence & Resume Header Links</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">LinkedIn Profile</label>
              <input
                type="url"
                value={profile.links?.linkedin || ""}
                onChange={(e) => setProfile({ ...profile, links: { ...(profile.links || {}), linkedin: e.target.value } })}
                className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600 bg-white"
                placeholder="https://linkedin.com/in/..."
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">GitHub Profile</label>
              <input
                type="url"
                value={profile.links?.github || ""}
                onChange={(e) => setProfile({ ...profile, links: { ...(profile.links || {}), github: e.target.value } })}
                className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600 bg-white"
                placeholder="https://github.com/..."
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Portfolio Website</label>
              <input
                type="url"
                value={profile.links?.portfolio || ""}
                onChange={(e) => setProfile({ ...profile, links: { ...(profile.links || {}), portfolio: e.target.value } })}
                className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600 bg-white"
                placeholder="https://..."
              />
            </div>
          </div>
        </div>

        {/* Section 4: Career Targets */}
        <div className="bg-white/85 backdrop-blur-xl border border-slate-200/90 rounded-2xl p-6 shadow-xs">
          <h2 className="text-lg font-bold text-slate-900 mb-4 font-outfit flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-blue-600" />
            <span>Career Targets & Salary Expectations</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Target Roles</label>
              <input
                type="text"
                value={(prefs.roles || []).join(", ")}
                onChange={(e) => setPrefs({ ...prefs, roles: e.target.value.split(",").map((r: string) => r.trim()).filter(Boolean) })}
                className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Preferred Locations</label>
              <input
                type="text"
                value={(prefs.locations || []).join(", ")}
                onChange={(e) => setPrefs({ ...prefs, locations: e.target.value.split(",").map((l: string) => l.trim()).filter(Boolean) })}
                className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Workplace Mode</label>
              <select
                value={prefs.workplaceType || "Hybrid"}
                onChange={(e) => setPrefs({ ...prefs, workplaceType: e.target.value })}
                className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600 bg-white"
              >
                <option value="Remote">Remote</option>
                <option value="Hybrid">Hybrid</option>
                <option value="On-site">On-site</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Minimum Salary Expectation</label>
              <div className="flex gap-2">
                <select
                  value={prefs.salary_curr || "INR"}
                  onChange={(e) => setPrefs({ ...prefs, salary_curr: e.target.value })}
                  className="text-sm px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600 bg-white"
                >
                  <option value="INR">INR (₹)</option>
                  <option value="USD">USD ($)</option>
                </select>
                <input
                  type="number"
                  value={prefs.salary_amt || 1500000}
                  onChange={(e) => setPrefs({ ...prefs, salary_amt: parseInt(e.target.value, 10) || 0 })}
                  className="flex-1 text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600 bg-white font-mono font-bold text-blue-600"
                />
              </div>
            </div>
          </div>
        </div>

      </form>
    </div>
  );
}
