import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "AI suggestions are not configured. Add GEMINI_API_KEY to enable this feature." },
      { status: 503 }
    );
  }

  let body: {
    pageTitle?: string;
    metaDescription?: string;
    h1Text?: string;
    keywords?: string[];
    pageUrl?: string;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { pageTitle = "", metaDescription = "", h1Text = "", keywords = [], pageUrl = "" } = body;

  if (!pageTitle && !pageUrl) {
    return NextResponse.json({ error: "Missing page information" }, { status: 400 });
  }

  const topKeywords = keywords.slice(0, 8).join(", ");

  const prompt = `You are an expert SEO specialist. Analyze the following webpage data and provide actionable suggestions.

Page URL: ${pageUrl}
Page Title: ${pageTitle}
Current Meta Description: ${metaDescription || "(missing)"}
H1 Heading: ${h1Text || "(missing)"}
Top Keywords found on page: ${topKeywords || "(none detected)"}

Respond ONLY with a valid JSON object in this exact format (no markdown, no extra text):
{
  "metaDescriptions": [
    "First optimized meta description (150-160 characters, includes main keyword)",
    "Second option with a different angle or call-to-action",
    "Third option focusing on benefits or unique value proposition"
  ],
  "lsiKeywords": [
    "related keyword 1",
    "related keyword 2",
    "related keyword 3",
    "related keyword 4",
    "related keyword 5"
  ],
  "titleSuggestion": "An improved page title (50-60 characters) if the current one needs improvement, or empty string if current title is good",
  "contentTip": "One specific, actionable SEO content tip for this page (2-3 sentences max)"
}`;

  try {
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const geminiRes = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1024,
        },
      }),
      signal: AbortSignal.timeout(25000),
    });

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error("Gemini API error:", errText);
      return NextResponse.json(
        { error: "AI service temporarily unavailable. Please try again." },
        { status: 502 }
      );
    }

    const geminiJson = await geminiRes.json();
    const rawText = geminiJson?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    // Extract JSON from response (Gemini sometimes wraps in ```json blocks)
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json(
        { error: "Could not parse AI response. Please try again." },
        { status: 500 }
      );
    }

    const suggestions = JSON.parse(jsonMatch[0]);
    return NextResponse.json(suggestions);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    if (msg.includes("timeout") || msg.includes("abort")) {
      return NextResponse.json(
        { error: "AI request timed out. Please try again." },
        { status: 504 }
      );
    }
    console.error("AI suggest error:", msg);
    return NextResponse.json({ error: "Failed to generate suggestions." }, { status: 500 });
  }
}
