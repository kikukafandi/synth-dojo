// src/app/api/battle/start/route.js
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma.js";
// Impor fungsi generator Gemini
import { generateGeminiQuestion } from "@/lib/gemini"; 
import { auth } from "@/lib/auth.js"; 

export async function POST(req) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Mock user untuk testing (sesuai file asli)
    const user = {
      id: session.user.id,
      email: session.user.email,
      level: session.user.level || 1, // Asumsikan ada properti level
    };

    const body = await req.json();
    const { mode, userLevel } = body; // userLevel sekarang didapat dari user di atas

    // 1. Dapatkan daftar soal yang sudah dilihat user
    const seenQuestions = await prisma.userSeenQuestion.findMany({
      where: { userId: user.id },
      select: { questionId: true },
    });
    const seenQuestionIds = seenQuestions.map(sq => sq.questionId);

    // 2. Cari soal di DB yang BELUM dilihat user
    const availableQuestions = await prisma.question.findMany({
      where: {
        isPublished: true,
        difficulty: {
          gte: Math.max(1, user.level - 1),
          lte: user.level + 1,
        },
        id: {
          notIn: seenQuestionIds, // Filter soal yang sudah dilihat
        },
      },
    });

    let selectedQuestion;

    if (availableQuestions.length > 0) {
      // 3a. Jika ada soal yang belum dilihat, pilih secara acak
      console.log(`Menemukan ${availableQuestions.length} soal yang belum dikerjakan.`);
      selectedQuestion = availableQuestions[Math.floor(Math.random() * availableQuestions.length)];
    } else {
      // 3b. (IDE ANDA) Jika semua soal sudah dilihat, buat soal baru!
      console.log("Semua soal sudah dikerjakan, membuat soal baru dengan AI...");
      
      let newQuestionData;
      try {
        // Panggil Gemini untuk membuat soal baru
        newQuestionData = await generateGeminiQuestion("JavaScript Algorithms", user.level);
      } catch (aiError) {
        console.error("Gagal membuat soal baru dengan AI:", aiError.message);
        // Fallback: Jika AI gagal, ambil saja soal acak yang sudah ada
        const allQuestions = await prisma.question.findMany({
          where: { isPublished: true },
          take: 50, // Ambil 50 soal secara acak saja
        });
        if (allQuestions.length === 0) {
          return NextResponse.json({ error: "No questions available in database and AI failed." }, { status: 500 });
        }
        selectedQuestion = allQuestions[Math.floor(Math.random() * allQuestions.length)];
        console.warn(`AI generation failed. Fallback to existing question: ${selectedQuestion.id}`);
      }

      // 4. (IDE ANDA) Simpan soal baru ke database (HANYA JIKA newQuestionData ADA dan fallback tidak digunakan)
      if (newQuestionData && !selectedQuestion) {
        // Lakukan validasi dasar
        if (!newQuestionData.title || !newQuestionData.prompt || !newQuestionData.testCases) {
          console.error("Data soal dari AI tidak valid/lengkap:", newQuestionData);
          // Fallback lagi jika data AI tidak valid
          const allQuestions = await prisma.question.findMany({ where: { isPublished: true }, take: 50 });
          if (allQuestions.length === 0) {
            return NextResponse.json({ error: "AI data invalid and no fallback questions." }, { status: 500 });
          }
          selectedQuestion = allQuestions[Math.floor(Math.random() * allQuestions.length)];
          console.warn(`AI data invalid. Fallback to existing question: ${selectedQuestion.id}`);
        } else {
          // Data AI valid, simpan ke database
          selectedQuestion = await prisma.question.create({
            data: {
              title: newQuestionData.title,
              prompt: newQuestionData.prompt,
              starterCode: newQuestionData.starterCode || "",
              testCases: newQuestionData.testCases, // Pastikan ini string JSON
              difficulty: newQuestionData.difficulty || user.level,
              points: newQuestionData.points || (user.level * 10),
              isPublished: true, // Langsung publish untuk digunakan
            },
          });
          console.log(`Soal baru [${selectedQuestion.id}] dibuat dan disimpan.`);
        }
      }
    }

    // 5. (IDE ANDA) Tandai soal ini sebagai "telah dilihat" oleh user
    if (!selectedQuestion) {
         console.error("Fatal: selectedQuestion tidak terdefinisi setelah semua logika.");
         return NextResponse.json({ error: "Failed to select a question." }, { status: 500 });
    }
    
    // Kita gunakan upsert untuk menghindari error jika user kebetulan dapat soal yang sama (dari fallback)
    await prisma.userSeenQuestion.upsert({
      where: {
        userId_questionId: {
          userId: user.id,
          questionId: selectedQuestion.id,
        },
      },
      update: {
        seenAt: new Date(),
      },
      create: {
        userId: user.id,
        questionId: selectedQuestion.id,
      },
    });

    // 6. Buat data match seperti sebelumnya
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
          create: {
            questionId: selectedQuestion.id,
            order: 1,
          },
        },
      },
    });

    // 7. Kembalikan soal ke user
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
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}