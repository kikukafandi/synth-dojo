// Guidance Hint API
// Returns structured hints from Gemini (or heuristic fallback)

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { generateGuidanceHints } from "@/lib/gemini";

export async function POST(req) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { prompt, userCode = "", aiCode = "", difficulty = 1 } = body || {};

    if (!prompt) {
      return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
    }

    const hints = await generateGuidanceHints({ prompt, userCode, aiCode, difficulty });

    return NextResponse.json({ hints });
  } catch (err) {
    console.error("Hint API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
