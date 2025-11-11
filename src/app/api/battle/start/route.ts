// Start Battle API
// Creates a new battle match and returns a question

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await req.json();
    const { mode, userLevel } = body;

    // Select random question based on user level
    const questions = await prisma.question.findMany({
      where: {
        isPublished: true,
        difficulty: {
          gte: Math.max(1, userLevel - 1),
          lte: userLevel + 1,
        },
      },
    });

    if (questions.length === 0) {
      return NextResponse.json(
        { error: "No questions available" },
        { status: 404 }
      );
    }

    const question = questions[Math.floor(Math.random() * questions.length)];

    // Create match
    const match = await prisma.match.create({
      data: {
        mode,
        status: "in_progress",
        startedAt: new Date(),
        participants: {
          create: [
            {
              userId: user.id,
              isAI: false,
              isReady: true,
            },
            {
              userId: user.id, // For AI opponent, we use same user ID but mark as AI
              isAI: true,
              isReady: true,
            },
          ],
        },
        questions: {
          create: {
            questionId: question.id,
            order: 1,
          },
        },
      },
    });

    return NextResponse.json({
      matchId: match.id,
      question: {
        id: question.id,
        title: question.title,
        prompt: question.prompt,
        starterCode: question.starterCode,
        difficulty: question.difficulty,
        points: question.points,
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
