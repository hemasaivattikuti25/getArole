'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Search, 
  UserSquare2, 
  Settings, 
  Sparkles,
  LogOut,
  Menu
} from 'lucide-react';
import BackgroundAurora from '@/components/BackgroundAurora';

const navigation = [
  { name: 'Explore Jobs', href: '/explore', icon: Search },
  { name: 'Match Resume', href: '/matches', icon: Sparkles },
  { name: 'Applications', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Resume Builder', href: '/resume-builder', icon: Sparkles },
  { name: 'Profile', href: '/profile', icon: UserSquare2 },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f8faff] via-white to-[#f4f8ff] text-slate-900 relative selection:bg-[#0062e3] selection:text-white">
      <BackgroundAurora />
      
      {/* Mobile Topbar */}
      <div className="lg:hidden flex items-center justify-between p-4 border-b border-slate-200/80 bg-white/80 backdrop-blur-md relative z-40">
        <Link href="/" className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="Logo" className="w-7 h-7 rounded-lg" />
          <span className="font-bold text-lg tracking-tight text-slate-900">
            get<span className="text-[#0062e3]">A</span>role
          </span>
        </Link>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 text-slate-600 hover:text-slate-900">
          <Menu className="w-6 h-6" />
        </button>
      </div>

      <div className="flex">
        {/* Sidebar Desktop */}
        <aside className={`
          fixed lg:sticky top-0 h-screen w-64 border-r border-slate-200/80 
          bg-white/80 backdrop-blur-xl z-40 transition-transform duration-300
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          flex flex-col
        `}>
          <div className="p-6 hidden lg:flex items-center gap-2.5">
            <Link href="/" className="flex items-center gap-2.5 group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.svg" alt="Logo" className="w-8 h-8 rounded-xl object-contain shadow-xs group-hover:scale-105 transition-transform" />
              <span className="font-bold text-xl tracking-tight text-slate-900">
                get<span className="text-[#0062e3]">A</span>role
              </span>
            </Link>
          </div>

          <nav className="flex-1 px-4 py-4 lg:py-0 space-y-1.5">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`
                    group flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200
                    ${isActive 
                      ? 'bg-blue-50 text-[#0062e3] shadow-xs border border-blue-100/80' 
                      : 'text-slate-600 hover:bg-slate-100/70 hover:text-slate-900'}
                  `}
                >
                  <item.icon className={`w-4 h-4 transition-colors ${isActive ? 'text-[#0062e3]' : 'text-slate-400 group-hover:text-slate-600'}`} />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-slate-200/70 space-y-1">
            <Link
              href="/preferences"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100/70 hover:text-slate-900 transition-colors"
            >
              <Settings className="w-4 h-4 text-slate-400" />
              Preferences
            </Link>
            <Link
              href="/"
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition-colors"
            >
              <LogOut className="w-4 h-4 text-slate-400" />
              Back to Home
            </Link>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-h-screen relative z-10 w-full overflow-x-hidden">
          {children}
        </main>
        
        {/* Mobile Backdrop */}
        {mobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-30 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}
      </div>
    </div>
  );
}
