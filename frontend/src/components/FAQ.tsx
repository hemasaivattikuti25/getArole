"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

interface FAQItem {
  q: string;
  a: string;
}

const FAQS: FAQItem[] = [
  {
    q: "How does getArole match my resume with jobs?",
    a: "We extract your core skills, programming languages, and project experience, then compare them against open job descriptions to highlight matches and recommend areas to emphasize.",
  },
  {
    q: "Is getArole free to use?",
    a: "Yes. Searching jobs, checking your resume match, building single-page PDF resumes, and tracking your applications are completely free for job seekers.",
  },
  {
    q: "Can I download my resume as a PDF?",
    a: "Yes. You can edit your resume in the resume builder and export a clean, formatted single-page PDF whenever you need it.",
  },
  {
    q: "How do I track jobs I've applied to?",
    a: "Your dashboard includes an applications board where you can save roles and organize them by status: Saved, Applied, Interview, and Offer.",
  },
  {
    q: "Is my resume data kept private?",
    a: "Yes. Your resume is used only for matching roles and generating your profile. It is never sold or shared with third-party marketing companies.",
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section className="py-12 md:py-16" id="faq">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-xl mx-auto mb-8">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Everything you need to know about finding roles and using getArole.
          </p>
        </div>

        {/* Clean, Lineless Accordion (Zero Border Lines) */}
        <div className="space-y-3">
          {FAQS.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={faq.q}
                className="rounded-2xl p-4 sm:p-5 bg-slate-50/70 hover:bg-slate-50 transition-colors"
              >
                <button
                  type="button"
                  onClick={() => toggle(idx)}
                  className="w-full text-left flex items-center justify-between gap-4 font-semibold text-slate-900 hover:text-[#0062e3] transition-colors cursor-pointer"
                  aria-expanded={isOpen}
                >
                  <span className="text-[15px] sm:text-base font-bold text-slate-900">{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform duration-200 ${
                      isOpen ? "rotate-180 text-[#0062e3]" : ""
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="mt-3 pr-6 text-sm text-slate-600 leading-relaxed font-normal">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
