import Link from "next/link";

const tools = [
  {
    href: "/",
    icon: "📊",
    title: "SEO Analyzer",
    desc: "Complete SEO audit with 35+ checks across 8 categories. Download PDF report.",
    badge: "Popular",
  },
  {
    href: "/tools/meta-generator",
    icon: "🏷️",
    title: "Meta Tags Generator",
    desc: "Generate perfect meta tags with live Google SERP preview and character counting.",
  },
  {
    href: "/tools/social-preview",
    icon: "📱",
    title: "Social Media Preview",
    desc: "See how your URL looks when shared on Facebook, Twitter, LinkedIn & WhatsApp.",
  },
  {
    href: "/tools/schema-generator",
    icon: "🧩",
    title: "Schema Markup Generator",
    desc: "Generate JSON-LD structured data for Articles, Products, FAQ, Business & more.",
  },
  {
    href: "/tools/robots-generator",
    icon: "🤖",
    title: "Robots.txt Generator",
    desc: "Create a robots.txt file with user-agent rules, allow/disallow paths & sitemap.",
  },
  {
    href: "/tools/keyword-density",
    icon: "🔑",
    title: "Keyword Density Checker",
    desc: "Analyze keyword frequency, density percentage, and N-gram phrases on any page.",
  },
  {
    href: "/tools/redirect-checker",
    icon: "🔀",
    title: "Redirect Chain Checker",
    desc: "Follow the redirect chain of any URL. Detect 301/302 redirects and loops.",
  },
  {
    href: "/tools/readability",
    icon: "📖",
    title: "Readability Analyzer",
    desc: "Check Flesch Reading Ease, grade level, sentence length, and content complexity.",
  },
  {
    href: "/tools/heading-structure",
    icon: "📑",
    title: "Heading Structure Visualizer",
    desc: "Visualize your page's H1-H6 heading hierarchy and detect structural issues.",
  },
];

export default function ToolsPage() {
  return (
    <main className="max-w-6xl mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
          Free SEO <span className="gradient-text">Toolkit</span>
        </h1>
        <p className="text-slate-400 max-w-2xl mx-auto">
          All tools are 100% free, no sign-up required. Results are based on
          actual data parsing — no guesswork, no predictions.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {tools.map((tool) => (
          <Link
            key={tool.href}
            href={tool.href}
            className="glass rounded-xl p-6 hover:bg-white/5 transition-all group relative"
          >
            {tool.badge && (
              <span className="absolute top-3 right-3 px-2 py-0.5 bg-indigo-500/20 text-indigo-300 text-xs rounded-full border border-indigo-500/30">
                {tool.badge}
              </span>
            )}
            <span className="text-3xl">{tool.icon}</span>
            <h2 className="text-lg font-semibold text-white mt-3 group-hover:text-indigo-300 transition-colors">
              {tool.title}
            </h2>
            <p className="text-sm text-slate-400 mt-2 leading-relaxed">
              {tool.desc}
            </p>
            <span className="inline-flex items-center gap-1 text-xs text-indigo-400 mt-4 group-hover:gap-2 transition-all">
              Open Tool
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </span>
          </Link>
        ))}
      </div>
    </main>
  );
}
