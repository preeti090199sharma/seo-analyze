"use client";

import { useState, useCallback } from "react";
import type { AnalysisResult, CategoryResult, Check } from "@/lib/analyzer";

// ─── Score Circle Component ──────────────────────────────────────────────────

function ScoreCircle({ score, size = 160 }: { score: number; size?: number }) {
  const radius = (size - 16) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const color =
    score >= 80
      ? "stroke-emerald-400"
      : score >= 50
        ? "stroke-amber-400"
        : "stroke-red-400";

  const textColor =
    score >= 80
      ? "text-emerald-400"
      : score >= 50
        ? "text-amber-400"
        : "text-red-400";

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.05)"
          strokeWidth="8"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          className={`${color} animate-score-fill`}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={
            {
              "--score-offset": offset,
              transition: "stroke-dashoffset 1.5s ease-out",
            } as React.CSSProperties
          }
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className={`text-5xl font-bold ${textColor}`}>{score}</span>
        <span className="text-sm text-slate-400 mt-1">/ 100</span>
      </div>
    </div>
  );
}

// ─── Status Badge ────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: Check["status"] }) {
  const styles = {
    pass: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    fail: "bg-red-500/20 text-red-400 border-red-500/30",
    warning: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  };
  const labels = { pass: "PASS", fail: "FAIL", warning: "WARNING" };

  return (
    <span
      className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold border ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}

// ─── Category Card ───────────────────────────────────────────────────────────

