// Submit Battle Solution API
// Evaluates user code and AI performance, determines winner

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/../../auth";
import { prisma } from "@/lib/prisma";
import { evaluateCode, generateAIScore } from "@/lib/evaluator";
import { calculateMatchScore, updateHP } from "@/lib/utils";

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
    const { code, questionId, mode, timeSpent } = body;

    // Get question details
    const question = await prisma.question.findUnique({
      where: { id: questionId },
    });

    if (!question) {
      return NextResponse.json(
        { error: "Question not found" },
        { status: 404 }
      );
    }

    // Evaluate user code
    const userResult = await evaluateCode(code, question.testCases);
    const userScore = calculateMatchScore(
      userResult.correct,
      userResult.runtimeMs,
      userResult.styleScore,
      question.points
    );

    // Generate AI performance
    const aiResult = generateAIScore(question.difficulty);
    const aiScore = calculateMatchScore(
      aiResult.correct,
      aiResult.runtimeMs,
      aiResult.styleScore,
      question.points
    );

    // Determine winner
    const winner = userScore > aiScore ? "user" : 
                   userScore < aiScore ? "ai" : null;

    // Find active match
    const match = await prisma.match.findFirst({
      where: {
        status: "in_progress",
        participants: {
          some: {
            userId: user.id,
            isAI: false,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (match) {
      // Create submission
      await prisma.matchSubmission.create({
        data: {
          matchId: match.id,
          userId: user.id,
          questionId: question.id,
          code,
          isCorrect: userResult.correct,
          score: userScore,
          runtimeMs: userResult.runtimeMs,
          styleScore: userResult.styleScore,
          output: JSON.stringify(userResult.testResults),
          error: userResult.error,
        },
      });

      // Update match
      await prisma.match.update({
        where: { id: match.id },
        data: {
          status: "completed",
          completedAt: new Date(),
          winnerId: winner === "user" ? user.id : null,
        },
      });

      // Update match participants scores
      await prisma.matchParticipant.updateMany({
        where: {
          matchId: match.id,
          userId: user.id,
          isAI: false,
        },
        data: {
          score: userScore,
        },
      });

      await prisma.matchParticipant.updateMany({
        where: {
          matchId: match.id,
          isAI: true,
        },
        data: {
          score: aiScore,
        },
      });
    }

    // Update user stats
    const newHP = updateHP(user.hp, winner === "user");
    const pointsToAdd = winner === "user" ? userScore : Math.floor(userScore * 0.3);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        points: {
          increment: pointsToAdd,
        },
        hp: newHP,
      },
    });

    // Update leaderboard
    const leaderboardEntry = await prisma.leaderboardEntry.findUnique({
      where: { userId: user.id },
    });

    if (leaderboardEntry) {
      await prisma.leaderboardEntry.update({
        where: { userId: user.id },
        data: {
          points: {
            increment: pointsToAdd,
          },
          wins: winner === "user" ? { increment: 1 } : undefined,
          losses: winner === "ai" ? { increment: 1 } : undefined,
        },
      });
    }

    return NextResponse.json({
      winner,
      userScore,
      opponentScore: aiScore,
      userResult: {
        correct: userResult.correct,
        runtimeMs: userResult.runtimeMs,
        styleScore: userResult.styleScore,
      },
      aiResult,
      pointsEarned: pointsToAdd,
      newHP,
    });
  } catch (error) {
    console.error("Submit battle error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
