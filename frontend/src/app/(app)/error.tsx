"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, Trash2, Compass } from "lucide-react";

export default function AppErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App boundary caught error:", error);
  }, [error]);

  const handleResetStorage = () => {
    try {
      localStorage.removeItem("getarole_resume_v2");
      localStorage.removeItem("getarole_profile");
      localStorage.removeItem("getarole_prefs");
      localStorage.removeItem("getarole_tracked_apps");
    } catch {}
    window.location.reload();
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full bg-white/90 backdrop-blur-xl border border-slate-200/90 rounded-3xl p-8 shadow-xl text-center">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto mb-5 shadow-xs">
          <AlertTriangle className="w-7 h-7" />
        </div>

        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight font-outfit mb-2">
          Unable to Load View
        </h2>
        <p className="text-sm text-slate-500 mb-6 leading-relaxed">
          We encountered an unexpected issue while rendering this page. You can try refreshing the view or resetting cached profile data.
        </p>

        {process.env.NODE_ENV !== "production" && error?.message && (
          <div className="mb-6 p-3 bg-slate-50 rounded-xl border border-slate-200 text-left overflow-auto max-h-32 text-xs font-mono text-rose-700">
            {error.message}
          </div>
        )}

        <div className="flex flex-col gap-2.5">
          <button
            onClick={() => reset()}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#0062e3] hover:bg-blue-700 text-white font-bold text-sm shadow-xs transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Try Again</span>
          </button>

          <button
            onClick={handleResetStorage}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5 text-slate-400" />
            <span>Clear Cached Data & Reload</span>
          </button>

          <Link
            href="/explore"
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold text-xs transition-colors mt-1"
          >
            <Compass className="w-3.5 h-3.5 text-slate-400" />
            <span>Return to Explore Jobs</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
