"use client";

import Link from "next/link";
import React from "react";
import { useAuth } from "@/providers/auth-provider";

export default function CTASection() {
  const { user, openAuthModal } = useAuth();

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-24 relative z-10">
      <div className="relative overflow-hidden bg-gradient-to-r from-[#0071e3] to-[#4facfe] rounded-3xl p-10 sm:p-16 text-center text-white shadow-2xl shadow-blue-600/30">
        <div className="relative z-10 max-w-2xl mx-auto">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight font-outfit mb-3.5">
            Ready to find your next role?
          </h2>

          <p className="text-base sm:text-lg opacity-95 leading-relaxed mb-8">
            Upload your resume and start getting matched with verified opportunities.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            {user ? (
              <Link
                href="/matches"
                className="inline-flex items-center gap-2 bg-white text-[#0071e3] hover:bg-slate-50 px-7 py-3.5 rounded-xl text-sm font-extrabold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
              >
                <span>Upload Resume &amp; Get Matched →</span>
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => openAuthModal("signup")}
                className="inline-flex items-center gap-2 bg-white text-[#0071e3] hover:bg-slate-50 px-7 py-3.5 rounded-xl text-sm font-extrabold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all cursor-pointer"
              >
                <span>Upload Resume &amp; Get Matched →</span>
              </button>
            )}

            <Link
              href="/explore"
              className="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white border border-white/40 px-7 py-3.5 rounded-xl text-sm font-bold shadow-xs hover:-translate-y-0.5 transition-all"
            >
              <span>Explore Live Jobs</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
