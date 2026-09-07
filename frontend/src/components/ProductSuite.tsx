"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";

export default function ProductSuite() {
  const [activeTab, setActiveTab] = useState<number>(0);

  const tabs = [
    { label: "🎯 Intelligent Role Matcher" },
    { label: "📄 LaTeX Resume Builder" },
    { label: "✉️ Tailored Cover Letter AI" },
    { label: "📊 Application Pipeline Tracker" },
  ];

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-24 relative z-10">
      {/* Section Header */}
      <div className="text-center max-w-2xl mx-auto mb-10">
        <div className="text-xs font-extrabold text-[#0071e3] uppercase tracking-widest mb-2 font-outfit">
          Complete Application Ecosystem
        </div>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight font-outfit">
          Everything You Need From Discovery to Offer
        </h2>
        <p className="mt-2 text-sm sm:text-base text-slate-600">
          One master profile to discover openings, check ATS compatibility, and manage interviews.
        </p>
      </div>

      {/* Tab Navigation Pills */}
      <div className="flex items-center justify-center gap-2 flex-wrap mb-10">
        {tabs.map((tab, idx) => (
          <button
            key={idx}
            onClick={() => setActiveTab(idx)}
            className={`px-4 py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === idx
                ? "bg-[#0071e3] text-white shadow-md shadow-blue-500/25"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Active Tab Panel */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-10 shadow-sm">
        {activeTab === 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="text-2xl font-extrabold text-slate-900 mb-3 font-outfit">
                Semantic Profile &amp; Role Matching
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed mb-6">
                Unlike primitive keyword searches, getArole models your technical skills, experience depth, and career preferences to calculate accurate, explainable match scores.
              </p>
              <ul className="space-y-3 mb-8">
                {[
                  "Multi-dimensional match diagnostics",
                  "Real-time keyword & requirement gap analysis",
                  "Direct bookmarking to your application board",
                ].map((feat, i) => (
                  <li key={i} className="flex items-center gap-2.5 text-sm font-semibold text-slate-800">
                    <span className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center text-xs font-bold shrink-0">
                      <Check className="w-3 h-3" />
                    </span>
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/matches"
                className="btn-sweep inline-flex items-center gap-2 bg-[#0071e3] text-white px-6 py-3 rounded-xl text-sm font-bold shadow-md shadow-blue-600/20"
              >
                <span>Start Matching Your Resume →</span>
              </Link>
            </div>

            <div className="bg-slate-50 rounded-2xl p-5 sm:p-6 border border-slate-200">
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-extrabold text-[#0071e3] uppercase tracking-wider">Fit Diagnostics</span>
                <span className="text-sm font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  98.4% Match
                </span>
              </div>
              <div className="text-xs font-bold text-slate-900 mb-1">Strengths:</div>
              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                Strong backend alignment in FastAPI, distributed async event queues, and Docker containerization.
              </p>
              <div className="text-xs font-bold text-slate-900 mb-2">Missing Recommended Keywords:</div>
              <div className="flex gap-2 flex-wrap">
                <span className="bg-rose-50 border border-rose-200 text-rose-700 text-xs px-2.5 py-1 rounded-md font-bold">
                  + Kubernetes Helm
                </span>
                <span className="bg-rose-50 border border-rose-200 text-rose-700 text-xs px-2.5 py-1 rounded-md font-bold">
                  + gRPC Protocol
                </span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 1 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="text-2xl font-extrabold text-slate-900 mb-3 font-outfit">
                Professional LaTeX ATS Resume Builder
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed mb-6">
                Craft clean, single-page resumes with proven engineering and executive layouts. Designed for optimal parsing across Workday, Greenhouse, Lever, and Taleo.
              </p>
              <ul className="space-y-3 mb-8">
                {[
                  "Clean A4 PDF export with modern typography",
                  "Bullet point enhancer with quantifiable impact metrics",
                  "Instant job description keyword tailor tool",
                ].map((feat, i) => (
                  <li key={i} className="flex items-center gap-2.5 text-sm font-semibold text-slate-800">
                    <span className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center text-xs font-bold shrink-0">
                      <Check className="w-3 h-3" />
                    </span>
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/resume-builder"
                className="btn-sweep inline-flex items-center gap-2 bg-[#0071e3] text-white px-6 py-3 rounded-xl text-sm font-bold shadow-md shadow-blue-600/20"
              >
                <span>Open Resume Builder Free →</span>
              </Link>
            </div>

            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 font-serif">
              <div className="text-center border-b border-slate-400 pb-3 mb-3">
                <div className="text-lg font-bold tracking-wider text-slate-900 uppercase">Candidate Resume Preview</div>
                <div className="text-xs text-slate-500 mt-0.5">ATS-Optimized Formatting • LaTeX Clean Typographic Layout</div>
              </div>
              <div className="text-xs font-bold border-b border-slate-400 pb-1 mb-2 text-slate-900 tracking-wider">
                EXPERIENCE
              </div>
              <div className="text-xs text-slate-700 leading-relaxed font-sans">
                <div className="font-bold text-slate-900">Software Engineer — Razorpay (2024–Present)</div>
                <div className="text-slate-600 mt-1">• Architected high-throughput payment webhook processing system with 99.99% reliability.</div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 2 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="text-2xl font-extrabold text-slate-900 mb-3 font-outfit">
                Tailored Cover Letter Generator
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed mb-6">
                Generate role-specific cover letters customized to your experience and target positions in seconds, with presets for freshers, engineers, and referrals.
              </p>
              <ul className="space-y-3 mb-8">
                {[
                  "4 Industry Presets: Professional, Early Career, High-Impact Tech, Referral",
                  "Tone Selector (Concise, Metrics-Driven, Executive)",
                  "Instant LaTeX PDF & Text Export",
                ].map((feat, i) => (
                  <li key={i} className="flex items-center gap-2.5 text-sm font-semibold text-slate-800">
                    <span className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center text-xs font-bold shrink-0">
                      <Check className="w-3 h-3" />
                    </span>
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/cover-letter"
                className="btn-sweep inline-flex items-center gap-2 bg-[#0071e3] text-white px-6 py-3 rounded-xl text-sm font-bold shadow-md shadow-blue-600/20"
              >
                <span>Generate Cover Letter →</span>
              </Link>
            </div>

            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
              <div className="text-xs font-bold text-[#0071e3] uppercase tracking-wider mb-2">
                Preview • Professional Preset
              </div>
              <div className="text-xs text-slate-600 leading-relaxed italic bg-white p-4 rounded-xl border border-slate-200">
                &ldquo;Dear Hiring Team,<br /><br />
                I am writing to express my enthusiasm for the Backend Engineer position at Google India. With dedicated experience in scalable microservices, I have consistently built high-performance APIs...&rdquo;
              </div>
            </div>
          </div>
        )}

        {activeTab === 3 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="text-2xl font-extrabold text-slate-900 mb-3 font-outfit">
                Visual Application Pipeline Tracker
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed mb-6">
                Organize your job search seamlessly across key hiring stages with direct application links, interview notes, and timeline tracking.
              </p>
              <ul className="space-y-3 mb-8">
                {[
                  "4 Lifecycle Stages: Saved, Applied, Interviewing, Offered",
                  "Direct company career portal deep-links",
                  "Exportable JSON/CSV application logs",
                ].map((feat, i) => (
                  <li key={i} className="flex items-center gap-2.5 text-sm font-semibold text-slate-800">
                    <span className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center text-xs font-bold shrink-0">
                      <Check className="w-3 h-3" />
                    </span>
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/dashboard"
                className="btn-sweep inline-flex items-center gap-2 bg-[#0071e3] text-white px-6 py-3 rounded-xl text-sm font-bold shadow-md shadow-blue-600/20"
              >
                <span>Open Kanban Tracker →</span>
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-6 rounded-2xl border border-slate-200">
              <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
                <div className="text-[11px] font-extrabold text-blue-600 mb-1.5 uppercase">📌 Saved</div>
                <div className="bg-slate-50 p-2.5 rounded-lg text-xs font-bold text-slate-800">
                  Google • SDE II
                </div>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
                <div className="text-[11px] font-extrabold text-emerald-600 mb-1.5 uppercase">🚀 Interviewing</div>
                <div className="bg-emerald-50 p-2.5 rounded-lg text-xs font-bold text-emerald-800">
                  Razorpay • System Design
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
