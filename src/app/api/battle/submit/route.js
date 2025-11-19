// Submit Battle Solution API
// Evaluates user code and AI performance, determines winner

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { evaluateCode, generateAIScore } from "@/lib/evaluator";
import { calculateMatchScore, updateHP } from "@/lib/utils";
import { generateCodeComparisonReview } from "@/lib/gemini";

export async function POST(req) {
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
    const { code, questionId, mode, timeSpent, aiCode } = body;

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
    const baseUserScore = calculateMatchScore(
      userResult.correct,
      userResult.runtimeMs,
      userResult.styleScore,
      question.points
    );

    // Evaluate AI performance: prefer actual AI code if available; fallback to simulation
    let aiResult;
    if (aiCode && typeof aiCode === 'string' && aiCode.trim().length > 0) {
      aiResult = await evaluateCode(aiCode, question.testCases);
    } else {
      aiResult = generateAIScore(question.difficulty);
    }
    const baseAiScore = calculateMatchScore(
      aiResult.correct,
      aiResult.runtimeMs,
      aiResult.styleScore,
      question.points
    );

    // Apply small bias toward user
    let userScore = Math.floor(baseUserScore * 1.1); // +10%
    let aiScore = baseAiScore;
    if (userScore === aiScore) userScore += 1; // break ties in favor of user

    // Determine winner with bias
    const winner = userScore > aiScore ? "user" : "ai";

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

    // Update user stats with nuanced loss behavior
    const timedOut = typeof timeSpent === 'number' && timeSpent >= 300;
    const severeLoss = (userScore === 0 && !!aiResult.correct) || (aiScore - userScore >= Math.max(20, Math.floor(question.points * 0.5)));
    const newHP = updateHP(user.hp, winner === "user");
    let pointsToAdd;
    if (winner === "user") {
      // bigger reward on win
      pointsToAdd = Math.max(question.points, Math.floor(userScore * 1.15));
    } else {
      // nuanced loss: 0 if timeout and severe loss; else small consolation points
      if (timedOut && severeLoss) {
        pointsToAdd = 0;
      } else {
        pointsToAdd = Math.max(Math.floor(question.points * 0.1), Math.floor(userScore * 0.3));
      }
    }

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

    // Build review using Gemini (best-effort)
    let review = null;
    try {
      review = await generateCodeComparisonReview({
        prompt: question.prompt,
        userCode: code,
        aiCode: aiCode || "",
      });
    } catch {}

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
      timedOut,
      severeLoss,
      review,
    });
  } catch (error) {
    console.error("Submit battle error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
