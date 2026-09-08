'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  Search, 
  UserSquare2, 
  Settings, 
  Sparkles, 
  LogOut, 
  Menu, 
  X,
  FileText,
  ChevronRight,
  ChevronDown
} from 'lucide-react';
import BackgroundAurora from '@/components/BackgroundAurora';
import Footer from '@/components/Footer';
import { useAuth } from '@/providers/auth-provider';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Explore Jobs', href: '/explore', icon: Search },
  { name: 'Explore Matches', href: '/matches', icon: Sparkles },
  { name: 'Resume Builder', href: '/resume-builder', icon: FileText },
  { name: 'Cover Letter', href: '/cover-letter', icon: FileText },
  { name: 'Profile', href: '/profile', icon: UserSquare2 },
];

const mobileNavigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Explore', href: '/explore', icon: Search },
  { name: 'Matches', href: '/matches', icon: Sparkles },
  { name: 'Resume', href: '/resume-builder', icon: FileText },
  { name: 'Profile', href: '/profile', icon: UserSquare2 },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { user, logout } = useAuth();

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/explore?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const getPageInfo = () => {
    if (pathname.startsWith('/dashboard')) return { title: 'Dashboard', breadcrumb: 'Dashboard', icon: LayoutDashboard };
    if (pathname.startsWith('/explore')) return { title: 'Explore Jobs', breadcrumb: 'Explore Jobs', icon: Search };
    if (pathname.startsWith('/matches')) return { title: 'AI Resume Matches', breadcrumb: 'Matches', icon: Sparkles };
    if (pathname.startsWith('/resume-builder')) return { title: 'ATS Resume Builder', breadcrumb: 'Resume Builder', icon: FileText };
    if (pathname.startsWith('/cover-letter')) return { title: 'AI Cover Letter', breadcrumb: 'Cover Letter', icon: FileText };
    if (pathname.startsWith('/profile')) return { title: 'Candidate Profile', breadcrumb: 'Profile', icon: UserSquare2 };
    if (pathname.startsWith('/preferences')) return { title: 'Account Settings', breadcrumb: 'Account Settings', icon: Settings };
    return { title: 'Platform', breadcrumb: 'Platform', icon: LayoutDashboard };
  };

  const pageInfo = getPageInfo();
  const PageIcon = pageInfo.icon;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f8faff] via-white to-[#f4f8ff] text-slate-900 relative selection:bg-[#0062e3] selection:text-white">
      <BackgroundAurora />
      
      <div className="flex min-h-screen">
        {/* Sidebar Desktop */}
        <aside className={`
          fixed lg:sticky top-0 h-screen w-64 border-r border-slate-200/80 
          bg-white/90 backdrop-blur-xl z-40 transition-transform duration-300
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          flex flex-col shrink-0
        `}>
          <div className="p-5 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5 group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.svg" alt="Logo" className="w-8 h-8 rounded-xl object-contain shadow-xs group-hover:scale-105 transition-transform" />
              <span className="font-bold text-xl tracking-tight text-slate-900">
                get<span className="text-[#0062e3]">A</span>role
              </span>
            </Link>
            <button 
              onClick={() => setMobileMenuOpen(false)} 
              className="lg:hidden p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="flex-1 px-4 py-2 space-y-1.5 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
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
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-slate-200/70 space-y-2 bg-white/50">
            {user && (
              <div className="px-3 py-2 rounded-xl bg-slate-50/80 border border-slate-200/60 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#0062e3] text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                  {(user.displayName || user.email || 'U')[0].toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-slate-800 truncate">
                    {user.displayName || 'Candidate'}
                  </div>
                  <div className="text-[11px] text-slate-400 truncate">
                    {user.email || ''}
                  </div>
                </div>
              </div>
            )}
            <Link
              href="/preferences"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-3.5 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100/70 hover:text-slate-900 transition-colors"
            >
              <Settings className="w-4 h-4 text-slate-400" />
              <span>Account Settings</span>
            </Link>
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                logout();
              }}
              className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-sm font-medium text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer text-left"
            >
              <LogOut className="w-4 h-4 text-rose-500" />
              <span>Sign Out</span>
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 min-h-screen relative z-10 w-full">
          {/* Top Unified Header */}
          <header className="sticky top-0 z-30 bg-white/85 backdrop-blur-xl border-b border-slate-200/80 px-4 sm:px-6 py-3 flex items-center justify-between gap-4 transition-all">
            {/* Left: Mobile menu toggle / Page title */}
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setMobileMenuOpen(true)} 
                className="lg:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
                aria-label="Open menu"
              >
                <Menu className="w-5 h-5" />
              </button>

              <Link href="/" className="lg:hidden flex items-center gap-1.5 mr-1">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo.svg" alt="Logo" className="w-6 h-6 rounded-md" />
              </Link>

              <div className="flex items-center gap-2">
                <div className="hidden sm:flex w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 items-center justify-center text-[#0062e3]">
                  <PageIcon className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs text-slate-400 font-medium hidden sm:flex items-center gap-1">
                    <span>getArole</span>
                    <ChevronRight className="w-3 h-3 text-slate-300" />
                    <span className="text-slate-600">{pageInfo.breadcrumb}</span>
                  </div>
                  <h1 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight leading-none">
                    {pageInfo.title}
                  </h1>
                </div>
              </div>
            </div>

            {/* Center: Search input */}
            <form onSubmit={handleSearchSubmit} className="relative hidden md:flex items-center max-w-xs w-full">
              <Search className="absolute left-3 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search jobs, skills, roles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8.5 pr-3 py-1.5 text-xs bg-slate-100/90 hover:bg-slate-100 focus:bg-white border border-slate-200/90 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0062e3]/20 focus:border-[#0062e3] transition-all placeholder:text-slate-400 font-medium"
              />
            </form>

            {/* Right: Quick actions + User Avatar Dropdown */}
            <div className="flex items-center gap-2.5">
              <Link
                href="/explore"
                className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200/80 px-3 py-1.5 rounded-xl hover:bg-slate-50 transition-colors shadow-2xs"
              >
                <Search className="w-3.5 h-3.5 text-[#0062e3]" />
                <span>Explore</span>
              </Link>

              <Link
                href="/matches"
                className="hidden md:inline-flex items-center gap-1.5 text-xs font-semibold text-[#0062e3] bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-xl hover:bg-blue-100/70 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI Matches</span>
              </Link>

              {/* User Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 p-1 sm:px-2.5 sm:py-1 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 transition-colors cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-lg bg-[#0062e3] text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                    {(user?.displayName || user?.email || 'U')[0].toUpperCase()}
                  </div>
                  <span className="hidden sm:block text-xs font-semibold text-slate-700 max-w-[100px] truncate">
                    {user?.displayName || 'Account'}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {userMenuOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setUserMenuOpen(false)} 
                    />
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200/90 py-1.5 z-50 text-xs animate-in fade-in slide-in-from-top-1 duration-150">
                      <div className="px-3.5 py-2.5 border-b border-slate-100">
                        <div className="font-bold text-slate-900 truncate">
                          {user?.displayName || 'Signed in candidate'}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate mt-0.5">
                          {user?.email || 'Authenticated User'}
                        </div>
                      </div>
                      <div className="py-1">
                        <Link
                          href="/profile"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3.5 py-2 text-slate-700 hover:bg-slate-50 font-medium"
                        >
                          <UserSquare2 className="w-4 h-4 text-slate-400" />
                          <span>Candidate Profile</span>
                        </Link>
                        <Link
                          href="/preferences"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3.5 py-2 text-slate-700 hover:bg-slate-50 font-medium"
                        >
                          <Settings className="w-4 h-4 text-slate-400" />
                          <span>Account Settings</span>
                        </Link>
                      </div>
                      <div className="border-t border-slate-100 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setUserMenuOpen(false);
                            logout();
                          }}
                          className="w-full flex items-center gap-2.5 px-3.5 py-2 text-rose-600 hover:bg-rose-50 font-semibold cursor-pointer text-left"
                        >
                          <LogOut className="w-4 h-4 text-rose-500" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </header>

          {/* Children Page Body */}
          <main className="flex-1 min-h-0 w-full pb-24 lg:pb-0">
            {children}
          </main>

          {/* Global Footer on ALL App Pages */}
          <Footer />
        </div>

        {/* Mobile Backdrop */}
        {mobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-30 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <nav 
        aria-label="Mobile Navigation"
        className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-t border-slate-200/90 shadow-2xl px-2 py-1 flex items-center justify-around lg:hidden"
      >
        {mobileNavigation.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`
                flex flex-col items-center justify-center py-1.5 px-3 min-w-[56px] rounded-xl transition-all duration-150
                ${isActive 
                  ? 'text-[#0062e3] font-bold' 
                  : 'text-slate-500 hover:text-slate-800 font-medium'}
              `}
            >
              <div className={`p-1 rounded-lg transition-colors ${isActive ? 'bg-blue-50 text-[#0062e3]' : 'text-slate-400'}`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-[10px] tracking-tight mt-0.5">{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

