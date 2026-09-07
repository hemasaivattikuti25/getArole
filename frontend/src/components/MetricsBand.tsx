"use client";

import React from "react";

export default function MetricsBand() {
  const metrics = [
    {
      number: "100%",
      label: "Direct Employer Postings",
      sub: "Verified against official career portals",
    },
    {
      number: "Smart Matching",
      label: "AI-Powered Fit Analysis",
      sub: "Your skills matched against job requirements",
    },
    {
      number: "ATS-Ready",
      label: "Resume Formatting",
      sub: "Clean, single-page layouts that pass ATS systems",
    },
    {
      number: "100% Free",
      label: "For Job Seekers",
      sub: "Zero paywalls on live opportunities",
    },
  ];

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-20 relative z-10">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {metrics.map((m, idx) => (
          <div
            key={idx}
            className="bg-white border border-slate-200/80 rounded-2xl p-7 text-center shadow-xs hover:-translate-y-1 hover:border-blue-200 transition-all duration-200"
          >
            <div className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-1.5 font-outfit tracking-tight">
              {m.number}
            </div>
            <div className="text-sm font-bold text-slate-700">{m.label}</div>
            <div className="text-xs text-slate-400 mt-1">{m.sub}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
