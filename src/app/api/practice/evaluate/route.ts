// Practice Evaluation API
// Evaluates user code against test cases

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { evaluateCode } from "@/lib/evaluator";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const body = await req.json();
    const { code, questionId, testCases } = body;

    if (!code || !questionId || !testCases) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Evaluate the code
    const result = await evaluateCode(code, testCases);

    // If correct, award points
    if (result.correct) {
      const question = await prisma.question.findUnique({
        where: { id: questionId },
      });

      if (question) {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            points: {
              increment: question.points,
            },
          },
        });
      }
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Practice evaluation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
