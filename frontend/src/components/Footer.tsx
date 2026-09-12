"use client";

import React from "react";
import Link from "next/link";
import { Mail, ShieldCheck, Sparkles, CheckCircle2 } from "lucide-react";

export default function Footer() {
  return (
    <footer className="w-full bg-white border-t border-slate-200/80 pt-12 pb-24 lg:pb-10 px-4 sm:px-6 lg:px-8 mt-auto font-sans text-slate-600 relative z-10">
      <div className="max-w-7xl mx-auto">
        {/* Top Grid: Brand, Founder Spotlight, and Nav Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-10 mb-10">
          
          {/* Col 1 & 2: Brand Identity & Founder Spotlight Card */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            <Link href="/" className="inline-flex items-center gap-2.5 group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo.svg"
                alt="getArole Logo"
                className="w-8 h-8 rounded-xl object-contain shadow-xs group-hover:scale-105 transition-transform"
              />
              <span className="font-bold text-2xl tracking-tight text-slate-900">
                get<span className="text-[#0062e3]">A</span>role
              </span>
            </Link>

            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed max-w-sm">
              Job discovery and intelligent talent evaluation platform indexing verified tech opportunities directly from official career gateways.
            </p>

            {/* Founder Spotlight Card */}
            <div className="bg-slate-50/80 border border-slate-200/90 rounded-2xl p-3.5 sm:p-4 max-w-md shadow-xs flex items-start gap-3.5">
              <div className="relative flex-shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/founder.png"
                  alt="getArole Team"
                  className="w-12 h-12 rounded-full object-cover border-2 border-[#0062e3] shadow-xs"
                />
                <span
                  className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"
                  title="Active Founder"
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-bold text-slate-900">Hemasai Vattikuti</span>
                  <span className="text-[10px] font-bold bg-blue-50 text-[#0062e3] border border-blue-200/60 px-2 py-0.5 rounded-md">
                    Founder
                  </span>
                </div>
                <div className="text-xs text-slate-500 mt-0.5 font-medium">
                  System Architect &amp; Lead Engineer, getArole
                </div>
                <p className="text-xs text-slate-600 mt-1.5 leading-normal">
                  Building intelligent tools to accelerate job discovery, calibrate ATS resumes, and streamline application pipelines for tech talent across India.
                </p>
                <div className="flex items-center gap-3 mt-2.5 flex-wrap">
                  <a
                    href="mailto:admingetarole@gmail.com"
                    className="text-xs font-semibold text-[#0062e3] hover:text-blue-700 transition-colors inline-flex items-center gap-1.5"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>admingetarole@gmail.com</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Live Telemetry Pill */}
            <div className="inline-flex items-center gap-2 bg-emerald-50/90 border border-emerald-200/80 px-3 py-1 rounded-full text-xs font-semibold text-emerald-700 w-fit">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Verified Employer Career Portals • Live</span>
            </div>
          </div>

          {/* Col 3: Platform Tools */}
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3.5">
              Platform Tools
            </div>
            <ul className="space-y-2.5 text-xs sm:text-sm">
              <li>
                <Link
                  href="/dashboard"
                  className="text-slate-600 hover:text-[#0062e3] transition-colors font-medium inline-block"
                >
                  Application Tracker
                </Link>
              </li>
              <li>
                <Link
                  href="/explore"
                  className="text-slate-600 hover:text-[#0062e3] transition-colors font-medium inline-block"
                >
                  Job Discovery &amp; Search
                </Link>
              </li>
              <li>
                <Link
                  href="/matches"
                  className="text-slate-600 hover:text-[#0062e3] transition-colors font-medium inline-block"
                >
                  AI Resume Matcher
                </Link>
              </li>
              <li>
                <Link
                  href="/resume-builder"
                  className="text-slate-600 hover:text-[#0062e3] transition-colors font-medium inline-block"
                >
                  AI Resume Builder
                </Link>
              </li>
              <li>
                <Link
                  href="/cover-letter"
                  className="text-slate-600 hover:text-[#0062e3] transition-colors font-medium inline-block"
                >
                  Cover Letter Generator
                </Link>
              </li>
              <li>
                <Link
                  href="/profile"
                  className="text-slate-600 hover:text-[#0062e3] transition-colors font-medium inline-block"
                >
                  Candidate Profile
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Active Career Hubs */}
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3.5">
              Active Hubs
            </div>
            <ul className="space-y-2.5 text-xs sm:text-sm">
              <li>
                <Link
                  href="/explore?q=Bengaluru"
                  className="text-slate-600 hover:text-[#0062e3] transition-colors font-medium inline-block"
                >
                  Bengaluru Tech Hub
                </Link>
              </li>
              <li>
                <Link
                  href="/explore?q=Hyderabad"
                  className="text-slate-600 hover:text-[#0062e3] transition-colors font-medium inline-block"
                >
                  Hyderabad Roles
                </Link>
              </li>
              <li>
                <Link
                  href="/explore?q=Pune"
                  className="text-slate-600 hover:text-[#0062e3] transition-colors font-medium inline-block"
                >
                  Pune &amp; Mumbai
                </Link>
              </li>
              <li>
                <Link
                  href="/explore?q=Gurgaon"
                  className="text-slate-600 hover:text-[#0062e3] transition-colors font-medium inline-block"
                >
                  Delhi NCR / Gurgaon
                </Link>
              </li>
              <li>
                <Link
                  href="/explore?q=Remote"
                  className="text-slate-600 hover:text-[#0062e3] transition-colors font-medium inline-block"
                >
                  Remote in India
                </Link>
              </li>
              <li>
                <Link
                  href="/explore?q=Fresher"
                  className="text-slate-600 hover:text-[#0062e3] transition-colors font-medium inline-block"
                >
                  Freshers &amp; Early Career
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 5: Contact & Governance */}
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3.5">
              Contact &amp; Legal
            </div>
            <ul className="space-y-2.5 text-xs sm:text-sm">
              <li>
                <a
                  href="mailto:admingetarole@gmail.com"
                  className="text-[#0062e3] hover:text-blue-700 font-semibold transition-colors break-all inline-block"
                >
                  admingetarole@gmail.com
                </a>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="text-slate-600 hover:text-[#0062e3] transition-colors font-medium inline-block"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="text-slate-600 hover:text-[#0062e3] transition-colors font-medium inline-block"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  href="/preferences"
                  className="text-slate-600 hover:text-[#0062e3] transition-colors font-medium inline-block"
                >
                  Account &amp; Job Settings
                </Link>
              </li>
              <li>
                <a
                  href="mailto:admingetarole@gmail.com?subject=Grievance%20Redressal"
                  className="text-slate-600 hover:text-[#0062e3] transition-colors font-medium inline-block"
                >
                  Grievance Redressal
                </a>
              </li>
              <li className="pt-1 text-[11px] text-slate-400 leading-relaxed">
                DPDP Act 2023 &amp; GDPR Compliant • Direct application links with zero third-party tracking.
              </li>
            </ul>
          </div>

        </div>

        {/* Sub-footer Bottom Bar */}
        <div className="border-t border-slate-200 pt-5 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span>
              © {new Date().getFullYear()} <strong className="text-slate-800 font-bold">getArole.in</strong>. All rights reserved.
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
            <span className="inline-flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Verified Opportunities
            </span>
            <span>•</span>
            <span className="inline-flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-[#0062e3]" />
              Direct Employer Links
            </span>
            <span>•</span>
            <a
              href="mailto:admingetarole@gmail.com"
              className="text-[#0062e3] hover:underline font-semibold"
            >
              Contact Support
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
