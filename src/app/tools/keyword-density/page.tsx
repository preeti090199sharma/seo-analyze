"use client";

import { useState } from "react";

interface KeywordEntry { keyword: string; count: number; density: number; }
interface KDData {
  totalWords: number;
  uniqueWords: number;
  oneWord: KeywordEntry[];
  twoWord: KeywordEntry[];
  threeWord: KeywordEntry[];
}

function DensityBar({ density }: { density: number }) {
  const color = density > 3 ? "bg-red-400" : density > 2 ? "bg-amber-400" : "bg-emerald-400";
  return (
    <div className="flex items-center gap-2">
      <div className="w-20 h-1.5 bg-white/10 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(density * 20, 100)}%` }} />
      </div>
      <span className="text-xs text-slate-400 w-12">{density}%</span>
    </div>
  );
}

function KeywordTable({ title, data }: { title: string; data: KeywordEntry[] }) {
  if (data.length === 0) return null;
  return (
    <div>
      <h3 className="text-sm font-semibold text-white mb-3">{title}</h3>
      <div className="glass rounded-xl overflow-hidden">
        <div className="grid grid-cols-[1fr_60px_120px] gap-2 px-4 py-2 text-xs font-medium text-slate-400 border-b border-white/5">
          <span>Keyword</span>
          <span className="text-center">Count</span>
          <span>Density</span>
        </div>
        {data.map((entry, i) => (
          <div key={i} className="grid grid-cols-[1fr_60px_120px] gap-2 px-4 py-2.5 text-sm border-b border-white/5 last:border-0 hover:bg-white/5">
            <span className="text-white font-mono text-xs">{entry.keyword}</span>
            <span className="text-center text-slate-300">{entry.count}</span>
            <DensityBar density={entry.density} />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function KeywordDensityPage() {
  const [url, setUrl] = useState("");
  const [data, setData] = useState<KDData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    setLoading(true);
    setError("");
    setData(null);
    try {
      const res = await fetch("/api/tools/keyword-density", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error); return; }
      setData(json);
    } catch { setError("Network error"); }
    finally { setLoading(false); }
  };

  return (
    <main className="max-w-5xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-white mb-2">🔑 Keyword Density Checker</h1>
      <p className="text-slate-400 mb-8">Analyze keyword frequency and density on any page. Mathematical precision — 100% accurate.</p>

      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 mb-10">
        <input type="text" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Enter URL to analyze" className="flex-1 px-4 py-3 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500" required />
        <button type="submit" disabled={loading} className="px-6 py-3 bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-800 text-white font-semibold rounded-xl transition-all">
          {loading ? "Analyzing..." : "Check Density"}
        </button>
      </form>

      {error && <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm mb-6">{error}</div>}

      {data && (
        <div className="space-y-8">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="glass rounded-xl p-5 text-center">
              <p className="text-3xl font-bold text-indigo-400">{data.totalWords.toLocaleString()}</p>
              <p className="text-xs text-slate-400 mt-1">Total Words</p>
            </div>
            <div className="glass rounded-xl p-5 text-center">
              <p className="text-3xl font-bold text-emerald-400">{data.uniqueWords.toLocaleString()}</p>
              <p className="text-xs text-slate-400 mt-1">Unique Words</p>
            </div>
            <div className="glass rounded-xl p-5 text-center">
              <p className="text-3xl font-bold text-amber-400">
                {data.totalWords > 0 ? ((data.uniqueWords / data.totalWords) * 100).toFixed(0) : 0}%
              </p>
              <p className="text-xs text-slate-400 mt-1">Vocabulary Richness</p>
            </div>
          </div>

          <div className="p-3 bg-slate-800/50 rounded-lg text-xs text-slate-400">
            <span className="inline-flex items-center gap-1 mr-4"><span className="w-2 h-2 rounded-full bg-emerald-400"></span> Optimal (&lt;2%)</span>
            <span className="inline-flex items-center gap-1 mr-4"><span className="w-2 h-2 rounded-full bg-amber-400"></span> High (2-3%)</span>
            <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400"></span> Over-optimized (&gt;3%)</span>
          </div>

          <KeywordTable title="Single Keywords (1-gram)" data={data.oneWord} />
          <KeywordTable title="Two-Word Phrases (2-gram)" data={data.twoWord} />
          <KeywordTable title="Three-Word Phrases (3-gram)" data={data.threeWord} />
        </div>
      )}
    </main>
  );
}
