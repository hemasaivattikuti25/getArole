'use client';

import React from 'react';
import { Sparkles } from 'lucide-react';
import { useAuth } from '@/providers/auth-provider';

export function WelcomeHero() {
  const { user } = useAuth();
  
  // Basic greeting logic based on user's local time
  const hour = new Date().getHours();
  let greeting = 'Good evening';
  if (hour < 12) greeting = 'Good morning';
  else if (hour < 18) greeting = 'Good afternoon';

  const firstName = user?.name?.split(' ')[0] || 'Engineer';

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-500 via-purple-500 to-sky-500 p-8 sm:p-10 text-white shadow-xl shadow-indigo-500/10 mb-8 border border-white/20">
      {/* Decorative Background Elements */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-sky-400/20 rounded-full blur-3xl pointer-events-none" />
      
      <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 border border-white/30 backdrop-blur-md mb-4 text-xs font-semibold tracking-wide uppercase">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Matching Active</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-2">
            {greeting}, {firstName}
          </h1>
          <p className="text-indigo-100 text-sm sm:text-base max-w-xl leading-relaxed">
            Your personalized AI job matcher and application pipeline is running. We are continuously scanning top tech hubs for roles matching your exact profile.
          </p>
        </div>
        
        <div className="hidden lg:block shrink-0">
          <div className="w-32 h-32 relative">
            <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90 drop-shadow-xl">
              <circle cx="50" cy="50" r="45" className="fill-none stroke-white/20 stroke-[8]" />
              <circle cx="50" cy="50" r="45" className="fill-none stroke-white stroke-[8] stroke-dasharray-[283] stroke-dashoffset-[70]" strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold">75%</span>
              <span className="text-[10px] uppercase font-bold text-indigo-100 tracking-wider">Profile</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
