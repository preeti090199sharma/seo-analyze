"use client";

import { useState } from "react";

interface Coverage {
  inTitle: boolean;
  inDescription: boolean;
  inH1: boolean;
  inUrl: boolean;
  inFirstParagraph: boolean;
  inAltText: boolean;
}

interface Recommendation {
  priority: "critical" | "high" | "medium" | "low";
  text: string;
}

interface KeywordRankData {
  keyword: string;
  url: string;
  score: number;
  coverage: Coverage;
  stats: { occurrences: number; density: number; totalWords: number };
  pageData: { title: string; description: string; h1: string };
  recommendations: Recommendation[];
}

const priorityStyles: Record<Recommendation["priority"], string> = {
  critical: "bg-red-500/15 border-red-500/30 text-red-300",
  high:     "bg-orange-500/15 border-orange-500/30 text-orange-300",
  medium:   "bg-amber-500/15 border-amber-500/30 text-amber-300",
  low:      "bg-slate-500/15 border-slate-500/30 text-slate-300",
};

const priorityLabels: Record<Recommendation["priority"], string> = {
  critical: "CRITICAL", high: "HIGH", medium: "MEDIUM", low: "LOW",
};

function ScoreCircle({ score }: { score: number }) {
  const size = 140;
  const radius = (size - 16) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 70 ? "stroke-emerald-400" : score >= 40 ? "stroke-amber-400" : "stroke-red-400";
  const textColor = score >= 70 ? "text-emerald-400" : score >= 40 ? "text-amber-400" : "text-red-400";
  const label = score >= 70 ? "Well Optimized" : score >= 40 ? "Needs Work" : "Poorly Optimized";

  return (
    <div className="flex flex-col items-center">
      <div className="relative inline-flex items-center justify-center">
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
          <circle cx={size/2} cy={size/2} r={radius} fill="none" className={color}
            strokeWidth="8" strokeLinecap="round"
            strokeDasharray={circumference} strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 1.2s ease-out" }}
          />
        </svg>
        <div className="absolute flex flex-col items-center">
          <span className={`text-4xl font-bold ${textColor}`}>{score}</span>
          <span className="text-xs text-slate-400">/100</span>
        </div>
      </div>
      <span className={`text-sm font-semibold mt-1 ${textColor}`}>{label}</span>
    </div>
  );
}

