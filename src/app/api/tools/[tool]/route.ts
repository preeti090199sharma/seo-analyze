import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";

const UA =
  "Mozilla/5.0 (compatible; SEOAnalyzerBot/1.0; +https://seoanalyzer.app)";

async function fetchPage(url: string) {
  const start = Date.now();
  const res = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "text/html,application/xhtml+xml" },
    redirect: "follow",
    signal: AbortSignal.timeout(15000),
  });
  const html = await res.text();
  const headers: Record<string, string> = {};
  res.headers.forEach((v, k) => (headers[k.toLowerCase()] = v));
  return { html, headers, status: res.status, time: Date.now() - start, finalUrl: res.url };
}

// ─── Social Preview ──────────────────────────────────────────────────────────

function handleSocialPreview($: cheerio.CheerioAPI, url: string) {
  const get = (sel: string) => $(sel).attr("content")?.trim() || "";
  return {
    url,
    title: get('meta[property="og:title"]') || $("title").text().trim(),
    description: get('meta[property="og:description"]') || get('meta[name="description"]'),
    image: get('meta[property="og:image"]'),
    siteName: get('meta[property="og:site_name"]'),
    type: get('meta[property="og:type"]'),
    ogUrl: get('meta[property="og:url"]'),
    twitterCard: get('meta[name="twitter:card"]'),
    twitterTitle: get('meta[name="twitter:title"]') || get('meta[property="og:title"]') || $("title").text().trim(),
    twitterDescription: get('meta[name="twitter:description"]') || get('meta[property="og:description"]') || get('meta[name="description"]'),
    twitterImage: get('meta[name="twitter:image"]') || get('meta[property="og:image"]'),
    twitterSite: get('meta[name="twitter:site"]'),
    favicon: $('link[rel="icon"]').attr("href") || $('link[rel="shortcut icon"]').attr("href") || "/favicon.ico",
    missing: [
      !get('meta[property="og:title"]') && "og:title",
      !get('meta[property="og:description"]') && "og:description",
      !get('meta[property="og:image"]') && "og:image",
      !get('meta[property="og:url"]') && "og:url",
      !get('meta[name="twitter:card"]') && "twitter:card",
    ].filter(Boolean),
  };
}

// ─── Keyword Density ─────────────────────────────────────────────────────────

function handleKeywordDensity($: cheerio.CheerioAPI) {
  $("script, style, noscript, nav, footer, header").remove();
  const text = $("body").text().replace(/\s+/g, " ").trim().toLowerCase();
  const words = text.split(/\s+/).filter((w) => w.length > 2);
  const total = words.length;

  const stopWords = new Set([
    "the", "and", "for", "are", "but", "not", "you", "all", "can", "her",
    "was", "one", "our", "out", "has", "have", "had", "this", "that", "with",
    "from", "they", "been", "said", "each", "she", "which", "their", "will",
    "other", "about", "many", "then", "them", "these", "some", "would",
    "make", "like", "into", "could", "time", "very", "when", "come", "what",
    "your", "more", "also", "its", "than",
  ]);

  const freq1: Record<string, number> = {};
  const freq2: Record<string, number> = {};
  const freq3: Record<string, number> = {};

  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    if (!stopWords.has(w)) {
      freq1[w] = (freq1[w] || 0) + 1;
    }
    if (i < words.length - 1) {
      const bi = `${words[i]} ${words[i + 1]}`;
      freq2[bi] = (freq2[bi] || 0) + 1;
    }
    if (i < words.length - 2) {
      const tri = `${words[i]} ${words[i + 1]} ${words[i + 2]}`;
      freq3[tri] = (freq3[tri] || 0) + 1;
    }
  }

  const toList = (obj: Record<string, number>, minCount = 2) =>
    Object.entries(obj)
      .filter(([, c]) => c >= minCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 30)
      .map(([keyword, count]) => ({
        keyword,
        count,
        density: Number(((count / total) * 100).toFixed(2)),
      }));

  return {
    totalWords: total,
    uniqueWords: new Set(words).size,
    oneWord: toList(freq1),
    twoWord: toList(freq2),
    threeWord: toList(freq3),
  };
}

// ─── Redirect Chain ──────────────────────────────────────────────────────────

async function handleRedirectChain(url: string) {
  const chain: { url: string; status: number; type: string }[] = [];
  let currentUrl = url;
  const maxHops = 10;

  for (let i = 0; i < maxHops; i++) {
    const res = await fetch(currentUrl, {
      headers: { "User-Agent": UA },
      redirect: "manual",
      signal: AbortSignal.timeout(10000),
    });

    const status = res.status;
    const location = res.headers.get("location");

    chain.push({
      url: currentUrl,
      status,
      type: status === 301 ? "Permanent (301)" : status === 302 ? "Temporary (302)" : status === 307 ? "Temporary (307)" : status === 308 ? "Permanent (308)" : `Response (${status})`,
    });

    if (![301, 302, 303, 307, 308].includes(status) || !location) break;

    try {
      currentUrl = new URL(location, currentUrl).href;
    } catch {
      break;
    }

    const alreadyVisited = chain.some((c, j) => j < chain.length - 1 && c.url === currentUrl);
    if (alreadyVisited) {
      chain.push({ url: currentUrl, status: 0, type: "LOOP DETECTED" });
      break;
    }
  }

  return {
    chain,
    totalRedirects: chain.length - 1,
    hasLoop: chain.some((c) => c.type === "LOOP DETECTED"),
    finalUrl: chain[chain.length - 1].url,
    finalStatus: chain[chain.length - 1].status,
  };
}

// ─── Readability ─────────────────────────────────────────────────────────────

