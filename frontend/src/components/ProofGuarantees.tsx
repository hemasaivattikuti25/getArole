"use client";

import { ShieldCheck, Lock, DollarSign, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

export default function ProofGuarantees() {
  const guarantees = [
    {
      icon: ShieldCheck,
      title: "100% Direct Portal Links",
      desc: "Every apply button links straight to the official employer ATS (Greenhouse, Lever, Workday, Ashby). No affiliate redirects, no middleman tracking, and zero spam agencies.",
      highlight: "Direct Recruiter Inboxes",
      color: "text-blue-600 bg-blue-50 border-blue-200",
    },
    {
      icon: Lock,
      title: "Privacy by Design",
      desc: "We do not sell, license, or distribute your resume or contact information to recruiters or third-party advertisers. You can permanently erase your data with one click at any time.",
      highlight: "Zero Third-Party Tracking",
      color: "text-indigo-600 bg-indigo-50 border-indigo-200",
    },
    {
      icon: DollarSign,
      title: "100% Free for Job Seekers",
      desc: "Job search, role fit diagnostics, LaTeX resume builder, and application pipeline tracking are completely free for candidates. No locked job listings or premium paywalls.",
      highlight: "Zero Paywalls on Opportunities",
      color: "text-emerald-600 bg-emerald-50 border-emerald-200",
    },
  ];

  return (
    <section className="py-20 md:py-28 relative overflow-hidden bg-gradient-to-b from-transparent via-slate-50/40 to-transparent">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-mono font-bold uppercase tracking-wider mb-3.5 shadow-2xs"
          >
            Institutional Standards
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight"
          >
            Authentic transparency.{" "}
            <span className="heading-gradient-emerald block sm:inline">No gimmicks.</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-4 text-base md:text-lg text-slate-600 leading-relaxed"
          >
            Built on verifiable guarantees instead of fake testimonials or exaggerated claims.
          </motion.p>
        </div>

        {/* 3 Pillar Guarantee Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {guarantees.map((g, idx) => {
            const Icon = g.icon;
            return (
              <motion.div
                key={g.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.6, delay: idx * 0.12 }}
                whileHover={{ y: -6, transition: { duration: 0.25 } }}
                className="glass-card rounded-2xl md:rounded-3xl p-7 md:p-8 flex flex-col justify-between bg-white/90"
              >
                <div>
                  <div className={`w-12 h-12 rounded-2xl ${g.color} border flex items-center justify-center font-bold mb-6 shadow-xs`}>
                    <Icon className="w-6 h-6" />
                  </div>

                  <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 mb-3.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{g.highlight}</span>
                  </div>

                  <h3 className="text-xl font-bold text-slate-900 mb-3 leading-snug">
                    {g.title}
                  </h3>

                  <p className="text-sm text-slate-600 leading-relaxed">
                    {g.desc}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-2 text-xs font-semibold text-slate-500">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>Verifiable on every listing</span>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Real Quantitative Proof Banner */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="mt-12 glass-card rounded-2xl md:rounded-3xl p-6 md:p-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center divide-y sm:divide-y-0 sm:divide-x divide-slate-100"
        >
          <div className="pt-2 sm:pt-0">
            <div className="font-mono text-3xl md:text-4xl font-extrabold text-slate-950">100%</div>
            <div className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-wider">Direct Employer Links</div>
          </div>
          <div className="pt-2 sm:pt-0">
            <div className="font-mono text-3xl md:text-4xl font-extrabold text-[#0062e3]">24h</div>
            <div className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-wider">Sync &amp; Pruning Cycle</div>
          </div>
          <div className="pt-2 sm:pt-0">
            <div className="font-mono text-3xl md:text-4xl font-extrabold text-slate-950">0</div>
            <div className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-wider">Recruiter Spam Postings</div>
          </div>
          <div className="pt-2 sm:pt-0">
            <div className="font-mono text-3xl md:text-4xl font-extrabold text-emerald-600">₹0</div>
            <div className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-wider">Candidate Paywalls</div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
