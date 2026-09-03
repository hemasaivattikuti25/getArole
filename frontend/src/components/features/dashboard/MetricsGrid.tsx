'use client';

import React from 'react';
import { Briefcase, Sparkles, Bookmark, CheckCircle2, Activity } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  trend?: { value: number; label: string };
  pulse?: boolean;
  colorScheme: 'sky' | 'purple' | 'emerald' | 'slate';
}

function MetricCard({ title, value, icon: Icon, trend, pulse, colorScheme }: MetricCardProps) {
  const colorStyles = {
    sky: 'bg-sky-50 text-sky-600 border-sky-100 group-hover:border-sky-300 group-hover:shadow-sky-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100 group-hover:border-purple-300 group-hover:shadow-purple-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100 group-hover:border-emerald-300 group-hover:shadow-emerald-100',
    slate: 'bg-slate-100 text-slate-600 border-slate-200 group-hover:border-slate-300 group-hover:shadow-slate-200',
  };

  const iconStyles = {
    sky: 'bg-sky-100 text-sky-500',
    purple: 'bg-purple-100 text-purple-500',
    emerald: 'bg-emerald-100 text-emerald-500',
    slate: 'bg-white text-slate-500 shadow-sm border border-slate-200',
  };

  return (
    <div className={cn(
      "group relative overflow-hidden bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1",
      colorStyles[colorScheme].split('group-hover:')[1] // extract hover border from map for base element
    )}>
      <div className="flex items-start justify-between mb-4">
        <div className={cn(
          "w-12 h-12 rounded-2xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110",
          iconStyles[colorScheme]
        )}>
          {pulse ? (
            <div className="relative flex items-center justify-center">
              <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
              <Activity className="w-6 h-6 relative z-10" />
            </div>
          ) : (
            <Icon className="w-6 h-6" />
          )}
        </div>
        {trend && (
          <span className={cn(
            "text-xs font-bold px-2.5 py-1 rounded-full",
            trend.value > 0 ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
          )}>
            {trend.value > 0 ? '+' : ''}{trend.value}%
          </span>
        )}
      </div>
      
      <div>
        <h3 className="text-slate-500 font-semibold text-sm mb-1">{title}</h3>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-slate-900 tracking-tight">{value}</span>
          {pulse && <span className="text-emerald-500 text-sm font-bold tracking-wide">LIVE</span>}
        </div>
      </div>
    </div>
  );
}

export function MetricsGrid() {
  return (
    <div className="mb-10">
      <h2 className="text-xl font-bold text-slate-900 mb-4 px-1">Performance Overview</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <MetricCard
          title="Active System Scrapes"
          value="1,402"
          icon={Activity}
          pulse={true}
          colorScheme="emerald"
        />
        <MetricCard
          title="AI Matches Found"
          value="16"
          icon={Sparkles}
          trend={{ value: 12, label: 'vs last week' }}
          colorScheme="purple"
        />
        <MetricCard
          title="Saved Opportunities"
          value="4"
          icon={Bookmark}
          colorScheme="sky"
        />
        <MetricCard
          title="Applications Sent"
          value="0"
          icon={CheckCircle2}
          colorScheme="slate"
        />
      </div>
    </div>
  );
}
