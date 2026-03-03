"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type { AnalysisResult, CategoryResult, Check } from "@/lib/analyzer";

// ─── Score Circle ─────────────────────────────────────────────────────────────

function ScoreCircle({ score, size = 160 }: { score: number; size?: number }) {
  const radius = (size - 16) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const color =
    score >= 80 ? "stroke-emerald-400" : score >= 50 ? "stroke-amber-400" : "stroke-red-400";
  const textColor =
    score >= 80 ? "text-emerald-400" : score >= 50 ? "text-amber-400" : "text-red-400";
  const label =
    score >= 80 ? "Good" : score >= 50 ? "Needs Work" : "Poor";

  return (
    <div className="relative inline-flex flex-col items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
        <circle
          cx={size / 2} cy={size / 2} r={radius} fill="none"
          className={`${color} animate-score-fill`}
          strokeWidth="8" strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ "--score-offset": offset, transition: "stroke-dashoffset 1.5s ease-out" } as React.CSSProperties}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className={`text-5xl font-bold ${textColor}`}>{score}</span>
        <span className="text-sm text-slate-400 mt-1">/ 100</span>
      </div>
      <span className={`text-xs font-semibold mt-1 ${textColor}`}>{label}</span>
    </div>
  );
}

// ─── Priority Badge ───────────────────────────────────────────────────────────

