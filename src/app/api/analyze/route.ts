import { NextRequest, NextResponse } from "next/server";
import { analyzeSite } from "@/lib/analyzer";

export const maxDuration = 30;

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

    const urlPattern =
      /^(https?:\/\/)?([\w-]+\.)+[\w-]+(\/[\w\-./?%&=]*)?$/i;

    const cleanUrl = url.trim().replace(/^(https?:\/\/)/, "");
    if (!urlPattern.test(url.trim()) && !cleanUrl.includes(".")) {
      return NextResponse.json(
        { error: "Invalid URL format. Example: example.com" },
        { status: 400 }
      );
    }

    const result = await analyzeSite(url);
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
