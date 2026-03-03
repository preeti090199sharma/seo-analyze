import * as cheerio from "cheerio";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface Check {
  name: string;
  status: "pass" | "fail" | "warning";
  priority: "critical" | "high" | "medium" | "low";
  message: string;
  value?: string;
  recommendation?: string;
  fix?: string;
}

export interface CategoryResult {
  name: string;
  score: number;
  icon: string;
  checks: Check[];
}

export interface PageSpeedData {
  performanceScore: number;
  lcp: string;
  cls: string;
  tbt: string;
  fcp: string;
  speedIndex: string;
  tti: string;
}

export interface AnalysisResult {
  url: string;
  score: number;
  analyzedAt: string;
  pageTitle: string;
  categories: {
    meta: CategoryResult;
    headings: CategoryResult;
    images: CategoryResult;
    links: CategoryResult;
    content: CategoryResult;
    technical: CategoryResult;
    social: CategoryResult;
    security: CategoryResult;
    performance: CategoryResult;
  };
  summary: {
    totalChecks: number;
    passed: number;
    warnings: number;
    failed: number;
    criticalIssues: string[];
    pageSpeedAvailable: boolean;
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function stripTags(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function calcCategoryScore(checks: Check[]): number {
  if (checks.length === 0) return 100;
  const points = checks.reduce((sum, c) => {
    if (c.status === "pass") return sum + 1;
    if (c.status === "warning") return sum + 0.5;
    return sum;
  }, 0);
  return Math.round((points / checks.length) * 100);
}

// ─── Meta Tags ───────────────────────────────────────────────────────────────

function analyzeMeta($: cheerio.CheerioAPI, url: string): CategoryResult {
  const checks: Check[] = [];

  const title = $("title").text().trim();
  if (!title) {
    checks.push({
      name: "Page Title",
      status: "fail",
      priority: "critical",
      message: "Page title is missing — this is one of the most important SEO factors",
      recommendation: "Add a descriptive <title> tag between 50-60 characters",
      fix: '<title>Your Page Title | Brand Name</title>',
    });
  } else if (title.length < 30) {
    checks.push({
      name: "Page Title",
      status: "warning",
      priority: "medium",
      message: `Title is too short (${title.length} chars) — may lack keywords`,
      value: title,
      recommendation: "Title should be 50-60 characters for optimal SERP display",
    });
  } else if (title.length > 60) {
    checks.push({
      name: "Page Title",
      status: "warning",
      priority: "medium",
      message: `Title is too long (${title.length} chars) — will be truncated in search results`,
      value: title,
      recommendation: "Keep title under 60 characters to avoid truncation",
    });
  } else {
    checks.push({
      name: "Page Title",
      status: "pass",
      priority: "critical",
      message: `Title is optimal (${title.length} chars)`,
      value: title,
    });
  }

  const desc = $('meta[name="description"]').attr("content")?.trim() ?? "";
  if (!desc) {
    checks.push({
      name: "Meta Description",
      status: "fail",
      priority: "high",
      message: "Meta description is missing — search engines will auto-generate one",
      recommendation: "Add a compelling meta description between 150-160 characters",
      fix: '<meta name="description" content="Your compelling page description (150-160 chars)">',
    });
  } else if (desc.length < 120) {
    checks.push({
      name: "Meta Description",
      status: "warning",
      priority: "medium",
      message: `Description is too short (${desc.length} chars) — may not appear in full`,
      value: desc,
      recommendation: "Expand to 150-160 characters for best SERP display",
    });
  } else if (desc.length > 160) {
    checks.push({
      name: "Meta Description",
      status: "warning",
      priority: "medium",
      message: `Description may be truncated (${desc.length} chars)`,
      value: desc,
      recommendation: "Keep under 160 characters to avoid truncation",
    });
  } else {
    checks.push({
      name: "Meta Description",
      status: "pass",
      priority: "high",
      message: `Description is optimal (${desc.length} chars)`,
      value: desc,
    });
  }

  const viewport = $('meta[name="viewport"]').attr("content") ?? "";
  checks.push({
    name: "Viewport Meta",
    status: viewport ? "pass" : "fail",
    priority: viewport ? "high" : "high",
    message: viewport
      ? "Viewport meta tag is set — mobile-friendly"
      : "Viewport meta tag is missing — site will NOT be mobile-friendly",
    value: viewport || undefined,
    recommendation: viewport
      ? undefined
      : 'Add <meta name="viewport" content="width=device-width, initial-scale=1">',
    fix: viewport
      ? undefined
      : '<meta name="viewport" content="width=device-width, initial-scale=1">',
  });

  const charset =
    $("meta[charset]").length > 0 ||
    $('meta[http-equiv="Content-Type"]').length > 0;
  checks.push({
    name: "Charset Declaration",
    status: charset ? "pass" : "warning",
    priority: "low",
    message: charset
      ? "Character encoding is declared"
      : "No explicit charset declaration found",
    recommendation: charset
      ? undefined
      : 'Add <meta charset="UTF-8"> to <head>',
    fix: charset ? undefined : '<meta charset="UTF-8">',
  });

  const robots = $('meta[name="robots"]').attr("content") ?? "";
  if (robots && robots.includes("noindex")) {
    checks.push({
      name: "Robots Meta",
      status: "fail",
      priority: "critical",
      message: "Page is set to noindex — it will NOT appear in search results",
      value: robots,
      recommendation: "Remove the noindex directive unless you intentionally want to hide this page",
    });
  } else {
    checks.push({
      name: "Robots Meta",
      status: "pass",
      priority: "critical",
      message: robots
        ? `Robots directive: ${robots}`
        : "No restrictive robots meta — page is indexable",
      value: robots || undefined,
    });
  }

  // Meta Keywords (outdated but still checked by some tools)
  const metaKeywords = $('meta[name="keywords"]').attr("content")?.trim() ?? "";
  if (metaKeywords) {
    checks.push({
      name: "Meta Keywords",
      status: "warning",
      priority: "low",
      message: `Meta keywords tag found — Google ignores this, Bing may use it`,
      value: metaKeywords.substring(0, 100),
      recommendation: "Meta keywords are outdated. Focus on quality content instead.",
    });
  }

  // OG Image dimensions
  const ogImgWidth = $('meta[property="og:image:width"]').attr("content") ?? "";
  const ogImgHeight = $('meta[property="og:image:height"]').attr("content") ?? "";
  const ogImage = $('meta[property="og:image"]').attr("content") ?? "";
  if (ogImage && (!ogImgWidth || !ogImgHeight)) {
    checks.push({
      name: "OG Image Dimensions",
      status: "warning",
      priority: "low",
      message: "OG image is set but width/height not specified — some platforms may not render it correctly",
      recommendation: "Add og:image:width and og:image:height (recommended: 1200x630)",
      fix: '<meta property="og:image:width" content="1200">\n<meta property="og:image:height" content="630">',
    });
  } else if (ogImage && ogImgWidth && ogImgHeight) {
    checks.push({
      name: "OG Image Dimensions",
      status: "pass",
      priority: "low",
      message: `OG image dimensions specified: ${ogImgWidth}x${ogImgHeight}`,
    });
  }

  const canonical = $('link[rel="canonical"]').attr("href") ?? "";
  if (!canonical) {
    checks.push({
      name: "Canonical URL",
      status: "warning",
      priority: "medium",
      message: "No canonical URL — may cause duplicate content issues",
      recommendation: "Add a canonical link to specify the preferred URL",
      fix: `<link rel="canonical" href="${url}">`,
    });
  } else {
    const isAbsolute = canonical.startsWith("http://") || canonical.startsWith("https://");
    if (!isAbsolute) {
      checks.push({
        name: "Canonical URL",
        status: "warning",
        priority: "medium",
        message: "Canonical URL is relative — should be an absolute URL",
        value: canonical,
        recommendation: "Use an absolute URL including the domain",
        fix: `<link rel="canonical" href="https://yourdomain.com${canonical}">`,
      });
    } else {
      checks.push({
        name: "Canonical URL",
        status: "pass",
        priority: "medium",
        message: "Canonical URL is correctly set to an absolute URL",
        value: canonical,
      });
    }
  }

  return {
    name: "Meta Tags",
    icon: "🏷️",
    score: calcCategoryScore(checks),
    checks,
  };
}

// ─── Headings ────────────────────────────────────────────────────────────────

function analyzeHeadings($: cheerio.CheerioAPI): CategoryResult {
  const checks: Check[] = [];

  const h1s = $("h1");
  if (h1s.length === 0) {
    checks.push({
      name: "H1 Tag",
      status: "fail",
      priority: "critical",
      message: "No H1 tag found — search engines use H1 to understand page topic",
      recommendation: "Add exactly one H1 tag that describes the main page topic",
      fix: "<h1>Your Main Page Heading</h1>",
    });
  } else if (h1s.length > 1) {
    checks.push({
      name: "H1 Tag",
      status: "warning",
      priority: "high",
      message: `Multiple H1 tags found (${h1s.length}) — can confuse search engines`,
      recommendation: "Use only one H1 tag per page",
    });
  } else {
    const h1Text = h1s.first().text().trim();
    checks.push({
      name: "H1 Tag",
      status: "pass",
      priority: "critical",
      message: "Single H1 tag found",
      value: h1Text.substring(0, 100),
    });
  }

  const headingCounts = {
    h2: $("h2").length,
    h3: $("h3").length,
    h4: $("h4").length,
    h5: $("h5").length,
    h6: $("h6").length,
  };

  const hasSubheadings = headingCounts.h2 > 0;
  checks.push({
    name: "Subheadings (H2)",
    status: hasSubheadings ? "pass" : "warning",
    priority: "medium",
    message: hasSubheadings
      ? `${headingCounts.h2} H2 subheading(s) found — good content structure`
      : "No H2 subheadings — content lacks structure",
    recommendation: hasSubheadings
      ? undefined
      : "Use H2 tags to break content into clearly defined sections",
  });

  const hierarchy: number[] = [];
  $("h1,h2,h3,h4,h5,h6").each((_, el) => {
    const level = parseInt(el.tagName.replace("h", ""));
    hierarchy.push(level);
  });

  let skipsLevel = false;
  for (let i = 1; i < hierarchy.length; i++) {
    if (hierarchy[i] - hierarchy[i - 1] > 1) {
      skipsLevel = true;
      break;
    }
  }

  checks.push({
    name: "Heading Hierarchy",
    status: skipsLevel ? "warning" : "pass",
    priority: "medium",
    message: skipsLevel
      ? "Heading levels are skipped (e.g. H2 → H4) — breaks semantic structure"
      : "Heading hierarchy is properly structured",
    value: `H1:${h1s.length} H2:${headingCounts.h2} H3:${headingCounts.h3} H4:${headingCounts.h4}`,
    recommendation: skipsLevel
      ? "Use heading levels in sequence: H1 → H2 → H3, never skip levels"
      : undefined,
  });

  return {
    name: "Headings",
    icon: "📑",
    score: calcCategoryScore(checks),
    checks,
  };
}

// ─── Images ──────────────────────────────────────────────────────────────────

function analyzeImages($: cheerio.CheerioAPI): CategoryResult {
  const checks: Check[] = [];
  const images = $("img");
  const totalImages = images.length;

  if (totalImages === 0) {
    checks.push({
      name: "Images Found",
      status: "warning",
      priority: "low",
      message: "No images found on the page",
      recommendation: "Consider adding relevant images to improve user engagement",
    });
    return { name: "Images", icon: "🖼️", score: calcCategoryScore(checks), checks };
  }

  checks.push({
    name: "Images Found",
    status: "pass",
    priority: "low",
    message: `${totalImages} image(s) found on the page`,
  });

  let missingAlt = 0;
  let decorativeAlt = 0;
  const missingAltSrcs: string[] = [];

  images.each((_, img) => {
    const alt = $(img).attr("alt");
    const src = $(img).attr("src") || $(img).attr("data-src") || "unknown";
    if (alt === undefined) {
      missingAlt++;
      if (missingAltSrcs.length < 5) missingAltSrcs.push(src.substring(0, 80));
    } else if (alt.trim() === "") {
      decorativeAlt++;
    }
  });

  if (missingAlt > 0) {
    checks.push({
      name: "Missing Alt Text",
      status: "fail",
      priority: "medium",
      message: `${missingAlt} image(s) are completely missing the alt attribute`,
      value: missingAltSrcs.join(" | "),
      recommendation: "Add descriptive alt text to all images for accessibility and SEO",
      fix: '<img src="image.jpg" alt="Descriptive text about the image">',
    });
  } else {
    checks.push({
      name: "Alt Text",
      status: "pass",
      priority: "medium",
      message: "All images have alt attributes",
    });
  }

  if (decorativeAlt > 0) {
    checks.push({
      name: "Decorative Images",
      status: "pass",
      priority: "low",
      message: `${decorativeAlt} image(s) use empty alt="" — correct for decorative images`,
    });
  }

  let missingDimensions = 0;
  images.each((_, img) => {
    const src = $(img).attr("src") || "";
    if (src && !src.includes("svg") && !src.startsWith("data:")) {
      if (!$(img).attr("width") || !$(img).attr("height")) {
        missingDimensions++;
      }
    }
  });

  if (missingDimensions > 0) {
    checks.push({
      name: "Image Dimensions",
      status: "warning",
      priority: "low",
      message: `${missingDimensions} image(s) missing explicit width/height attributes`,
      recommendation: "Set width and height attributes to prevent layout shifts (CLS)",
      fix: '<img src="image.jpg" alt="..." width="800" height="600">',
    });
  } else if (totalImages > 0) {
    checks.push({
      name: "Image Dimensions",
      status: "pass",
      priority: "low",
      message: "All images have explicit dimensions",
    });
  }

  // Modern image formats (WebP / AVIF)
  const webpImages = $('picture source[type="image/webp"]').length +
    $('img[src$=".webp"]').length + $('img[src*=".webp?"]').length;
  const avifImages = $('picture source[type="image/avif"]').length +
    $('img[src$=".avif"]').length;
  if (webpImages > 0 || avifImages > 0) {
    checks.push({
      name: "Modern Image Formats",
      status: "pass",
      priority: "medium",
      message: `Modern formats in use: ${webpImages} WebP, ${avifImages} AVIF — great for performance`,
    });
  } else if (totalImages > 0) {
    checks.push({
      name: "Modern Image Formats",
      status: "warning",
      priority: "medium",
      message: "No WebP or AVIF images found — modern formats are 25-50% smaller than JPEG/PNG",
      recommendation: "Convert images to WebP/AVIF and use <picture> element for fallback",
      fix: '<picture>\n  <source srcset="image.webp" type="image/webp">\n  <img src="image.jpg" alt="...">\n</picture>',
    });
  }

  const lazyImages = $('img[loading="lazy"]').length;
  if (totalImages > 3 && lazyImages === 0) {
    checks.push({
      name: "Lazy Loading",
      status: "warning",
      priority: "low",
      message: "No images use lazy loading — may slow initial page load",
      recommendation: 'Add loading="lazy" to below-the-fold images for faster load times',
      fix: '<img src="image.jpg" alt="..." loading="lazy">',
    });
  } else if (lazyImages > 0) {
    checks.push({
      name: "Lazy Loading",
      status: "pass",
      priority: "low",
      message: `${lazyImages} image(s) use lazy loading — great for performance`,
    });
  }

  return {
    name: "Images",
    icon: "🖼️",
    score: calcCategoryScore(checks),
    checks,
  };
}

// ─── Links ───────────────────────────────────────────────────────────────────

function analyzeLinks(
  $: cheerio.CheerioAPI,
  baseUrl: string,
  brokenLinkCheck: Check | null
): CategoryResult {
  const checks: Check[] = [];
  const links = $("a");
  const totalLinks = links.length;

  let internal = 0;
  let external = 0;
  let noHref = 0;
  let emptyAnchors = 0;

  const baseHost = new URL(baseUrl).hostname;

  links.each((_, a) => {
    const href = $(a).attr("href") || "";
    const text = $(a).text().trim();

    if (!href || href === "#" || href === "javascript:void(0)") {
      noHref++;
    } else {
      try {
        const linkUrl = new URL(href, baseUrl);
        if (linkUrl.hostname === baseHost) {
          internal++;
        } else {
          external++;
        }
      } catch {
        internal++;
      }
    }

    if (!text && !$(a).find("img").length) emptyAnchors++;
  });

  checks.push({
    name: "Total Links",
    status: "pass",
    priority: "low",
    message: `${totalLinks} links found on the page`,
    value: `Internal: ${internal} | External: ${external}`,
  });

  if (internal === 0) {
    checks.push({
      name: "Internal Links",
      status: "warning",
      priority: "medium",
      message: "No internal links found — hurts site crawlability and PageRank flow",
      recommendation: "Add internal links to related pages to improve navigation and SEO",
    });
  } else {
    checks.push({
      name: "Internal Links",
      status: "pass",
      priority: "medium",
      message: `${internal} internal link(s) found — good for site structure`,
    });
  }

  if (noHref > 0) {
    checks.push({
      name: "Empty/Invalid Links",
      status: "warning",
      priority: "low",
      message: `${noHref} link(s) have no valid href destination`,
      recommendation: "Remove or fix links without proper destinations",
    });
  } else {
    checks.push({
      name: "Link Validity",
      status: "pass",
      priority: "low",
      message: "All links have valid href attributes",
    });
  }

  if (emptyAnchors > 0) {
    checks.push({
      name: "Anchor Text",
      status: "warning",
      priority: "medium",
      message: `${emptyAnchors} link(s) have no visible anchor text`,
      recommendation: "Add descriptive anchor text for better accessibility and SEO signals",
    });
  } else {
    checks.push({
      name: "Anchor Text",
      status: "pass",
      priority: "medium",
      message: "All links have visible anchor text or images",
    });
  }

  if (brokenLinkCheck) {
    checks.push(brokenLinkCheck);
  }

  // Hreflang (international SEO)
  const hreflang = $('link[rel="alternate"][hreflang]');
  if (hreflang.length > 0) {
    checks.push({
      name: "Hreflang Tags",
      status: "pass",
      priority: "medium",
      message: `${hreflang.length} hreflang tag(s) found — good for international/multilingual SEO`,
      value: hreflang.map((_, el) => $(el).attr("hreflang")).get().join(", "),
    });
  } else {
    checks.push({
      name: "Hreflang Tags",
      status: "warning",
      priority: "low",
      message: "No hreflang tags — needed if your site targets multiple languages or regions",
      recommendation: "Add hreflang tags if your site has multilingual/multi-region content",
      fix: '<link rel="alternate" hreflang="en" href="https://example.com/en/">\n<link rel="alternate" hreflang="es" href="https://example.com/es/">',
    });
  }

  // Pagination (rel next/prev)
  const relNext = $('link[rel="next"]').attr("href") ?? "";
  const relPrev = $('link[rel="prev"]').attr("href") ?? "";
  if (relNext || relPrev) {
    checks.push({
      name: "Pagination Tags",
      status: "pass",
      priority: "low",
      message: `Pagination tags found — helps Google understand paginated content`,
      value: [relPrev && `prev: ${relPrev}`, relNext && `next: ${relNext}`].filter(Boolean).join(" | "),
    });
  }

  return {
    name: "Links",
    icon: "🔗",
    score: calcCategoryScore(checks),
    checks,
  };
}

// ─── Content ─────────────────────────────────────────────────────────────────

function analyzeContent($: cheerio.CheerioAPI): CategoryResult {
  const checks: Check[] = [];

  $("script, style, noscript").remove();
  const bodyText = stripTags($("body").html() || "");
  const words = bodyText.split(/\s+/).filter((w) => w.length > 0);
  const wordCount = words.length;

  if (wordCount < 100) {
    checks.push({
      name: "Word Count",
      status: "fail",
      priority: "high",
      message: `Only ${wordCount} words — extremely thin content, likely penalized by Google`,
      recommendation: "Add at least 300 words of quality, relevant content",
    });
  } else if (wordCount < 300) {
    checks.push({
      name: "Word Count",
      status: "warning",
      priority: "medium",
      message: `Page has ${wordCount} words — may be considered thin content`,
      recommendation: "Aim for 300+ words for better rankings; 1000+ for competitive topics",
    });
  } else if (wordCount < 1000) {
    checks.push({
      name: "Word Count",
      status: "pass",
      priority: "medium",
      message: `Page has ${wordCount} words — decent content length`,
    });
  } else {
    checks.push({
      name: "Word Count",
      status: "pass",
      priority: "medium",
      message: `Page has ${wordCount} words — excellent content depth`,
    });
  }

  const htmlLength = $("html").html()?.length || 0;
  const textRatio =
    htmlLength > 0 ? Math.round((bodyText.length / htmlLength) * 100) : 0;

  if (textRatio < 10) {
    checks.push({
      name: "Text-to-HTML Ratio",
      status: "warning",
      priority: "low",
      message: `Low text-to-HTML ratio (${textRatio}%) — page is bloated with markup`,
      recommendation: "Move inline styles/scripts to external files to improve ratio",
    });
  } else {
    checks.push({
      name: "Text-to-HTML Ratio",
      status: "pass",
      priority: "low",
      message: `Text-to-HTML ratio is ${textRatio}% — good content density`,
    });
  }

  const paragraphs = $("p").length;
  checks.push({
    name: "Paragraphs",
    status: paragraphs > 0 ? "pass" : "warning",
    priority: "low",
    message:
      paragraphs > 0
        ? `${paragraphs} paragraph(s) found — good content structure`
        : "No paragraph tags found — content may lack proper structure",
    recommendation:
      paragraphs > 0
        ? undefined
        : "Wrap text content in <p> tags for proper semantic structure",
  });

  const lists = $("ul, ol").length;
  checks.push({
    name: "Lists",
    status: lists > 0 ? "pass" : "warning",
    priority: "low",
    message:
      lists > 0
        ? `${lists} list(s) found — improves readability and featured snippet chances`
        : "No lists found — consider using lists for scannable content",
  });

  // RSS / Atom Feed
  const rssFeed = $('link[type="application/rss+xml"], link[type="application/atom+xml"]');
  if (rssFeed.length > 0) {
    checks.push({
      name: "RSS/Atom Feed",
      status: "pass",
      priority: "low",
      message: `RSS/Atom feed found — helps with content syndication and subscribers`,
      value: rssFeed.first().attr("href") || "",
    });
  } else {
    checks.push({
      name: "RSS/Atom Feed",
      status: "warning",
      priority: "low",
      message: "No RSS/Atom feed detected — useful for blogs and news sites",
      recommendation: "Add an RSS feed if you publish regular content",
    });
  }

  return {
    name: "Content",
    icon: "📝",
    score: calcCategoryScore(checks),
    checks,
  };
}

// ─── Technical ───────────────────────────────────────────────────────────────

function analyzeTechnical(
  $: cheerio.CheerioAPI,
  url: string,
  headers: Record<string, string>,
  sitemapExists: boolean,
  robotsExists: boolean,
  responseTime: number,
  htmlSize: number,
  has404?: boolean
): CategoryResult {
  const checks: Check[] = [];

  const doctype = ($("html").html() || "").toLowerCase().includes("<!doctype");
  checks.push({
    name: "DOCTYPE",
    status: doctype ? "pass" : "warning",
    priority: "low",
    message: doctype
      ? "HTML DOCTYPE is declared"
      : "DOCTYPE declaration not found — may trigger browser quirks mode",
    fix: doctype ? undefined : "<!DOCTYPE html>",
  });

  const lang = $("html").attr("lang") || "";
  checks.push({
    name: "Language Attribute",
    status: lang ? "pass" : "warning",
    priority: "medium",
    message: lang
      ? `Language is set to "${lang}" — good for accessibility and international SEO`
      : "No lang attribute on <html> — affects accessibility and hreflang signals",
    recommendation: lang
      ? undefined
      : 'Add lang attribute: <html lang="en">',
    fix: lang ? undefined : '<html lang="en">',
  });

  const favicon =
    $('link[rel="icon"]').length > 0 ||
    $('link[rel="shortcut icon"]').length > 0 ||
    $('link[rel="apple-touch-icon"]').length > 0;
  checks.push({
    name: "Favicon",
    status: favicon ? "pass" : "warning",
    priority: "low",
    message: favicon
      ? "Favicon is set"
      : "No favicon found — site looks unprofessional in browser tabs and bookmarks",
    recommendation: favicon ? undefined : "Add a favicon link in <head>",
    fix: favicon ? undefined : '<link rel="icon" href="/favicon.ico" type="image/x-icon">',
  });

  checks.push({
    name: "Sitemap.xml",
    status: sitemapExists ? "pass" : "warning",
    priority: "medium",
    message: sitemapExists
      ? "Sitemap.xml is accessible — helps search engines discover all pages"
      : "Sitemap.xml not found — search engines may miss pages",
    recommendation: sitemapExists
      ? undefined
      : "Create a sitemap.xml and submit it to Google Search Console",
  });

  checks.push({
    name: "Robots.txt",
    status: robotsExists ? "pass" : "warning",
    priority: "medium",
    message: robotsExists
      ? "Robots.txt is accessible"
      : "Robots.txt not found — search engines will crawl all pages by default",
    recommendation: robotsExists
      ? undefined
      : "Create a robots.txt to control search engine crawling behavior",
  });

  const jsonLd = $('script[type="application/ld+json"]');
  checks.push({
    name: "Structured Data",
    status: jsonLd.length > 0 ? "pass" : "warning",
    priority: "medium",
    message:
      jsonLd.length > 0
        ? `${jsonLd.length} structured data block(s) found — eligible for rich results`
        : "No structured data (JSON-LD) found — missing rich result opportunities",
    recommendation:
      jsonLd.length > 0
        ? undefined
        : "Add JSON-LD structured data for rich search results (e.g. FAQ, Product, Organization)",
    fix: jsonLd.length > 0 ? undefined :
      `<script type="application/ld+json">
{"@context":"https://schema.org","@type":"Organization","name":"Your Brand","url":"${url}"}
</script>`,
  });

  const inlineStyles = $("[style]").length;
  checks.push({
    name: "Inline Styles",
    status: inlineStyles > 20 ? "warning" : "pass",
    priority: "low",
    message:
      inlineStyles > 20
        ? `${inlineStyles} elements use inline styles — slows rendering, hurts performance`
        : `${inlineStyles} inline style(s) — acceptable`,
    recommendation: inlineStyles > 20
      ? "Move styles to external CSS files for better performance and maintainability"
      : undefined,
  });

  const renderBlockingScripts = $("head script:not([async]):not([defer]):not([type])").length;
  if (renderBlockingScripts > 0) {
    checks.push({
      name: "Render-Blocking Scripts",
      status: "warning",
      priority: "medium",
      message: `${renderBlockingScripts} render-blocking script(s) in <head> — delays first paint`,
      recommendation: "Add async or defer attribute to non-critical scripts",
      fix: '<script src="script.js" defer></script>',
    });
  } else {
    checks.push({
      name: "Render-Blocking Scripts",
      status: "pass",
      priority: "medium",
      message: "No render-blocking scripts detected in <head>",
    });
  }

  const htmlKb = Math.round(htmlSize / 1024);
  if (htmlKb > 500) {
    checks.push({
      name: "Page Size",
      status: "fail",
      priority: "high",
      message: `HTML is very large (${htmlKb}KB) — significantly impacts load time`,
      recommendation: "Reduce HTML size by removing unnecessary code, whitespace, and inline scripts",
    });
  } else if (htmlKb > 100) {
    checks.push({
      name: "Page Size",
      status: "warning",
      priority: "medium",
      message: `HTML size is ${htmlKb}KB — consider optimization`,
      recommendation: "Enable GZIP/Brotli compression and minimize HTML output",
    });
  } else {
    checks.push({
      name: "Page Size",
      status: "pass",
      priority: "medium",
      message: `HTML size is ${htmlKb}KB — good`,
    });
  }

  // Text Compression (Gzip / Brotli)
  const contentEncoding = headers["content-encoding"] ?? "";
  const isCompressed = contentEncoding.includes("gzip") || contentEncoding.includes("br") || contentEncoding.includes("deflate");
  checks.push({
    name: "Text Compression",
    status: isCompressed ? "pass" : "warning",
    priority: "medium",
    message: isCompressed
      ? `Compression enabled: ${contentEncoding} — reduces transfer size significantly`
      : "No text compression detected — enable Gzip or Brotli to reduce page size by 60-80%",
    recommendation: isCompressed ? undefined : "Enable Gzip or Brotli compression on your server",
    fix: isCompressed ? undefined : "# Nginx:\ngzip on;\ngzip_types text/html text/css application/javascript;\n\n# Apache:\nAddOutputFilterByType DEFLATE text/html text/css application/javascript",
  });

  // Cache-Control
  const cacheControl = headers["cache-control"] ?? "";
  if (cacheControl) {
    checks.push({
      name: "Cache-Control",
      status: "pass",
      priority: "medium",
      message: `Cache-Control header set: ${cacheControl}`,
      value: cacheControl,
    });
  } else {
    checks.push({
      name: "Cache-Control",
      status: "warning",
      priority: "medium",
      message: "No Cache-Control header — browsers cannot cache this page efficiently",
      recommendation: "Set Cache-Control headers to improve repeat visit performance",
      fix: "Cache-Control: public, max-age=3600, must-revalidate",
    });
  }

  // Preconnect / DNS-prefetch hints
  const preconnect = $('link[rel="preconnect"], link[rel="dns-prefetch"]');
  if (preconnect.length > 0) {
    checks.push({
      name: "Resource Hints",
      status: "pass",
      priority: "low",
      message: `${preconnect.length} preconnect/dns-prefetch hint(s) found — speeds up third-party connections`,
    });
  } else {
    checks.push({
      name: "Resource Hints",
      status: "warning",
      priority: "low",
      message: "No preconnect or dns-prefetch hints — add them for faster third-party resource loading",
      recommendation: "Add preconnect for fonts, analytics, CDN domains",
      fix: '<link rel="preconnect" href="https://fonts.googleapis.com">\n<link rel="dns-prefetch" href="//www.google-analytics.com">',
    });
  }

  // AMP (Accelerated Mobile Pages)
  const ampLink = $('link[rel="amphtml"]').attr("href") ?? "";
  const isAmpPage = $("html[amp], html[⚡]").length > 0;
  if (ampLink || isAmpPage) {
    checks.push({
      name: "AMP",
      status: "pass",
      priority: "low",
      message: isAmpPage ? "This is an AMP page" : `AMP version linked: ${ampLink}`,
      value: ampLink || undefined,
    });
  }

  // Custom 404 Page
  if (has404 !== undefined) {
    checks.push({
      name: "Custom 404 Page",
      status: has404 ? "pass" : "warning",
      priority: "medium",
      message: has404
        ? "Custom 404 page is configured — missing pages return proper 404 status"
        : "No proper 404 handling detected — missing pages may return 200 (soft 404), confusing search engines",
      recommendation: has404
        ? undefined
        : "Configure your server to return HTTP 404 status for missing pages and create a custom error page",
    });
  }

  const isHttp2 = headers["x-firefox-http3"] || headers["alt-svc"] || (headers["x-powered-by"] || "").includes("HTTP/2");
  const protocol = responseTime < 2000 ? "pass" : responseTime < 5000 ? "warning" : "fail";
  checks.push({
    name: "Response Time",
    status: protocol as "pass" | "warning" | "fail",
    priority: responseTime >= 5000 ? "critical" : responseTime >= 2000 ? "high" : "medium",
    message: `Server responded in ${responseTime}ms${isHttp2 ? " (HTTP/2 detected)" : ""}`,
    value: `${responseTime}ms`,
    recommendation:
      responseTime >= 2000
        ? "Improve server response time — use caching, CDN, and optimize server configuration"
        : undefined,
  });

  return {
    name: "Technical",
    icon: "⚙️",
    score: calcCategoryScore(checks),
    checks,
  };
}

// ─── Social / Open Graph ─────────────────────────────────────────────────────

function analyzeSocial($: cheerio.CheerioAPI): CategoryResult {
  const checks: Check[] = [];

  const ogTags = {
    "og:title": $('meta[property="og:title"]').attr("content") ?? "",
    "og:description": $('meta[property="og:description"]').attr("content") ?? "",
    "og:image": $('meta[property="og:image"]').attr("content") ?? "",
    "og:url": $('meta[property="og:url"]').attr("content") ?? "",
    "og:type": $('meta[property="og:type"]').attr("content") ?? "",
  };

  const ogPresent = Object.values(ogTags).filter((v) => v).length;
  if (ogPresent === 0) {
    checks.push({
      name: "Open Graph Tags",
      status: "fail",
      priority: "high",
      message: "No Open Graph tags found — links shared on social media will look plain",
      recommendation: "Add og:title, og:description, og:image, og:url, og:type",
      fix: `<meta property="og:title" content="Your Page Title">
<meta property="og:description" content="Your page description">
<meta property="og:image" content="https://yourdomain.com/image.jpg">
<meta property="og:url" content="https://yourdomain.com/page">
<meta property="og:type" content="website">`,
    });
  } else if (ogPresent < 4) {
    checks.push({
      name: "Open Graph Tags",
      status: "warning",
      priority: "medium",
      message: `Only ${ogPresent}/5 Open Graph tags found — incomplete social sharing setup`,
      value: Object.entries(ogTags)
        .filter(([, v]) => v)
        .map(([k]) => k)
        .join(", "),
      recommendation: "Add all 5 recommended OG tags for best social sharing experience",
    });
  } else {
    checks.push({
      name: "Open Graph Tags",
      status: "pass",
      priority: "high",
      message: `${ogPresent}/5 Open Graph tags found — great for social sharing`,
    });
  }

  if (ogTags["og:image"]) {
    checks.push({
      name: "OG Image",
      status: "pass",
      priority: "high",
      message: "Social sharing image is set",
      value: ogTags["og:image"].substring(0, 100),
    });
  } else {
    checks.push({
      name: "OG Image",
      status: "fail",
      priority: "high",
      message: "No OG image — shared links will have no preview image on social media",
      recommendation: "Add an og:image (recommended: 1200×630 pixels, under 8MB)",
      fix: '<meta property="og:image" content="https://yourdomain.com/social-image.jpg">',
    });
  }

  const twitterCard = $('meta[name="twitter:card"]').attr("content") ?? "";
  const twitterTitle = $('meta[name="twitter:title"]').attr("content") ?? "";
  const twitterDesc = $('meta[name="twitter:description"]').attr("content") ?? "";

  const twitterPresent = [twitterCard, twitterTitle, twitterDesc].filter((v) => v).length;

  if (twitterPresent === 0) {
    checks.push({
      name: "Twitter Card Tags",
      status: "warning",
      priority: "low",
      message: "No Twitter Card tags found — tweets with this URL will look plain",
      recommendation: "Add twitter:card, twitter:title, twitter:description",
      fix: `<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="Your Page Title">
<meta name="twitter:description" content="Your description">`,
    });
  } else {
    checks.push({
      name: "Twitter Card Tags",
      status: twitterPresent >= 2 ? "pass" : "warning",
      priority: "low",
      message: `${twitterPresent}/3 Twitter Card tags found`,
    });
  }

  return {
    name: "Social Media",
    icon: "📱",
    score: calcCategoryScore(checks),
    checks,
  };
}

// ─── Security ────────────────────────────────────────────────────────────────

function analyzeSecurity(
  url: string,
  headers: Record<string, string>
): CategoryResult {
  const checks: Check[] = [];

  const isHttps = url.startsWith("https://");
  checks.push({
    name: "HTTPS",
    status: isHttps ? "pass" : "fail",
    priority: isHttps ? "critical" : "critical",
    message: isHttps
      ? "Site uses HTTPS — connection is encrypted and trusted by Google"
      : "Site does NOT use HTTPS — Google uses HTTPS as a ranking factor",
    recommendation: isHttps
      ? undefined
      : "Install an SSL certificate immediately. Free certificates are available via Let's Encrypt.",
  });

  const securityHeaders: { name: string; header: string; importance: string; fix: string }[] = [
    {
      name: "X-Content-Type-Options",
      header: "x-content-type-options",
      importance: "Prevents MIME-type sniffing attacks",
      fix: "X-Content-Type-Options: nosniff",
    },
    {
      name: "X-Frame-Options",
      header: "x-frame-options",
      importance: "Prevents clickjacking attacks",
      fix: "X-Frame-Options: DENY",
    },
    {
      name: "Strict-Transport-Security",
      header: "strict-transport-security",
      importance: "Forces HTTPS connections — prevents SSL stripping",
      fix: "Strict-Transport-Security: max-age=31536000; includeSubDomains",
    },
    {
      name: "Content-Security-Policy",
      header: "content-security-policy",
      importance: "Prevents XSS and data injection attacks",
      fix: "Content-Security-Policy: default-src 'self'",
    },
    {
      name: "X-XSS-Protection",
      header: "x-xss-protection",
      importance: "Enables browser XSS filtering",
      fix: "X-XSS-Protection: 1; mode=block",
    },
  ];

  for (const sh of securityHeaders) {
    const value = headers[sh.header] ?? "";
    checks.push({
      name: sh.name,
      status: value ? "pass" : "warning",
      priority: "low",
      message: value
        ? `${sh.name} header is set`
        : `${sh.name} missing — ${sh.importance}`,
      value: value || undefined,
      fix: value ? undefined : sh.fix,
    });
  }

  return {
    name: "Security",
    icon: "🔒",
    score: calcCategoryScore(checks),
    checks,
  };
}

// ─── Performance ─────────────────────────────────────────────────────────────

function analyzePerformance(
  $: cheerio.CheerioAPI,
  pageSpeedData: PageSpeedData | undefined
): CategoryResult {
  const checks: Check[] = [];

  if (pageSpeedData) {
    // Performance Score
    const psScore = pageSpeedData.performanceScore;
    checks.push({
      name: "Performance Score",
      status: psScore >= 90 ? "pass" : psScore >= 50 ? "warning" : "fail",
      priority: psScore < 50 ? "critical" : psScore < 90 ? "high" : "high",
      message: `Google PageSpeed score: ${psScore}/100 (mobile)`,
      value: `${psScore}/100`,
      recommendation: psScore < 90
        ? "Run a full PageSpeed audit at pagespeed.web.dev for specific recommendations"
        : undefined,
    });

    // LCP
    const lcpMs = parseFloat(pageSpeedData.lcp) * 1000;
    checks.push({
      name: "Largest Contentful Paint (LCP)",
      status: lcpMs <= 2500 ? "pass" : lcpMs <= 4000 ? "warning" : "fail",
      priority: lcpMs > 4000 ? "critical" : lcpMs > 2500 ? "high" : "high",
      message: `LCP: ${pageSpeedData.lcp} — ${lcpMs <= 2500 ? "Good (under 2.5s)" : lcpMs <= 4000 ? "Needs improvement (2.5–4s)" : "Poor (over 4s)"}`,
      value: pageSpeedData.lcp,
      recommendation: lcpMs > 2500
        ? "Optimize the largest element (hero image/text): use CDN, compress images, preload key resources"
        : undefined,
    });

    // CLS
    const clsVal = parseFloat(pageSpeedData.cls);
    checks.push({
      name: "Cumulative Layout Shift (CLS)",
      status: clsVal <= 0.1 ? "pass" : clsVal <= 0.25 ? "warning" : "fail",
      priority: clsVal > 0.25 ? "critical" : clsVal > 0.1 ? "high" : "high",
      message: `CLS: ${pageSpeedData.cls} — ${clsVal <= 0.1 ? "Good (under 0.1)" : clsVal <= 0.25 ? "Needs improvement (0.1–0.25)" : "Poor (over 0.25)"}`,
      value: pageSpeedData.cls,
      recommendation: clsVal > 0.1
        ? "Set explicit size attributes on images/videos, avoid inserting content above existing content"
        : undefined,
    });

    // TBT (proxy for FID/INP)
    const tbtMs = parseFloat(pageSpeedData.tbt);
    checks.push({
      name: "Total Blocking Time (TBT)",
      status: tbtMs <= 200 ? "pass" : tbtMs <= 600 ? "warning" : "fail",
      priority: tbtMs > 600 ? "critical" : tbtMs > 200 ? "high" : "high",
      message: `TBT: ${pageSpeedData.tbt} — ${tbtMs <= 200 ? "Good (under 200ms)" : tbtMs <= 600 ? "Needs improvement (200–600ms)" : "Poor (over 600ms)"}`,
      value: pageSpeedData.tbt,
      recommendation: tbtMs > 200
        ? "Split long JavaScript tasks, remove unused JS, use code splitting"
        : undefined,
    });

    // FCP
    const fcpMs = parseFloat(pageSpeedData.fcp) * 1000;
    checks.push({
      name: "First Contentful Paint (FCP)",
      status: fcpMs <= 1800 ? "pass" : fcpMs <= 3000 ? "warning" : "fail",
      priority: "medium",
      message: `FCP: ${pageSpeedData.fcp} — ${fcpMs <= 1800 ? "Good (under 1.8s)" : fcpMs <= 3000 ? "Needs improvement (1.8–3s)" : "Poor (over 3s)"}`,
      value: pageSpeedData.fcp,
    });
  } else {
    checks.push({
      name: "Performance Score",
      status: "warning",
      priority: "high",
      message: "Real performance data unavailable — add GOOGLE_PAGESPEED_API_KEY for Core Web Vitals",
      recommendation: "Get a free API key at console.cloud.google.com and set GOOGLE_PAGESPEED_API_KEY",
    });
  }

  // Static checks always run
  const externalScripts = $('script[src^="http"]').length + $('script[src^="//"]').length;
  if (externalScripts > 10) {
    checks.push({
      name: "External Scripts",
      status: "warning",
      priority: "medium",
      message: `${externalScripts} external scripts loaded — each adds a network round-trip`,
      recommendation: "Bundle scripts, remove unused third-party scripts, or load them async",
    });
  } else {
    checks.push({
      name: "External Scripts",
      status: "pass",
      priority: "medium",
      message: `${externalScripts} external script(s) — acceptable`,
    });
  }

  const externalStyles = $('link[rel="stylesheet"][href^="http"], link[rel="stylesheet"][href^="//"]').length;
  if (externalStyles > 5) {
    checks.push({
      name: "External Stylesheets",
      status: "warning",
      priority: "low",
      message: `${externalStyles} external stylesheets — consider consolidating`,
      recommendation: "Bundle CSS files to reduce HTTP requests",
    });
  } else {
    checks.push({
      name: "External Stylesheets",
      status: "pass",
      priority: "low",
      message: `${externalStyles} external stylesheet(s) — acceptable`,
    });
  }

  return {
    name: "Performance",
    icon: "⚡",
    score: calcCategoryScore(checks),
    checks,
  };
}

// ─── Broken Links ────────────────────────────────────────────────────────────

async function analyzeBrokenLinks(
  internalLinks: string[]
): Promise<Check> {
  if (internalLinks.length === 0) {
    return {
      name: "Broken Links",
      status: "pass",
      priority: "medium",
      message: "No internal links to check",
    };
  }

  const linksToCheck = internalLinks.slice(0, 10);
  const results = await Promise.allSettled(
    linksToCheck.map((link) =>
      fetch(link, {
        method: "HEAD",
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; SEOAnalyzerBot/1.0)",
        },
        redirect: "follow",
        signal: AbortSignal.timeout(5000),
      })
    )
  );

  const broken: string[] = [];
  results.forEach((result, i) => {
    if (result.status === "rejected") {
      broken.push(linksToCheck[i]);
    } else if (result.value.status >= 400) {
      broken.push(`${linksToCheck[i]} (${result.value.status})`);
    }
  });

  if (broken.length === 0) {
    return {
      name: "Broken Links",
      status: "pass",
      priority: "medium",
      message: `All ${linksToCheck.length} sampled internal link(s) are working`,
    };
  } else if (broken.length <= 2) {
    return {
      name: "Broken Links",
      status: "warning",
      priority: "high",
      message: `${broken.length} broken link(s) found out of ${linksToCheck.length} checked`,
      value: broken.join(" | "),
      recommendation: "Fix or redirect broken links — they harm user experience and crawl budget",
    };
  } else {
    return {
      name: "Broken Links",
      status: "fail",
      priority: "high",
      message: `${broken.length} broken links found — significant crawlability issue`,
      value: broken.slice(0, 3).join(" | "),
      recommendation: "Fix all broken links. Use 301 redirects for moved pages.",
    };
  }
}

// ─── Main Analysis Function ──────────────────────────────────────────────────

export async function analyzeSite(
  targetUrl: string,
  pageSpeedData?: PageSpeedData
): Promise<AnalysisResult> {
  let url = targetUrl.trim();
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    url = "https://" + url;
  }
  if (url.endsWith("/")) url = url.slice(0, -1);

