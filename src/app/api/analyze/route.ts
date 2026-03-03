import { NextRequest, NextResponse } from "next/server";
import { analyzeSite } from "@/lib/analyzer";
import type { PageSpeedData, DomainData } from "@/lib/analyzer";

export const maxDuration = 60;

// ─── SSRF Protection ─────────────────────────────────────────────────────────

function isSafeUrl(rawUrl: string): boolean {
  let parsed: URL;
  try {
    let u = rawUrl.trim();
    if (!u.startsWith("http://") && !u.startsWith("https://")) u = "https://" + u;
    parsed = new URL(u);
  } catch {
    return false;
  }

  const { protocol, hostname } = parsed;

  // Only allow http/https
  if (protocol !== "http:" && protocol !== "https:") return false;

  const h = hostname.toLowerCase();

  // Block localhost variants
  if (h === "localhost" || h === "127.0.0.1" || h === "0.0.0.0" || h === "[::1]") return false;

  // Block hostnames without a dot (internal names like "server", "db", "redis")
  if (!h.includes(".")) return false;

  // Block private IP ranges
  const ipv4 = h.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4) {
    const [, a, b] = ipv4.map(Number);
    // 10.0.0.0/8
    if (a === 10) return false;
    // 172.16.0.0/12
    if (a === 172 && b >= 16 && b <= 31) return false;
    // 192.168.0.0/16
    if (a === 192 && b === 168) return false;
    // 127.x.x.x (loopback)
    if (a === 127) return false;
    // 169.254.x.x (link-local)
    if (a === 169 && b === 254) return false;
  }

  return true;
}

// ─── PageSpeed Data Extraction ────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractPageSpeedData(json: any): PageSpeedData | undefined {
  try {
    const audits = json?.lighthouseResult?.audits;
    const categories = json?.lighthouseResult?.categories;
    if (!audits || !categories) return undefined;

    const score = Math.round((categories?.performance?.score ?? 0) * 100);

    const lcp = audits["largest-contentful-paint"]?.numericValue
      ? (audits["largest-contentful-paint"].numericValue / 1000).toFixed(1)
      : "0";
    const cls = audits["cumulative-layout-shift"]?.numericValue?.toFixed(2) ?? "0";
    const tbt = audits["total-blocking-time"]?.numericValue?.toFixed(0) ?? "0";
    const fcp = audits["first-contentful-paint"]?.numericValue
      ? (audits["first-contentful-paint"].numericValue / 1000).toFixed(1)
      : "0";
    const speedIndex = audits["speed-index"]?.numericValue
      ? (audits["speed-index"].numericValue / 1000).toFixed(1)
      : "0";
    const tti = audits["interactive"]?.numericValue
      ? (audits["interactive"].numericValue / 1000).toFixed(1)
      : "0";

    return {
      performanceScore: score,
      lcp,
      cls,
      tbt,
      fcp,
      speedIndex,
      tti,
    };
  } catch {
    return undefined;
  }
}

// ─── Route Handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { url } = body;

    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { error: "Please provide a valid URL" },
        { status: 400 }
      );
    }

    const cleanUrl = url.trim();
    const cleanedWithoutProtocol = cleanUrl.replace(/^(https?:\/\/)/, "");
    if (!cleanedWithoutProtocol.includes(".")) {
      return NextResponse.json(
        { error: "Invalid URL format. Example: example.com or https://example.com" },
        { status: 400 }
      );
    }

    // SSRF protection — block private/internal URLs
    if (!isSafeUrl(cleanUrl)) {
      return NextResponse.json(
        { error: "This URL is not allowed for security reasons." },
        { status: 400 }
      );
    }

    // Optional: Google PageSpeed Insights API
    let pageSpeedData: PageSpeedData | undefined;
    const apiKey = process.env.GOOGLE_PAGESPEED_API_KEY;
    if (apiKey) {
      try {
        const fullUrl = cleanUrl.startsWith("http") ? cleanUrl : "https://" + cleanUrl;
        const psUrl = `https://pagespeedonline.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(fullUrl)}&strategy=mobile&key=${apiKey}`;
        const psRes = await fetch(psUrl, { signal: AbortSignal.timeout(15000) });
        if (psRes.ok) {
          const psJson = await psRes.json();
          pageSpeedData = extractPageSpeedData(psJson);
        }
      } catch {
        // Silent fallback — analysis continues without PageSpeed data
      }
    }

    // Optional: OpenPageRank API for Domain Authority
    let domainData: DomainData | undefined;
    const oprKey = process.env.OPEN_PAGE_RANK_API_KEY;
    if (oprKey) {
      try {
        const fullUrl = cleanUrl.startsWith("http") ? cleanUrl : "https://" + cleanUrl;
        const domain = new URL(fullUrl).hostname.replace(/^www\./, "");
        const oprUrl = `https://openpagerank.com/api/v1.0/getPageRank?domains[0]=${encodeURIComponent(domain)}`;
        const oprRes = await fetch(oprUrl, {
          headers: { "API-OPR": oprKey },
          signal: AbortSignal.timeout(8000),
        });
        if (oprRes.ok) {
          const oprJson = await oprRes.json();
          const entry = oprJson?.response?.[0];
          if (entry && entry.status_code === 200) {
            domainData = {
              domainAuthority: Math.round(entry.page_rank_integer ?? 0),
              globalRank: entry.rank ? parseInt(entry.rank) : 0,
            };
          }
        }
      } catch {
        // Silent fallback — analysis continues without domain authority data
      }
    }

    const result = await analyzeSite(cleanUrl, pageSpeedData, domainData);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Something went wrong";

    if (message.includes("timeout") || message.includes("abort")) {
      return NextResponse.json(
        {
          error:
            "The website took too long to respond. Please try again or check if the URL is correct.",
        },
        { status: 504 }
      );
    }

    if (message.includes("ENOTFOUND") || message.includes("getaddrinfo")) {
      return NextResponse.json(
        { error: "Website not found. Please check the URL and try again." },
        { status: 404 }
      );
    }

    console.error("Analysis error:", message);
    return NextResponse.json(
      { error: `Failed to analyze: ${message}` },
      { status: 500 }
    );
  }
}
