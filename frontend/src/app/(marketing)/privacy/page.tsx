"use client";

import React from "react";
import Link from "next/link";
import { ShieldCheck, Lock, Eye, FileText, Database, ArrowLeft, CheckCircle } from "lucide-react";

export default function PrivacyPage() {
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
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center font-bold">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200/60">
            GDPR & CCPA Compliant
          </span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight font-outfit mb-3">
          Privacy Policy
        </h1>
        <p className="text-sm text-slate-500 max-w-3xl leading-relaxed">
          At getArole, your data ownership, resume privacy, and control over AI-generated profiles are fundamental principles. This policy explains what information we collect, how our matching algorithms process it, and how you retain full control over your personal data.
        </p>
        <div className="text-xs font-semibold text-slate-400 mt-4 pt-4 border-t border-slate-100">
          Last Updated: {lastUpdated} • Effective Date: January 1, 2026
        </div>
      </div>

      {/* ── Content Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Table of Contents (4 cols) */}
        <div className="lg:col-span-4 sticky top-6 space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3">Sections</h2>
            <nav className="space-y-2 text-xs font-semibold text-slate-600">
              <a href="#collection" className="block hover:text-indigo-600 transition-colors">1. Information We Collect</a>
              <a href="#ai-processing" className="block hover:text-indigo-600 transition-colors">2. AI & Resume Parsing Ethics</a>
              <a href="#usage" className="block hover:text-indigo-600 transition-colors">3. How We Use Your Data</a>
              <a href="#sharing" className="block hover:text-indigo-600 transition-colors">4. Third-Party Sharing & Telemetry</a>
              <a href="#rights" className="block hover:text-indigo-600 transition-colors">5. Your GDPR & CCPA Rights</a>
              <a href="#security" className="block hover:text-indigo-600 transition-colors">6. Security & Encryption Standards</a>
              <a href="#contact" className="block hover:text-indigo-600 transition-colors">7. Contact Data Protection Officer</a>
            </nav>
          </div>

          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-5 rounded-2xl border border-indigo-100/80 text-xs">
            <div className="font-bold text-indigo-950 mb-1 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-indigo-600" />
              <span>Zero-Training Guarantee</span>
            </div>
            <p className="text-indigo-800/80 leading-relaxed text-[11px]">
              We strictly do not use candidate resume uploads, contact details, or job application dossiers to train public AI foundation models.
            </p>
          </div>
        </div>

        {/* Right Content Stream (8 cols) */}
        <div className="lg:col-span-8 bg-white p-8 sm:p-10 rounded-3xl border border-slate-200/80 shadow-xs space-y-10 text-sm leading-relaxed text-slate-700">
          
          <section id="collection" className="space-y-3">
            <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Database className="w-5 h-5 text-indigo-600" /> 1. Information We Collect
            </h2>
            <p>
              When you interact with getArole, we collect information you provide directly to deliver semantic job matching and resume optimization services:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600 text-xs">
              <li><strong>Account Identifiers:</strong> Name, verified email address, phone number, and Firebase authentication tokens.</li>
              <li><strong>Career Information:</strong> Uploaded resume files (PDF, DOCX), employment history, academic qualifications, portfolio URLs, and declared skills.</li>
              <li><strong>Job Preferences:</strong> Target compensation ranges, preferred work locations (e.g. Remote, Bengaluru, Hyderabad), and roles.</li>
              <li><strong>Telemetry & Usage Logs:</strong> Anonymous IP address, browser User-Agent, and SRE request duration logs retained for up to 30 days.</li>
            </ul>
          </section>

          <section id="ai-processing" className="space-y-3 pt-6 border-t border-slate-100">
            <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Eye className="w-5 h-5 text-indigo-600" /> 2. AI & Resume Parsing Ethics
            </h2>
            <p>
              Our automated parsing processes convert PDF documents into structured JSON objects using dedicated PyMuPDF and FastEmbed vector embeddings:
            </p>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2 text-xs">
              <div className="flex items-center gap-2 font-bold text-slate-900">
                <CheckCircle className="w-4 h-4 text-emerald-600" /> Transparent Semantic Scoring
              </div>
              <p className="text-slate-600">
                Match percentages are computed via deterministic cosine vector similarity (BAAI/bge-small-en-v1.5) and validated lexical overlap. We do not use proprietary opaque black-box models to disqualify candidates.
              </p>
            </div>
          </section>

          <section id="rights" className="space-y-3 pt-6 border-t border-slate-100">
            <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-600" /> 3. Your Data Protection Rights
            </h2>
            <p>
              Under the European Union General Data Protection Regulation (GDPR) and California Consumer Privacy Act (CCPA), you retain full sovereignty over your information:
            </p>
            
            <div className="overflow-x-auto mt-4">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-900 font-bold border-b border-slate-200">
                    <th className="py-2.5 px-4">Right</th>
                    <th className="py-2.5 px-4">What It Means</th>
                    <th className="py-2.5 px-4">How to Exercise</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600">
                  <tr>
                    <td className="py-2.5 px-4 font-bold text-slate-900">Right of Erasure (GDPR Art. 17)</td>
                    <td className="py-2.5 px-4">Permanently purge your account, uploaded resumes, and application history.</td>
                    <td className="py-2.5 px-4">Via Profile Settings or emailing privacy@getarole.com</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 font-bold text-slate-900">Right of Access (GDPR Art. 15)</td>
                    <td className="py-2.5 px-4">Receive a machine-readable JSON copy of all data stored about you.</td>
                    <td className="py-2.5 px-4">Available in Profile Settings with 1-click export</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 font-bold text-slate-900">Do Not Sell My Info (CCPA)</td>
                    <td className="py-2.5 px-4">getArole does not sell candidate data to third-party data brokers.</td>
                    <td className="py-2.5 px-4">Enforced by default</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section id="security" className="space-y-3 pt-6 border-t border-slate-100">
            <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Lock className="w-5 h-5 text-indigo-600" /> 4. Security & Encryption Standards
            </h2>
            <p>
              We implement enterprise security defenses to safeguard your personal documents:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-xs text-slate-600">
              <li>AES-256 encryption at rest for all database tables and resume archives.</li>
              <li>TLS 1.3 encryption in transit across all HTTP/REST and WebSocket connections.</li>
              <li>Sliding-window IP rate limiting to prevent credential stuffing and enumeration attacks.</li>
              <li>OWASP Top 10 automated security regression test suites executed prior to every code release.</li>
            </ul>
          </section>

          <section id="contact" className="space-y-3 pt-6 border-t border-slate-100 text-xs">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
              5. Contact Our Data Protection Team
            </h2>
            <p className="text-slate-600">
              If you have any questions or wish to file a data deletion request, please reach out to:
            </p>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 font-mono text-slate-700">
              Email: privacy@getarole.com<br />
              Data Protection Officer, getArole Engineering<br />
              Bengaluru, Karnataka, India
            </div>
          </section>

        </div>
      </div>

    </div>
  );
}
