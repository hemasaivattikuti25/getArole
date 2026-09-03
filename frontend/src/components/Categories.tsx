"use client";

import Link from "next/link";
import { ArrowUpRight, Globe, Building2, Sparkles, Laptop, GraduationCap, Award } from "lucide-react";

export default function Categories() {
  const categories = [
    {
      title: "Global Tech",
      desc: "Google, Microsoft, Amazon India, Cisco",
      icon: Globe,
      q: "Global",
      color: "text-blue-600 bg-blue-50 border-blue-200",
    },
    {
      title: "Enterprise & IT",
      desc: "TCS, Infosys, Wipro, Cognizant",
      icon: Building2,
      q: "MNC",
      color: "text-indigo-600 bg-indigo-50 border-indigo-200",
    },
    {
      title: "High-Growth Startups",
      desc: "Razorpay, Zerodha, Swiggy, CRED",
      icon: Sparkles,
      q: "Unicorn",
      color: "text-purple-600 bg-purple-50 border-purple-200",
    },
    {
      title: "Remote Roles",
      desc: "Distributed engineering teams hiring in India",
      icon: Laptop,
      q: "Remote",
      color: "text-emerald-600 bg-emerald-50 border-emerald-200",
    },
    {
      title: "Freshers & Graduates",
      desc: "Graduate Trainee & 0-2 yrs experience roles",
      icon: GraduationCap,
      q: "Fresher",
      color: "text-amber-600 bg-amber-50 border-amber-200",
    },
    {
      title: "Internships",
      desc: "Summer internships and pre-placement opportunities",
      icon: Award,
      q: "Internship",
      color: "text-teal-600 bg-teal-50 border-teal-200",
    },
  ];

  return (
    <section className="py-10 md:py-14">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-7">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Explore by Category
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Browse openings across company stages and work preferences.
            </p>
          </div>
          <Link
            href="/explore"
            className="text-xs sm:text-sm font-bold text-[#0062e3] hover:underline inline-flex items-center gap-1"
          >
            <span>View all</span>
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {categories.map((cat) => {
            const Icon = cat.icon;
            return (
              <Link
                key={cat.title}
                href={`/explore?q=${cat.q}`}
                className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-2xs hover:border-blue-400 hover:-translate-y-1 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className={`w-8 h-8 rounded-lg ${cat.color} border flex items-center justify-center font-bold mb-2.5 shadow-2xs`}>
                    <Icon className="w-4 h-4" />
                  </div>

                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 mb-1 group-hover:text-[#0062e3] transition-colors leading-snug">
                    {cat.title}
                  </h3>
                  <p className="text-[11px] text-slate-500 leading-normal line-clamp-2">
                    {cat.desc}
                  </p>
                </div>

                <div className="mt-3 text-[10.5px] font-bold text-[#0062e3] opacity-0 group-hover:opacity-100 transition-opacity">
                  Browse →
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
