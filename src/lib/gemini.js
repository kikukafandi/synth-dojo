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

export async function generateCodeComparisonReview({ prompt, userCode, aiCode }) {
  try {
    const reviewPrompt = `You are a senior code reviewer.
Compare two JavaScript solutions for the same problem.
Return ONLY strict JSON with this schema:
{
  "summary": string,
  "user": { "strengths": string[], "weaknesses": string[] },
  "ai": { "strengths": string[], "weaknesses": string[] },
  "scores": { "algorithm": number, "correctness": number, "readability": number, "efficiency": number }
}

Problem:\n${prompt}

User Code:\n${userCode}

AI Code:\n${aiCode}`;

    const result = await retry(() =>
      ai.models.generateContent({
        model: MODEL_NAME,
        contents: [{ role: "user", parts: [{ text: reviewPrompt }] }],
        safetySettings,
        generationConfig: { responseMimeType: "application/json" },
      })
    );

    const candidate = result.candidates?.[0];
    const text = candidate?.content?.parts?.[0]?.text?.trim();
    if (!text) throw new Error("Empty review response");

    let jsonText = text;
    if (jsonText.startsWith("```")) {
      jsonText = jsonText.replace(/```json|```/g, "").trim();
    }

    const parsed = JSON.parse(jsonText);
    return _normalizedReview(parsed);
  } catch {
    return _buildHeuristicReview(userCode, aiCode);
  }
}

function _normalizedReview(obj) {
  const def = {
    summary: "",
    user: { strengths: [], weaknesses: [] },
    ai: { strengths: [], weaknesses: [] },
    scores: { algorithm: 70, correctness: 70, readability: 70, efficiency: 70 },
  };
  try {
    return {
      summary: String(obj?.summary || def.summary),
      user: {
        strengths: Array.isArray(obj?.user?.strengths) ? obj.user.strengths.slice(0, 10) : [],
        weaknesses: Array.isArray(obj?.user?.weaknesses) ? obj.user.weaknesses.slice(0, 10) : [],
      },
      ai: {
        strengths: Array.isArray(obj?.ai?.strengths) ? obj.ai.strengths.slice(0, 10) : [],
        weaknesses: Array.isArray(obj?.ai?.weaknesses) ? obj.ai.weaknesses.slice(0, 10) : [],
      },
      scores: {
        algorithm: _clamp0to100(Number(obj?.scores?.algorithm ?? def.scores.algorithm)),
        correctness: _clamp0to100(Number(obj?.scores?.correctness ?? def.scores.correctness)),
        readability: _clamp0to100(Number(obj?.scores?.readability ?? def.scores.readability)),
        efficiency: _clamp0to100(Number(obj?.scores?.efficiency ?? def.scores.efficiency)),
      },
    };
  } catch {
    return def;
  }
}

function _clamp0to100(n) {
  if (!Number.isFinite(n)) return 70;
  return Math.max(0, Math.min(100, Math.round(n)));
}

function _buildHeuristicReview(userCode = "", aiCode = "") {
  const lenU = (userCode || "").length;
  const lenA = (aiCode || "").length;
  const hasCommentsU = /\/\//.test(userCode) || /\/\*/.test(userCode);
  const hasCommentsA = /\/\//.test(aiCode) || /\/\*/.test(aiCode);
  const linesU = (userCode || "").split("\n").length;
  const linesA = (aiCode || "").split("\n").length;

  const readabilityU = _clamp0to100(60 + (hasCommentsU ? 10 : 0) + Math.min(10, Math.floor(linesU / 20)));
  const readabilityA = _clamp0to100(60 + (hasCommentsA ? 10 : 0) + Math.min(10, Math.floor(linesA / 20)));

  return {
    summary: "Heuristic review generated due to missing AI review.",
    user: {
      strengths: [hasCommentsU ? "Has explanatory comments" : "Concise implementation"],
      weaknesses: [lenU < 10 ? "Very short code may miss edge cases" : "Consider more descriptive naming"],
    },
    ai: {
      strengths: [hasCommentsA ? "Has explanatory comments" : "Concise implementation"],
      weaknesses: [lenA < 10 ? "Very short code may miss edge cases" : "May need clearer structure"],
    },
    scores: {
      algorithm: _clamp0to100(70 + Math.sign(lenU - lenA) * 5),
      correctness: 70,
      readability: Math.max(readabilityU, readabilityA),
      efficiency: 70,
    },
  };
}

