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
        let approxProgress = 0;

        const sseStream = new ReadableStream({
            async start(controller) {
                controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify({ type: "start" })}\n\n`)
                );

                while (true) {
                    const { value, done } = await reader.read();
                    if (done) break;

                    const chunkText = decoder.decode(value);
                    const lines = chunkText.split('\n');
                    let ended = false;

                    for (const line of lines) {
                        if (!line.startsWith('data: ')) continue;
                        try {
                            const evt = JSON.parse(line.slice(6));
                            if (evt.type === 'chunk') {
                                const raw = String(evt.text || '').replace(/```(?:javascript)?/gi, '');
                                // Remove block comments and line comments (avoid URLs like http://)
                                const piece = raw
                                  .replace(/\/\*[\s\S]*?\*\//g, '')
                                  .replace(/(^|[^:])\/\/.*$/gm, '$1');
                                if (piece) {
                                    for (const ch of piece) {
                                        fullCode += ch;
                                        approxProgress = Math.min(99, approxProgress + 0.2);
                                        controller.enqueue(
                                            encoder.encode(`data: ${JSON.stringify({
                                                type: 'typing',
                                                code: fullCode,
                                                progress: Math.round(approxProgress),
                                                isTyping: true,
                                                totalLength: 0,
                                                currentLength: fullCode.length
                                            })}\n\n`)
                                        );
                                        let delay = typingSpeed;
                                        if (ch === '\n') delay += 100;
                                        else if (ch === ' ') delay += 20;
                                        else if (['{','}','(',')',';'].includes(ch)) delay += 30;
                                        delay += Math.random() * 40 - 20;
                                        await new Promise(r => setTimeout(r, Math.max(10, delay)));
                                    }
                                }
                            } else if (evt.type === 'end') {
                                ended = true;
                                break;
                            } else if (evt.type === 'error') {
                                controller.enqueue(
                                    encoder.encode(`data: ${JSON.stringify({ type: 'error', error: evt.error || 'Gemini stream error', isTyping: false })}\n\n`)
                                );
                                controller.close();
                                return;
                            }
                        } catch (_) {
                            // ignore malformed inner lines
                        }
                    }

                    if (ended) break;
                }

                controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify({
                        type: 'complete',
                        code: fullCode,
                        progress: 100,
                        isTyping: false
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
