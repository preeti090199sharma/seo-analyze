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

  const prompt = `You are an SEO specialist. Respond with ONLY a raw JSON object — no markdown, no backticks, no explanation, no extra text before or after.

Page URL: ${pageUrl}
Page Title: ${pageTitle}
Meta Description: ${metaDescription || "(missing)"}
H1 Heading: ${h1Text || "(missing)"}
Top Keywords: ${topKeywords || "(none)"}

Output this exact JSON (replace values with real suggestions):
{"metaDescriptions":["option1 between 150-160 chars","option2 between 150-160 chars","option3 between 150-160 chars"],"lsiKeywords":["related keyword 1","related keyword 2","related keyword 3","related keyword 4","related keyword 5"],"titleSuggestion":"improved title or empty string if current is good","contentTip":"one specific actionable SEO improvement tip"}`;

  try {
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    const geminiRes = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 1024,
        },
      }),
      signal: AbortSignal.timeout(25000),
    });

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error("Gemini API error:", geminiRes.status, errText);
      return NextResponse.json(
        { error: "AI service temporarily unavailable. Please try again." },
        { status: 502 }
      );
    }

    const geminiJson = await geminiRes.json();

    // Check for blocked content
    const candidate = geminiJson?.candidates?.[0];
    const finishReason = candidate?.finishReason;
    if (finishReason === "SAFETY" || finishReason === "RECITATION") {
      return NextResponse.json(
        { error: "AI could not generate suggestions for this content. Please try again." },
        { status: 422 }
      );
    }

    // Check for prompt-level block
    if (geminiJson?.promptFeedback?.blockReason) {
      console.error("Prompt blocked:", geminiJson.promptFeedback.blockReason);
      return NextResponse.json(
        { error: "AI could not process this request. Please try again." },
        { status: 422 }
      );
    }

    const rawText = candidate?.content?.parts?.[0]?.text ?? "";

    if (!rawText) {
      console.error("Empty Gemini response. Full response:", JSON.stringify(geminiJson).slice(0, 500));
      return NextResponse.json(
        { error: "AI returned an empty response. Please try again." },
        { status: 500 }
      );
    }

    // Try direct parse first, then strip markdown fences, then regex extract
    let suggestions;
    const attempts = [
      rawText.trim(),
      rawText.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim(),
    ];

    for (const attempt of attempts) {
      try {
        suggestions = JSON.parse(attempt);
        break;
      } catch {
        // try next
      }
    }

    if (!suggestions) {
      // Last resort: extract first {...} block
      const match = rawText.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          suggestions = JSON.parse(match[0]);
        } catch {
          // fall through
        }
      }
    }

    if (!suggestions) {
      console.error("Could not parse Gemini response:", rawText.substring(0, 300));
      return NextResponse.json(
        { error: "Could not parse AI response. Please try again." },
        { status: 500 }
      );
    }

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