function countSyllables(word: string): number {
  word = word.toLowerCase().replace(/[^a-z]/g, "");
  if (word.length <= 3) return 1;
  word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "");
  word = word.replace(/^y/, "");
  const match = word.match(/[aeiouy]{1,2}/g);
  return match ? match.length : 1;
}

function handleReadability($: cheerio.CheerioAPI) {
  $("script, style, noscript, nav, footer, header").remove();
  const text = $("body").text().replace(/\s+/g, " ").trim();

  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 5);
  const words = text.split(/\s+/).filter((w) => w.length > 0);
  const totalWords = words.length;
  const totalSentences = Math.max(sentences.length, 1);
  const totalSyllables = words.reduce((s, w) => s + countSyllables(w), 0);
  const complexWords = words.filter((w) => countSyllables(w) >= 3).length;
  const avgSentenceLength = Number((totalWords / totalSentences).toFixed(1));
  const avgSyllablesPerWord = Number((totalSyllables / Math.max(totalWords, 1)).toFixed(2));

  const fleschEase = Number(
    (206.835 - 1.015 * avgSentenceLength - 84.6 * avgSyllablesPerWord).toFixed(1)
  );

  const fleschKincaid = Number(
    (0.39 * avgSentenceLength + 11.8 * avgSyllablesPerWord - 15.59).toFixed(1)
  );

  const gunningFog = Number(
    (0.4 * (avgSentenceLength + 100 * (complexWords / Math.max(totalWords, 1)))).toFixed(1)
  );

  let readabilityLevel: string;
  let readabilityColor: string;
  if (fleschEase >= 80) { readabilityLevel = "Very Easy"; readabilityColor = "emerald"; }
  else if (fleschEase >= 60) { readabilityLevel = "Standard"; readabilityColor = "emerald"; }
  else if (fleschEase >= 40) { readabilityLevel = "Fairly Difficult"; readabilityColor = "amber"; }
  else if (fleschEase >= 20) { readabilityLevel = "Difficult"; readabilityColor = "red"; }
  else { readabilityLevel = "Very Difficult"; readabilityColor = "red"; }

  return {
    totalWords,
    totalSentences,
    totalSyllables,
    complexWords,
    avgSentenceLength,
    avgSyllablesPerWord,
    fleschReadingEase: fleschEase,
    fleschKincaidGrade: fleschKincaid,
    gunningFogIndex: gunningFog,
    readabilityLevel,
    readabilityColor,
    recommendations: [
      avgSentenceLength > 20 && "Shorten your sentences — aim for 15-20 words per sentence",
      complexWords / Math.max(totalWords, 1) > 0.15 && "Use simpler words — too many complex words reduce readability",
      fleschEase < 60 && "Content is harder to read — simplify language for a wider audience",
      totalWords < 300 && "Content is too short — aim for 300+ words for better SEO",
    ].filter(Boolean),
  };
}

// ─── Heading Structure ───────────────────────────────────────────────────────

function handleHeadingStructure($: cheerio.CheerioAPI) {
  const headings: { tag: string; text: string; level: number }[] = [];

  $("h1, h2, h3, h4, h5, h6").each((_, el) => {
    headings.push({
      tag: el.tagName.toUpperCase(),
      text: $(el).text().trim().substring(0, 120),
      level: parseInt(el.tagName.replace("h", "")),
    });
  });

  const issues: string[] = [];
  const h1Count = headings.filter((h) => h.level === 1).length;

  if (h1Count === 0) issues.push("No H1 tag found — every page should have exactly one H1");
  if (h1Count > 1) issues.push(`Multiple H1 tags found (${h1Count}) — use only one H1 per page`);
  if (headings.length > 0 && headings[0].level !== 1) issues.push("First heading is not H1 — page should start with an H1");

  for (let i = 1; i < headings.length; i++) {
    if (headings[i].level - headings[i - 1].level > 1) {
      issues.push(`Skipped heading level: ${headings[i - 1].tag} → ${headings[i].tag} (between "${headings[i - 1].text.substring(0, 40)}..." and "${headings[i].text.substring(0, 40)}...")`);
    }
  }

  const counts: Record<string, number> = { H1: 0, H2: 0, H3: 0, H4: 0, H5: 0, H6: 0 };
  headings.forEach((h) => counts[h.tag]++);

  return { headings, issues, counts, total: headings.length };
}

// ─── Main Handler ────────────────────────────────────────────────────────────

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ tool: string }> }
) {
  try {
    const { tool } = await params;
    const body = await req.json();
    const { url } = body;

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "Please provide a valid URL" }, { status: 400 });
    }

    let targetUrl = url.trim();
    if (!targetUrl.startsWith("http://") && !targetUrl.startsWith("https://")) {
      targetUrl = "https://" + targetUrl;
    }

    if (tool === "redirect-check") {
      const result = await handleRedirectChain(targetUrl);
      return NextResponse.json(result);
    }

    const { html } = await fetchPage(targetUrl);
    const $ = cheerio.load(html);

    switch (tool) {
      case "social-preview":
        return NextResponse.json(handleSocialPreview($, targetUrl));
      case "keyword-density":
        return NextResponse.json(handleKeywordDensity($));
      case "readability":
        return NextResponse.json(handleReadability($));
      case "heading-structure":
        return NextResponse.json(handleHeadingStructure($));
      default:
        return NextResponse.json({ error: "Unknown tool" }, { status: 404 });
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Something went wrong";
    if (msg.includes("timeout") || msg.includes("abort")) {
      return NextResponse.json({ error: "Website took too long to respond" }, { status: 504 });
    }
    if (msg.includes("ENOTFOUND")) {
      return NextResponse.json({ error: "Website not found. Check the URL." }, { status: 404 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
