"use client";

import { useState } from "react";

interface Rule {
  userAgent: string;
  allow: string[];
  disallow: string[];
}

export default function RobotsGeneratorPage() {
  const [rules, setRules] = useState<Rule[]>([
    { userAgent: "*", allow: ["/"], disallow: ["/admin/", "/private/"] },
  ]);
  const [sitemapUrl, setSitemapUrl] = useState("");
  const [crawlDelay, setCrawlDelay] = useState("");
  const [copied, setCopied] = useState(false);

  const updateRule = (i: number, field: keyof Rule, value: string | string[]) => {
    setRules((prev) => prev.map((r, j) => (j === i ? { ...r, [field]: value } : r)));
  };

  const generated = [
    ...rules.flatMap((r) => [
      `User-agent: ${r.userAgent}`,
      ...r.allow.filter(Boolean).map((p) => `Allow: ${p}`),
      ...r.disallow.filter(Boolean).map((p) => `Disallow: ${p}`),
      crawlDelay ? `Crawl-delay: ${crawlDelay}` : "",
      "",
    ]),
    sitemapUrl ? `Sitemap: ${sitemapUrl}` : "",
  ]
    .filter((line, i, arr) => !(line === "" && arr[i - 1] === ""))
    .join("\n")
    .trim();

  const handleCopy = () => {
    navigator.clipboard.writeText(generated);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([generated], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "robots.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-white mb-2">🤖 Robots.txt Generator</h1>
      <p className="text-slate-400 mb-8">Create a robots.txt file to control how search engines crawl your site. Download ready to upload.</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Form */}
        <div className="space-y-6">
          {rules.map((rule, i) => (
            <div key={i} className="glass rounded-xl p-5 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-semibold text-white">Rule {i + 1}</h3>
                {rules.length > 1 && (
                  <button onClick={() => setRules((p) => p.filter((_, j) => j !== i))} className="text-red-400 text-xs hover:text-red-300">Remove</button>
                )}
              </div>

              <div>
                <label className="text-xs font-medium text-slate-400 mb-1 block">User-agent</label>
                <select
                  value={rule.userAgent}
                  onChange={(e) => updateRule(i, "userAgent", e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="*">* (All bots)</option>
                  <option value="Googlebot">Googlebot</option>
                  <option value="Bingbot">Bingbot</option>
                  <option value="Yandex">Yandex</option>
                  <option value="DuckDuckBot">DuckDuckBot</option>
                  <option value="Baiduspider">Baiduspider</option>
                  <option value="facebot">Facebook Bot</option>
                  <option value="Twitterbot">Twitter Bot</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-400 mb-1 block">Allow paths</label>
                {rule.allow.map((p, pi) => (
                  <div key={pi} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={p}
                      onChange={(e) => { const n = [...rule.allow]; n[pi] = e.target.value; updateRule(i, "allow", n); }}
                      placeholder="/public/"
                      className="flex-1 px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button onClick={() => updateRule(i, "allow", rule.allow.filter((_, j) => j !== pi))} className="text-red-400 text-xs px-2">✕</button>
                  </div>
                ))}
                <button
                  onClick={() => updateRule(i, "allow", [...rule.allow, ""])}
                  className="text-xs text-indigo-400 hover:text-indigo-300"
                >+ Add Allow path</button>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-400 mb-1 block">Disallow paths</label>
                {rule.disallow.map((p, pi) => (
                  <div key={pi} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={p}
                      onChange={(e) => { const n = [...rule.disallow]; n[pi] = e.target.value; updateRule(i, "disallow", n); }}
                      placeholder="/admin/"
                      className="flex-1 px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button onClick={() => updateRule(i, "disallow", rule.disallow.filter((_, j) => j !== pi))} className="text-red-400 text-xs px-2">✕</button>
                  </div>
                ))}
                <button
                  onClick={() => updateRule(i, "disallow", [...rule.disallow, ""])}
                  className="text-xs text-indigo-400 hover:text-indigo-300"
                >+ Add Disallow path</button>
              </div>
            </div>
          ))}

          <button
            onClick={() => setRules((p) => [...p, { userAgent: "Googlebot", allow: ["/"], disallow: [] }])}
            className="w-full py-3 border border-dashed border-slate-600 rounded-xl text-sm text-slate-400 hover:text-white hover:border-indigo-500 transition-colors"
          >+ Add Another Rule</button>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-slate-400 mb-1 block">Sitemap URL</label>
              <input
                type="text"
                value={sitemapUrl}
                onChange={(e) => setSitemapUrl(e.target.value)}
                placeholder="https://example.com/sitemap.xml"
                className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-400 mb-1 block">Crawl Delay (seconds)</label>
              <input
                type="number"
                value={crawlDelay}
                onChange={(e) => setCrawlDelay(e.target.value)}
                placeholder="10"
                className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Output */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-medium text-slate-300">Generated robots.txt</h3>
            <div className="flex gap-2">
              <button onClick={handleCopy} className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-xs font-medium rounded-lg transition-colors">
                {copied ? "✓ Copied!" : "Copy"}
              </button>
              <button onClick={handleDownload} className="px-3 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-medium rounded-lg transition-colors">
                Download File
              </button>
            </div>
          </div>
          <pre className="bg-slate-900 border border-slate-700 rounded-xl p-4 text-sm text-emerald-300 whitespace-pre-wrap leading-relaxed">
            {generated}
          </pre>
          <p className="text-xs text-slate-500 mt-3">
            Upload this file to the root of your website (e.g., https://example.com/robots.txt)
          </p>
        </div>
      </div>
    </main>
  );
}
