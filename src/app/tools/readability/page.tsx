"use client";

import { useState } from "react";

interface ReadabilityData {
  totalWords: number;
  totalSentences: number;
  totalSyllables: number;
  complexWords: number;
  avgSentenceLength: number;
  avgSyllablesPerWord: number;
  fleschReadingEase: number;
  fleschKincaidGrade: number;
  gunningFogIndex: number;
  readabilityLevel: string;
  readabilityColor: string;
  recommendations: string[];
}

function ScoreGauge({ score, label, max = 100 }: { score: number; label: string; max?: number }) {
  const pct = Math.min(Math.max((score / max) * 100, 0), 100);
  const color = score >= 60 ? "text-emerald-400" : score >= 40 ? "text-amber-400" : "text-red-400";
  const barColor = score >= 60 ? "bg-emerald-400" : score >= 40 ? "bg-amber-400" : "bg-red-400";

  return (
    <div className="glass rounded-xl p-5 text-center">
      <p className={`text-3xl font-bold ${color}`}>{score}</p>
      <div className="w-full h-1.5 bg-white/10 rounded-full mt-2 overflow-hidden">
        <div className={`h-full rounded-full ${barColor} transition-all duration-1000`} style={{ width: `${pct}%` }} />
      </div>
      <p className="text-xs text-slate-400 mt-2">{label}</p>
    </div>
  );
}

const fleschScale = [
  { min: 90, label: "Very Easy", desc: "5th grade student can understand", color: "emerald" },
  { min: 80, label: "Easy", desc: "6th grade level", color: "emerald" },
  { min: 70, label: "Fairly Easy", desc: "7th grade level", color: "emerald" },
  { min: 60, label: "Standard", desc: "8th-9th grade level", color: "emerald" },
  { min: 50, label: "Fairly Difficult", desc: "10th-12th grade level", color: "amber" },
  { min: 30, label: "Difficult", desc: "College level", color: "amber" },
  { min: 0, label: "Very Difficult", desc: "College graduate level", color: "red" },
];

export default function ReadabilityPage() {
  const [url, setUrl] = useState("");
  const [data, setData] = useState<ReadabilityData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    setLoading(true);
    setError("");
    setData(null);
    try {
      const res = await fetch("/api/tools/readability", {
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
      <h1 className="text-3xl font-bold text-white mb-2">📖 Readability Analyzer</h1>
      <p className="text-slate-400 mb-8">Analyze content readability using proven formulas — Flesch Reading Ease, Flesch-Kincaid Grade, Gunning Fog Index.</p>

      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 mb-10">
        <input type="text" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Enter URL to analyze readability" className="flex-1 px-4 py-3 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500" required />
        <button type="submit" disabled={loading} className="px-6 py-3 bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-800 text-white font-semibold rounded-xl transition-all">
          {loading ? "Analyzing..." : "Analyze"}
        </button>
      </form>

      {error && <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm mb-6">{error}</div>}

      {data && (
        <div className="space-y-8">
          {/* Readability Level Banner */}
          <div className={`glass rounded-2xl p-8 text-center glow`}>
            <p className="text-sm text-slate-400 mb-2">Readability Level</p>
            <h2 className={`text-4xl font-bold ${
              data.readabilityColor === "emerald" ? "text-emerald-400" :
              data.readabilityColor === "amber" ? "text-amber-400" : "text-red-400"
            }`}>
              {data.readabilityLevel}
            </h2>
            <p className="text-slate-400 text-sm mt-2">
              {fleschScale.find(s => data.fleschReadingEase >= s.min)?.desc}
            </p>
          </div>

          {/* Score Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <ScoreGauge score={data.fleschReadingEase} label="Flesch Reading Ease" />
            <ScoreGauge score={data.fleschKincaidGrade} label="Flesch-Kincaid Grade" max={20} />
            <ScoreGauge score={data.gunningFogIndex} label="Gunning Fog Index" max={20} />
          </div>

          {/* Content Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { value: data.totalWords, label: "Words" },
              { value: data.totalSentences, label: "Sentences" },
              { value: data.avgSentenceLength, label: "Avg Words/Sentence" },
              { value: data.complexWords, label: "Complex Words" },
            ].map((stat) => (
              <div key={stat.label} className="glass-light rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-xs text-slate-400 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Flesch Scale */}
          <div className="glass rounded-xl p-6">
            <h3 className="text-sm font-semibold text-white mb-4">Flesch Reading Ease Scale</h3>
            <div className="space-y-2">
              {fleschScale.map((level) => {
                const isActive = data.fleschReadingEase >= level.min &&
                  (level.min === 90 || data.fleschReadingEase < (fleschScale[fleschScale.indexOf(level) - 1]?.min ?? 100));
                return (
                  <div key={level.min} className={`flex items-center gap-3 px-3 py-2 rounded-lg ${isActive ? "bg-indigo-500/20 border border-indigo-500/30" : ""}`}>
                    <span className={`w-16 text-xs font-mono ${isActive ? "text-white font-bold" : "text-slate-500"}`}>{level.min}+</span>
                    <span className={`text-sm ${isActive ? "text-white font-medium" : "text-slate-400"}`}>{level.label}</span>
                    <span className={`text-xs ${isActive ? "text-slate-300" : "text-slate-600"}`}>— {level.desc}</span>
                    {isActive && <span className="ml-auto text-indigo-400 text-xs">← Your Score</span>}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recommendations */}
          {data.recommendations.length > 0 && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-5">
              <h3 className="text-amber-400 font-semibold text-sm mb-3">Recommendations</h3>
              <ul className="space-y-2">
                {data.recommendations.map((rec, i) => (
                  <li key={i} className="text-sm text-amber-200 flex items-start gap-2">
                    <span className="mt-0.5">→</span> {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
