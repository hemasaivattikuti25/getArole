"use client";

import React from "react";

export default function Testimonials() {
  const testimonials = [
    {
      quote:
        "Applying with verified company links directly instead of dead recruiter portals completely changed my search. Landed my SDE role in 3 weeks.",
      avatar: "AK",
      avatarBg: "bg-[#0071e3]",
      name: "Aravind Kumar",
      role: "Backend Engineer • Joined Razorpay",
    },
    {
      quote:
        "The LaTeX resume builder identified crucial missing keywords for my Google Cloud application, raising my match alignment significantly.",
      avatar: "PS",
      avatarBg: "bg-indigo-600",
      name: "Pooja Sharma",
      role: "Software Engineer • Joined Google India",
    },
    {
      quote:
        "The Kanban tracker saved me from managing chaotic spreadsheets. Having verified direct application links with instant match scores is unmatched.",
      avatar: "RN",
      avatarBg: "bg-blue-600",
      name: "Rahul Nair",
      role: "Full Stack Dev • Joined TCS Digital",
    },
  ];

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-24 relative z-10">
      {/* Section Header */}
      <div className="text-center max-w-2xl mx-auto mb-12">
        <div className="text-xs font-extrabold text-[#0071e3] uppercase tracking-widest mb-2 font-outfit">
          What People Are Saying
        </div>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight font-outfit">
          Engineers Landing Roles Faster with getArole
        </h2>
      </div>

      {/* Testimonials 3-Col Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {testimonials.map((t, idx) => (
          <div
            key={idx}
            className="bg-white border border-slate-200/90 rounded-3xl p-7 shadow-xs hover:border-blue-200 hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between"
          >
            <p className="text-sm sm:text-base text-slate-700 leading-relaxed italic mb-6">
              &ldquo;{t.quote}&rdquo;
            </p>
            <div className="flex items-center gap-3.5 pt-4 border-t border-slate-100">
              <div
                className={`w-11 h-11 rounded-full ${t.avatarBg} text-white font-extrabold flex items-center justify-center text-sm shadow-xs shrink-0`}
              >
                {t.avatar}
              </div>
              <div>
                <div className="text-sm font-extrabold text-slate-900 font-outfit">
                  {t.name}
                </div>
                <div className="text-xs text-slate-500 font-medium">
                  {t.role}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