function CoverageRow({ label, value, impact }: { label: string; value: boolean; impact: string }) {
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-white/5 last:border-0">
      <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${value ? "bg-emerald-500/20" : "bg-red-500/20"}`}>
        {value
          ? <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg>
          : <svg className="w-3.5 h-3.5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12"/></svg>
        }
      </div>
      <div className="flex-1">
        <span className={`text-sm font-medium ${value ? "text-white" : "text-slate-400"}`}>{label}</span>
      </div>
      <span className="text-xs text-slate-500">{impact}</span>
      <span className={`text-xs font-bold ${value ? "text-emerald-400" : "text-red-400"}`}>
        {value ? "Found" : "Missing"}
      </span>
    </div>
  );
}

export default function KeywordRankPage() {
  const [url, setUrl] = useState("");
  const [keyword, setKeyword] = useState("");
  const [data, setData] = useState<KeywordRankData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    if (!url.trim() || !keyword.trim()) return;
    setLoading(true);
    setError("");
    setData(null);
    try {
      const res = await fetch("/api/tools/keyword-rank", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim(), keyword: keyword.trim() }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error); return; }
      setData(json);
    } catch { setError("Network error. Please try again."); }
    finally { setLoading(false); }
  };

  const criticalCount = data?.recommendations.filter(r => r.priority === "critical").length ?? 0;

  return (
    <main className="max-w-5xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-white mb-2">🎯 Keyword Rank Checker</h1>
      <p className="text-slate-400 mb-8">
        Check how well your page is optimized for a target keyword. Get on-page optimization score and actionable fixes.
      </p>

      <form onSubmit={handleSubmit} className="glass rounded-xl p-6 mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-xs font-medium text-slate-400 mb-1.5 block">Page URL</label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="example.com/your-page"
              className="w-full px-4 py-3 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-400 mb-1.5 block">Target Keyword</label>
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="e.g. best seo tools"
              className="w-full px-4 py-3 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
              required
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full sm:w-auto px-8 py-3 bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-800 text-white font-semibold rounded-xl transition-all"
        >
          {loading ? "Analyzing..." : "Check Keyword Optimization"}
        </button>
      </form>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm mb-6">{error}</div>
      )}

      {data && (
        <div className="space-y-6 animate-fade-in">

          {/* Score + Summary */}
          <div className="glass rounded-2xl p-8">
            <div className="flex flex-col lg:flex-row items-center gap-8">
              <ScoreCircle score={data.score} />
              <div className="flex-1 text-center lg:text-left">
                <p className="text-slate-400 text-sm mb-1">Analyzing keyword</p>
                <h2 className="text-2xl font-bold text-violet-300 mb-1">"{data.keyword}"</h2>
                <p className="text-indigo-300 font-mono text-sm truncate mb-4">{data.url}</p>
                <div className="flex flex-wrap justify-center lg:justify-start gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"/>
                    <span className="text-slate-300">{Object.values(data.coverage).filter(Boolean).length}/6 locations covered</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-400"/>
                    <span className="text-slate-300">{data.stats.occurrences} occurrences ({data.stats.density}% density)</span>
                  </div>
                  {criticalCount > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-red-400"/>
                      <span className="text-red-300">{criticalCount} critical issues</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Stat cards */}
              <div className="grid grid-cols-3 gap-3 shrink-0">
                {[
                  { label: "Occurrences", value: data.stats.occurrences, color: data.stats.occurrences > 0 ? "text-emerald-400" : "text-red-400" },
                  { label: "Density", value: `${data.stats.density}%`, color: data.stats.density >= 0.5 && data.stats.density <= 3 ? "text-emerald-400" : "text-amber-400" },
                  { label: "Total Words", value: data.stats.totalWords.toLocaleString(), color: "text-indigo-400" },
                ].map(s => (
                  <div key={s.label} className="glass-light rounded-xl p-4 text-center">
                    <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                    <p className="text-xs text-slate-400 mt-1">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Page Data Found */}
          <div className="glass rounded-xl p-5">
            <h3 className="text-sm font-semibold text-white mb-3">Page Data Found</h3>
            <div className="space-y-2 text-xs">
              {[
                { label: "Title", value: data.pageData.title },
                { label: "H1", value: data.pageData.h1 },
                { label: "Description", value: data.pageData.description },
              ].map(({ label, value }) => (
                <div key={label} className="flex gap-2">
                  <span className="text-slate-500 w-20 shrink-0 font-medium">{label}</span>
                  <span className={value ? "text-slate-200" : "text-red-400 italic"}>{value || "Not found"}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Coverage Checklist */}
          <div className="glass rounded-xl p-6">
            <h3 className="text-sm font-semibold text-white mb-4">
              Keyword Coverage
              <span className="ml-2 text-xs font-normal text-slate-400">— where "{data.keyword}" appears</span>
            </h3>
            <div className="divide-y divide-white/0">
              <CoverageRow label="Page Title" value={data.coverage.inTitle} impact="Very High Impact" />
              <CoverageRow label="H1 Heading" value={data.coverage.inH1} impact="Very High Impact" />
              <CoverageRow label="Meta Description" value={data.coverage.inDescription} impact="High Impact" />
              <CoverageRow label="URL / Slug" value={data.coverage.inUrl} impact="Medium Impact" />
              <CoverageRow label="First Paragraph" value={data.coverage.inFirstParagraph} impact="Medium Impact" />
              <CoverageRow label="Image Alt Text" value={data.coverage.inAltText} impact="Low Impact" />
            </div>
          </div>

          {/* Density Guide */}
          <div className="glass rounded-xl p-5">
            <h3 className="text-sm font-semibold text-white mb-3">Keyword Density Guide</h3>
            <div className="flex items-center gap-2 mb-3">
              <div className="flex-1 h-3 rounded-full bg-white/5 overflow-hidden relative">
                <div className="h-full rounded-full bg-gradient-to-r from-red-500 via-emerald-400 to-red-500" style={{ width: "100%" }} />
                <div
                  className="absolute top-0 h-full w-1 bg-white rounded-full shadow-lg"
                  style={{ left: `${Math.min((data.stats.density / 5) * 100, 99)}%` }}
                />
              </div>
              <span className={`text-sm font-bold w-12 text-right ${data.stats.density >= 0.5 && data.stats.density <= 3 ? "text-emerald-400" : "text-red-400"}`}>
                {data.stats.density}%
              </span>
            </div>
            <div className="flex justify-between text-xs text-slate-500">
              <span>0% (too low)</span>
              <span className="text-emerald-400">0.5–2% optimal</span>
              <span>5%+ (stuffing)</span>
            </div>
          </div>

          {/* Recommendations */}
          {data.recommendations.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-white">
                Action Plan
                <span className="ml-2 text-xs font-normal text-slate-400">({data.recommendations.length} fixes)</span>
              </h3>
              {data.recommendations.map((rec, i) => (
                <div key={i} className={`flex items-start gap-3 p-4 rounded-xl border ${priorityStyles[rec.priority]}`}>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border shrink-0 mt-0.5 ${priorityStyles[rec.priority]}`}>
                    {priorityLabels[rec.priority]}
                  </span>
                  <p className="text-sm">{rec.text}</p>
                </div>
              ))}
            </div>
          )}

          {data.recommendations.length === 0 && (
            <div className="p-5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-sm text-center">
              This page is well optimized for "{data.keyword}". Keep up the great work!
            </div>
          )}
        </div>
      )}
    </main>
  );
}
