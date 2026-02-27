"use client";

import { useState } from "react";

interface HeadingData {
  headings: { tag: string; text: string; level: number }[];
  issues: string[];
  counts: Record<string, number>;
  total: number;
}

const levelColors: Record<number, string> = {
  1: "bg-indigo-500 text-white",
  2: "bg-sky-500 text-white",
  3: "bg-emerald-500 text-white",
  4: "bg-amber-500 text-white",
  5: "bg-orange-500 text-white",
  6: "bg-rose-500 text-white",
};

export default function HeadingStructurePage() {
  const [url, setUrl] = useState("");
  const [data, setData] = useState<HeadingData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    setLoading(true);
    setError("");
    setData(null);
    try {
      const res = await fetch("/api/tools/heading-structure", {
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
      <h1 className="text-3xl font-bold text-white mb-2">📑 Heading Structure Visualizer</h1>
      <p className="text-slate-400 mb-8">Visualize the H1-H6 heading hierarchy of any page. Detect structural issues instantly.</p>

      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 mb-10">
        <input type="text" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Enter URL to analyze headings" className="flex-1 px-4 py-3 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500" required />
        <button type="submit" disabled={loading} className="px-6 py-3 bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-800 text-white font-semibold rounded-xl transition-all">
          {loading ? "Scanning..." : "Visualize"}
        </button>
      </form>

      {error && <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm mb-6">{error}</div>}

      {data && (
        <div className="space-y-8">
          {/* Summary */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {["H1", "H2", "H3", "H4", "H5", "H6"].map((tag) => (
              <div key={tag} className="glass rounded-xl p-4 text-center">
                <span className={`inline-flex px-2 py-0.5 rounded text-xs font-bold ${levelColors[parseInt(tag.replace("H", ""))]}`}>
                  {tag}
                </span>
                <p className="text-2xl font-bold text-white mt-2">{data.counts[tag] || 0}</p>
              </div>
            ))}
          </div>

          {/* Issues */}
          {data.issues.length > 0 ? (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-5">
              <h3 className="text-red-400 font-semibold text-sm mb-3">Issues Found ({data.issues.length})</h3>
              <ul className="space-y-2">
                {data.issues.map((issue, i) => (
                  <li key={i} className="text-sm text-red-300 flex items-start gap-2">
                    <span className="mt-0.5">•</span> {issue}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-5 text-emerald-300 text-sm">
              No structural issues found. Heading hierarchy is properly structured!
            </div>
          )}

          {/* Heading Tree */}
          <div className="glass rounded-xl p-6">
            <h3 className="text-sm font-semibold text-white mb-4">
              Heading Hierarchy ({data.total} headings)
            </h3>

            {data.headings.length === 0 ? (
              <p className="text-slate-400 text-sm">No headings found on this page.</p>
            ) : (
              <div className="space-y-1.5">
                {data.headings.map((h, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2 py-1.5 hover:bg-white/5 rounded-lg px-2 transition-colors"
                    style={{ paddingLeft: `${(h.level - 1) * 24 + 8}px` }}
                  >
                    {h.level > 1 && (
                      <span className="text-slate-600 text-xs mt-1">└─</span>
                    )}
                    <span className={`inline-flex px-1.5 py-0.5 rounded text-xs font-bold shrink-0 ${levelColors[h.level]}`}>
                      {h.tag}
                    </span>
                    <span className="text-sm text-slate-200 break-words">
                      {h.text || <span className="text-slate-500 italic">(empty)</span>}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-3 text-xs">
            {Object.entries(levelColors).map(([level, cls]) => (
              <span key={level} className="flex items-center gap-1.5">
                <span className={`inline-flex w-6 text-center justify-center py-0.5 rounded text-xs font-bold ${cls}`}>H{level}</span>
                <span className="text-slate-400">
                  {level === "1" ? "Main Title" : level === "2" ? "Section" : level === "3" ? "Sub-section" : `Level ${level}`}
                </span>
              </span>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
