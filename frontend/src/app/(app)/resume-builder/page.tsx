"use client";

import React, { useState } from "react";
import { Sparkles, Download, ExternalLink, RefreshCw, FileText, ArrowUpRight } from "lucide-react";

export default function ResumeBuilderPage() {
  const [iframeLoaded, setIframeLoaded] = useState(false);

  return (
    <div className="relative min-h-screen pt-4 pb-12 px-2 sm:px-4 lg:px-6 max-w-[1600px] mx-auto">
      {/* ── Subheader ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 bg-white/70 backdrop-blur-xl p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-xs">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight font-outfit">
              1-Page ATS Resume & Cover Letter Architect
            </h1>
            <p className="text-xs text-slate-500">
              Harvard/Standard LaTeX format • Real-time AI Bullet Enhancer • Single-Page PDF Export
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="http://localhost:8000/resume-builder"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200/80 rounded-xl hover:bg-slate-50 shadow-2xs transition-colors"
          >
            <span>Open in Full Tab</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
          </a>
        </div>
      </div>

      {/* ── Full Application Iframe / Workspace ── */}
      <div className="w-full h-[calc(100vh-140px)] min-h-[750px] bg-white rounded-2xl border border-slate-200/80 shadow-md overflow-hidden relative">
        {!iframeLoaded && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50 z-10">
            <div className="w-8 h-8 border-3 border-[#0062e3] border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-xs font-semibold text-slate-600">Loading ATS Resume Architect...</p>
          </div>
        )}
        <iframe
          src="http://localhost:8000/resume-builder"
          title="getArole ATS Resume Builder"
          className="w-full h-full border-none"
          onLoad={() => setIframeLoaded(true)}
        />
      </div>
    </div>
  );
}
