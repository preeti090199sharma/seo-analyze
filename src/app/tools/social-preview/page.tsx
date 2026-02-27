"use client";

import { useState } from "react";

interface SocialData {
  url: string;
  title: string;
  description: string;
  image: string;
  siteName: string;
  type: string;
  twitterCard: string;
  twitterTitle: string;
  twitterDescription: string;
  twitterImage: string;
  twitterSite: string;
  favicon: string;
  missing: string[];
}

export default function SocialPreviewPage() {
  const [url, setUrl] = useState("");
  const [data, setData] = useState<SocialData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    setLoading(true);
    setError("");
    setData(null);
    try {
      const res = await fetch("/api/tools/social-preview", {
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

  const domain = data ? new URL(data.url).hostname : "";

  return (
    <main className="max-w-5xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-white mb-2">📱 Social Media Preview</h1>
      <p className="text-slate-400 mb-8">See exactly how your URL will look when shared on social media platforms.</p>

      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 mb-10">
        <input type="text" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Enter URL (e.g. example.com)" className="flex-1 px-4 py-3 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500" required />
        <button type="submit" disabled={loading} className="px-6 py-3 bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-800 text-white font-semibold rounded-xl transition-all">
          {loading ? "Analyzing..." : "Preview"}
        </button>
      </form>

      {error && <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm mb-6">{error}</div>}

      {data && (
        <div className="space-y-8">
          {/* Missing Tags Warning */}
          {data.missing.length > 0 && (
            <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
              <h3 className="text-amber-400 font-semibold text-sm mb-2">Missing Tags ({data.missing.length})</h3>
              <div className="flex flex-wrap gap-2">
                {data.missing.map((tag) => (
                  <span key={tag as string} className="px-2 py-1 bg-amber-500/20 text-amber-300 text-xs rounded-lg">{tag as string}</span>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Facebook Preview */}
            <div>
              <h3 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
                <span className="w-5 h-5 bg-blue-600 rounded-md flex items-center justify-center text-white text-xs font-bold">f</span>
                Facebook / LinkedIn
              </h3>
              <div className="bg-white rounded-lg overflow-hidden shadow-lg">
                {data.image ? (
                  <div className="w-full h-48 bg-gray-200 flex items-center justify-center overflow-hidden">
                    <img src={data.image} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                  </div>
                ) : (
                  <div className="w-full h-48 bg-gray-100 flex items-center justify-center text-gray-400 text-sm">No OG Image Set</div>
                )}
                <div className="p-3 bg-gray-50 border-t border-gray-200">
                  <p className="text-xs text-gray-500 uppercase">{domain}</p>
                  <h4 className="text-sm font-semibold text-gray-900 mt-0.5 line-clamp-2">{data.title || "No title"}</h4>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">{data.description || "No description"}</p>
                </div>
              </div>
            </div>

            {/* Twitter Preview */}
            <div>
              <h3 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
                <span className="w-5 h-5 bg-black rounded-md flex items-center justify-center text-white text-xs font-bold">𝕏</span>
                Twitter / X
              </h3>
              <div className="bg-white rounded-2xl overflow-hidden shadow-lg border border-gray-200">
                {data.twitterImage ? (
                  <div className="w-full h-48 bg-gray-200 overflow-hidden">
                    <img src={data.twitterImage} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                  </div>
                ) : (
                  <div className="w-full h-48 bg-gray-100 flex items-center justify-center text-gray-400 text-sm">No Image</div>
                )}
                <div className="p-3">
                  <h4 className="text-sm font-semibold text-gray-900 line-clamp-2">{data.twitterTitle || "No title"}</h4>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">{data.twitterDescription || "No description"}</p>
                  <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                    {domain}
                  </p>
                </div>
              </div>
            </div>

            {/* WhatsApp Preview */}
            <div>
              <h3 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
                <span className="w-5 h-5 bg-green-500 rounded-md flex items-center justify-center text-white text-xs font-bold">W</span>
                WhatsApp
              </h3>
              <div className="bg-emerald-50 rounded-lg overflow-hidden shadow-lg p-3">
                <div className="bg-white rounded-lg overflow-hidden border border-gray-200">
                  {data.image && (
                    <div className="w-full h-36 bg-gray-200 overflow-hidden">
                      <img src={data.image} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                    </div>
                  )}
                  <div className="p-2.5">
                    <p className="text-xs text-green-700 font-medium">{domain}</p>
                    <h4 className="text-sm font-semibold text-gray-900 mt-0.5 line-clamp-2">{data.title || "No title"}</h4>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{data.description || ""}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Raw Data */}
            <div>
              <h3 className="text-sm font-medium text-slate-300 mb-3">Raw Tag Data</h3>
              <div className="glass rounded-xl p-4 space-y-2 text-xs">
                {[
                  ["og:title", data.title],
                  ["og:description", data.description],
                  ["og:image", data.image],
                  ["og:site_name", data.siteName],
                  ["og:type", data.type],
                  ["twitter:card", data.twitterCard],
                  ["twitter:site", data.twitterSite],
                ].map(([key, val]) => (
                  <div key={key} className="flex gap-2">
                    <span className="text-slate-500 w-32 shrink-0">{key}</span>
                    <span className={val ? "text-emerald-300 break-all" : "text-red-400"}>
                      {val || "Missing"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
