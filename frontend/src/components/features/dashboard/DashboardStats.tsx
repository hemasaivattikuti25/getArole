'use client';

import { Briefcase, CheckCircle2, Calendar, Star } from 'lucide-react';
import { motion } from 'framer-motion';

const stats = [
  { label: 'Saved Jobs', value: '12', icon: Briefcase, color: 'text-blue-600', bg: 'bg-blue-100' },
  { label: 'Applied', value: '4', icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-100' },
  { label: 'Interviews', value: '1', icon: Calendar, color: 'text-purple-600', bg: 'bg-purple-100' },
  { label: 'Avg Match', value: '84%', icon: Star, color: 'text-amber-600', bg: 'bg-amber-100' },
];

export default function DashboardStats() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      {stats.map((stat, idx) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.1 }}
          className="bg-white/80 backdrop-blur-sm border border-slate-200/50 rounded-2xl p-4 flex items-center gap-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
        >
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.bg}`}>
            <stat.icon className={`w-6 h-6 ${stat.color}`} />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 font-outfit">{stat.value}</div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{stat.label}</div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
