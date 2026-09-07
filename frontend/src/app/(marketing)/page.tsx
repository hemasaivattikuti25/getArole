import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import MetricsBand from "@/components/MetricsBand";
import AtsIngestionBand from "@/components/AtsIngestionBand";
import ProductSuite from "@/components/ProductSuite";
import BentoGrid from "@/components/BentoGrid";
import Categories from "@/components/Categories";
import Testimonials from "@/components/Testimonials";
import FAQ from "@/components/FAQ";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";
import BackgroundAurora from "@/components/BackgroundAurora";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col relative text-slate-900 selection:bg-[#0062e3] selection:text-white bg-gradient-to-b from-[#f8faff] via-white to-[#f4f8ff]">
      {/* Dynamic Background Mesh */}
      <BackgroundAurora />

      {/* Header with Original Logo and Nav */}
      <Navbar />

      <main className="flex-1 relative z-10" id="main-content">
        {/* 1. Hero Section with Search, Trending Pills, and Live Match Preview */}
        <Hero />

        {/* 2. Proof Metrics Band */}
        <MetricsBand />

        {/* 3. Direct ATS Ingestion Stream */}
        <AtsIngestionBand />

        {/* 4. Interactive 4-Pillar Product Suite */}
        <ProductSuite />

        {/* 5. Bento Grid of Core AI Capabilities */}
        <BentoGrid />

        {/* 6. Explore by Category */}
        <Categories />

        {/* 7. Candidate Wall of Love (Testimonials) */}
        <Testimonials />

        {/* 8. Frequently Asked Questions */}
        <FAQ />

        {/* 9. Final Action Banner */}
        <CTASection />
      </main>

      {/* 10. Global Enterprise Footer */}
      <Footer />
    </div>
  );
}
