// src/lib/gemini.js
// Menggunakan SDK v2 (@google/genai)
// Model: gemini-2.5-flash
// Perbaikan: 1. Iterasi 'result' (bukan 'result.stream')
// Perbaikan: 2. Menggunakan 'chunk.text' (bukan 'chunk.text()')

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
    try {
        const difficultyPrompts = {
            1: "Write a simple, basic solution.",
            2: "Write a clean solution.",
            3: "Write an efficient solution.",
            4: "Write an optimized solution.",
            5: "Write a highly optimized, elegant solution.",
        };

        // ---- PROMPT SISTEM YANG LEBIH TEGAS ----
        const systemPrompt = `You are a silent code generation engine.
Your ONLY task is to complete the 'starterCode' provided.
You MUST NOT output anything other than raw code.
You MUST NOT use markdown (like \`\`\`javascript).
You MUST NOT include explanations or comments.
Your output is piped directly into a file. Do not say "Here is the code:".
You must only output the code that completes the function.
Difficulty: ${difficultyPrompts[difficulty] || difficultyPrompts[3]}`;

        // ---- PROMPT USER YANG LEBIH TEGAS ----
        const userPrompt = `PROBLEM:
${prompt}

STARTER CODE TO COMPLETE:
${starterCode}

YOUR CODE (RAW JAVASCRIPT ONLY):`; // Ini mengarahkan AI untuk langsung menulis kode

        const result = await ai.models.generateContentStream({
            model: MODEL_NAME,
            systemInstruction: {
                role: "system",
                parts: [{ text: systemPrompt }],
            },
            contents: [{ role: "user", parts: [{ text: userPrompt }] }],
            safetySettings: safetySettings,
        });

        const encoder = new TextEncoder();
        const readableStream = new ReadableStream({
            async start(controller) {
                // Perbaikan dari error sebelumnya (menggunakan .stream dan .text())
                if (!result.stream) {
                    controller.enqueue(encoder.encode("// Error: Gemini API did not return a stream."));
                    controller.close();
                    return;
                }
                try {
                    for await (const chunk of result.stream) {
                        const text = chunk.text();
                        if (text) {
                            controller.enqueue(encoder.encode(text));
                        }
                    }
                } catch (e) {
                    console.error("Gemini stream chunk error:", e);
                    controller.enqueue(encoder.encode(`// Gemini stream error: ${e.message}`));
                }
                controller.close();
            },
        });

        return readableStream;

    } catch (error) {
        console.error("Gemini API error:", error);
        const encoder = new TextEncoder();
        return new ReadableStream({
            start(controller) {
                controller.enqueue(encoder.encode(`// Error generating AI code: ${error.message}`));
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
      Tingkat Kesulitan (1-5): ${difficulty}

      Struktur JSON yang DIHARUSKAN:
      {
        "title": "Nama soal (contoh: 'Balikkan String')",
        "prompt": "Deskripsi lengkap soal yang harus dikerjakan user.",
        "starterCode": "function namaFungsi(param) {\n  // Kode Anda di sini\n}",
        "testCases": "[{\"input\": [\"hello\"], \"expected\": \"olleh\"}, {\"input\": [\"world\"], \"expected\": \"dlrow\"}]",
        "difficulty": ${difficulty},
        "points": ${difficulty * 10}
      }
    `;

        const result = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: {
                responseMimeType: "application/json",
            },
            safetySettings: safetySettings,
        });

        // Ini menggunakan .text() karena BUKAN stream, ini sudah benar
        const responseText = result.response.text();
        return JSON.parse(responseText);

    } catch (error) {
        console.error("Gemini question generation error:", error);
        throw new Error(`Failed to generate question: ${error.message}`);
    }
}