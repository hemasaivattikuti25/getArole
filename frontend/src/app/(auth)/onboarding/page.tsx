"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sparkles, ArrowRight, CheckCircle2, Building2, MapPin, Upload, Briefcase } from "lucide-react";
import BackgroundAurora from "@/components/BackgroundAurora";

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [targetRole, setTargetRole] = useState("Software Engineer");
  const [experience, setExperience] = useState("1-3 years");
  const [locations, setLocations] = useState<string[]>(["Bengaluru", "Remote"]);
  const [skills, setSkills] = useState<string[]>(["React", "Node.js", "TypeScript", "Python"]);
  const [newSkill, setNewSkill] = useState("");
  const [workplaceType, setWorkplaceType] = useState("Hybrid");
  const [saving, setSaving] = useState(false);

  const toggleLocation = (loc: string) => {
    if (locations.includes(loc)) {
      setLocations(locations.filter((l) => l !== loc));
    } else {
      setLocations([...locations, loc]);
    }
  };

  const addSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()]);
      setNewSkill("");
    }
  };

  const removeSkill = (s: string) => {
    setSkills(skills.filter((skill) => skill !== s));
  };

  const handleFinish = () => {
    setSaving(true);
    const prefs = {
      primary_role: targetRole,
      experience_years: experience === "Fresher" ? 0 : experience === "1-3 years" ? 2 : 5,
      preferred_locations: locations,
      workplace_type: workplaceType,
      skills,
    };
    
    // Save to localStorage
    localStorage.setItem("getarole_cloud_prefs", JSON.stringify(prefs));
    localStorage.setItem("getarole_user", JSON.stringify({ uid: "user-" + Date.now(), role: targetRole }));
    
    setTimeout(() => {
      setSaving(false);
      router.push("/dashboard");
    }, 600);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f8faff] via-white to-[#f4f8ff] text-slate-900 relative selection:bg-[#0062e3] selection:text-white flex flex-col justify-between">
      <BackgroundAurora />

      {/* Header */}
      <header className="p-6 max-w-7xl mx-auto w-full flex items-center justify-between relative z-10">
        <Link href="/" className="flex items-center gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="Logo" className="w-8 h-8 rounded-xl object-contain shadow-xs" />
          <span className="font-bold text-xl tracking-tight text-slate-900">
            get<span className="text-[#0062e3]">A</span>role
          </span>
        </Link>
        <span className="text-xs font-semibold text-slate-400">Step {step} of 2</span>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center p-4 relative z-10">
        <div className="max-w-xl w-full bg-white/80 backdrop-blur-xl border border-slate-200/90 rounded-3xl p-6 sm:p-10 shadow-xl">
          {step === 1 ? (
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/80 text-[#0062e3] text-xs font-semibold mb-3">
                <Briefcase className="w-3.5 h-3.5" />
                <span>Target Career Trajectory</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-outfit mb-2">
                What roles are you targeting?
              </h1>
              <p className="text-slate-500 text-xs sm:text-sm mb-6">
                We personalize live openings and match scores based on your focus.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Target Job Title
                  </label>
                  <input
                    type="text"
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                    placeholder="e.g. Software Engineer, Frontend Developer"
                    className="w-full text-sm px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#0062e3]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Experience Bracket
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {["Fresher", "1-3 years", "3-5+ years"].map((exp) => (
                      <button
                        key={exp}
                        type="button"
                        onClick={() => setExperience(exp)}
                        className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                          experience === exp
                            ? "bg-blue-50 border-[#0062e3] text-[#0062e3] shadow-xs"
                            : "border-slate-200 hover:bg-slate-50 text-slate-700"
                        }`}
                      >
                        {exp}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Preferred Cities / Locations
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {["Bengaluru", "Hyderabad", "Pune", "Mumbai", "Delhi NCR", "Remote"].map((loc) => {
                      const selected = locations.includes(loc);
                      return (
                        <button
                          key={loc}
                          type="button"
                          onClick={() => toggleLocation(loc)}
                          className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all ${
                            selected
                              ? "bg-blue-50 border-[#0062e3] text-[#0062e3] shadow-xs"
                              : "border-slate-200 hover:bg-slate-50 text-slate-700"
                          }`}
                        >
                          {selected ? "✓ " : "+ "}
                          {loc}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="btn-sweep inline-flex items-center gap-2 bg-[#0062e3] text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-xs hover:shadow-md transition-shadow"
                  >
                    <span>Next: Skills & Matching</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 border border-purple-200/80 text-purple-700 text-xs font-semibold mb-3">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Skills & Match Profiling</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-outfit mb-2">
                What are your key competencies?
              </h1>
              <p className="text-slate-500 text-xs sm:text-sm mb-6">
                Our AI compares these skills directly against requirement descriptions.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Your Skills (Click to remove)
                  </label>
                  <div className="flex flex-wrap gap-1.5 p-3 rounded-xl border border-slate-200 bg-slate-50/50 min-h-[60px]">
                    {skills.map((s) => (
                      <span
                        key={s}
                        onClick={() => removeSkill(s)}
                        className="cursor-pointer text-xs bg-white text-slate-800 font-semibold px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs hover:bg-rose-50 hover:text-rose-600 transition-colors"
                      >
                        {s} ×
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Add More Skills
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="e.g. Next.js, Docker, AWS"
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
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
                    >
                      + Add
                    </button>
                  </div>
                </div>

                <div className="pt-6 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-xs font-semibold text-slate-500 hover:text-slate-900"
                  >
                    ← Back
                  </button>

                  <button
                    type="button"
                    disabled={saving}
                    onClick={handleFinish}
                    className="btn-sweep inline-flex items-center gap-2 bg-[#0062e3] text-white px-7 py-2.5 rounded-xl text-sm font-bold shadow-md shadow-blue-600/20 hover:shadow-lg transition-all"
                  >
                    <span>{saving ? "Configuring Dashboard..." : "Go to My Dashboard →"}</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="p-6 text-center text-xs text-slate-400 relative z-10">
        © 2026 getArole. Verified developer job discovery platform.
      </footer>
    </div>
  );
}
