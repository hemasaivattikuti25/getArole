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
  { name: 'Matches', href: '/matches', icon: Sparkles },
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Profile', href: '/profile', icon: UserSquare2 },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 relative selection:bg-sky-500/30">
      <BackgroundAurora />
      
      {/* Mobile Topbar */}
      <div className="lg:hidden flex items-center justify-between p-4 border-b border-slate-200/50 bg-white/50 backdrop-blur-md relative z-40">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-500 to-purple-600 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight">getArole</span>
        </div>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 text-slate-500 hover:text-slate-900">
          <Menu className="w-6 h-6" />
        </button>
      </div>

      <div className="flex">
        {/* Sidebar Desktop */}
        <aside className={`
          fixed lg:sticky top-0 h-screen w-64 border-r border-slate-200/50 
          bg-white/40 backdrop-blur-xl z-40 transition-transform duration-300
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          flex flex-col
        `}>
          <div className="p-6 hidden lg:flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-500 to-purple-600 flex items-center justify-center shadow-lg shadow-sky-500/20">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-900">getArole</span>
          </div>

          <nav className="flex-1 px-4 py-6 lg:py-0 space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`
                    group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                    ${isActive 
                      ? 'bg-sky-500/10 text-sky-700' 
                      : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'}
                  `}
                >
                  <item.icon className={`w-5 h-5 transition-colors ${isActive ? 'text-sky-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-slate-200/50 space-y-1">
            <Link
              href="/preferences"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100/80 hover:text-slate-900 transition-colors"
            >
              <Settings className="w-5 h-5 text-slate-400" />
              Settings
            </Link>
            <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors">
              <LogOut className="w-5 h-5 text-slate-400" />
              Sign Out
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-h-screen relative z-10 w-full overflow-x-hidden">
          {children}
        </main>
        
        {/* Mobile Backdrop */}
        {mobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-30 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}
      </div>
    </div>
  );
}
