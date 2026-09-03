"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, Menu, X } from "lucide-react";
import { useAuth } from "@/providers/auth-provider";

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-200 ${
        isScrolled
          ? "bg-white/95 backdrop-blur-md shadow-xs py-3"
          : "bg-white/80 backdrop-blur-xs py-3.5"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Real Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.svg"
            alt="getArole Logo"
            className="w-8 h-8 rounded-xl object-contain shadow-xs group-hover:scale-105 transition-transform"
          />
          <span className="font-bold text-xl tracking-tight text-slate-900">
            get<span className="text-[#0062e3]">A</span>role
          </span>
        </Link>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center gap-7 text-[14.5px] font-medium text-slate-600">
          <Link
            href="/explore"
            className="hover:text-[#0062e3] transition-colors"
          >
            Explore Jobs
          </Link>
          <Link
            href="/matches"
            className="hover:text-[#0062e3] transition-colors"
          >
            Match Resume
          </Link>
          <Link
            href="/resume-builder"
            className="hover:text-[#0062e3] transition-colors"
          >
            Resume Builder
          </Link>
          <Link
            href="/dashboard"
            className="hover:text-[#0062e3] transition-colors"
          >
            Applications
          </Link>
        </nav>

        {/* Action CTAs */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <Link
              href="/dashboard"
              className="btn-sweep inline-flex items-center gap-2 bg-[#0062e3] text-white px-4.5 py-2 rounded-xl text-sm font-semibold shadow-xs hover:shadow-md transition-shadow"
            >
              <span>Go to Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <>
              <Link
                href="/onboarding"
                className="text-sm font-semibold text-slate-700 hover:text-slate-900 px-3 py-2 transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/onboarding"
                className="btn-sweep inline-flex items-center gap-2 bg-[#0062e3] text-white px-4.5 py-2 rounded-xl text-sm font-semibold shadow-xs hover:shadow-md transition-shadow"
              >
                <span>Get Started</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </>
          )}
        </div>

        {/* Mobile Hamburger Toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          aria-label="Toggle Navigation Menu"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 px-4 pt-3 pb-5 space-y-2.5 shadow-lg">
          <div className="grid gap-1.5">
            <Link
              href="/explore"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50 text-slate-900 font-semibold text-sm"
            >
              <span>Explore Jobs</span>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </Link>
            <Link
              href="/matches"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50 text-slate-900 font-semibold text-sm"
            >
              <span>Match Resume</span>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </Link>
            <Link
              href="/resume-builder"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50 text-slate-900 font-semibold text-sm"
            >
              <span>Resume Builder</span>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </Link>
            <Link
              href="/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50 text-slate-900 font-semibold text-sm"
            >
              <span>Applications</span>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </Link>
          </div>
          <div className="pt-2.5 border-t border-slate-100 flex flex-col gap-2">
            {user ? (
              <Link
                href="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2 text-sm font-semibold text-white bg-[#0062e3] rounded-lg shadow-xs"
              >
                Go to Dashboard →
              </Link>
            ) : (
              <>
                <Link
                  href="/onboarding"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2 text-sm font-semibold text-slate-700 bg-slate-50 rounded-lg"
                >
                  Sign In
                </Link>
                <Link
                  href="/onboarding"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2 text-sm font-semibold text-white bg-[#0062e3] rounded-lg shadow-xs"
                >
                  Get Started Free →
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
