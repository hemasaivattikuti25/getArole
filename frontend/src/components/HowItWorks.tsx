"use client";

import { FileText, CheckCircle2, ArrowRight } from "lucide-react";

export default function HowItWorks() {
  const steps = [
    {
      num: "1",
      title: "Add your resume",
      desc: "Upload your existing PDF or build one in our free editor. We extract your skills and projects so you don't have to re-enter anything.",
    },
    {
      num: "2",
      title: "See matching roles",
      desc: "Every listing is compared against your experience. You can see which skills align and where you stand before applying.",
    },
    {
      num: "3",
      title: "Apply and track",
      desc: "Apply directly to the company. Keep track of what you've applied to and what's next right in your personal dashboard.",
    },
  ];

  return (
    <section className="py-10 md:py-14">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-xl mx-auto mb-8">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            How it works
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            A simple, straightforward way to find developer roles that fit your background.
          </p>
        </div>

        {/* 3 Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {steps.map((step) => (
            <div
              key={step.num}
              className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs hover:border-blue-300 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#0062e3] font-bold text-sm flex items-center justify-center mb-3">
                  {step.num}
                </div>

                <h3 className="text-base font-bold text-slate-900 mb-2">
                  {step.title}
                </h3>

                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {step.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
