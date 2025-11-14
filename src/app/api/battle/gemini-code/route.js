// src/app/api/battle/gemini-code/route.js
import { NextResponse } from "next/server";
import { generateGeminiCodeStream } from "@/lib/gemini";

export async function POST(req) {
    try {
        const body = await req.json();
        const { prompt, starterCode, difficulty, typingSpeed = 50 } = body;

        if (!prompt) {
            return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
        }

        // STREAM LANGSUNG DARI GEMINI
        const geminiStream = await generateGeminiCodeStream(prompt, starterCode, difficulty);

        if (!geminiStream || !(geminiStream instanceof ReadableStream)) {
            console.error("Gemini returned no stream.");
            return new Response(`data: ${JSON.stringify({
                type: "error",
                error: "Gemini API did not return a valid stream"
            })}\n\n`, {
                status: 500,
                headers: { "Content-Type": "text/event-stream" }
            });
        }

        const decoder = new TextDecoder();
        const encoder = new TextEncoder();
        const reader = geminiStream.getReader();

        let fullCode = "";

        const sseStream = new ReadableStream({
            async start(controller) {
                controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify({ type: "start" })}\n\n`)
                );

                while (true) {
                    const { value, done } = await reader.read();
                    if (done) break;

                    const text = decoder.decode(value);
                    fullCode += text;

                    controller.enqueue(
                        encoder.encode(`data: ${JSON.stringify({
                            type: "typing",
                            code: fullCode
                        })}\n\n`)
                    );

                    await new Promise(r => setTimeout(r, typingSpeed));
                }

                controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify({
                        type: "complete",
                        code: fullCode
                    })}\n\n`)
                );

                controller.close();
            }
        });

        return new Response(sseStream, {
            headers: {
                "Content-Type": "text/event-stream",
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
            },
        });

    } catch (e) {
        console.error("AI code API error:", e);

        return new Response(`data: ${JSON.stringify({
            type: "error",
            error: e.message
        })}\n\n`, {
            status: 500,
            headers: { "Content-Type": "text/event-stream" }
        });
    }
}
