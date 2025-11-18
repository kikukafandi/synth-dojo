// src/app/api/battle/start/route.js
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma.js";
import { generateGeminiQuestion } from "@/lib/gemini";
import { auth } from "@/lib/auth.js";

export async function POST(req) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = {
      id: session.user.id,
      email: session.user.email,
      level: session.user.level || 1,
    };

    const body = await req.json();
    const { mode } = body;

    // --- 1. Ambil soal yang sudah dilihat user
    const seen = await prisma.userSeenQuestion.findMany({
      where: { userId: user.id },
      select: { questionId: true },
    });
    const seenIds = seen.map(s => s.questionId);

    // --- 2. Cari soal baru yang belum dilihat
    const availableQuestions = await prisma.question.findMany({
      where: {
        isPublished: true,
        difficulty: { gte: user.level - 1, lte: user.level + 1 },
        id: { notIn: seenIds },
      },
    });

    let selectedQuestion = null;

    if (availableQuestions.length > 0) {
      // 3a — Masih ada soal belum dilihat
      selectedQuestion = availableQuestions[Math.floor(Math.random() * availableQuestions.length)];

    } else {
      // 3b — Semua soal sudah dikerjakan → coba minta AI
      console.log("Semua soal sudah dikerjakan, membuat soal baru dengan AI...");

      let newQuestionData = null;

      try {
        newQuestionData = await generateGeminiQuestion("JavaScript Algorithms", user.level);
      } catch (err) {
        console.error("Gemini question generation error:", err.message);
      }

      // --- 4. VALIDASI AI QUESTION ---
      const isAIValid =
        newQuestionData &&
        newQuestionData.title &&
        newQuestionData.prompt &&
        newQuestionData.testCases;

      if (isAIValid) {
        // --- SIMPAN SOAL BARU KE DB ---
        selectedQuestion = await prisma.question.create({
          data: {
            title: newQuestionData.title,
            prompt: newQuestionData.prompt,
            starterCode: newQuestionData.starterCode || "",
            testCases:
              typeof newQuestionData.testCases === "string"
                ? newQuestionData.testCases
                : JSON.stringify(newQuestionData.testCases),
            difficulty: newQuestionData.difficulty || user.level,
            points: newQuestionData.points || user.level * 10,
            isPublished: true,
          },
        });

        console.log(`Soal baru dibuat [${selectedQuestion.id}]`);
      } else {
        // --- Fallback jika AI gagal
        console.warn("AI invalid, fallback ke soal acak.");

        const fallback = await prisma.question.findFirst({
          where: { isPublished: true },
        });

        if (!fallback) {
          return NextResponse.json(
            { error: "No questions available and AI failed" },
            { status: 500 }
          );
        }

        selectedQuestion = fallback;
      }
    }

    // --- 5. Tandai soal sudah dilihat user
    await prisma.userSeenQuestion.upsert({
      where: {
        userId_questionId: {
          userId: user.id,
          questionId: selectedQuestion.id,
        },
      },
      update: { seenAt: new Date() },
      create: {
        userId: user.id,
        questionId: selectedQuestion.id,
      },
    });

    // --- 6. Buat match
    const match = await prisma.match.create({
      data: {
        mode,
        status: "in_progress",
        startedAt: new Date(),
        participants: {
          create: [
            { userId: user.id, isAI: false, isReady: true },
            { userId: `${user.id}-ai`, isAI: true, isReady: true },
          ],
        },
        questions: {
          create: { questionId: selectedQuestion.id, order: 1 },
        },
      },
    });

    // --- 7. Kirim response
    return NextResponse.json({
      matchId: match.id,
      question: {
        id: selectedQuestion.id,
        title: selectedQuestion.title,
        prompt: selectedQuestion.prompt,
        starterCode: selectedQuestion.starterCode,
        difficulty: selectedQuestion.difficulty,
        points: selectedQuestion.points,
      },
    });

  } catch (error) {
    console.error("Start battle error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
