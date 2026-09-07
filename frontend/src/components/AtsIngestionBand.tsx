"use client";

import React from "react";

export default function AtsIngestionBand() {
  const platforms = [
    "Greenhouse",
    "Lever",
    "Ashby",
    "Workday",
    "LinkedIn",
    "Internshala",
    "Unstop",
  ];

  return (
    <section className="bg-slate-100/70 border-y border-slate-200 py-11 px-4 sm:px-6 lg:px-8 mb-24 text-center">
      <div className="max-w-7xl mx-auto">
        <div className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-6 font-outfit">
          Jobs sourced from top career platforms
        </div>

        <div className="flex items-center justify-center gap-3.5 sm:gap-5 flex-wrap">
          {platforms.map((p) => (
            <div
              key={p}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 text-sm font-bold text-slate-800 shadow-2xs hover:-translate-y-0.5 hover:border-blue-400 transition-all duration-200"
            >
              <span className="text-amber-500">⚡</span>
              <span>{p}</span>
            </div>
          ))}
        </div>

        <div className="text-xs text-slate-500 mt-4 font-semibold">
          Every listing verified · Direct apply links · Updated daily
        </div>
      </div>
    </section>
  );
}
