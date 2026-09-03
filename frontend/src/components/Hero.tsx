"use client";

import { useState } from "react";
import { Search, MapPin, ArrowRight } from "lucide-react";
import Link from "next/link";
import HeroPreview from "./HeroPreview";

export default function Hero() {
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (location) params.set("location", location);
    window.location.href = `/explore?${params.toString()}`;
  };

  return (
    <section className="relative pt-6 pb-12 md:pt-10 md:pb-16 overflow-hidden">
      {/* Blueprint Grid (Spacious, modern architectural grid in Hero Section) */}
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

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Simple Honest Headline */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-slate-950 max-w-3xl mx-auto leading-[1.1]">
          Find the right role for your skills.
        </h1>

        {/* Clear Subheadline */}
        <p className="mt-4 text-base sm:text-lg text-slate-600 max-w-xl mx-auto leading-relaxed">
          Search open developer positions or match your resume directly to see exactly where your experience fits.
        </p>

        {/* ═════════ SEARCH BAR ═════════ */}
        <form
          onSubmit={handleSearch}
          className="mt-6 md:mt-8 max-w-2xl mx-auto bg-white/95 backdrop-blur-xl p-2 rounded-2xl border border-blue-200/90 shadow-lg shadow-blue-500/5 hover:border-blue-400 transition-all flex flex-col sm:flex-row items-center gap-2 ring-4 ring-blue-50/60"
        >
          {/* Query Input */}
          <div className="flex items-center gap-2.5 px-3 w-full sm:flex-1">
            <Search className="w-4 h-4 text-[#0062e3] flex-shrink-0" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Title, skill, or company (e.g. React, Python, SDE)"
              className="w-full text-sm text-slate-900 placeholder:text-slate-400 bg-transparent focus:outline-none py-1.5 font-medium"
            />
          </div>

          <div className="hidden sm:block w-[1px] h-6 bg-slate-200"></div>

          {/* Location Select */}
          <div className="flex items-center gap-2 px-3 w-full sm:w-48">
            <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              aria-label="Filter by Location"
              className="w-full text-xs text-slate-700 bg-transparent focus:outline-none py-1.5 cursor-pointer font-medium"
            >
              <option value="">All Locations</option>
              <option value="Bengaluru">Bengaluru</option>
              <option value="Hyderabad">Hyderabad</option>
              <option value="Pune">Pune</option>
              <option value="Mumbai">Mumbai</option>
              <option value="Delhi NCR">Delhi NCR</option>
              <option value="Remote">Remote</option>
            </select>
          </div>

          {/* Search Button */}
          <button
            type="submit"
            className="btn-sweep w-full sm:w-auto px-5 py-2.5 bg-[#0062e3] hover:bg-[#0050b8] text-white rounded-xl text-sm font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all flex-shrink-0 cursor-pointer"
          >
            <span>Search</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        {/* Discovery Chips */}
        <div className="mt-3.5 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-500">
          <span className="font-semibold text-slate-400 mr-1">Browse:</span>
          {[
            { label: "🏢 Enterprises", q: "MNC" },
            { label: "🦄 High-Growth", q: "Unicorn" },
            { label: "🌐 Remote", q: "Remote" },
            { label: "🎓 Freshers", q: "Fresher" },
            { label: "Frontend", q: "Frontend" },
            { label: "Backend", q: "Backend" },
          ].map((item) => (
            <Link
              key={item.q}
              href={`/explore?q=${item.q}`}
              className="bg-white/90 backdrop-blur-xs hover:bg-blue-50 hover:border-blue-300 hover:text-[#0062e3] text-slate-700 px-3 py-0.5 rounded-full border border-slate-200/90 shadow-2xs transition-all font-medium"
            >
              {item.label}
            </Link>
          ))}
        </div>

        {/* CTA Buttons */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/onboarding"
            className="btn-sweep inline-flex items-center gap-2 bg-[#0062e3] text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-md shadow-blue-600/20 hover:shadow-lg transition-all"
          >
            <span>Match Your Resume</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            href="/resume-builder"
            className="inline-flex items-center gap-2 bg-white text-slate-800 border border-slate-200 px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-50 hover:border-slate-300 shadow-2xs transition-all"
          >
            <span>Build a Resume</span>
          </Link>
        </div>

        {/* Live Preview */}
        <HeroPreview />
      </div>
    </section>
  );
}
