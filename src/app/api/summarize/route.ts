import { NextRequest, NextResponse } from "next/server";

const GEMINI_API_KEY = "AIzaSyDxa8BZTnSOVwf8j3ZIWQOaY_CmZUtasqo";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

async function fetchPageContent(url: string): Promise<string> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; BookmarkBrain/1.0)",
      },
    });
    clearTimeout(timeout);
    const html = await res.text();
    // Strip HTML tags and extract text
    const text = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 8000);
    return text;
  } catch {
    return "";
  }
}

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();
    if (!url) {
      return NextResponse.json({ error: "URL required" }, { status: 400 });
    }

    const content = await fetchPageContent(url);
    const prompt = `Analyze this web page and return a JSON object (no markdown, just raw JSON) with these fields:
- "title": a concise title (max 80 chars)
- "summary": a one-line summary of what this page is about (max 150 chars)
- "takeaways": an array of exactly 3 key takeaways (each max 100 chars)
- "category": ONE category from this list: Technology, Business, Design, Marketing, Programming, AI, Science, Health, Finance, News, Entertainment, Education, Productivity, Other

URL: ${url}
Page content: ${content || "(could not fetch content — summarize based on URL alone)"}

Return ONLY valid JSON, no other text.`;

    const geminiRes = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 500,
        },
      }),
    });

    const geminiData = await geminiRes.json();
    const rawText =
      geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // Extract JSON from response (handle markdown code blocks)
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json(
        {
          title: new URL(url).hostname,
          summary: "Could not generate summary",
          takeaways: ["Visit the link for details"],
          category: "Other",
        },
        { status: 200 }
      );
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return NextResponse.json({
      title: parsed.title || new URL(url).hostname,
      summary: parsed.summary || "",
      takeaways: Array.isArray(parsed.takeaways)
        ? parsed.takeaways.slice(0, 3)
        : [],
      category: parsed.category || "Other",
    });
  } catch (error) {
    console.error("Summarize error:", error);
    return NextResponse.json(
      { error: "Failed to summarize" },
      { status: 500 }
    );
  }
}
