// src/app/api/battle/gemini-code/route.js
import { NextResponse } from "next/server";
// GANTI import ke file gemini.js yang baru
import { generateGeminiCodeStream } from "@/lib/gemini";

export async function POST(req) {
    try {
        // Autentikasi bisa ditambahkan di sini jika perlu

        const body = await req.json();
        const { prompt, starterCode, difficulty, typingSpeed = 50 } = body;

        if (!prompt) {
            return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
        }

        // 1. Dapatkan stream dari Gemini (bukan OpenAI)
        const aiStream = await generateGeminiCodeStream(prompt, starterCode, difficulty);
        const reader = aiStream.getReader();
        const decoder = new TextDecoder();

        let fullCode = "";

        // 2. Baca seluruh stream dari Gemini terlebih dahulu
        // (Ini diperlukan untuk simulasi mengetik. Jika ingin stream langsung, logikanya beda)
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunkText = decoder.decode(value);
            fullCode += chunkText;
        }

        if (!fullCode) {
            throw new Error("Failed to generate AI code - empty response from Gemini");
        }

        // 3. Buat stream baru untuk mensimulasikan pengetikan (Logika ini sama persis)
        const encoder = new TextEncoder();
        const typingStream = new ReadableStream({
            async start(controller) {
                try {
                    controller.enqueue(
                        encoder.encode(`data: ${JSON.stringify({ type: 'start' })}\n\n`)
                    );

                    let currentCode = "";
                    const totalLength = fullCode.length;

                    for (let i = 0; i < fullCode.length; i++) {
                        if (controller.desiredSize === null) break;

                        currentCode += fullCode[i];
                        const progress = Math.round((i + 1) / totalLength * 100);

                        controller.enqueue(
                            encoder.encode(`data: ${JSON.stringify({
                                type: 'typing',
                                code: currentCode,
                                progress: progress,
                                totalLength: totalLength,
                                currentLength: i + 1
                            })}\n\n`)
                        );

                        let delay = typingSpeed;
                        if (fullCode[i] === '\n') delay += 100;
                        else if (['{', '}', '(', ')', ';'].includes(fullCode[i])) delay += 30;
                        delay += Math.random() * 40 - 20;

                        await new Promise(resolve => setTimeout(resolve, Math.max(10, delay)));
                    }

                    controller.enqueue(
                        encoder.encode(`data: ${JSON.stringify({
                            type: 'complete',
                            code: fullCode,
                            progress: 100
                        })}\n\n`)
                    );
                    controller.close();

                } catch (error) {
                    console.error("Stream typing error:", error);
                    controller.enqueue(
                        encoder.encode(`data: ${JSON.stringify({ type: 'error', error: error.message })}\n\n`)
                    );
                    controller.close();
                }
            },
        });

        return new Response(typingStream, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
            },
        });

    } catch (error) {
        console.error("AI code API error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}