"use client";

import { useState } from "react";

interface RedirectData {
  chain: { url: string; status: number; type: string }[];
  totalRedirects: number;
  hasLoop: boolean;
  finalUrl: string;
  finalStatus: number;
}

export default function RedirectCheckerPage() {
  const [url, setUrl] = useState("");
  const [data, setData] = useState<RedirectData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    setLoading(true);
    setError("");
    setData(null);
    try {
      const res = await fetch("/api/tools/redirect-check", {
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

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return "bg-emerald-500";
    if (status >= 300 && status < 400) return "bg-amber-500";
    if (status >= 400) return "bg-red-500";
    return "bg-slate-500";
  };

  return (
    <main className="max-w-5xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-white mb-2">🔀 Redirect Chain Checker</h1>
      <p className="text-slate-400 mb-8">Follow the redirect chain of any URL. Detects 301, 302, 307, 308 redirects and loops.</p>

      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 mb-10">
        <input type="text" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Enter URL to check redirects" className="flex-1 px-4 py-3 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500" required />
        <button type="submit" disabled={loading} className="px-6 py-3 bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-800 text-white font-semibold rounded-xl transition-all">
          {loading ? "Checking..." : "Check Redirects"}
        </button>
      </form>

      {error && <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm mb-6">{error}</div>}

      {data && (
        <div className="space-y-6">
          {/* Summary */}
          <div className="grid grid-cols-3 gap-4">
            <div className="glass rounded-xl p-5 text-center">
              <p className={`text-3xl font-bold ${data.totalRedirects === 0 ? "text-emerald-400" : data.totalRedirects <= 2 ? "text-amber-400" : "text-red-400"}`}>
                {data.totalRedirects}
              </p>
              <p className="text-xs text-slate-400 mt-1">Redirects</p>
            </div>
            <div className="glass rounded-xl p-5 text-center">
              <p className={`text-3xl font-bold ${data.finalStatus >= 200 && data.finalStatus < 300 ? "text-emerald-400" : "text-red-400"}`}>
                {data.finalStatus}
              </p>
              <p className="text-xs text-slate-400 mt-1">Final Status</p>
            </div>
            <div className="glass rounded-xl p-5 text-center">
              <p className={`text-3xl font-bold ${data.hasLoop ? "text-red-400" : "text-emerald-400"}`}>
                {data.hasLoop ? "YES" : "NO"}
              </p>
              <p className="text-xs text-slate-400 mt-1">Loop Detected</p>
            </div>
          </div>

          {data.totalRedirects > 2 && (
            <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-sm">
              Too many redirects ({data.totalRedirects}). Each redirect adds latency. Try to reduce to 1 or fewer.
            </div>
          )}

          {data.hasLoop && (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-sm">
              Redirect loop detected! This will cause browsers to fail loading the page.
            </div>
          )}

          {/* Chain Visualization */}
          <div className="glass rounded-xl p-6">
            <h3 className="text-sm font-semibold text-white mb-4">Redirect Chain</h3>
            <div className="space-y-0">
              {data.chain.map((hop, i) => (
                <div key={i}>
                  <div className="flex items-start gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full ${getStatusColor(hop.status)} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                        {hop.status || "!"}
                      </div>
                      {i < data.chain.length - 1 && (
                        <div className="w-0.5 h-8 bg-slate-600 my-1" />
                      )}
                    </div>
                    <div className="pt-1">
                      <p className="text-xs font-medium text-slate-400">{hop.type}</p>
                      <p className="text-sm text-white font-mono break-all">{hop.url}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {data.totalRedirects === 0 && (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-sm">
              No redirects found. The URL resolves directly — perfect!
            </div>
          )}
        </div>
      )}
    </main>
  );
}