  const startTime = Date.now();

  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; SEOAnalyzerBot/1.0; +https://seoanalyzer.app)",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    },
    redirect: "follow",
    signal: AbortSignal.timeout(15000),
  });

  const responseTime = Date.now() - startTime;
  const html = await response.text();
  const htmlSize = Buffer.byteLength(html, "utf8");

  const responseHeaders: Record<string, string> = {};
  response.headers.forEach((value, key) => {
    responseHeaders[key.toLowerCase()] = value;
  });

  const $ = cheerio.load(html);

  // Collect internal links for broken link check
  const baseHost = new URL(url).hostname;
  const internalLinks: string[] = [];
  $("a[href]").each((_, el) => {
    const href = $(el).attr("href") || "";
    if (href.startsWith("#") || href.startsWith("javascript:")) return;
    try {
      const linkUrl = new URL(href, url);
      if (linkUrl.hostname === baseHost && linkUrl.href !== url) {
        const normalized = linkUrl.href;
        if (!internalLinks.includes(normalized)) {
          internalLinks.push(normalized);
        }
      }
    } catch {
      // skip invalid URLs
    }
  });

  // Run all external checks in parallel
  const notFoundUrl = new URL(`/this-page-definitely-does-not-exist-seo-check-${Date.now()}`, url).href;
  const [sitemapRes, robotsRes, brokenLinkCheck, notFoundRes] = await Promise.allSettled([
    fetch(new URL("/sitemap.xml", url).href, { signal: AbortSignal.timeout(5000) }),
    fetch(new URL("/robots.txt", url).href, { signal: AbortSignal.timeout(5000) }),
    analyzeBrokenLinks(internalLinks),
    fetch(notFoundUrl, { signal: AbortSignal.timeout(5000), redirect: "follow" }),
  ]);

  const sitemapExists =
    sitemapRes.status === "fulfilled" && sitemapRes.value.ok;
  const robotsExists =
    robotsRes.status === "fulfilled" && robotsRes.value.ok;
  const brokenCheck =
    brokenLinkCheck.status === "fulfilled" ? brokenLinkCheck.value : null;
  const has404 =
    notFoundRes.status === "fulfilled" && notFoundRes.value.status === 404;

  const meta = analyzeMeta($, url);
  const headings = analyzeHeadings($);
  const images = analyzeImages($);
  const links = analyzeLinks($, url, brokenCheck);
  const content = analyzeContent(cheerio.load(html));
  const technical = analyzeTechnical(
    $,
    url,
    responseHeaders,
    sitemapExists,
    robotsExists,
    responseTime,
    htmlSize,
    has404
  );
  const social = analyzeSocial($);
  const security = analyzeSecurity(url, responseHeaders);
  const performance = analyzePerformance($, pageSpeedData);

  const categories = {
    meta,
    headings,
    images,
    links,
    content,
    technical,
    social,
    security,
    performance,
  };

  const allChecks = Object.values(categories).flatMap((c) => c.checks);
  const passed = allChecks.filter((c) => c.status === "pass").length;
  const warnings = allChecks.filter((c) => c.status === "warning").length;
  const failed = allChecks.filter((c) => c.status === "fail").length;

  const criticalIssues = allChecks
    .filter((c) => c.status === "fail")
    .map((c) => c.message);

  // Weighted scoring
  const categoryWeights: Record<string, number> = {
    meta: 0.20,
    security: 0.15,
    technical: 0.13,
    content: 0.13,
    performance: 0.12,
    headings: 0.10,
    social: 0.07,
    images: 0.05,
    links: 0.05,
  };

  const totalScore = Math.round(
    Object.entries(categories).reduce((sum, [key, cat]) => {
      const weight = categoryWeights[key] ?? 0.05;
      return sum + cat.score * weight;
    }, 0)
  );

  return {
    url,
    score: totalScore,
    analyzedAt: new Date().toISOString(),
    pageTitle: $("title").text().trim() || url,
    categories,
    summary: {
      totalChecks: allChecks.length,
      passed,
      warnings,
      failed,
      criticalIssues,
      pageSpeedAvailable: !!pageSpeedData,
    },
  };
}
