"use client";

import React from "react";

export default function BentoGrid() {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-24 relative z-10">
      {/* Section Header */}
      <div className="text-center max-w-2xl mx-auto mb-12">
        <div className="text-xs font-extrabold text-[#0071e3] uppercase tracking-widest mb-2 font-outfit">
          How It Works
        </div>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight font-outfit">
          Built for engineers, by engineers
        </h2>
        <p className="mt-2 text-sm sm:text-base text-slate-600">
          Tools designed around how engineers actually search for jobs.
        </p>
      </div>

      {/* 2-Column Responsive Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Span 2 cols */}
        <div className="md:col-span-2 bg-white border border-slate-200/90 rounded-3xl p-8 sm:p-9 shadow-xs hover:border-blue-200 hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200/80 flex items-center justify-center text-2xl mb-5 shadow-2xs">
              🧠
            </div>
            <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 mb-3 font-outfit">
              Intelligent Semantic Matching
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed max-w-2xl">
              Traditional job boards rely on rigid keyword filters that miss qualified engineers. getArole evaluates your technical skills, experience depth, and career preferences against live job requirements to calculate true conceptual relevance.
            </p>
          </div>
          <div className="flex gap-2.5 mt-6 flex-wrap">
            <span className="bg-slate-100/90 border border-slate-200/80 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-700">
              Skills &amp; experience matching
            </span>
            <span className="bg-slate-100/90 border border-slate-200/80 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-700">
              ATS compatibility checks
            </span>
          </div>
        </div>

        {/* Card 2: 1 col */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-8 sm:p-9 shadow-xs hover:border-blue-200 hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200/80 flex items-center justify-center text-2xl mb-5 shadow-2xs">
              🛡️
            </div>
            <h3 className="text-xl font-extrabold text-slate-900 mb-3 font-outfit">
              Continuous Verification Engine
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Every role is verified continuously against source career portals. Inactive postings and duplicate recruiter spam are purged automatically.
            </p>
          </div>
          <div className="text-xs font-bold text-emerald-700 mt-6 flex items-center gap-1">
            <span>✓ Verified Direct Portal Links</span>
          </div>
        </div>

        {/* Card 3: 1 col */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-8 sm:p-9 shadow-xs hover:border-blue-200 hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200/80 flex items-center justify-center text-2xl mb-5 shadow-2xs">
              📊
            </div>
            <h3 className="text-xl font-extrabold text-slate-900 mb-3 font-outfit">
              Achievement-Focused Bullet Optimizer
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Transform standard job duties into high-impact achievements using structured metrics, quantifiable impact, and clear action verbs.
            </p>
          </div>
          <div className="text-xs font-bold text-[#0071e3] mt-6 flex items-center gap-1">
            <span>✓ Proven Industry Resume Framework</span>
          </div>
        </div>

        {/* Card 4: Span 2 cols */}
        <div className="md:col-span-2 bg-white border border-slate-200/90 rounded-3xl p-8 sm:p-9 shadow-xs hover:border-blue-200 hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200/80 flex items-center justify-center text-2xl mb-5 shadow-2xs">
              🔒
            </div>
            <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 mb-3 font-outfit">
              Privacy-First Architecture
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed max-w-2xl">
              We never sell or distribute your resume or personal details to third parties. You retain complete ownership with one-click permanent account erasure at any time.
            </p>
          </div>
          <div className="flex gap-2.5 mt-6 flex-wrap">
            <span className="bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg text-xs font-bold text-emerald-800">
              🔒 DPDP &amp; GDPR Compliant
            </span>
            <span className="bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg text-xs font-bold text-emerald-800">
              🛡️ 256-Bit TLS Security
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
