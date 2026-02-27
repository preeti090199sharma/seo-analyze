"use client";

import { useState } from "react";

function CharCount({ current, min, max }: { current: number; min: number; max: number }) {
  const status = current === 0 ? "text-slate-500" : current < min ? "text-amber-400" : current > max ? "text-red-400" : "text-emerald-400";
  return <span className={`text-xs ${status}`}>{current}/{max} chars {current >= min && current <= max ? "✓" : current === 0 ? "" : current < min ? "(too short)" : "(too long)"}</span>;
}

export default function MetaGeneratorPage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [keywords, setKeywords] = useState("");
  const [url, setUrl] = useState("");
  const [author, setAuthor] = useState("");
  const [ogImage, setOgImage] = useState("");
  const [copied, setCopied] = useState(false);

  const generatedCode = [
    `<meta charset="UTF-8">`,
    `<meta name="viewport" content="width=device-width, initial-scale=1.0">`,
    title && `<title>${title}</title>`,
    description && `<meta name="description" content="${description}">`,
    keywords && `<meta name="keywords" content="${keywords}">`,
    author && `<meta name="author" content="${author}">`,
    url && `<link rel="canonical" href="${url}">`,
    "",
    "<!-- Open Graph / Facebook -->",
    `<meta property="og:type" content="website">`,
    title && `<meta property="og:title" content="${title}">`,
    description && `<meta property="og:description" content="${description}">`,
    url && `<meta property="og:url" content="${url}">`,
    ogImage && `<meta property="og:image" content="${ogImage}">`,
    "",
    "<!-- Twitter Card -->",
    `<meta name="twitter:card" content="summary_large_image">`,
    title && `<meta name="twitter:title" content="${title}">`,
    description && `<meta name="twitter:description" content="${description}">`,
    ogImage && `<meta name="twitter:image" content="${ogImage}">`,
  ]
    .filter(Boolean)
    .join("\n");

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const serpTitle = title || "Your Page Title Here";
  const serpDesc = description || "Your meta description will appear here. Make it compelling to improve click-through rates from search results.";
  const serpUrl = url || "https://example.com";

  return (
    <main className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-white mb-2">🏷️ Meta Tags Generator</h1>
      <p className="text-slate-400 mb-8">Generate perfect meta tags with live Google preview. 100% accurate output.</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Form */}
        <div className="space-y-5">
          <div>
            <div className="flex justify-between mb-1.5">
              <label className="text-sm font-medium text-slate-300">Page Title</label>
              <CharCount current={title.length} min={50} max={60} />
            </div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="My Awesome Page — Brand Name"
              className="w-full px-4 py-3 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <div className="flex justify-between mb-1.5">
              <label className="text-sm font-medium text-slate-300">Meta Description</label>
              <CharCount current={description.length} min={150} max={160} />
            </div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A compelling description of your page that will appear in search results..."
              rows={3}
              className="w-full px-4 py-3 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-300 mb-1.5 block">Keywords</label>
            <input
              type="text"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="seo, analyzer, free tool, website audit"
              className="w-full px-4 py-3 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-300 mb-1.5 block">Canonical URL</label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/page"
              className="w-full px-4 py-3 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-300 mb-1.5 block">Author</label>
            <input
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="John Doe"
              className="w-full px-4 py-3 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-300 mb-1.5 block">OG Image URL</label>
            <input
              type="text"
              value={ogImage}
              onChange={(e) => setOgImage(e.target.value)}
              placeholder="https://example.com/og-image.jpg (1200x630 recommended)"
              className="w-full px-4 py-3 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Preview + Output */}
        <div className="space-y-6">
          {/* Google SERP Preview */}
          <div>
            <h3 className="text-sm font-medium text-slate-300 mb-3">Google Search Preview</h3>
            <div className="bg-white rounded-xl p-5">
              <p className="text-sm text-green-700 font-normal truncate">{serpUrl}</p>
              <h3 className="text-xl text-blue-800 font-normal mt-0.5 leading-snug hover:underline cursor-pointer line-clamp-2">
                {serpTitle}
              </h3>
              <p className="text-sm text-gray-600 mt-1 line-clamp-2">{serpDesc}</p>
            </div>
          </div>

          {/* Generated Code */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-medium text-slate-300">Generated HTML</h3>
              <button
                onClick={handleCopy}
                className="px-3 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-medium rounded-lg transition-colors"
              >
                {copied ? "✓ Copied!" : "Copy Code"}
              </button>
            </div>
            <pre className="bg-slate-900 border border-slate-700 rounded-xl p-4 text-xs text-emerald-300 overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-80 overflow-y-auto">
              {generatedCode}
            </pre>
          </div>
        </div>
      </div>
    </main>
  );
}
