import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import HowItWorks from "@/components/HowItWorks";
import BentoGrid from "@/components/BentoGrid";
import Categories from "@/components/Categories";
import FAQ from "@/components/FAQ";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";
import BackgroundAurora from "@/components/BackgroundAurora";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col relative text-slate-900 selection:bg-[#0062e3] selection:text-white bg-gradient-to-b from-[#f8faff] via-white to-[#f4f8ff]">
      {/* Dynamic Background Mesh */}
      <BackgroundAurora />

      {/* Header with Original Logo */}
      <Navbar />

      <main className="flex-1 relative z-10">
        {/* 1. Hero with Search & Live Match Preview */}
        <Hero />

        {/* 2. Simple 3-Step Overview */}
        <HowItWorks />

        {/* 3. Core Features Bento Grid */}
        <BentoGrid />

        {/* 4. Explore by Category */}
        <Categories />

        {/* 5. Frequently Asked Questions */}
        <FAQ />

        {/* 6. Action Call */}
        <CTASection />
      </main>

      {/* 7. Clean Footer */}
      <Footer />
    </div>
  );
}
