"use client";

import React, { useState, useEffect } from "react";
import { 
  FileText, Sparkles, Copy, Check, Download, 
  RefreshCw, Briefcase, UserCheck, Wand2
} from "lucide-react";

type LetterTone = "professional" | "confident" | "modern" | "executive";

interface CoverLetterForm {
  candidateName: string;
  candidateEmail: string;
  candidatePhone: string;
  candidateLocation: string;
  targetRole: string;
  targetCompany: string;
  hiringManager: string;
  tone: LetterTone;
  keyHighlights: string;
  jobDescription: string;
}

const SAMPLE_PRESETS: Record<string, Partial<CoverLetterForm>> = {
  swe: {
    targetRole: "Staff Software Engineer",
    targetCompany: "Stripe",
    hiringManager: "Infrastructure Engineering Team",
    tone: "confident",
    keyHighlights: "Spearheaded low-latency payment processing pipeline scaling to 45k req/sec with 99.999% SLA; reduced AWS spend by $320k/yr via Redis caching and gRPC migration.",
  },
  ai: {
    targetRole: "AI / ML Solutions Engineer",
    targetCompany: "Databricks",
    hiringManager: "Applied AI Hiring Committee",
    tone: "modern",
    keyHighlights: "Architected semantic vector search pipeline using pgvector and BGE embeddings, cutting query response times by 4x; fine-tuned LLaMA-3 models on enterprise proprietary data.",
  },
  product: {
    targetRole: "Lead Technical Product Manager",
    targetCompany: "Linear",
    hiringManager: "Product Leadership Team",
    tone: "executive",
    keyHighlights: "Led cross-functional team of 14 engineers to deliver enterprise workspace collaboration tools; accelerated user activation by 38% and reduced churn by 18%.",
  }
};

