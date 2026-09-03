"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useAuth } from "@/providers/auth-provider";

export default function CTASection() {
  const { user, openAuthModal } = useAuth();

  return (
    <section className="py-10 md:py-14">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-50/70 via-white to-indigo-50/50 rounded-2xl md:rounded-3xl p-6 sm:p-10 md:p-12 border border-blue-200/80 shadow-md text-center">
          <div className="relative z-10 max-w-xl mx-auto">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-950 tracking-tight leading-tight">
              Ready to find your next role?
            </h2>

            <p className="mt-2.5 text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
              Upload your resume to see which positions match your skills, or browse all active roles directly.
            </p>

            {/* Action Buttons */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              {user ? (
                <Link
                  href="/dashboard"
                  className="btn-sweep inline-flex items-center gap-2 bg-[#0062e3] text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-sm hover:shadow-md transition-all"
                >
                  <span>Go to Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => openAuthModal("signup")}
                  className="btn-sweep inline-flex items-center gap-2 bg-[#0062e3] text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-sm hover:shadow-md transition-all cursor-pointer"
                >
                  <span>Match Your Resume</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}

              <Link
                href="/explore"
                className="inline-flex items-center gap-2 bg-white text-slate-800 border border-slate-200 px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-50 hover:border-slate-300 shadow-2xs transition-all"
              >
                <span>Browse Roles →</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