/**
 * Generate structured guidance hints to help user think and plan steps fairly.
 */
export async function generateGuidanceHints({ prompt, userCode = "", aiCode = "", difficulty = 1 }) {
    try {
      const hintPrompt = `You are an assistant that gives helpful, fair coding hints.\nDo NOT provide full code. Focus on:\n- Thinking: a short mental model to approach the problem (objective)\n- Inner Monologue: first-person Bahasa Indonesia (gunakan kata 'saya'), 1-3 kalimat, nada natural, bukan instruksi ke user\n- Steps: 3-6 concrete steps the user can try next (second-person)\n- Pitfalls: common mistakes and how to avoid them\n- Fairness: keep competition fair; do not copy AI code\nReturn ONLY strict JSON with this schema:\n{\n  "thinking": string,\n  "innerMonologue": string,\n  "steps": string[],\n  "pitfalls": string[],\n  "fairness": string\n}\nConstraints:\n- Write innerMonologue strictly in Bahasa Indonesia, first-person singular using 'saya' and present-tense.\n- innerMonologue must NOT include lists, bullets, or code; keep 1-3 concise sentences.\n- thinking is objective/third-person; steps are actionable for the user; pitfalls are short.\n\nProblem:\n${prompt}\n\nUser Code (partial allowed):\n${userCode.slice(0, 4000)}\n\nAI Code (context only, do not replicate):\n${aiCode.slice(0, 2000)}\n`;

      const result = await retry(() =>
        ai.models.generateContent({
          model: MODEL_NAME,
          contents: [{ role: "user", parts: [{ text: hintPrompt }] }],
          safetySettings,
          generationConfig: { responseMimeType: "application/json" },
        })
      );

      const candidate = result.candidates?.[0];
      const text = candidate?.content?.parts?.[0]?.text?.trim();
      if (!text) throw new Error("Empty hint response");

      let jsonText = text;
      if (jsonText.startsWith("```")) {
        jsonText = jsonText.replace(/```json|```/g, "").trim();
      }
      const parsed = JSON.parse(jsonText);
      return _normalizeHints(parsed);
    } catch (e) {
      return _heuristicHints(prompt, userCode);
    }
  }

  function _normalizeHints(obj) {
    const thinking = String(obj?.thinking || "Break the problem into small, testable parts and reason about input-output patterns.");
    let inner = String(obj?.innerMonologue || "").trim();
    if (!inner) {
      // Build a soft fallback inner monologue in Indonesian
      inner = "Hmm... saya perlu memahami pola input-outputnya dulu, lalu menguji pendekatan paling sederhana sebelum memikirkan optimasi.";
    }
    return {
      thinking,
      innerMonologue: inner,
      steps: Array.isArray(obj?.steps) && obj.steps.length
        ? obj.steps.slice(0, 6)
        : [
            "Tulis fungsi kecil untuk satu kasus dasar terlebih dulu",
            "Tambahkan test sederhana dan jalankan",
            "Umumkan solusi ke kasus lain secara bertahap",
          ],
      pitfalls: Array.isArray(obj?.pitfalls) && obj.pitfalls.length
        ? obj.pitfalls.slice(0, 5)
        : ["Hindari asumsi tanpa uji edge case", "Perhatikan tipe data dan nilai kosong"],
      fairness: String(obj?.fairness || "Gunakan ide umum; jangan menyalin kode lawan agar kompetisi tetap adil."),
    };
  }

  function _heuristicHints(prompt, userCode) {
    const short = (prompt || "").slice(0, 160);
    return {
      thinking: `Pahami pola input-output dari soal: ${short}... Pikirkan solusi sederhana lebih dulu, lalu optimasi jika lolos test dasar.`,
      innerMonologue: "Hmm... saya perlu memahami pola input-outputnya dulu, menguji beberapa contoh kecil, lalu memutuskan struktur data yang paling masuk akal.",
      steps: [
        "Identifikasi kasus dasar dan tulis pseudo-code singkat",
        "Implementasikan langkah inti dalam 3-5 baris",
        "Tambahkan test sederhana untuk 1-2 contoh",
        "Refactor agar lebih rapi dan mudah dibaca",
      ],
      pitfalls: ["Terlalu cepat optimasi tanpa lulus test dasar", "Mengabaikan input kosong atau nilai ekstrem"],
      fairness: "Gunakan langkah-langkah umum; jangan menyalin kode pihak lain agar tetap adil.",
    };
  }
