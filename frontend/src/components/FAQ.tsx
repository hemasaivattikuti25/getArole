"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import React from "react";

interface FAQItem {
  q: string;
  a: string;
}

const FAQS: FAQItem[] = [
  {
    q: "How does getArole differ from traditional job boards?",
    a: "getArole provides a modern, high-precision job discovery platform. We ingest openings directly from official enterprise career portals (Greenhouse, Lever, Ashby, Workday) to ensure zero ghost jobs and direct application links without middleman redirects.",
  },
  {
    q: "How does the AI resume match score work?",
    a: "When you upload your resume, getArole evaluates your technical skills and experience depth against the job description using AI analysis to give you a fit percentage and keyword suggestions.",
  },
  {
    q: "Is getArole completely free for job seekers?",
    a: "Yes! getArole provides 100% free access to explore verified live roles, AI resume matching evaluations, LaTeX resume exports, and the Kanban application tracking board.",
  },
  {
    q: "How is my personal data and resume protected?",
    a: "We strictly adhere to the Digital Personal Data Protection (DPDP) Act 2023 and GDPR guidelines. We do not sell user data to telemarketers or third-party recruiters. You can permanently delete your profile and resumes at any time.",
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mb-24 relative z-10" id="faq">
      {/* Section Header */}
      <div className="text-center max-w-xl mx-auto mb-10">
        <div className="text-xs font-extrabold text-[#0071e3] uppercase tracking-widest mb-2 font-outfit">
          Frequently Asked Questions
        </div>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight font-outfit">
          Everything You Need to Know
        </h2>
      </div>

      {/* Accordion */}
      <div className="space-y-3.5">
        {FAQS.map((faq, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div
              key={faq.q}
              className={`rounded-2xl border transition-all ${
                isOpen
                  ? "bg-white border-blue-300 shadow-xs"
                  : "bg-white border-slate-200/90 hover:border-slate-300"
              }`}
            >
              <button
                type="button"
                onClick={() => toggle(idx)}
                className="w-full text-left p-5 sm:p-6 flex items-center justify-between gap-4 font-semibold text-slate-900 hover:text-[#0071e3] transition-colors cursor-pointer"
                aria-expanded={isOpen}
              >
                <span className="text-base sm:text-lg font-bold text-slate-900">{faq.q}</span>
                <ChevronDown
                  className={`w-5 h-5 text-slate-400 shrink-0 transition-transform duration-200 ${
                    isOpen ? "rotate-180 text-[#0071e3]" : ""
                  }`}
                />
              </button>

              {isOpen && (
                <div className="px-5 sm:px-6 pb-5 sm:pb-6 text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
                  {faq.a}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
