'use client';

import React from 'react';
import Link from 'next/link';
import { Sparkles, Briefcase, FileCheck, XCircle, CheckCircle2 } from 'lucide-react';

export default function DashboardStats() {
  return (
    <div className="w-full">
      {/* ── HOME HERO CARD ── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-[18px] p-8 md:p-10 text-white mb-8 shadow-xl shadow-indigo-900/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        {/* Background Decorative Element */}
        <div className="absolute -top-[50%] -right-[20%] w-[400px] h-[400px] bg-[radial-gradient(circle,rgba(255,255,255,0.12)_0%,transparent_70%)] pointer-events-none" />
        
        <div className="relative z-10">
          <h1 className="text-[28px] font-extrabold font-outfit mb-2 tracking-tight">
            Welcome back, <span className="text-sky-300">Hemasaivattikuti!</span> 👋
          </h1>
          <p className="text-[14.5px] text-indigo-100 max-w-xl leading-relaxed">
            Your AI agent has scanned <strong className="text-white">42 new jobs</strong> in the last 24 hours. You have 3 high-probability matches ready for review.
          </p>
        </div>
        
        <Link 
          href="/matches"
          className="relative z-10 bg-white text-indigo-600 px-6 py-3 rounded-xl text-[14px] font-extrabold flex items-center gap-2 shadow-lg shadow-black/10 hover:-translate-y-0.5 hover:shadow-xl transition-all duration-200 whitespace-nowrap"
        >
          <Sparkles className="w-4 h-4 text-sky-500" />
          View New Matches
        </Link>
      </div>

      {/* ── STATS METRIC GRID ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Saved Jobs', value: '12', icon: Briefcase, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Applications Sent', value: '4', icon: CheckCircle2, color: 'text-sky-600', bg: 'bg-sky-50' },
          { label: 'Interviews', value: '1', icon: FileCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Rejected', value: '2', icon: XCircle, color: 'text-rose-600', bg: 'bg-rose-50' },
        ].map((stat, idx) => (
          <div 
            key={idx} 
            className="bg-white/70 backdrop-blur-md border border-slate-200 rounded-2xl p-5 flex items-center gap-4 transition-all duration-200 hover:border-indigo-300 hover:shadow-lg hover:-translate-y-0.5"
          >
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${stat.bg} ${stat.color} transition-transform duration-200 hover:scale-110`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-extrabold font-outfit text-slate-900">{stat.value}</div>
              <div className="text-[12.5px] font-bold text-slate-500">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── 4-STEP WIDGET ── */}
      <div className="bg-white/70 backdrop-blur-md border border-slate-200 rounded-2xl p-6 shadow-sm mb-8">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-[20px] font-extrabold text-slate-900 mb-1.5 font-outfit">Get started with getArole</h2>
            <p className="text-[14px] text-slate-500 font-medium">Complete a few steps to land your next dream role.</p>
          </div>
          <div className="bg-indigo-50 text-indigo-700 font-extrabold text-[14px] px-3.5 py-1.5 rounded-lg border border-indigo-100">
            1/4 Completed
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { num: '1', title: 'Complete your profile', desc: 'Add skills, experience & target roles to qualify for more jobs.', href: '/profile', done: true },
            { num: '2', title: 'View your first match', desc: 'Automatically discover personalized high-fit AI matches.', href: '/matches', done: false },
            { num: '3', title: 'Apply to first job', desc: 'Tailor your resume and apply to a verified match.', href: '/explore', done: false },
            { num: '4', title: 'Track interviews', desc: 'Move your first application into the interview stage.', href: '/dashboard', done: false },
          ].map((step, idx) => (
            <Link 
              key={idx} 
              href={step.href}
              className={`
                border rounded-xl p-4.5 cursor-pointer transition-all duration-200 flex flex-col items-start
                ${step.done 
                  ? 'bg-indigo-50/50 border-indigo-200 opacity-75' 
                  : 'bg-white border-slate-200 hover:border-indigo-300 hover:shadow-md'}
              `}
            >
              <div className={`
                w-7 h-7 rounded-full flex items-center justify-center font-extrabold text-[13px] mb-3 shadow-md
                ${step.done ? 'bg-indigo-600 text-white shadow-indigo-600/30' : 'bg-slate-800 text-white shadow-slate-800/30'}
              `}>
                {step.done ? <CheckCircle2 className="w-4 h-4" /> : step.num}
              </div>
              <h3 className={`text-[15px] font-extrabold mb-1.5 font-outfit ${step.done ? 'text-indigo-900' : 'text-slate-900'}`}>
                {step.title}
              </h3>
              <p className="text-[13px] text-slate-500 leading-relaxed font-medium">
                {step.desc}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