function PriorityBadge({ priority }: { priority: Check["priority"] }) {
  const styles: Record<Check["priority"], string> = {
    critical: "bg-red-500/20 text-red-400 border-red-500/30",
    high: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    medium: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    low: "bg-slate-500/20 text-slate-400 border-slate-500/30",
  };
  return (
    <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wide ${styles[priority]}`}>
      {priority}
    </span>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: Check["status"] }) {
  const styles = {
    pass: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    fail: "bg-red-500/20 text-red-400 border-red-500/30",
    warning: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  };
  const labels = { pass: "PASS", fail: "FAIL", warning: "WARN" };
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold border ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}

// ─── Top Actions Panel ───────────────────────────────────────────────────────

function TopActionsPanel({ categories }: { categories: AnalysisResult["categories"] }) {
  const [expandedFix, setExpandedFix] = useState<string | null>(null);

  const priorityOrder: Record<Check["priority"], number> = {
    critical: 0, high: 1, medium: 2, low: 3,
  };

  const actionItems: Array<{ check: Check; category: CategoryResult }> = [];
  for (const cat of Object.values(categories)) {
    for (const check of cat.checks) {
      if (check.status !== "pass") {
        actionItems.push({ check, category: cat });
      }
    }
  }

  actionItems.sort((a, b) => {
    const pd = priorityOrder[a.check.priority] - priorityOrder[b.check.priority];
    if (pd !== 0) return pd;
    if (a.check.status === "fail" && b.check.status !== "fail") return -1;
    if (b.check.status === "fail" && a.check.status !== "fail") return 1;
    return 0;
  });

  const top = actionItems.slice(0, 6);
  if (top.length === 0) return null;

  return (
    <div className="glass rounded-2xl p-6 mb-6 animate-fade-in">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl">🎯</span>
        <h3 className="text-lg font-bold text-white">Top Improvements</h3>
        <span className="text-xs text-slate-400 ml-auto">sorted by impact</span>
      </div>
      <div className="space-y-3">
        {top.map((item, i) => {
          const fixKey = `${item.category.name}-${item.check.name}`;
          const isOpen = expandedFix === fixKey;
          return (
            <div key={i} className="bg-white/5 rounded-xl p-4 border border-white/5">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <StatusBadge status={item.check.status} />
                <PriorityBadge priority={item.check.priority} />
                <span className="text-xs text-slate-400">{item.category.icon} {item.category.name}</span>
                <span className="text-sm font-semibold text-white ml-1">{item.check.name}</span>
              </div>
              <p className="text-xs text-slate-300 mt-1">{item.check.message}</p>
              {item.check.recommendation && (
                <p className="text-xs text-amber-300/80 mt-1 italic">→ {item.check.recommendation}</p>
              )}
              {item.check.fix && (
                <div className="mt-2">
                  <button
                    onClick={() => setExpandedFix(isOpen ? null : fixKey)}
                    className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                  >
                    {isOpen ? "Hide fix ▲" : "Show fix ▼"}
                  </button>
                  {isOpen && (
                    <pre className="mt-2 text-xs bg-slate-900/80 text-emerald-300 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap font-mono border border-white/10">
                      {item.check.fix}
                    </pre>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
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
    category.score >= 80 ? "text-emerald-400" : category.score >= 50 ? "text-amber-400" : "text-red-400";
  const barColor =
    category.score >= 80 ? "bg-emerald-400" : category.score >= 50 ? "bg-amber-400" : "bg-red-400";

  return (
    <div className="glass rounded-xl overflow-hidden animate-fade-in">
      <button
        onClick={onToggle}
        className="w-full p-5 flex items-center justify-between hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">{category.icon}</span>
          <div className="text-left">
            <h3 className="text-base font-semibold text-white">{category.name}</h3>
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
          <span className={`text-2xl font-bold ${scoreColor}`}>{category.score}</span>
          <svg
            className={`w-5 h-5 text-slate-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {isExpanded && (
        <div className="border-t border-white/5 divide-y divide-white/5">
          {category.checks.map((check, i) => (
            <CheckRow key={i} check={check} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Check Row ────────────────────────────────────────────────────────────────

function CheckRow({ check }: { check: Check }) {
  const [showFix, setShowFix] = useState(false);

  return (
    <div className="px-5 py-3 flex flex-col sm:flex-row sm:items-start gap-2">
      <div className="flex items-center gap-2 sm:w-44 shrink-0">
        <StatusBadge status={check.status} />
        <PriorityBadge priority={check.priority} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white">{check.name}</p>
        <p className="text-xs text-slate-400 mt-0.5">{check.message}</p>
        {check.value && (
          <p className="text-xs text-indigo-300 mt-1 font-mono truncate">{check.value}</p>
        )}
        {check.recommendation && (
          <p className="text-xs text-amber-300/80 mt-1 italic">→ {check.recommendation}</p>
        )}
        {check.fix && (
          <div className="mt-1.5">
            <button
              onClick={() => setShowFix((v) => !v)}
              className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              {showFix ? "Hide fix ▲" : "Show fix ▼"}
            </button>
            {showFix && (
              <pre className="mt-2 text-xs bg-slate-900/80 text-emerald-300 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap font-mono border border-white/10">
                {check.fix}
              </pre>
            )}
          </div>
        )}
      </div>
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
    "Checking broken links...",
    "Analyzing performance...",
    "Checking social tags...",
    "Analyzing security headers...",
    "Generating weighted score...",
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
    }, 1400);
    return () => clearInterval(interval);
  });

  return (
    <div className="max-w-lg mx-auto text-center py-20">
      <div className="flex justify-center mb-8">
        <div className="w-16 h-16 border-4 border-indigo-500/30 border-t-indigo-400 rounded-full animate-spin" />
      </div>
      <h2 className="text-xl font-semibold text-white mb-2">Analyzing your website</h2>
      <p className="text-slate-400 text-sm mb-8 font-mono">{url}</p>
      <div className="space-y-3 text-left glass rounded-xl p-6">
        {steps.map((step, i) => (
          <div key={i} className="flex items-center gap-3">
            {i < currentStep ? (
              <svg className="w-5 h-5 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
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
            <span className={`text-sm ${i < currentStep ? "text-slate-300" : i === currentStep ? "text-white font-medium" : "text-slate-600"}`}>
              {step}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── History Item Type ────────────────────────────────────────────────────────

interface HistoryItem {
  url: string;
  score: number;
  pageTitle: string;
  date: string;
}

// ─── History Panel ────────────────────────────────────────────────────────────

function HistoryPanel({
  history,
  onSelect,
  onClear,
}: {
  history: HistoryItem[];
  onSelect: (url: string) => void;
  onClear: () => void;
}) {
  if (history.length === 0) return null;
  return (
    <div className="mt-8 max-w-2xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-400">Recent Analyses</h3>
        <button onClick={onClear} className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
          Clear history
        </button>
      </div>
      <div className="space-y-2">
        {history.map((item, i) => {
          const color = item.score >= 80 ? "text-emerald-400" : item.score >= 50 ? "text-amber-400" : "text-red-400";
          return (
            <button
              key={i}
              onClick={() => onSelect(item.url)}
              className="w-full glass-light rounded-xl px-4 py-3 flex items-center gap-3 hover:bg-white/5 transition-colors text-left"
            >
              <span className={`text-lg font-bold ${color} shrink-0 w-8 text-center`}>{item.score}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white truncate">{item.pageTitle || item.url}</p>
                <p className="text-xs text-slate-500 truncate font-mono">{item.url}</p>
              </div>
              <span className="text-xs text-slate-600 shrink-0">{new Date(item.date).toLocaleDateString()}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Score Comparison Bar ─────────────────────────────────────────────────────

function CompareBar({ label, score, isLeft }: { label: string; score: number; isLeft: boolean }) {
  const color = score >= 80 ? "bg-emerald-400" : score >= 50 ? "bg-amber-400" : "bg-red-400";
  const textColor = score >= 80 ? "text-emerald-400" : score >= 50 ? "text-amber-400" : "text-red-400";
  return (
    <div className={`flex flex-col ${isLeft ? "items-end" : "items-start"} gap-1`}>
      <span className="text-xs text-slate-400 truncate max-w-[120px]">{label}</span>
      <span className={`text-2xl font-bold ${textColor}`}>{score}</span>
      <div className={`flex items-center gap-1 ${isLeft ? "flex-row-reverse" : "flex-row"}`}>
        <div className="w-24 h-2 bg-white/10 rounded-full overflow-hidden">
          <div className={`h-full rounded-full ${color} transition-all duration-1000`} style={{ width: `${score}%` }} />
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Home() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState("");
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [pdfLoading, setPdfLoading] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [shareCopied, setShareCopied] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const [compareUrl, setCompareUrl] = useState("");
  const [compareResult, setCompareResult] = useState<AnalysisResult | null>(null);
  const [compareLoading, setCompareLoading] = useState(false);
  const [compareError, setCompareError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const toggleCategory = useCallback((name: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }, []);

  // Load history from localStorage and handle share URL on mount
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("seo-history") || "[]");
      setHistory(saved);
    } catch { /* ignore */ }

    const params = new URLSearchParams(window.location.search);
    const sharedUrl = params.get("url");
    if (sharedUrl) {
      setUrl(sharedUrl);
      runAnalysis(sharedUrl);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveToHistory = (data: AnalysisResult) => {
    try {
      const item: HistoryItem = {
        url: data.url,
        score: data.score,
        pageTitle: data.pageTitle,
        date: data.analyzedAt,
      };
      setHistory((prev) => {
        const updated = [item, ...prev.filter((h) => h.url !== data.url)].slice(0, 10);
        localStorage.setItem("seo-history", JSON.stringify(updated));
        return updated;
      });
    } catch { /* ignore */ }
  };

  const runAnalysis = async (targetUrl: string) => {
    if (!targetUrl.trim()) return;
    setLoading(true);
    setResult(null);
    setError("");
    setExpandedCategories(new Set());

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: targetUrl.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong");
        return;
      }
      setResult(data);
      saveToHistory(data);
      // Auto-expand categories with score < 80
      const failedCats = Object.entries(data.categories)
        .filter(([, cat]) => (cat as CategoryResult).score < 80)
        .map(([, cat]) => (cat as CategoryResult).name);
      setExpandedCategories(new Set(failedCats));
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const runCompareAnalysis = async (targetUrl: string) => {
    if (!targetUrl.trim()) return;
    setCompareLoading(true);
    setCompareResult(null);
    setCompareError("");
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: targetUrl.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCompareError(data.error || "Something went wrong");
        return;
      }
      setCompareResult(data);
    } catch {
      setCompareError("Network error. Please check your connection.");
    } finally {
      setCompareLoading(false);
    }
  };

  const handleAnalyze = (e: React.FormEvent) => {
    e.preventDefault();
    runAnalysis(url);
  };

  const handleReAnalyze = () => {
    runAnalysis(url);
  };

  const handleAnalyzeAnother = () => {
    setResult(null);
    setCompareResult(null);
    setUrl("");
    setCompareUrl("");
    setCompareMode(false);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleShare = () => {
    if (!result) return;
    const shareLink = `${window.location.origin}?url=${encodeURIComponent(result.url)}`;
    navigator.clipboard.writeText(shareLink).then(() => {
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2500);
    }).catch(() => {
      prompt("Copy this link to share:", shareLink);
    });
  };

  const handleClearHistory = () => {
    localStorage.removeItem("seo-history");
    setHistory([]);
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
              Analyze Your Website&apos;s <span className="gradient-text">SEO</span>
            </h1>
            <p className="text-slate-400 text-lg mb-10 max-w-2xl mx-auto">
              Get a comprehensive SEO audit with 40+ checks, weighted scoring, Core Web Vitals,
              broken link detection, and a downloadable PDF report — completely free.
            </p>

            <form onSubmit={handleAnalyze} className="max-w-2xl mx-auto flex flex-col gap-3">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                    </svg>
                  </div>
                  <input
                    ref={inputRef}
                    type="text"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder={compareMode ? "Your website URL (e.g. yoursite.com)" : "Enter website URL (e.g. example.com)"}
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
              </div>

              {/* Competitor comparison second input */}
              {compareMode && (
                <div className="flex flex-col sm:flex-row gap-3 animate-fade-in">
                  <div className="flex-1 relative">
                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      value={compareUrl}
                      onChange={(e) => setCompareUrl(e.target.value)}
                      placeholder="Competitor URL (e.g. competitor.com)"
                      className="w-full pl-12 pr-4 py-4 bg-slate-800/80 border border-orange-500/40 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-base"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => compareUrl && runCompareAnalysis(compareUrl)}
                    disabled={compareLoading}
                    className="px-6 py-4 bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/40 text-orange-300 font-semibold rounded-xl transition-all"
                  >
                    {compareLoading ? "Analyzing..." : "Compare"}
                  </button>
                </div>
              )}

              {/* Compare toggle */}
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={() => { setCompareMode(!compareMode); setCompareResult(null); setCompareError(""); }}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${compareMode ? "bg-orange-500/20 border-orange-500/40 text-orange-300" : "border-slate-700 text-slate-500 hover:text-slate-300 hover:border-slate-500"}`}
                >
                  {compareMode ? "✕ Cancel Comparison" : "+ Compare with Competitor"}
                </button>
              </div>
            </form>

            {error && (
              <div className="mt-6 max-w-2xl mx-auto p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
                {error}
              </div>
            )}
            {compareError && (
              <div className="mt-3 max-w-2xl mx-auto p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
                Competitor: {compareError}
              </div>
            )}

            {/* Analysis History */}
            <HistoryPanel
              history={history}
              onSelect={(u) => { setUrl(u); runAnalysis(u); }}
              onClear={handleClearHistory}
            />

            {/* Features Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mt-10 max-w-4xl mx-auto">
              {[
                { icon: "🔍", title: "40+ Checks", desc: "Meta, headings, images, links, technical, security & more" },
                { icon: "⚡", title: "Core Web Vitals", desc: "Real LCP, CLS, TBT from Google PageSpeed Insights" },
                { icon: "🎯", title: "Priority Actions", desc: "Ranked fixes sorted by SEO impact — know what to fix first" },
                { icon: "📄", title: "PDF Report", desc: "Professional report with action plan, ready to share with clients" },
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
            {/* Top Bar: Score + URL + Buttons */}
            <div className="glass rounded-2xl p-8 mb-6 glow">
              <div className="flex flex-col lg:flex-row items-center gap-8">
                <ScoreCircle score={result.score} />
                <div className="flex-1 text-center lg:text-left">
                  <h2 className="text-2xl font-bold text-white mb-1">{result.pageTitle}</h2>
                  <p className="text-indigo-300 text-sm font-mono mb-1">{result.url}</p>
                  <p className="text-slate-500 text-xs mb-4">
                    Analyzed {new Date(result.analyzedAt).toLocaleString()}
                    {result.summary.pageSpeedAvailable && (
                      <span className="ml-2 text-indigo-400">⚡ Core Web Vitals included</span>
                    )}
                  </p>
                  <div className="flex flex-wrap justify-center lg:justify-start gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-emerald-400" />
                      <span className="text-sm text-slate-300">{result.summary.passed} Passed</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-amber-400" />
                      <span className="text-sm text-slate-300">{result.summary.warnings} Warnings</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-400" />
                      <span className="text-sm text-slate-300">{result.summary.failed} Failed</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-3 shrink-0">
                  <button
                    onClick={handleDownloadPDF}
                    disabled={pdfLoading}
                    className="flex items-center gap-2 px-6 py-3 bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-800 text-white font-semibold rounded-xl transition-all hover:shadow-lg hover:shadow-indigo-500/25 active:scale-[0.98]"
                  >
                    {pdfLoading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    )}
                    Download PDF Report
                  </button>
                  <button
                    onClick={handleReAnalyze}
                    className="flex items-center gap-2 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-xl transition-all active:scale-[0.98]"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Re-analyze
                  </button>
                  <button
                    onClick={handleShare}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all active:scale-[0.98] ${shareCopied ? "bg-emerald-600 text-white" : "bg-slate-700 hover:bg-slate-600 text-white"}`}
                  >
                    {shareCopied ? (
                      <>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Link Copied!
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                        </svg>
                        Share Results
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Competitor Comparison Panel */}
            {compareMode && (
              <div className="glass rounded-2xl p-6 mb-6 animate-fade-in">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-white">Competitor Comparison</h3>
                  {!compareResult && !compareLoading && (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={compareUrl}
                        onChange={(e) => setCompareUrl(e.target.value)}
                        placeholder="Enter competitor URL..."
                        className="px-3 py-2 bg-slate-800/80 border border-orange-500/40 rounded-lg text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500"
                        onKeyDown={(e) => e.key === "Enter" && compareUrl && runCompareAnalysis(compareUrl)}
                      />
                      <button
                        onClick={() => compareUrl && runCompareAnalysis(compareUrl)}
                        disabled={compareLoading}
                        className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-lg transition-all"
                      >
                        Analyze
                      </button>
                    </div>
                  )}
                </div>

                {compareLoading && (
                  <div className="text-center py-8 text-slate-400 text-sm">
                    <div className="w-8 h-8 border-2 border-orange-500/30 border-t-orange-400 rounded-full animate-spin mx-auto mb-3" />
                    Analyzing competitor...
                  </div>
                )}

                {compareError && (
                  <p className="text-red-400 text-sm">{compareError}</p>
                )}

                {compareResult && (
                  <div className="space-y-4">
                    {/* Score comparison */}
                    <div className="flex items-center gap-4">
                      <CompareBar label={new URL(result.url).hostname} score={result.score} isLeft={true} />
                      <div className="flex-1 text-center">
                        <p className="text-xs text-slate-500 mb-1">vs</p>
                        <p className={`text-sm font-bold ${result.score > compareResult.score ? "text-emerald-400" : result.score < compareResult.score ? "text-red-400" : "text-slate-400"}`}>
                          {result.score > compareResult.score ? `+${result.score - compareResult.score} ahead` : result.score < compareResult.score ? `${result.score - compareResult.score} behind` : "Tied"}
                        </p>
                      </div>
                      <CompareBar label={new URL(compareResult.url).hostname} score={compareResult.score} isLeft={false} />
                    </div>

                    {/* Category comparison */}
                    <div className="space-y-2">
                      {Object.entries(result.categories).map(([key, cat]) => {
                        const compCat = compareResult.categories[key as keyof typeof compareResult.categories];
                        if (!compCat) return null;
                        const diff = cat.score - compCat.score;
                        const diffColor = diff > 0 ? "text-emerald-400" : diff < 0 ? "text-red-400" : "text-slate-500";
                        return (
                          <div key={key} className="flex items-center gap-3 text-sm">
                            <span className="text-base shrink-0">{cat.icon}</span>
                            <span className="text-slate-400 w-20 shrink-0 text-xs truncate">{cat.name}</span>
                            <div className="flex-1 flex items-center gap-2">
                              <span className={`w-8 text-right text-xs font-bold ${cat.score >= 80 ? "text-emerald-400" : cat.score >= 50 ? "text-amber-400" : "text-red-400"}`}>{cat.score}</span>
                              <div className="flex-1 h-1.5 bg-white/10 rounded-full relative">
                                <div className={`absolute left-0 h-full rounded-full ${cat.score >= 80 ? "bg-emerald-400" : cat.score >= 50 ? "bg-amber-400" : "bg-red-400"}`} style={{ width: `${cat.score}%` }} />
                                <div className={`absolute h-full rounded-full opacity-60 ${compCat.score >= 80 ? "bg-orange-400" : compCat.score >= 50 ? "bg-orange-400" : "bg-orange-400"}`} style={{ left: `${Math.min(cat.score, compCat.score)}%`, width: `${Math.abs(diff)}%` }} />
                              </div>
                              <span className={`w-8 text-xs font-bold ${compCat.score >= 80 ? "text-emerald-400" : compCat.score >= 50 ? "text-amber-400" : "text-red-400"}`}>{compCat.score}</span>
                            </div>
                            <span className={`w-10 text-right text-xs font-bold ${diffColor}`}>{diff > 0 ? `+${diff}` : diff}</span>
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex justify-between text-xs text-slate-500 pt-1">
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-indigo-400 inline-block" />{new URL(result.url).hostname}</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-400 inline-block" />{new URL(compareResult.url).hostname}</span>
                    </div>
                    <button
                      onClick={() => { setCompareResult(null); setCompareUrl(""); setCompareError(""); }}
                      className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      Clear comparison
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Critical Issues Alert */}
            {result.summary.criticalIssues.length > 0 && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-5 mb-6">
                <h3 className="text-red-400 font-semibold flex items-center gap-2 mb-3">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  Critical Issues ({result.summary.criticalIssues.length})
                </h3>
                <ul className="space-y-1">
                  {result.summary.criticalIssues.map((issue, i) => (
                    <li key={i} className="text-sm text-red-300 flex items-start gap-2">
                      <span className="mt-0.5 shrink-0">•</span>
                      {issue}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Category Scores Grid */}
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mb-6">
              {Object.values(result.categories).map((cat) => {
                const color = cat.score >= 80 ? "text-emerald-400" : cat.score >= 50 ? "text-amber-400" : "text-red-400";
                return (
                  <button
                    key={cat.name}
                    onClick={() => toggleCategory(cat.name)}
                    className="glass-light rounded-xl p-4 text-center hover:bg-white/5 transition-colors"
                  >
                    <span className="text-xl">{cat.icon}</span>
                    <p className={`text-2xl font-bold mt-1 ${color}`}>{cat.score}</p>
                    <p className="text-xs text-slate-400 mt-0.5 leading-tight">{cat.name}</p>
                  </button>
                );
              })}
            </div>

            {/* Top Actions Panel */}
            <TopActionsPanel categories={result.categories} />

            {/* Detailed Categories */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Detailed Analysis</h3>
                <button
                  onClick={() => {
                    const allNames = Object.values(result.categories).map((c) => c.name);
                    setExpandedCategories((prev) =>
                      prev.size === allNames.length ? new Set() : new Set(allNames)
                    );
                  }}
                  className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  {expandedCategories.size === Object.values(result.categories).length ? "Collapse All" : "Expand All"}
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
                onClick={handleReAnalyze}
                className="flex items-center gap-2 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white text-sm font-semibold rounded-xl transition-all"
              >
                Re-analyze
              </button>
              <button
                onClick={handleAnalyzeAnother}
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
        <div className="max-w-6xl mx-auto px-4 py-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-8">
            <div>
              <h4 className="text-white font-semibold mb-2">SEO Analyzer Pro</h4>
              <p className="text-slate-400 text-sm">
                Free, professional-grade SEO audit tool with 40+ checks, Core Web Vitals,
                broken link detection, and downloadable PDF reports.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3">Hire for SEO Work</h4>
              <p className="text-slate-400 text-sm mb-3">
                Need a professional SEO audit, strategy, or implementation for your website?
              </p>
              <div className="space-y-2">
                <a
                  href="mailto:Seopreeti09@gmail.com"
                  className="flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Seopreeti09@gmail.com
                </a>
                <a
                  href="https://wa.me/919418228411"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  WhatsApp: +919418228411
                </a>
              </div>
            </div>
          </div>
          <div className="border-t border-white/5 pt-6 text-center">
            <p className="text-slate-500 text-sm">
              SEO Analyzer Pro — Free, open-source SEO audit tool
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
