'use client';

import { motion } from 'framer-motion';

export default function AIMatchRing({ score }: { score: number }) {
  const radius = 30;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  let color = 'stroke-emerald-500';
  let gradientId = 'matchGradientHigh';
  if (score < 80) {
    color = 'stroke-blue-500';
    gradientId = 'matchGradientMed';
  }
  if (score < 60) {
    color = 'stroke-amber-500';
    gradientId = 'matchGradientLow';
  }

  return (
    <div className="relative w-20 h-20 flex items-center justify-center">
      <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 80 80">
        <defs>
          <linearGradient id="matchGradientHigh" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#0ea5e9" />
          </linearGradient>
          <linearGradient id="matchGradientMed" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
          <linearGradient id="matchGradientLow" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#ef4444" />
          </linearGradient>
        </defs>
        
        {/* Background track */}
        <circle
          cx="40"
          cy="40"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="6"
          className="text-slate-100"
        />
        
        {/* Animated fill */}
        <motion.circle
          cx="40"
          cy="40"
          r={radius}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth="6"
          strokeLinecap="round"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          style={{ strokeDasharray: circumference }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center font-outfit font-bold text-lg text-slate-900">
        {score}
      </div>
    </div>
  );
}
