import * as cheerio from "cheerio";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface Check {
  name: string;
  status: "pass" | "fail" | "warning";
  message: string;
  value?: string;
  recommendation?: string;
}

export interface CategoryResult {
  name: string;
  score: number;
  icon: string;
  checks: Check[];
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
  };
  summary: {
    totalChecks: number;
    passed: number;
    warnings: number;
    failed: number;
    criticalIssues: string[];
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
      message: "Page title is missing",
      recommendation: "Add a <title> tag between 50-60 characters",
    });
  } else if (title.length < 30) {
    checks.push({
      name: "Page Title",
      status: "warning",
      message: `Title is too short (${title.length} chars)`,
      value: title,
      recommendation: "Title should be 50-60 characters for optimal SEO",
    });
  } else if (title.length > 60) {
    checks.push({
      name: "Page Title",
      status: "warning",
      message: `Title is too long (${title.length} chars) — may be truncated in search results`,
      value: title,
      recommendation: "Keep title under 60 characters",
    });
  } else {
    checks.push({
      name: "Page Title",
      status: "pass",
      message: `Title is optimal (${title.length} chars)`,
      value: title,
    });
  }

  const desc =
    $('meta[name="description"]').attr("content")?.trim() ?? "";
  if (!desc) {
    checks.push({
      name: "Meta Description",
      status: "fail",
      message: "Meta description is missing",
      recommendation:
        "Add a meta description between 150-160 characters",
    });
  } else if (desc.length < 120) {
    checks.push({
      name: "Meta Description",
      status: "warning",
      message: `Description is too short (${desc.length} chars)`,
      value: desc,
      recommendation: "Description should be 150-160 characters",
    });
  } else if (desc.length > 160) {
    checks.push({
      name: "Meta Description",
      status: "warning",
      message: `Description may be truncated (${desc.length} chars)`,
      value: desc,
      recommendation: "Keep under 160 characters",
    });
  } else {
    checks.push({
      name: "Meta Description",
      status: "pass",
      message: `Description is optimal (${desc.length} chars)`,
      value: desc,
    });
  }

  const viewport = $('meta[name="viewport"]').attr("content") ?? "";
  checks.push({
    name: "Viewport Meta",
    status: viewport ? "pass" : "fail",
    message: viewport
      ? "Viewport meta tag is set"
      : "Viewport meta tag is missing — site may not be mobile-friendly",
    value: viewport || undefined,
    recommendation: viewport
      ? undefined
      : 'Add <meta name="viewport" content="width=device-width, initial-scale=1">',
  });

  const charset =
    $("meta[charset]").length > 0 ||
    $('meta[http-equiv="Content-Type"]').length > 0;
  checks.push({
    name: "Charset Declaration",
    status: charset ? "pass" : "warning",
    message: charset
      ? "Character encoding is declared"
      : "No explicit charset declaration found",
    recommendation: charset
      ? undefined
      : 'Add <meta charset="UTF-8"> to <head>',
  });

  const robots = $('meta[name="robots"]').attr("content") ?? "";
  if (robots && robots.includes("noindex")) {
    checks.push({
      name: "Robots Meta",
      status: "warning",
      message: "Page is set to noindex — it will NOT appear in search results",
      value: robots,
    });
  } else {
    checks.push({
      name: "Robots Meta",
      status: "pass",
      message: robots
        ? `Robots directive: ${robots}`
        : "No restrictive robots meta (page is indexable)",
    });
  }

  const canonical = $('link[rel="canonical"]').attr("href") ?? "";
  checks.push({
    name: "Canonical URL",
    status: canonical ? "pass" : "warning",
    message: canonical
      ? `Canonical URL is set`
      : "No canonical URL — may cause duplicate content issues",
    value: canonical || undefined,
    recommendation: canonical
      ? undefined
      : "Add a canonical link to specify the preferred URL",
  });

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
      message: "No H1 tag found on the page",
      recommendation: "Add exactly one H1 tag that describes the page content",
    });
  } else if (h1s.length > 1) {
    checks.push({
      name: "H1 Tag",
      status: "warning",
      message: `Multiple H1 tags found (${h1s.length})`,
      recommendation: "Use only one H1 tag per page for better SEO",
    });
  } else {
    const h1Text = h1s.first().text().trim();
    checks.push({
      name: "H1 Tag",
      status: "pass",
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
    message: hasSubheadings
      ? `${headingCounts.h2} H2 subheadings found`
      : "No H2 subheadings — content may lack structure",
    recommendation: hasSubheadings
      ? undefined
      : "Use H2 tags to break content into sections",
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
    message: skipsLevel
      ? "Heading levels are skipped (e.g. H2 → H4)"
      : "Heading hierarchy is properly structured",
    value: `H1:${h1s.length} H2:${headingCounts.h2} H3:${headingCounts.h3} H4:${headingCounts.h4}`,
    recommendation: skipsLevel
      ? "Don't skip heading levels — use H1 → H2 → H3 in order"
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
      message: "No images found on the page",
      recommendation:
        "Consider adding relevant images to improve engagement",
    });
    return { name: "Images", icon: "🖼️", score: calcCategoryScore(checks), checks };
  }

  checks.push({
    name: "Images Found",
    status: "pass",
    message: `${totalImages} image(s) found on the page`,
  });

  let missingAlt = 0;
  let emptyAlt = 0;
  const missingAltSrcs: string[] = [];

  images.each((_, img) => {
    const alt = $(img).attr("alt");
    const src = $(img).attr("src") || $(img).attr("data-src") || "unknown";
    if (alt === undefined) {
      missingAlt++;
      if (missingAltSrcs.length < 5) missingAltSrcs.push(src);
    } else if (alt.trim() === "") {
      emptyAlt++;
    }
  });

  if (missingAlt > 0) {
    checks.push({
      name: "Missing Alt Text",
      status: "fail",
      message: `${missingAlt} image(s) have no alt attribute`,
      value: missingAltSrcs.join(", ").substring(0, 200),
      recommendation:
        "Add descriptive alt text to all images for accessibility and SEO",
    });
  } else {
    checks.push({
      name: "Alt Text",
      status: "pass",
      message: "All images have alt attributes",
    });
  }

  if (emptyAlt > 0) {
    checks.push({
      name: "Empty Alt Text",
      status: "warning",
      message: `${emptyAlt} image(s) have empty alt text`,
      recommendation:
        "Add meaningful alt text unless the image is purely decorative",
    });
  }

  let largeSrcCount = 0;
  images.each((_, img) => {
    const src = $(img).attr("src") || "";
    if (src && !src.includes("svg") && !src.startsWith("data:")) {
      const width = parseInt($(img).attr("width") || "0");
      const height = parseInt($(img).attr("height") || "0");
      if (!$(img).attr("width") || !$(img).attr("height")) {
        largeSrcCount++;
      }
    }
  });

  if (largeSrcCount > 0) {
    checks.push({
      name: "Image Dimensions",
      status: "warning",
      message: `${largeSrcCount} image(s) missing explicit width/height`,
      recommendation:
        "Set width and height attributes to prevent layout shifts (CLS)",
    });
  } else if (totalImages > 0) {
    checks.push({
      name: "Image Dimensions",
      status: "pass",
      message: "All images have explicit dimensions",
    });
  }

  const lazyImages = $('img[loading="lazy"]').length;
  if (totalImages > 3 && lazyImages === 0) {
    checks.push({
      name: "Lazy Loading",
      status: "warning",
      message: "No images use lazy loading",
      recommendation:
        'Add loading="lazy" to below-the-fold images for faster page load',
    });
  } else if (lazyImages > 0) {
    checks.push({
      name: "Lazy Loading",
      status: "pass",
      message: `${lazyImages} image(s) use lazy loading`,
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

function analyzeLinks($: cheerio.CheerioAPI, baseUrl: string): CategoryResult {
  const checks: Check[] = [];
  const links = $("a");
  const totalLinks = links.length;

  let internal = 0;
  let external = 0;
  let noHref = 0;
  let nofollow = 0;
  let emptyAnchors = 0;

  const baseHost = new URL(baseUrl).hostname;

  links.each((_, a) => {
    const href = $(a).attr("href") || "";
    const rel = $(a).attr("rel") || "";
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

    if (rel.includes("nofollow")) nofollow++;
    if (!text && !$(a).find("img").length) emptyAnchors++;
  });

  checks.push({
    name: "Total Links",
    status: "pass",
    message: `${totalLinks} links found on the page`,
    value: `Internal: ${internal} | External: ${external}`,
  });

  if (internal === 0) {
    checks.push({
      name: "Internal Links",
      status: "warning",
      message: "No internal links found",
      recommendation: "Add internal links to improve site navigation and SEO",
    });
  } else {
    checks.push({
      name: "Internal Links",
      status: "pass",
      message: `${internal} internal link(s) found`,
    });
  }

  if (noHref > 0) {
    checks.push({
      name: "Empty/Invalid Links",
      status: "warning",
      message: `${noHref} link(s) have no valid href`,
      recommendation: "Remove or fix links without proper destinations",
    });
  } else {
    checks.push({
      name: "Link Validity",
      status: "pass",
      message: "All links have valid href attributes",
    });
  }

  if (emptyAnchors > 0) {
    checks.push({
      name: "Anchor Text",
      status: "warning",
      message: `${emptyAnchors} link(s) have no visible anchor text`,
      recommendation:
        "Add descriptive anchor text for better accessibility and SEO",
    });
  } else {
    checks.push({
      name: "Anchor Text",
      status: "pass",
      message: "All links have visible anchor text or images",
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

  if (wordCount < 300) {
    checks.push({
      name: "Word Count",
      status: "warning",
      message: `Page has only ${wordCount} words — may be considered thin content`,
      recommendation:
        "Aim for at least 300+ words of quality content for better rankings",
    });
  } else if (wordCount >= 300 && wordCount < 1000) {
    checks.push({
      name: "Word Count",
      status: "pass",
      message: `Page has ${wordCount} words — decent content length`,
    });
  } else {
    checks.push({
      name: "Word Count",
      status: "pass",
      message: `Page has ${wordCount} words — great content depth`,
    });
  }

  const htmlLength = $("html").html()?.length || 0;
  const textRatio =
    htmlLength > 0 ? Math.round((bodyText.length / htmlLength) * 100) : 0;

  if (textRatio < 10) {
    checks.push({
      name: "Text-to-HTML Ratio",
      status: "warning",
      message: `Low text-to-HTML ratio (${textRatio}%)`,
      recommendation: "Increase text content relative to HTML code",
    });
  } else {
    checks.push({
      name: "Text-to-HTML Ratio",
      status: "pass",
      message: `Text-to-HTML ratio is ${textRatio}%`,
    });
  }

  const paragraphs = $("p").length;
  checks.push({
    name: "Paragraphs",
    status: paragraphs > 0 ? "pass" : "warning",
    message:
      paragraphs > 0
        ? `${paragraphs} paragraph(s) found`
        : "No paragraph tags found — content may lack structure",
    recommendation:
      paragraphs > 0
        ? undefined
        : "Wrap text content in <p> tags for proper structure",
  });

  const lists = $("ul, ol").length;
  checks.push({
    name: "Lists",
    status: lists > 0 ? "pass" : "warning",
    message:
      lists > 0
        ? `${lists} list(s) found — good for readability`
        : "No lists found on the page",
  });

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
  responseTime: number
): CategoryResult {
  const checks: Check[] = [];

  const doctype = ($("html").html() || "").toLowerCase().includes("<!doctype");
  checks.push({
    name: "DOCTYPE",
    status: doctype ? "pass" : "warning",
    message: doctype
      ? "HTML DOCTYPE is declared"
      : "DOCTYPE declaration not found",
  });

  const lang = $("html").attr("lang") || "";
  checks.push({
    name: "Language Attribute",
    status: lang ? "pass" : "warning",
    message: lang
      ? `Language is set to "${lang}"`
      : "No lang attribute on <html> — may affect accessibility",
    recommendation: lang
      ? undefined
      : 'Add lang attribute: <html lang="en">',
  });

  const favicon =
    $('link[rel="icon"]').length > 0 ||
    $('link[rel="shortcut icon"]').length > 0 ||
    $('link[rel="apple-touch-icon"]').length > 0;
  checks.push({
    name: "Favicon",
    status: favicon ? "pass" : "warning",
    message: favicon
      ? "Favicon is set"
      : "No favicon found — site may look unprofessional in browser tabs",
    recommendation: favicon ? undefined : "Add a favicon link in <head>",
  });

  checks.push({
    name: "Sitemap.xml",
    status: sitemapExists ? "pass" : "warning",
    message: sitemapExists
      ? "Sitemap.xml is accessible"
      : "Sitemap.xml not found",
    recommendation: sitemapExists
      ? undefined
      : "Create a sitemap.xml to help search engines discover your pages",
  });

  checks.push({
    name: "Robots.txt",
    status: robotsExists ? "pass" : "warning",
    message: robotsExists
      ? "Robots.txt is accessible"
      : "Robots.txt not found",
    recommendation: robotsExists
      ? undefined
      : "Create a robots.txt to control search engine crawling",
  });

  const jsonLd = $('script[type="application/ld+json"]');
  checks.push({
    name: "Structured Data",
    status: jsonLd.length > 0 ? "pass" : "warning",
    message:
      jsonLd.length > 0
        ? `${jsonLd.length} structured data block(s) found (JSON-LD)`
        : "No structured data (JSON-LD) found",
    recommendation:
      jsonLd.length > 0
        ? undefined
        : "Add JSON-LD structured data for rich search results",
  });

  const inlineStyles = $("[style]").length;
  checks.push({
    name: "Inline Styles",
    status: inlineStyles > 20 ? "warning" : "pass",
    message:
      inlineStyles > 20
        ? `${inlineStyles} elements have inline styles — consider external CSS`
        : `${inlineStyles} inline style(s) found — acceptable`,
  });

  checks.push({
    name: "Response Time",
    status: responseTime < 2000 ? "pass" : responseTime < 5000 ? "warning" : "fail",
    message: `Server responded in ${responseTime}ms`,
    value: `${responseTime}ms`,
    recommendation:
      responseTime >= 2000
        ? "Improve server response time — aim for under 2 seconds"
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
    "og:description":
      $('meta[property="og:description"]').attr("content") ?? "",
    "og:image": $('meta[property="og:image"]').attr("content") ?? "",
    "og:url": $('meta[property="og:url"]').attr("content") ?? "",
    "og:type": $('meta[property="og:type"]').attr("content") ?? "",
  };

  const ogPresent = Object.values(ogTags).filter((v) => v).length;
  if (ogPresent === 0) {
    checks.push({
      name: "Open Graph Tags",
      status: "fail",
      message: "No Open Graph tags found — links shared on social media will look plain",
      recommendation:
        "Add og:title, og:description, og:image, og:url, og:type meta tags",
    });
  } else if (ogPresent < 4) {
    checks.push({
      name: "Open Graph Tags",
      status: "warning",
      message: `Only ${ogPresent}/5 Open Graph tags found`,
      value: Object.entries(ogTags)
        .filter(([, v]) => v)
        .map(([k]) => k)
        .join(", "),
      recommendation: "Add all recommended OG tags for best social sharing",
    });
  } else {
    checks.push({
      name: "Open Graph Tags",
      status: "pass",
      message: `${ogPresent}/5 Open Graph tags found — great for social sharing`,
    });
  }

  if (ogTags["og:image"]) {
    checks.push({
      name: "OG Image",
      status: "pass",
      message: "Social sharing image is set",
      value: ogTags["og:image"].substring(0, 100),
    });
  } else {
    checks.push({
      name: "OG Image",
      status: "fail",
      message: "No social sharing image — links will show without preview image",
      recommendation: "Add an og:image (recommended size: 1200x630 pixels)",
    });
  }

  const twitterCard =
    $('meta[name="twitter:card"]').attr("content") ?? "";
  const twitterTitle =
    $('meta[name="twitter:title"]').attr("content") ?? "";
  const twitterDesc =
    $('meta[name="twitter:description"]').attr("content") ?? "";

  const twitterPresent = [twitterCard, twitterTitle, twitterDesc].filter(
    (v) => v
  ).length;

  if (twitterPresent === 0) {
    checks.push({
      name: "Twitter Card Tags",
      status: "warning",
      message: "No Twitter Card tags found",
      recommendation: "Add twitter:card, twitter:title, twitter:description",
    });
  } else {
    checks.push({
      name: "Twitter Card Tags",
      status: twitterPresent >= 2 ? "pass" : "warning",
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
    message: isHttps
      ? "Site uses HTTPS — connection is secure"
      : "Site does NOT use HTTPS — Google penalizes insecure sites",
    recommendation: isHttps
      ? undefined
      : "Switch to HTTPS immediately for security and SEO benefits",
  });

  const securityHeaders: { name: string; header: string; importance: string }[] = [
    {
      name: "X-Content-Type-Options",
      header: "x-content-type-options",
      importance: "Prevents MIME-type sniffing",
    },
    {
      name: "X-Frame-Options",
      header: "x-frame-options",
      importance: "Prevents clickjacking attacks",
    },
    {
      name: "Strict-Transport-Security",
      header: "strict-transport-security",
      importance: "Forces HTTPS connections",
    },
    {
      name: "Content-Security-Policy",
      header: "content-security-policy",
      importance: "Prevents XSS attacks",
    },
    {
      name: "X-XSS-Protection",
      header: "x-xss-protection",
      importance: "Legacy XSS filter",
    },
  ];

  for (const sh of securityHeaders) {
    const value = headers[sh.header] ?? "";
    checks.push({
      name: sh.name,
      status: value ? "pass" : "warning",
      message: value
        ? `${sh.name} header is set`
        : `${sh.name} header is missing — ${sh.importance}`,
      value: value || undefined,
    });
  }

  return {
    name: "Security",
    icon: "🔒",
    score: calcCategoryScore(checks),
    checks,
  };
}

// ─── Main Analysis Function ──────────────────────────────────────────────────

export async function analyzeSite(targetUrl: string): Promise<AnalysisResult> {
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
  const responseHeaders: Record<string, string> = {};
  response.headers.forEach((value, key) => {
    responseHeaders[key.toLowerCase()] = value;
  });

  const $ = cheerio.load(html);

  const [sitemapRes, robotsRes] = await Promise.allSettled([
    fetch(new URL("/sitemap.xml", url).href, {
      signal: AbortSignal.timeout(5000),
    }),
    fetch(new URL("/robots.txt", url).href, {
      signal: AbortSignal.timeout(5000),
    }),
  ]);

  const sitemapExists =
    sitemapRes.status === "fulfilled" && sitemapRes.value.ok;
  const robotsExists =
    robotsRes.status === "fulfilled" && robotsRes.value.ok;

  const meta = analyzeMeta($, url);
  const headings = analyzeHeadings($);
  const images = analyzeImages($);
  const links = analyzeLinks($, url);
  const content = analyzeContent(cheerio.load(html));
  const technical = analyzeTechnical(
    $,
    url,
    responseHeaders,
    sitemapExists,
    robotsExists,
    responseTime
  );
  const social = analyzeSocial($);
  const security = analyzeSecurity(url, responseHeaders);

  const categories = {
    meta,
    headings,
    images,
    links,
    content,
    technical,
    social,
    security,
  };

  const allChecks = Object.values(categories).flatMap((c) => c.checks);
  const passed = allChecks.filter((c) => c.status === "pass").length;
  const warnings = allChecks.filter((c) => c.status === "warning").length;
  const failed = allChecks.filter((c) => c.status === "fail").length;

  const criticalIssues = allChecks
    .filter((c) => c.status === "fail")
    .map((c) => c.message);

  const totalScore = Math.round(
    Object.values(categories).reduce((s, c) => s + c.score, 0) /
      Object.values(categories).length
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
    },
  };
}
