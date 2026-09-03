'use client';

import React from 'react';
import Link from 'next/link';
import { UserSquare2, Sparkles, Search, ChevronRight } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const trackSteps = [
  {
    id: 1,
    title: 'Complete your profile',
    description: 'Upload your ATS resume and set your role preferences.',
    icon: UserSquare2,
    href: '/profile',
    color: 'sky',
    completed: true,
  },
  {
    id: 2,
    title: 'Review AI Matches',
    description: 'See the top roles our AI has verified for you.',
    icon: Sparkles,
    href: '/matches',
    color: 'purple',
    completed: false,
  },
  {
    id: 3,
    title: 'Explore Market',
    description: 'Browse the entire pipeline of active tech jobs.',
    icon: Search,
    href: '/explore',
    color: 'emerald',
    completed: false,
  }
];

export function ActionTrack() {
  return (
    <div className="mb-12">
      <h2 className="text-xl font-bold text-slate-900 mb-4 px-1">Your Onboarding Track</h2>
      
      <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden p-2 sm:p-4 relative">
        {/* Connection Line */}
        <div className="absolute top-1/2 left-0 w-full h-[2px] bg-slate-100 -z-10 hidden md:block transform -translate-y-1/2" />
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 sm:gap-4 relative z-10">
          {trackSteps.map((step, index) => {
            const Icon = step.icon;
            
            const colorClasses = {
              sky: 'group-hover:border-sky-300 group-hover:bg-sky-50 group-hover:shadow-sky-100/50',
              purple: 'group-hover:border-purple-300 group-hover:bg-purple-50 group-hover:shadow-purple-100/50',
              emerald: 'group-hover:border-emerald-300 group-hover:bg-emerald-50 group-hover:shadow-emerald-100/50',
            }[step.color];

            const iconBg = {
              sky: step.completed ? 'bg-sky-500 text-white shadow-sky-500/30' : 'bg-sky-100 text-sky-600',
              purple: step.completed ? 'bg-purple-500 text-white shadow-purple-500/30' : 'bg-purple-100 text-purple-600',
              emerald: step.completed ? 'bg-emerald-500 text-white shadow-emerald-500/30' : 'bg-emerald-100 text-emerald-600',
            }[step.color];

            return (
              <Link 
                key={step.id} 
                href={step.href}
                className={cn(
                  "group flex flex-col p-5 rounded-2xl bg-white border border-slate-100 shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer",
                  colorClasses,
                  step.completed ? 'opacity-80 hover:opacity-100' : ''
                )}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center shadow-sm transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3",
                    iconBg
                  )}>
                    <Icon className="w-5 h-5" />
                  </div>
                  
                  {/* Step Badge */}
                  <div className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold font-mono transition-colors",
                    step.completed ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200 group-hover:text-slate-600'
                  )}>
                    {step.id}
                  </div>
                </div>
                
                <h3 className="font-bold text-slate-900 text-base mb-1.5 transition-colors group-hover:text-black">
                  {step.title}
                </h3>
                <p className="text-slate-500 text-sm leading-relaxed mb-4 flex-1">
                  {step.description}
                </p>
                
                <div className={cn(
                  "flex items-center gap-1.5 text-sm font-bold mt-auto transition-colors",
                  step.completed ? 'text-slate-400' : `text-${step.color}-600`
                )}>
                  {step.completed ? 'Review' : 'Start now'}
                  <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
