"use client";

import { ShieldCheck, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

const PLATFORMS = [
  { name: "Greenhouse", tier: "Enterprise ATS", dot: "bg-emerald-500", glow: "hover:border-emerald-300 hover:bg-emerald-50/50" },
  { name: "Lever", tier: "Modern Tech ATS", dot: "bg-blue-500", glow: "hover:border-blue-300 hover:bg-blue-50/50" },
  { name: "Ashby", tier: "High-Growth ATS", dot: "bg-indigo-500", glow: "hover:border-indigo-300 hover:bg-indigo-50/50" },
  { name: "Workday", tier: "Corporate Portals", dot: "bg-amber-500", glow: "hover:border-amber-300 hover:bg-amber-50/50" },
  { name: "LinkedIn Talent", tier: "Direct Verified", dot: "bg-sky-500", glow: "hover:border-sky-300 hover:bg-sky-50/50" },
  { name: "Internshala", tier: "Internships", dot: "bg-teal-500", glow: "hover:border-teal-300 hover:bg-teal-50/50" },
  { name: "Unstop", tier: "Campus Drives", dot: "bg-purple-500", glow: "hover:border-purple-300 hover:bg-purple-50/50" },
];

export default function TrustTicker() {
  return (
    <section className="relative py-12 md:py-16 border-y border-slate-200/80 bg-gradient-to-b from-white/60 via-blue-50/30 to-white/60 backdrop-blur-md overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 text-xs uppercase tracking-widest font-mono font-bold text-blue-700 bg-blue-50/90 px-3 py-1 rounded-full border border-blue-200 mb-3.5 shadow-2xs"
        >
          <ShieldCheck className="w-4 h-4 text-[#0062e3]" />
          <span>Continuous Automated Ingestion</span>
        </motion.div>

        <motion.h3
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-lg md:text-2xl font-bold text-slate-900 max-w-xl mx-auto leading-snug"
        >
          Openings synchronized directly from verified employer career infrastructure
        </motion.h3>

        {/* ATS Badges with Staggered Entrance and Hover Physics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="mt-8 flex flex-wrap items-center justify-center gap-3 md:gap-4 max-w-4xl mx-auto"
        >
          {PLATFORMS.map((plat) => (
            <div
              key={plat.name}
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border text-xs md:text-sm font-semibold transition-all duration-300 hover:-translate-y-1 hover:shadow-md bg-white/90 backdrop-blur-md border-slate-200/90 text-slate-800 ${plat.glow}`}
            >
              <span className={`w-2 h-2 rounded-full ${plat.dot} animate-pulse`}></span>
              <span>{plat.name}</span>
              <span className="text-[11px] font-mono text-slate-400 font-normal">({plat.tier})</span>
            </div>
          ))}
        </motion.div>

        <p className="mt-6 text-xs text-slate-500 max-w-lg mx-auto leading-relaxed">
          Postings are re-verified every 24 hours. Stale listings and duplicate recruiter postings are pruned automatically.
        </p>
      </div>
    </section>
  );
}