export default function CoverLetterPage() {
  const [formData, setFormData] = useState<CoverLetterForm>({
    candidateName: "Candidate",
    candidateEmail: "",
    candidatePhone: "",
    candidateLocation: "Bengaluru, India",
    targetRole: "Senior Software Engineer",
    targetCompany: "Google",
    hiringManager: "Engineering Hiring Team",
    tone: "professional",
    keyHighlights: "Architected high-throughput distributed systems scaling to 10k+ req/sec with 99.99% uptime SLA.",
    jobDescription: ""
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [generatedLetter, setGeneratedLetter] = useState<string>(() => generateLetterTemplate(formData));

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const profRaw = localStorage.getItem("getarole_profile");
        const userRaw = localStorage.getItem("getarole_user");
        if (profRaw) {
          const p = JSON.parse(profRaw);
          setFormData((prev) => {
            const updated = {
              ...prev,
              candidateName: p.name || prev.candidateName,
              candidateEmail: p.email || prev.candidateEmail,
              candidatePhone: p.phone || prev.candidatePhone,
              candidateLocation: p.location || p.city || prev.candidateLocation,
              targetRole: p.headline || prev.targetRole,
            };
            setGeneratedLetter(generateLetterTemplate(updated));
            return updated;
          });
        } else if (userRaw) {
          const u = JSON.parse(userRaw);
          if (u.displayName || u.name) {
            setFormData((prev) => {
              const updated = {
                ...prev,
                candidateName: u.displayName || u.name || prev.candidateName,
                candidateEmail: u.email || prev.candidateEmail,
              };
              setGeneratedLetter(generateLetterTemplate(updated));
              return updated;
            });
          }
        }

        if (typeof window !== "undefined") {
          const params = new URLSearchParams(window.location.search);
          const roleParam = params.get("role");
          const companyParam = params.get("company");
          if (roleParam || companyParam) {
            setFormData((prev) => {
              const updated = {
                ...prev,
                targetRole: roleParam || prev.targetRole,
                targetCompany: companyParam || prev.targetCompany,
              };
              setGeneratedLetter(generateLetterTemplate(updated));
              return updated;
            });
          }
        }
      } catch {}
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  function generateLetterTemplate(data: CoverLetterForm): string {
    const today = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
    const manager = data.hiringManager.trim() || "Hiring Team";
    const role = data.targetRole.trim() || "Software Engineer";
    const company = data.targetCompany.trim() || "your organization";

    const toneGreeting = `Dear ${manager},`;
    let introParagraph = `I am writing to express my enthusiastic interest in the ${role} position at ${company}. Having followed ${company}’s industry-defining contributions to modern technology, I am eager to bring my background in high-throughput distributed systems, clean architecture, and reliable engineering to your team.`;
    
    if (data.tone === "confident") {
      introParagraph = `I am writing to formally submit my candidacy for the ${role} role at ${company}. With a proven track record of shipping zero-downtime platforms and architecting scalable backend infrastructure, I am confident in my ability to deliver immediate, measurable impact to ${company}’s engineering milestones.`;
    } else if (data.tone === "modern") {
      introParagraph = `When I saw that ${company} was expanding its engineering team for the ${role} position, I immediately recognized a natural alignment. I have built my career at the intersection of rapid product velocity and resilient systems architecture, and I am excited about the opportunity to build the future alongside your team.`;
    } else if (data.tone === "executive") {
      introParagraph = `It is with great pleasure that I submit my application for the ${role} opportunity at ${company}. Throughout my career, I have prioritized operational excellence, strategic architectural alignment, and mentoring high-velocity engineering talent to consistently deliver mission-critical outcomes.`;
    }

    const highlights = data.keyHighlights.trim() 
      ? `In my previous work, ${data.keyHighlights.trim().replace(/\.$/, "")}. By pairing deep domain expertise with an obsessive focus on performance and reliability, I have consistently driven measurable improvements across system latency, developer ergonomics, and infrastructure efficiency.`
      : `Throughout my career, I have focused on solving complex distributed computing problems, optimizing database access patterns, and ensuring 99.99% availability for customer-facing systems.`;

    const closingParagraph = `What excites me most about ${company} is your commitment to uncompromising technical craftsmanship and forward-thinking innovation. I welcome the opportunity to discuss how my skill set and passion for robust engineering can support ${company}’s strategic roadmap.`;

    return `${today}\n\n${toneGreeting}\n\n${introParagraph}\n\n${highlights}\n\n${closingParagraph}\n\nSincerely,\n\n${data.candidateName}\n${data.candidateEmail} • ${data.candidatePhone}`;
  }

  async function handleGenerate() {
    setIsGenerating(true);
    // Simulate generation with intelligent tone adaptation
    await new Promise(r => setTimeout(r, 600));
    const newLetter = generateLetterTemplate(formData);
    setGeneratedLetter(newLetter);
    setIsGenerating(false);
  }

  function applyPreset(key: string) {
    const preset = SAMPLE_PRESETS[key];
    if (preset) {
      const updated = { ...formData, ...preset };
      setFormData(updated);
      setGeneratedLetter(generateLetterTemplate(updated));
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(generatedLetter);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleDownloadTxt() {
    const blob = new Blob([generatedLetter], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Cover_Letter_${formData.targetCompany.replace(/\s+/g, "_")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50/50 pt-6 pb-20 px-3 sm:px-6 lg:px-8 max-w-[1600px] mx-auto">
      
      {/* ── Top Header ── */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/80 backdrop-blur-md p-6 rounded-3xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 via-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-md shadow-indigo-200">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight font-outfit">
                  AI Cover Letter Architect
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/60 uppercase tracking-wider">
                  ATS Ready
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Generate tailored, high-impact cover letters optimized for technical hiring teams and modern ATS screeners.
              </p>
            </div>
          </div>

          {/* Quick Presets */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-slate-400 mr-1 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Presets:
            </span>
            <button
              onClick={() => applyPreset("swe")}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all"
            >
              Stripe SWE
            </button>
            <button
              onClick={() => applyPreset("ai")}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all"
            >
              Databricks AI
            </button>
            <button
              onClick={() => applyPreset("product")}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all"
            >
              Linear Lead
            </button>
          </div>
        </div>
      </div>

      {/* ── Two-Column Workspace ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* ── Left Column: Configuration Controls (5 cols) ── */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-indigo-600" /> Target Opportunity
              </h2>
              <span className="text-[11px] font-medium text-slate-400">Step 1 of 2</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Target Role *</label>
                <input
                  type="text"
                  value={formData.targetRole}
                  onChange={e => setFormData({ ...formData, targetRole: e.target.value })}
                  placeholder="e.g. Senior Backend Engineer"
                  className="w-full px-3.5 py-2.5 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Target Company *</label>
                <input
                  type="text"
                  value={formData.targetCompany}
                  onChange={e => setFormData({ ...formData, targetCompany: e.target.value })}
                  placeholder="e.g. Stripe, Postman"
                  className="w-full px-3.5 py-2.5 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Hiring Manager / Team (Optional)</label>
              <input
                type="text"
                value={formData.hiringManager}
                onChange={e => setFormData({ ...formData, hiringManager: e.target.value })}
                placeholder="e.g. Core Infrastructure Hiring Team"
                className="w-full px-3.5 py-2.5 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>

            {/* Tone Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2 flex items-center justify-between">
                <span>Narrative Tone</span>
                <span className="text-[10px] font-normal text-slate-400 capitalize">{formData.tone}</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: "professional", label: "Professional", desc: "Balanced & formal" },
                  { id: "confident", label: "Confident", desc: "Results & metrics heavy" },
                  { id: "modern", label: "Modern Startup", desc: "Agile & visionary" },
                  { id: "executive", label: "Executive", desc: "Strategic & leadership" }
                ].map(t => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, tone: t.id as LetterTone })}
                    className={`p-2.5 text-left rounded-xl border transition-all ${
                      formData.tone === t.id
                        ? "bg-indigo-50/80 border-indigo-300 text-indigo-900 shadow-2xs"
                        : "bg-slate-50/60 border-slate-200/70 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <div className="text-xs font-bold">{t.label}</div>
                    <div className="text-[10px] text-slate-400">{t.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Key Achievements */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Key Accomplishments to Highlight
              </label>
              <textarea
                rows={4}
                value={formData.keyHighlights}
                onChange={e => setFormData({ ...formData, keyHighlights: e.target.value })}
                placeholder="Paste notable achievements, metrics, latency numbers, or technologies you used..."
                className="w-full p-3 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all leading-relaxed"
              />
            </div>

            {/* Candidate Info */}
            <div className="border-t border-slate-100 pt-4">
              <h3 className="text-xs font-bold text-slate-700 mb-3 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-slate-500" /> Sender Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  value={formData.candidateName}
                  onChange={e => setFormData({ ...formData, candidateName: e.target.value })}
                  placeholder="Your Full Name"
                  className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none"
                />
                <input
                  type="email"
                  value={formData.candidateEmail}
                  onChange={e => setFormData({ ...formData, candidateEmail: e.target.value })}
                  placeholder="Your Email"
                  className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            {/* Generate Action */}
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white rounded-xl font-bold text-xs shadow-md shadow-indigo-200/50 flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99]"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Synthesizing Cover Letter...</span>
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4" />
                  <span>Generate Tailored Cover Letter</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* ── Right Column: Document Preview (7 cols) ── */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Action Toolbar */}
          <div className="flex items-center justify-between bg-white px-5 py-3 rounded-2xl border border-slate-200/80 shadow-2xs">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
              <span>Live ATS Document Preview</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                title="Copy plain text"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-600 font-bold">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                    <span>Copy Text</span>
                  </>
                )}
              </button>

              <button
                onClick={handleDownloadTxt}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 border border-indigo-100 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export .TXT</span>
              </button>
            </div>
          </div>

          {/* Realistic A4 Paper Sheet */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-lg shadow-slate-200/40 p-8 sm:p-12 min-h-[750px] relative font-sans text-slate-800 leading-relaxed text-sm">
            {/* Header / Contact Banner */}
            <div className="border-b border-slate-200 pb-6 mb-8">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight font-outfit uppercase">
                {formData.candidateName}
              </h2>
              <div className="flex items-center gap-3 text-xs text-slate-500 mt-2 flex-wrap font-medium">
                <span>{formData.candidateEmail}</span>
                <span>•</span>
                <span>{formData.candidatePhone}</span>
                <span>•</span>
                <span>{formData.candidateLocation}</span>
              </div>
            </div>

            {/* Recipient Block */}
            <div className="mb-8 text-xs text-slate-600 space-y-1">
              <div className="font-bold text-slate-900">{formData.hiringManager || "Hiring Team"}</div>
              <div className="font-semibold text-indigo-700">{formData.targetCompany}</div>
              <div className="text-slate-400">Application for {formData.targetRole}</div>
            </div>

            {/* Editable / Live Formatted Body */}
            <div className="prose prose-slate max-w-none">
              <textarea
                value={generatedLetter}
                onChange={e => setGeneratedLetter(e.target.value)}
                rows={18}
                className="w-full bg-transparent border-none focus:outline-none focus:ring-0 text-slate-700 text-sm leading-relaxed resize-none font-sans"
              />
            </div>

            {/* Professional Footer Signoff */}
            <div className="mt-10 pt-6 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
              <span>Tailored via getArole AI Architect</span>
              <span>100% ATS Lexical Compatible</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
