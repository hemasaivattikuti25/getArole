"use client";

import React from "react";
import Link from "next/link";
import { FileCheck, AlertCircle, Scale, ShieldAlert, ArrowLeft } from "lucide-react";

export default function TermsPage() {
  const lastUpdated = "September 7, 2026";

  return (
    <div className="min-h-screen bg-slate-50/60 pt-6 pb-24 px-4 sm:px-6 lg:px-8 max-w-[1200px] mx-auto">
      
      {/* ── Breadcrumb & Navigation ── */}
      <div className="mb-6">
        <Link 
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Home</span>
        </Link>
      </div>

      {/* ── Title Banner ── */}
      <div className="bg-white p-8 sm:p-10 rounded-3xl border border-slate-200/80 shadow-xs mb-10">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center font-bold">
            <Scale className="w-5 h-5" />
          </div>
          <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-200/60">
            Terms of Service
          </span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight font-outfit mb-3">
          Terms of Service
        </h1>
        <p className="text-sm text-slate-500 max-w-3xl leading-relaxed">
          Please read these terms carefully before accessing or utilizing getArole. By creating an account, uploading career documents, or exploring job listings, you enter into a binding agreement with getArole.
        </p>
        <div className="text-xs font-semibold text-slate-400 mt-4 pt-4 border-t border-slate-100">
          Last Updated: {lastUpdated} • Version 2.4-Enterprise
        </div>
      </div>

      {/* ── Content Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Table of Contents */}
        <div className="lg:col-span-4 sticky top-6 space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3">Agreement Pillars</h2>
            <nav className="space-y-2 text-xs font-semibold text-slate-600">
              <a href="#acceptance" className="block hover:text-indigo-600 transition-colors">1. Acceptance of Terms</a>
              <a href="#services" className="block hover:text-indigo-600 transition-colors">2. Description of Services</a>
              <a href="#user-conduct" className="block hover:text-indigo-600 transition-colors">3. User Conduct & Accounts</a>
              <a href="#ai-disclaimer" className="block hover:text-indigo-600 transition-colors">4. AI Generation Disclaimer</a>
              <a href="#ip" className="block hover:text-indigo-600 transition-colors">5. Intellectual Property Rights</a>
              <a href="#liability" className="block hover:text-indigo-600 transition-colors">6. Limitation of Liability</a>
              <a href="#governing-law" className="block hover:text-indigo-600 transition-colors">7. Governing Law & Jurisdiction</a>
            </nav>
          </div>

          <div className="bg-amber-50/70 p-5 rounded-2xl border border-amber-200/60 text-xs">
            <div className="font-bold text-amber-950 mb-1 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
              <span>Employment Guarantee Disclaimer</span>
            </div>
            <p className="text-amber-900/80 leading-relaxed text-[11px]">
              getArole provides algorithmic matching tools and job aggregations. We do not guarantee employment, interview selection, or specific hiring outcomes from third-party employers.
            </p>
          </div>
        </div>

        {/* Right Content Stream */}
        <div className="lg:col-span-8 bg-white p-8 sm:p-10 rounded-3xl border border-slate-200/80 shadow-xs space-y-10 text-sm leading-relaxed text-slate-700">
          
          <section id="acceptance" className="space-y-3">
            <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-indigo-600" /> 1. Acceptance of Terms
            </h2>
            <p>
              By accessing our platform at getarole.com or via any associated application programming interfaces (APIs), you agree to comply with and be bound by these Terms of Service. If you disagree with any portion of these terms, you must discontinue platform usage immediately.
            </p>
          </section>

          <section id="services" className="space-y-3 pt-6 border-t border-slate-100">
            <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Scale className="w-5 h-5 text-indigo-600" /> 2. Description of Services
            </h2>
            <p>
              getArole operates as an intelligent career discovery gateway. Our services include:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-600">
              <li>Aggregation and indexing of publicly accessible career portal listings (Greenhouse, Lever, Ashby, Workday).</li>
              <li>Local vector embedding similarity matching between candidate profiles and listings.</li>
              <li>ATS resume formatting, real-time AI bullet point suggestions, and single-page PDF generation.</li>
              <li>Recruiter candidate screening dashboards and hiring pipeline management tools.</li>
            </ul>
          </section>

          <section id="user-conduct" className="space-y-3 pt-6 border-t border-slate-100">
            <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-indigo-600" /> 3. User Conduct & Acceptable Use
            </h2>
            <p>
              When utilizing getArole, you agree not to engage in prohibited activities, including:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-xs text-slate-600">
              <li>Uploading fraudulent, forged, or misrepresentative career histories.</li>
              <li>Attempting to reverse engineer or scrape platform APIs at rates exceeding documented rate limits.</li>
              <li>Injecting malicious code, SQL injection payloads, or cross-site scripting vectors via resume uploads.</li>
              <li>Sharing or publishing unauthorized access credentials or API admin keys.</li>
            </ul>
          </section>

          <section id="ai-disclaimer" className="space-y-3 pt-6 border-t border-slate-100">
            <h2 className="text-lg font-black text-slate-900 tracking-tight">
              4. AI & Algorithmic Outputs Disclaimer
            </h2>
            <p className="text-xs text-slate-600">
              AI-generated suggestions, bullet point refinements, cover letters, and match scores are provided for informational and assistive purposes. You are solely responsible for reviewing and verifying the accuracy of any resume content submitted to employers. getArole disclaims liability for inaccuracies generated by underlying language models.
            </p>
          </section>

          <section id="ip" className="space-y-3 pt-6 border-t border-slate-100">
            <h2 className="text-lg font-black text-slate-900 tracking-tight">
              5. Intellectual Property Rights
            </h2>
            <p className="text-xs text-slate-600">
              <strong>Your Content:</strong> You retain complete ownership of all resumes, cover letters, and personal identifiers you upload to getArole.<br /><br />
              <strong>Platform Property:</strong> The getArole interface design, logos, proprietary matching pipelines, and software algorithms remain the exclusive intellectual property of getArole.
            </p>
          </section>

          <section id="liability" className="space-y-3 pt-6 border-t border-slate-100">
            <h2 className="text-lg font-black text-slate-900 tracking-tight">
              6. Limitation of Liability
            </h2>
            <p className="text-xs text-slate-600">
              To the maximum extent permitted by applicable law, getArole shall not be liable for any indirect, punitive, incidental, or consequential damages resulting from platform downtime, scraper source availability, or employer hiring decisions.
            </p>
          </section>

          <section id="governing-law" className="space-y-3 pt-6 border-t border-slate-100 text-xs">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
              7. Governing Law & Dispute Resolution
            </h2>
            <p className="text-slate-600">
              These Terms shall be governed by and construed in accordance with the laws of Bengaluru, Karnataka, India. Any disputes arising out of these terms shall be subject to the exclusive jurisdiction of the courts located in Bengaluru.
            </p>
          </section>

        </div>
      </div>

    </div>
  );
}
