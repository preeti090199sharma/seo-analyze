"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const tools = [
  { href: "/", label: "SEO Analyzer", icon: "📊" },
  { href: "/tools/meta-generator", label: "Meta Tags Generator", icon: "🏷️" },
  { href: "/tools/social-preview", label: "Social Preview", icon: "📱" },
  { href: "/tools/schema-generator", label: "Schema Generator", icon: "🧩" },
  { href: "/tools/robots-generator", label: "Robots.txt Generator", icon: "🤖" },
  { href: "/tools/keyword-density", label: "Keyword Density", icon: "🔑" },
  { href: "/tools/redirect-checker", label: "Redirect Checker", icon: "🔀" },
  { href: "/tools/readability", label: "Readability Checker", icon: "📖" },
  { href: "/tools/heading-structure", label: "Heading Structure", icon: "📑" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-slate-900/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <span className="text-lg font-bold text-white hidden sm:inline">
            SEO Analyzer <span className="text-indigo-400">Pro</span>
          </span>
        </Link>

        <nav className="hidden lg:flex items-center gap-1">
          {tools.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                pathname === t.href
                  ? "bg-indigo-500/20 text-indigo-300"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              {t.icon} {t.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/tools"
            className="hidden sm:flex text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            All Tools →
          </Link>
          <button
            onClick={() => setOpen(!open)}
            className="lg:hidden p-2 text-slate-400 hover:text-white"
          >
            {open ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {open && (
        <div className="lg:hidden border-t border-white/5 bg-slate-900/95 backdrop-blur-xl">
          <nav className="max-w-7xl mx-auto px-4 py-3 grid grid-cols-2 gap-1">
            {tools.map((t) => (
              <Link
                key={t.href}
                href={t.href}
                onClick={() => setOpen(false)}
                className={`px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  pathname === t.href
                    ? "bg-indigo-500/20 text-indigo-300"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                {t.icon} {t.label}
              </Link>
            ))}
            <Link
              href="/tools"
              onClick={() => setOpen(false)}
              className="px-3 py-2.5 rounded-lg text-sm text-indigo-400 hover:bg-white/5 col-span-2 text-center"
            >
              View All Tools →
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
