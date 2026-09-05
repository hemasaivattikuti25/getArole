"use client";

import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-white border-t border-slate-200 py-7 px-4 sm:px-6 lg:px-8 mt-auto text-slate-600 font-sans">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-5">
        {/* Brand & Team Spotlight (Spans 2 cols on lg) */}
        <div className="lg:col-span-2">
          <Link href="/" className="inline-flex items-center gap-2 no-underline mb-2 group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.svg"
              alt="getArole Logo"
              className="w-7 h-7 rounded-lg shadow-xs group-hover:scale-105 transition-transform"
            />
            <span className="text-lg font-black text-slate-900 tracking-tight">
              get<span className="text-[#4f46e5]">A</span>role
            </span>
          </Link>

          <p className="text-xs text-slate-500 leading-relaxed max-w-xs mb-3">
            AI-powered job search platform. Verified listings from top career portals.
          </p>

          {/* Team / Founder Spotlight Pill */}
          <div className="inline-flex items-center gap-2 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-full mb-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/founder.png"
              alt="getArole Team"
              className="w-5 h-5 rounded-full object-cover border-[1.5px] border-[#4f46e5] flex-shrink-0"
            />
            <span className="text-[11px] font-bold text-slate-900">
              Built by getArole Team <span className="text-[#4f46e5]">✓</span>
            </span>
          </div>

          <div>
            <div className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full text-[11px] font-bold text-emerald-700">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              Verified Jobs • Live
            </div>
          </div>
        </div>

        {/* Col 2: Explore Jobs */}
        <div>
          <div className="text-xs font-extrabold uppercase tracking-wider text-slate-900 mb-2.5">
            Explore Jobs
          </div>
          <ul className="space-y-1.5 text-xs">
            <li>
              <Link href="/explore" className="text-slate-500 hover:text-[#0062e3] transition-colors font-medium">
                All Opportunities
              </Link>
            </li>
            <li>
              <Link href="/explore?q=Bengaluru" className="text-slate-500 hover:text-[#0062e3] transition-colors font-medium">
                Bengaluru Hub
              </Link>
            </li>
            <li>
              <Link href="/explore?q=Hyderabad" className="text-slate-500 hover:text-[#0062e3] transition-colors font-medium">
                Hyderabad Roles
              </Link>
            </li>
            <li>
              <Link href="/explore?q=Remote" className="text-slate-500 hover:text-[#0062e3] transition-colors font-medium">
                Global Remote
              </Link>
            </li>
            <li>
              <Link href="/explore?q=Fresher" className="text-slate-500 hover:text-[#0062e3] transition-colors font-medium">
                Freshers &amp; 2026
              </Link>
            </li>
          </ul>
        </div>

        {/* Col 3: AI Platform */}
        <div>
          <div className="text-xs font-extrabold uppercase tracking-wider text-slate-900 mb-2.5">
            AI Platform
          </div>
          <ul className="space-y-1.5 text-xs">
            <li>
              <Link href="/onboarding/" className="text-slate-500 hover:text-[#0062e3] transition-colors font-medium">
                AI Resume Matcher
              </Link>
            </li>
            <li>
              <Link href="/resume-builder/" className="text-slate-500 hover:text-[#0062e3] transition-colors font-medium">
                LaTeX Resume Builder
              </Link>
            </li>
            <li>
              <Link href="/cover-letter-builder/" className="text-slate-500 hover:text-[#0062e3] transition-colors font-medium">
                Cover Letter AI
              </Link>
            </li>
            <li>
              <Link href="/matches/" className="text-slate-500 hover:text-[#0062e3] transition-colors font-medium">
                Semantic Matches
              </Link>
            </li>
            <li>
              <Link href="/dashboard/" className="text-slate-500 hover:text-[#0062e3] transition-colors font-medium">
                Kanban Pipeline
              </Link>
            </li>
          </ul>
        </div>

        {/* Col 4: Legal & Support */}
        <div>
          <div className="text-xs font-extrabold uppercase tracking-wider text-slate-900 mb-2.5">
            Legal &amp; Support
          </div>
          <ul className="space-y-1.5 text-xs">
            <li>
              <Link href="/privacy" className="text-slate-500 hover:text-[#0062e3] transition-colors font-medium">
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link href="/terms" className="text-slate-500 hover:text-[#0062e3] transition-colors font-medium">
                Terms of Service
              </Link>
            </li>
            <li>
              <a href="mailto:admingetarole@gmail.com" className="text-slate-500 hover:text-[#0062e3] transition-colors font-medium">
                Grievance Redressal
              </a>
            </li>
            <li>
              <a href="mailto:admingetarole@gmail.com" className="text-slate-500 hover:text-[#0062e3] transition-colors font-medium">
                Contact Support
              </a>
            </li>
          </ul>
        </div>
      </div>

      {/* Sub-footer bottom bar */}
      <div className="max-w-6xl mx-auto border-t border-slate-200 pt-3.5 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-3">
        <div>
          © {new Date().getFullYear()} <strong className="text-slate-700 font-bold">getArole.in</strong>. All rights reserved.
        </div>
        <div className="flex items-center gap-3 text-slate-400 text-[11px]">
          <span>🔒 DPDP Act 2023 &amp; GDPR Compliant</span>
          <span>🛡️ 256-Bit SSL</span>
        </div>
      </div>
    </footer>
  );
}
