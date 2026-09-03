"use client";

import { motion } from "framer-motion";

export default function BackgroundAurora() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
      {/* ═════════════════════════════════════════════════════════════════
          RHYTHMIC 3-COLOR AMBIENT AURORA CANVAS
          Palette:
          1. Sky Blue (#0ea5e9 / #38bdf8)
          2. Violet Purple (#a855f7 / #818cf8)
          3. Emerald Teal Green (#10b981 / #14b8a6)
         ═════════════════════════════════════════════════════════════════ */}

      {/* ── ZONE 1: HERO SECTION (TOP) ── */}
      {/* 1A. Top-Left: Sky Blue Sheen */}
      <motion.div
        animate={{
          x: [-20, 30, -15, -20],
          y: [-15, 25, -10, -15],
          scale: [1, 1.08, 0.95, 1],
        }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -top-24 left-[8%] w-[580px] h-[480px] rounded-full bg-gradient-to-br from-sky-400/25 via-blue-500/20 to-transparent blur-[80px]"
      />

      {/* 1B. Top-Right: Violet Purple Glow */}
      <motion.div
        animate={{
          x: [20, -35, 25, 20],
          y: [-10, 30, -15, -10],
          scale: [1, 1.1, 0.92, 1],
        }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -top-20 right-[6%] w-[600px] h-[500px] rounded-full bg-gradient-to-bl from-purple-500/20 via-indigo-400/15 to-transparent blur-[85px]"
      />

      {/* ── ZONE 2: HOW IT WORKS SECTION (~22% DOWN) ── */}
      {/* 2A. Right: Emerald Teal Glow */}
      <motion.div
        animate={{
          x: [-25, 30, -20, -25],
          y: [15, -25, 15, 15],
          scale: [0.95, 1.08, 0.95, 0.95],
        }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[20%] right-[10%] w-[540px] h-[460px] rounded-full bg-gradient-to-bl from-emerald-400/20 via-teal-400/15 to-transparent blur-[80px]"
      />

      {/* 2B. Left: Soft Sky Blue Tint */}
      <motion.div
        animate={{
          x: [20, -25, 15, 20],
          y: [-10, 20, -10, -10],
          scale: [1, 1.05, 0.95, 1],
        }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute top-[24%] left-[6%] w-[500px] h-[420px] rounded-full bg-gradient-to-tr from-sky-400/20 via-cyan-300/12 to-transparent blur-[75px]"
      />

      {/* ── ZONE 3: TOOLS SECTION (~42% DOWN) ── */}
      {/* 3A. Left: Violet Purple Tint */}
      <motion.div
        animate={{
          x: [-20, 25, -15, -20],
          y: [-15, 20, -10, -15],
          scale: [0.98, 1.08, 0.96, 0.98],
        }}
        transition={{ duration: 17, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[38%] left-[12%] w-[560px] h-[480px] rounded-full bg-gradient-to-br from-purple-500/18 via-indigo-400/14 to-transparent blur-[80px]"
      />

      {/* 3B. Right: Sky Blue Tint */}
      <motion.div
        animate={{
          x: [25, -30, 20, 25],
          y: [10, -20, 15, 10],
          scale: [1, 1.06, 0.94, 1],
        }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        className="absolute top-[42%] right-[8%] w-[520px] h-[440px] rounded-full bg-gradient-to-tl from-sky-400/20 via-blue-400/15 to-transparent blur-[75px]"
      />

      {/* ── ZONE 4: CATEGORIES SECTION (~62% DOWN) ── */}
      {/* 4A. Center-Left: Emerald Teal Green */}
      <motion.div
        animate={{
          x: [-20, 30, -15, -20],
          y: [15, -20, 10, 15],
          scale: [1, 1.08, 0.95, 1],
        }}
        transition={{ duration: 19, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[60%] left-[10%] w-[560px] h-[460px] rounded-full bg-gradient-to-tr from-emerald-400/18 via-teal-300/14 to-transparent blur-[80px]"
      />

      {/* 4B. Right: Violet Purple Sheen */}
      <motion.div
        animate={{
          x: [20, -25, 15, 20],
          y: [-10, 25, -15, -10],
          scale: [0.96, 1.06, 0.96, 0.96],
        }}
        transition={{ duration: 17, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute top-[64%] right-[10%] w-[540px] h-[450px] rounded-full bg-gradient-to-bl from-purple-500/18 via-indigo-400/12 to-transparent blur-[80px]"
      />

      {/* ── ZONE 5: FAQ & CTA SECTION (~82% DOWN TO BOTTOM) ── */}
      {/* 5A. Left: Sky Blue Sheen */}
      <motion.div
        animate={{
          x: [-25, 25, -20, -25],
          y: [-15, 20, -10, -15],
          scale: [1, 1.07, 0.95, 1],
        }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[80%] left-[8%] w-[580px] h-[480px] rounded-full bg-gradient-to-br from-sky-400/22 via-blue-500/15 to-transparent blur-[80px]"
      />

      {/* 5B. Center-Right: Emerald Teal Glow */}
      <motion.div
        animate={{
          x: [25, -30, 20, 25],
          y: [15, -25, 10, 15],
          scale: [0.95, 1.08, 0.95, 0.95],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        className="absolute top-[84%] right-[12%] w-[550px] h-[460px] rounded-full bg-gradient-to-tl from-emerald-400/18 via-teal-400/12 to-transparent blur-[85px]"
      />
    </div>
  );
}
