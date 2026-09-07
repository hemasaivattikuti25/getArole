"use client";

import { useState } from "react";
import Link from "next/link";
import HeroPreview from "./HeroPreview";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";

export default function Hero() {
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const { user, openAuthModal } = useAuth();
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (location) params.set("location", location);
    router.push(`/explore?${params.toString()}`);
  };

  const trendingItems = [
    { label: "🌐 Remote", q: "Remote" },
    { label: "🏢 Enterprise & MNCs", q: "MNC" },
    { label: "🎓 Early Career & Graduates", q: "Fresher" },
    { label: "🦄 High-Growth Tech", q: "Unicorn" },
    { label: "⚡ Frontend", q: "Frontend" },
    { label: "⚡ Backend", q: "Backend" },
    { label: "🧠 AI & Machine Learning", q: "AI" },
    { label: "🎯 Internships", q: "Internship" },
  ];

  return (
    <section className="relative pt-8 pb-16 md:pt-14 md:pb-20 overflow-hidden text-center">
      {/* Ambient Blueprint Grid */}
      <div 
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(0, 98, 227, 0.07) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(0, 98, 227, 0.07) 1px, transparent 1px)
          `,
          backgroundSize: "68px 68px",
          maskImage: "radial-gradient(ellipse 85% 70% at 50% 35%, #000 50%, transparent 100%)",
          WebkitMaskImage: "radial-gradient(ellipse 85% 70% at 50% 35%, #000 50%, transparent 100%)",
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Exact Hero Title */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900 max-w-3xl mx-auto leading-[1.1] font-outfit">
          Your AI Job Search Partner
        </h1>

        {/* Exact Subtitle */}
        <p className="mt-4 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Stop searching job boards. getArole automatically matches your resume with verified jobs.
        </p>

        {/* ═════════ POWER SEARCH BAR ═════════ */}
        <form
          onSubmit={handleSearch}
          className="mt-7 max-w-3xl mx-auto bg-white p-2 sm:p-2.5 rounded-2xl border border-slate-300 shadow-xl shadow-slate-900/5 hover:border-[#0071e3] transition-all flex flex-col sm:flex-row items-center gap-2"
        >
          {/* Query Input */}
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by role or tech stack (e.g. React, Python, SDE, Fresher, AI Engineer)"
            className="w-full sm:flex-[1.4] text-sm sm:text-base px-3 py-2 text-slate-900 placeholder:text-slate-400 bg-transparent focus:outline-none"
          />

          {/* Location Select */}
          <select
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            aria-label="Filter by Location"
            className="w-full sm:flex-1 text-xs sm:text-sm px-3 py-2 text-slate-600 bg-transparent border-t sm:border-t-0 sm:border-l border-slate-200 focus:outline-none cursor-pointer"
          >
            <option value="">All Locations in India</option>
            <option value="Bengaluru">Bengaluru Tech Hub</option>
            <option value="Hyderabad">Hyderabad Tech Roles</option>
            <option value="Pune">Pune</option>
            <option value="Mumbai">Mumbai</option>
            <option value="Delhi NCR">Delhi NCR</option>
            <option value="Remote">Global Remote</option>
          </select>

          {/* Search Button */}
          <button
            type="submit"
            className="btn-sweep w-full sm:w-auto px-6 py-3 bg-[#0071e3] hover:bg-[#0077ed] text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-md shadow-blue-600/20 transition-all flex-shrink-0 cursor-pointer"
          >
            <span>Search Jobs 🔍</span>
          </button>
        </form>

        {/* ── TRENDING SEARCH CHIPS ── */}
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-500">
          <span className="font-extrabold uppercase tracking-wider text-slate-400 mr-1 text-[11px]">
            Trending:
          </span>
          {trendingItems.map((item) => (
            <Link
              key={item.q}
              href={`/explore?q=${item.q}`}
              className="bg-slate-100/80 hover:bg-blue-50 hover:border-blue-300 hover:text-[#0071e3] text-slate-600 px-3 py-1 rounded-full border border-slate-200 transition-all font-semibold"
            >
              {item.label}
            </Link>
          ))}
        </div>

        {/* ── TWO PRIMARY ACTION BUTTONS ── */}
        <div className="mt-7 flex flex-wrap items-center justify-center gap-4">
          {user ? (
            <Link
              href="/matches"
              className="btn-sweep inline-flex items-center gap-2 bg-gradient-to-r from-[#0071e3] to-[#4facfe] text-white px-7 py-3.5 rounded-xl text-sm font-bold shadow-lg shadow-blue-600/25 hover:shadow-xl transition-all"
            >
              <span>Upload Resume &amp; Get Matched →</span>
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => openAuthModal("signup")}
              className="btn-sweep inline-flex items-center gap-2 bg-gradient-to-r from-[#0071e3] to-[#4facfe] text-white px-7 py-3.5 rounded-xl text-sm font-bold shadow-lg shadow-blue-600/25 hover:shadow-xl transition-all cursor-pointer"
            >
              <span>Upload Resume &amp; Get Matched →</span>
            </button>
          )}

          <Link
            href="/resume-builder"
            className="inline-flex items-center gap-2 bg-white text-slate-800 border border-slate-300 px-6 py-3.5 rounded-xl text-sm font-bold hover:bg-slate-50 hover:border-slate-400 shadow-xs transition-all"
          >
            <span>Build ATS Resume Free</span>
          </Link>
        </div>

        {/* ── HERO INTERACTIVE LIVE PRODUCT PREVIEW ── */}
        <HeroPreview />
      </div>
    </section>
  );
}
