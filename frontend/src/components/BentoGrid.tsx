"use client";

import Link from "next/link";
import { Sparkles, FileText, Kanban, FileEdit, ArrowRight } from "lucide-react";

export default function BentoGrid() {
  const tools = [
    {
      icon: Sparkles,
      iconColor: "text-blue-600 bg-blue-50",
      title: "Resume Match Screener",
      desc: "Compare your resume against any open role to see matching competencies and highlight where your experience aligns best.",
      linkText: "Try Resume Matcher",
      href: "/matches",
    },
    {
      icon: FileText,
      iconColor: "text-indigo-600 bg-indigo-50",
      title: "Single-Page Resume Builder",
      desc: "Write and format a clean, single-page resume with standard developer structure, then export directly to PDF for free.",
      linkText: "Open Resume Builder",
      href: "/resume-builder",
    },
    {
      icon: Kanban,
      iconColor: "text-purple-600 bg-purple-50",
      title: "Application Pipeline Tracker",
      desc: "Organize every opportunity across simple stages—Saved, Applied, Interview, and Offer—in your personal dashboard.",
      linkText: "View Dashboard",
      href: "/dashboard",
    },
    {
      icon: FileEdit,
      iconColor: "text-emerald-600 bg-emerald-50",
      title: "Tailored Application Notes",
      desc: "Draft concise, role-specific cover notes tailored to the exact technologies requested by the hiring team.",
      linkText: "Generate Notes",
      href: "/cover-letter-builder",
    },
  ];

  return (
    <section className="py-10 md:py-14">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-xl mx-auto mb-10">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Tools to make applying faster
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Everything you need to match, build, and organize your job search in one place.
          </p>
        </div>

        {/* Normal, Clean Feature Grid (No Nested Boxes or Heavy Cards) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {tools.map((tool) => {
            const Icon = tool.icon;
            return (
              <div
                key={tool.title}
                className="flex flex-col justify-between p-5 rounded-xl hover:bg-slate-50/80 transition-colors group"
              >
                <div>
                  <div className={`w-10 h-10 rounded-xl ${tool.iconColor} flex items-center justify-center font-bold mb-3.5`}>
                    <Icon className="w-5 h-5" />
                  </div>

                  <h3 className="text-base font-bold text-slate-900 mb-2 group-hover:text-[#0062e3] transition-colors">
                    {tool.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {tool.desc}
                  </p>
                </div>

                <div className="mt-4 pt-1">
                  <Link
                    href={tool.href}
                    className="text-xs font-bold text-[#0062e3] hover:underline inline-flex items-center gap-1"
                  >
                    <span>{tool.linkText}</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
