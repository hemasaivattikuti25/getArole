"use client";

import Link from "next/link";
import React from "react";

export default function Categories() {
  const categories = [
    {
      name: "🏢 Enterprise & MNCs",
      sub: "TCS, Infosys, Wipro, HCL",
      q: "MNC",
    },
    {
      name: "🦄 High-Growth Tech",
      sub: "Razorpay, Zerodha, CRED, Swiggy",
      q: "Unicorn",
    },
    {
      name: "🌐 Global Tech Giants",
      sub: "Google, Microsoft, Amazon",
      q: "Global",
    },
    {
      name: "🌍 Remote Opportunities",
      sub: "Global Engineering Positions",
      q: "Remote",
    },
    {
      name: "🎓 Early Career & Graduates",
      sub: "Graduate Trainee & Associate Roles",
      q: "Fresher",
    },
    {
      name: "🎯 Engineering Internships",
      sub: "Paid Engineering Programs",
      q: "Internship",
    },
    {
      name: "💳 Fintech & Banking",
      sub: "PhonePe, Paytm, Slice, Jupiter",
      q: "Fintech",
    },
    {
      name: "🧠 AI & Machine Learning",
      sub: "Applied AI, NLP, Vision, Systems",
      q: "AI",
    },
  ];

  return (
    <section className="bg-slate-100/70 border-y border-slate-200 py-16 px-4 sm:px-6 lg:px-8 mb-24" id="companies">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="text-xs font-extrabold text-[#0071e3] uppercase tracking-widest mb-2 font-outfit">
            Top Companies Hiring Now
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight font-outfit">
            Explore by Company Tier &amp; Category
          </h2>
          <p className="mt-2 text-sm sm:text-base text-slate-600">
            Direct access to verified hiring pipelines across top employers.
          </p>
        </div>

        {/* 4-column Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {categories.map((cat) => (
            <Link
              key={cat.q}
              href={`/explore?q=${cat.q}`}
              className="bg-white border border-slate-200/90 rounded-2xl p-5 hover:border-[#0071e3] hover:-translate-y-1 transition-all duration-200 flex items-center justify-between shadow-2xs group"
            >
              <div>
                <div className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-[#0071e3] transition-colors">
                  {cat.name}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  {cat.sub}
                </div>
              </div>
              <span className="text-xs font-bold text-[#0071e3] bg-blue-50 px-2.5 py-1 rounded-md shrink-0 ml-2">
                Explore Roles →
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
