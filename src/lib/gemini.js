import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from "@google/genai";

const API_KEY = process.env.GEMINI_API_KEY;
const MODEL_NAME = process.env.GEMINI_MODEL || "gemini-2.5-flash";

// Inisialisasi client v2
const ai = new GoogleGenAI(API_KEY);

// Safety settings
const safetySettings = [
    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
];

/**
 * Generate AI code solution for a given problem (STREAMING)
 */
export async function generateGeminiCodeStream(prompt, starterCode = "", difficulty = 1) {
    const encoder = new TextEncoder();

    try {
        const difficultyPrompts = {
            1: "Write a simple, basic solution.",
            2: "Write a clean solution.",
            3: "Write an efficient solution.",
            4: "Write an optimized solution.",
            5: "Write a highly optimized, elegant solution.",
        };

        const systemPrompt = `You are a silent code generation engine.
Output only raw JavaScript with no markdown and no comments.
${difficultyPrompts[difficulty]}`;

        const userPrompt = `PROBLEM:
${prompt}

STARTER CODE:
${starterCode}

WRITE ONLY THE RAW JAVASCRIPT CODE:
`;

        const result = await ai.models.generateContentStream({
            model: MODEL_NAME,
            systemInstruction: {
                role: "system",
                parts: [{ text: systemPrompt }]
            },
            contents: [
                { role: "user", parts: [{ text: userPrompt }] }
            ],
            safetySettings,
        });

        return new ReadableStream({
            async start(controller) {
                try {

                    for await (const chunk of result) {
                        const text =
                            chunk?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

                        if (text.trim().length > 0) {
                            controller.enqueue(
                                encoder.encode(`data: ${JSON.stringify({
                                    type: "chunk",
                                    text
                                })}\n\n`)
                            );
                        }
                    }

                    controller.enqueue(
                        encoder.encode(`data: ${JSON.stringify({ type: "end" })}\n\n`)
                    );

                } catch (error) {
                    controller.enqueue(
                        encoder.encode(`data: ${JSON.stringify({
                            type: "error",
                            error: error.message
                        })}\n\n`)
                    );
                }

                controller.close();
            }
        });

    } catch (error) {
        return new ReadableStream({
            start(controller) {
                controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify({
                        type: "error",
                        error: error.message
                    })}\n\n`)
                );
                controller.close();
            }
        });
    }
}


/**
 * Generate a new coding question using Gemini
 */
export async function generateGeminiQuestion(topic, difficulty) {
    try {
        const prompt = `
        Buat sebuah soal coding JavaScript dengan struktur JSON berikut.
        Topik: "${topic}"
        Tingkat Kesulitan: ${difficulty}

        HARUS membalas HANYA JSON valid. Tidak boleh markdown.
        {
            "title": "",
            "prompt": "",
            "starterCode": "",
            "testCases": "",
            "difficulty": ${difficulty},
            "points": ${difficulty * 10}
        }
        `;

        const result = await retry(() =>
            ai.models.generateContent({
                model: MODEL_NAME,
                contents: [{ role: "user", parts: [{ text: prompt }] }],
                safetySettings: safetySettings,
                generationConfig: {
                    responseMimeType: "application/json",
                },
            })
        );

        // ---- FIX: Struktur SDK v2 ----
        const candidate = result.candidates?.[0];
        if (!candidate) {
            throw new Error("No candidates found in Gemini result.");
        }

        const text = candidate.content?.parts?.[0]?.text;
        if (!text) {
            throw new Error("No text found in Gemini result.");
        }

        let responseText = text.trim();

        // Hilangkan markdown jika masih ada
        if (responseText.startsWith("```")) {
            responseText = responseText.replace(/```json|```/g, "").trim();
        }

        return JSON.parse(responseText);

    } catch (error) {
        console.error("Gemini question generation error:", error);
        throw new Error(`Failed to generate question: ${error.message}`);
    }
}



async function retry(fn, retries = 3, delay = 800) {
    try {
        return await fn();
    } catch (err) {
        if (retries === 0) throw err;

        // hanya retry jika errornya 503 atau 429
        const msg = err?.message || "";
        if (
            msg.includes("503") ||
            msg.includes("UNAVAILABLE") ||
            msg.includes("overloaded") ||
            msg.includes("429") ||
            msg.includes("rate")
        ) {
            console.warn(`Retrying Gemini... remaining: ${retries}`);
            await new Promise(res => setTimeout(res, delay));
            return retry(fn, retries - 1, delay * 1.5);
        }

        throw err;
    }
}
