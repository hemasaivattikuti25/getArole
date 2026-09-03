'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Search, 
  Sparkles,
  User,
  LogOut,
  RefreshCw,
  Menu
} from 'lucide-react';
import BackgroundAurora from '@/components/BackgroundAurora';
import { motion, AnimatePresence } from 'framer-motion';

const navigation = [
  { name: 'Explore Jobs', href: '/explore', icon: Search },
  { name: 'Matches', href: '/matches', icon: Sparkles },
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [userMenuOpen, setUserMenuOpen] = React.useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 relative selection:bg-sky-500/30 overflow-x-hidden flex flex-col">
      <BackgroundAurora />
      
      {/* ── TOP NAVIGATION BAR ── */}
      <header className="sticky top-0 z-50 bg-white/70 backdrop-blur-xl border-b border-slate-200 shadow-sm transition-all duration-300">
        <div className="max-w-[1500px] w-full mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          
          <div className="flex items-center gap-8">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-indigo-500 flex items-center justify-center text-white font-bold font-outfit shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform">
                A
              </div>
              <span className="font-outfit font-extrabold text-lg text-slate-900 tracking-tight">
                get<span className="text-indigo-600">Arole</span>
              </span>
            </Link>

            {/* Desktop Nav Tabs */}
            <nav className="hidden md:flex items-center gap-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href || (pathname === '/' && item.href === '/dashboard');
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`
                      flex items-center gap-2 px-3.5 py-2 rounded-lg text-[13.5px] font-semibold transition-all duration-200
                      ${isActive 
                        ? 'bg-indigo-50 text-indigo-600' 
                        : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'}
                    `}
                  >
                    <item.icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            <button className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-2 border-slate-200 bg-white text-[13px] font-bold text-slate-700 hover:border-indigo-600 hover:text-indigo-600 transition-colors">
              <RefreshCw className="w-4 h-4" />
              Sync Data
            </button>

            {/* User Profile Button */}
            <div className="relative">
              <button 
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-full border-2 border-slate-200 bg-white hover:border-indigo-600 transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-600 to-indigo-500 text-white font-bold text-xs flex items-center justify-center">
                  H
                </div>
                <span className="text-[13px] font-bold text-slate-700 hidden sm:block">Hemasa..</span>
              </button>

              <AnimatePresence>
                {userMenuOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-[calc(100%+8px)] w-48 bg-white border border-slate-200 rounded-xl shadow-xl p-2 flex flex-col gap-1 z-50"
                  >
                    <Link href="/profile" className="flex items-center gap-2 px-3 py-2 rounded-md text-[13px] font-semibold text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-colors">
                      <User className="w-4 h-4 text-slate-400" /> My Profile
                    </Link>
                    <button className="flex items-center gap-2 px-3 py-2 rounded-md text-[13px] font-semibold text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-colors text-left">
                      <LogOut className="w-4 h-4 text-slate-400" /> Sign Out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Mobile Hamburger */}
            <button 
              className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full flex flex-col relative z-10 mx-auto max-w-[1500px]">
        {children}
      </main>
      
      {/* Mobile Navigation Backdrop (Optional full-screen menu can go here) */}
    </div>
  );
}
