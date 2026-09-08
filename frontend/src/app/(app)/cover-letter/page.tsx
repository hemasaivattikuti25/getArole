"use client";

import React, { useState } from "react";
import { RefreshCw, FileText, Sparkles, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function CoverLetterPage() {
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [builderUrl] = useState<string>("/cover-letter-builder/index.html?v=4");

  return (
    <div className="w-full max-w-[1680px] mx-auto px-3 sm:px-6 py-4 sm:py-6 flex flex-col gap-4">
      {/* ── Subheader Card ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/80 backdrop-blur-md p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-xs">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight font-outfit">
              Tailored AI Cover Letter Architect
            </h1>
            <p className="text-xs text-slate-500">
              Role-specific synthesis • Professional tone calibration • Live Preview &amp; PDF Export
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/resume-builder"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200/80 rounded-xl hover:bg-slate-50 shadow-2xs transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#0062e3]" />
            <span>Resume Builder</span>
            <ArrowRight className="w-3 h-3 text-slate-400" />
          </Link>
        </div>
      </div>

      {/* ── Builder Workspace Canvas ── */}
      <div className="w-full h-[calc(100vh-210px)] min-h-[750px] lg:h-[880px] bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden relative">
        {!iframeLoaded && !hasError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50 z-10">
            <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-xs font-semibold text-slate-600">Loading AI Cover Letter Architect...</p>
          </div>
        )}
        {hasError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50 z-10 p-6 text-center">
            <p className="text-sm font-bold text-slate-800 mb-2">Unable to connect to Cover Letter Architect service</p>
            <p className="text-xs text-slate-500 max-w-md mb-4">
              Please ensure the service is accessible or retry the connection.
            </p>
            <button
              onClick={() => {
                setHasError(false);
                setIframeLoaded(false);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry Connection</span>
            </button>
          </div>
        )}
        <iframe
          src={builderUrl}
          title="getArole AI Cover Letter Builder"
          className="w-full h-full border-none"
          onLoad={() => setIframeLoaded(true)}
          onError={() => setHasError(true)}
        />
      </div>
    </div>
  );
}