function CategoryCard({
  category,
  isExpanded,
  onToggle,
}: {
  category: CategoryResult;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const scoreColor =
    category.score >= 80
      ? "text-emerald-400"
      : category.score >= 50
        ? "text-amber-400"
        : "text-red-400";

  const barColor =
    category.score >= 80
      ? "bg-emerald-400"
      : category.score >= 50
        ? "bg-amber-400"
        : "bg-red-400";

  return (
    <div className="glass rounded-xl overflow-hidden animate-fade-in">
      <button
        onClick={onToggle}
        className="w-full p-5 flex items-center justify-between hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">{category.icon}</span>
          <div className="text-left">
            <h3 className="text-base font-semibold text-white">
              {category.name}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-24 h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${barColor} transition-all duration-1000`}
                  style={{ width: `${category.score}%` }}
                />
              </div>
              <span className="text-xs text-slate-400">
                {category.checks.filter((c) => c.status === "pass").length}/
                {category.checks.length} passed
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-2xl font-bold ${scoreColor}`}>
            {category.score}
          </span>
          <svg
            className={`w-5 h-5 text-slate-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </button>

      {isExpanded && (
        <div className="border-t border-white/5 divide-y divide-white/5">
          {category.checks.map((check, i) => (
            <div
              key={i}
              className="px-5 py-3 flex flex-col sm:flex-row sm:items-start gap-2"
            >
              <div className="flex items-center gap-2 sm:w-32 shrink-0">
                <StatusBadge status={check.status} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white">{check.name}</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {check.message}
                </p>
                {check.value && (
                  <p className="text-xs text-indigo-300 mt-1 font-mono truncate">
                    {check.value}
                  </p>
                )}
                {check.recommendation && (
                  <p className="text-xs text-amber-300/80 mt-1 italic">
                    → {check.recommendation}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Loading Component ───────────────────────────────────────────────────────

function LoadingView({ url }: { url: string }) {
  const steps = [
    "Connecting to website...",
    "Crawling HTML content...",
    "Analyzing meta tags...",
    "Checking headings & structure...",
    "Scanning images & alt texts...",
    "Analyzing links...",
    "Checking technical SEO...",
    "Checking social tags...",
    "Analyzing security...",
    "Generating report...",
  ];

  const [currentStep, setCurrentStep] = useState(0);

  useState(() => {
    let step = 0;
    const interval = setInterval(() => {
      step++;
      if (step < steps.length) {
        setCurrentStep(step);
      } else {
        clearInterval(interval);
      }
    }, 1200);
    return () => clearInterval(interval);
  });

  return (
    <div className="max-w-lg mx-auto text-center py-20">
      <div className="flex justify-center mb-8">
        <div className="w-16 h-16 border-4 border-indigo-500/30 border-t-indigo-400 rounded-full animate-spin" />
      </div>
      <h2 className="text-xl font-semibold text-white mb-2">
        Analyzing your website
      </h2>
      <p className="text-slate-400 text-sm mb-8 font-mono">{url}</p>
      <div className="space-y-3 text-left glass rounded-xl p-6">
        {steps.map((step, i) => (
          <div key={i} className="flex items-center gap-3">
            {i < currentStep ? (
              <svg
                className="w-5 h-5 text-emerald-400 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            ) : i === currentStep ? (
              <div className="w-5 h-5 shrink-0 flex items-center justify-center">
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse" />
              </div>
            ) : (
              <div className="w-5 h-5 shrink-0 flex items-center justify-center">
                <div className="w-2 h-2 bg-slate-600 rounded-full" />
              </div>
            )}
            <span
              className={`text-sm ${
                i < currentStep
                  ? "text-slate-300"
                  : i === currentStep
                    ? "text-white font-medium"
                    : "text-slate-600"
              }`}
            >
              {step}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function Home() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState("");
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set()
  );
  const [pdfLoading, setPdfLoading] = useState(false);

  const toggleCategory = useCallback((name: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }, []);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setResult(null);
    setError("");
    setExpandedCategories(new Set());

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong");
        return;
      }

      setResult(data);

      const failedCategories = Object.entries(data.categories)
        .filter(
          ([, cat]) => (cat as CategoryResult).score < 80
        )
        .map(([key]) => (data.categories as Record<string, CategoryResult>)[key].name);
      setExpandedCategories(new Set(failedCategories));
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!result) return;
    setPdfLoading(true);
    try {
      const { generatePDF } = await import("@/lib/pdf");
      const doc = generatePDF(result);
      const filename = `seo-report-${new URL(result.url).hostname}-${new Date().toISOString().slice(0, 10)}.pdf`;
      doc.save(filename);
    } catch (err) {
      console.error("PDF generation failed:", err);
      alert("PDF generation failed. Please try again.");
    } finally {
      setPdfLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Hero / Input Section */}
        {!result && !loading && (
          <div className="text-center py-16 animate-fade-in">
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
              Analyze Your Website&apos;s{" "}
              <span className="gradient-text">SEO</span>
            </h1>
            <p className="text-slate-400 text-lg mb-10 max-w-2xl mx-auto">
              Enter any URL and get a comprehensive SEO audit with detailed
              findings, scores, and a downloadable PDF report — completely free.
            </p>

            <form
              onSubmit={handleAnalyze}
              className="max-w-2xl mx-auto flex flex-col sm:flex-row gap-3"
            >
              <div className="flex-1 relative">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                  <svg
                    className="w-5 h-5 text-slate-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
                    />
                  </svg>
                </div>
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="Enter website URL (e.g. example.com)"
                  className="w-full pl-12 pr-4 py-4 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-base"
                  required
                />
              </div>
              <button
                type="submit"
                className="px-8 py-4 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold rounded-xl transition-all hover:shadow-lg hover:shadow-indigo-500/25 active:scale-[0.98]"
              >
                Analyze SEO
              </button>
            </form>

            {error && (
              <div className="mt-6 max-w-2xl mx-auto p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Features Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-16 max-w-4xl mx-auto">
              {[
                {
                  icon: "🔍",
                  title: "Deep Crawl",
                  desc: "Scans meta tags, headings, images, links, and more",
                },
                {
                  icon: "📊",
                  title: "Detailed Score",
                  desc: "Get scores for 8 SEO categories with actionable tips",
                },
                {
                  icon: "📄",
                  title: "PDF Report",
                  desc: "Download a professional PDF report to share with clients",
                },
              ].map((f) => (
                <div key={f.title} className="glass-light rounded-xl p-6 text-center">
                  <span className="text-3xl">{f.icon}</span>
                  <h3 className="text-white font-semibold mt-3">{f.title}</h3>
                  <p className="text-slate-400 text-sm mt-1">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && <LoadingView url={url} />}

        {/* Results */}
        {result && !loading && (
          <div className="animate-fade-in">
            {/* Top Bar: Score + URL + PDF Button */}
            <div className="glass rounded-2xl p-8 mb-8 glow">
              <div className="flex flex-col lg:flex-row items-center gap-8">
                <ScoreCircle score={result.score} />
                <div className="flex-1 text-center lg:text-left">
                  <h2 className="text-2xl font-bold text-white mb-1">
                    {result.pageTitle}
                  </h2>
                  <p className="text-indigo-300 text-sm font-mono mb-4">
                    {result.url}
                  </p>
                  <div className="flex flex-wrap justify-center lg:justify-start gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-emerald-400" />
                      <span className="text-sm text-slate-300">
                        {result.summary.passed} Passed
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-amber-400" />
                      <span className="text-sm text-slate-300">
                        {result.summary.warnings} Warnings
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-400" />
                      <span className="text-sm text-slate-300">
                        {result.summary.failed} Failed
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleDownloadPDF}
                  disabled={pdfLoading}
                  className="flex items-center gap-2 px-6 py-3 bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-800 text-white font-semibold rounded-xl transition-all hover:shadow-lg hover:shadow-indigo-500/25 active:scale-[0.98] shrink-0"
                >
                  {pdfLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  )}
                  Download PDF Report
                </button>
              </div>
            </div>

            {/* Critical Issues Alert */}
            {result.summary.criticalIssues.length > 0 && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-5 mb-6">
                <h3 className="text-red-400 font-semibold flex items-center gap-2 mb-3">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                    />
                  </svg>
                  Critical Issues Found ({result.summary.criticalIssues.length})
                </h3>
                <ul className="space-y-1">
                  {result.summary.criticalIssues.map((issue, i) => (
                    <li
                      key={i}
                      className="text-sm text-red-300 flex items-start gap-2"
                    >
                      <span className="mt-0.5">•</span>
                      {issue}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Category Scores Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
              {Object.values(result.categories).map((cat) => {
                const color =
                  cat.score >= 80
                    ? "text-emerald-400"
                    : cat.score >= 50
                      ? "text-amber-400"
                      : "text-red-400";
                return (
                  <button
                    key={cat.name}
                    onClick={() => toggleCategory(cat.name)}
                    className="glass-light rounded-xl p-4 text-center hover:bg-white/5 transition-colors"
                  >
                    <span className="text-2xl">{cat.icon}</span>
                    <p className={`text-2xl font-bold mt-1 ${color}`}>
                      {cat.score}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">{cat.name}</p>
                  </button>
                );
              })}
            </div>

            {/* Detailed Categories */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">
                  Detailed Analysis
                </h3>
                <button
                  onClick={() => {
                    const allNames = Object.values(result.categories).map(
                      (c) => c.name
                    );
                    setExpandedCategories((prev) =>
                      prev.size === allNames.length
                        ? new Set()
                        : new Set(allNames)
                    );
                  }}
                  className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  {expandedCategories.size ===
                  Object.values(result.categories).length
                    ? "Collapse All"
                    : "Expand All"}
                </button>
              </div>
              {Object.values(result.categories).map((cat) => (
                <CategoryCard
                  key={cat.name}
                  category={cat}
                  isExpanded={expandedCategories.has(cat.name)}
                  onToggle={() => toggleCategory(cat.name)}
                />
              ))}
            </div>

            {/* Footer Actions */}
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={handleDownloadPDF}
                disabled={pdfLoading}
                className="flex items-center gap-2 px-8 py-3 bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-800 text-white font-semibold rounded-xl transition-all"
              >
                {pdfLoading ? "Generating..." : "Download Full PDF Report"}
              </button>
              <button
                onClick={() => {
                  setResult(null);
                  setUrl("");
                }}
                className="text-slate-400 hover:text-white text-sm transition-colors"
              >
                Analyze Another Website
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 mt-20">
        <div className="max-w-6xl mx-auto px-4 py-6 text-center">
          <p className="text-slate-500 text-sm">
            SEO Analyzer Pro — Free, open-source SEO audit tool
          </p>
        </div>
      </footer>
    </div>
  );
}
