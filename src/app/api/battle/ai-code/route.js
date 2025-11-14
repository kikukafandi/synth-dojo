// AI Code Generation API
// Streams AI code generation for real-time battle experience

import { NextRequest, NextResponse } from "next/server";
import { generateAICode } from "@/lib/openai";
import { auth } from "@/lib/auth";

export async function POST(req) {
  try {
    // BYPASS AUTH FOR TESTING - Remove this in production
    // const session = await auth();
    // if (!session?.user?.email) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // }

    const body = await req.json();
    const { prompt, starterCode, difficulty, matchId, typingSpeed = 50 } = body;

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    // Create a readable stream for Server-Sent Events
    const encoder = new TextEncoder();
    
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Send initial event
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ 
              type: 'start', 
              code: '',
              progress: 0,
              isTyping: true 
            })}\n\n`)
          );

          // First, generate the complete code
          console.log("Generating AI code...");
          const fullCode = await generateAICode(prompt, starterCode, difficulty);
          console.log("Generated code length:", fullCode?.length);
          
          if (!fullCode) {
            throw new Error("Failed to generate AI code - empty response");
          }

          // Now simulate typing character by character
          let currentCode = "";
          const totalLength = fullCode.length;
          
          for (let i = 0; i < fullCode.length; i++) {
            // Check if controller is still open
            if (controller.desiredSize === null) {
              console.log("Stream controller closed, stopping typing simulation");
              break;
            }

            currentCode += fullCode[i];
            const progress = Math.round((i + 1) / totalLength * 100);
            
            try {
              // Send each character
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ 
                  type: 'typing', 
                  code: currentCode,
                  progress: progress,
                  isTyping: true,
                  totalLength: totalLength,
                  currentLength: i + 1
                })}\n\n`)
              );
            } catch (error) {
              console.log("Failed to enqueue data, stream may be closed:", error.message);
              break;
            }

            // Calculate typing delay based on character and speed setting
            let delay = typingSpeed;
            
            // Add variation for realistic typing
            if (fullCode[i] === '\n') {
              delay += 100; // Pause longer at line breaks
            } else if (fullCode[i] === ' ') {
              delay += 20; // Slight pause at spaces
            } else if (['{', '}', '(', ')', ';'].includes(fullCode[i])) {
              delay += 30; // Pause at syntax characters
            }
            
            // Add random variation (±20ms)
            delay += Math.random() * 40 - 20;
            
            await new Promise(resolve => setTimeout(resolve, Math.max(10, delay)));
          }

          // Send completion event
          try {
            if (controller.desiredSize !== null) {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ 
                  type: 'complete', 
                  code: fullCode,
                  progress: 100,
                  isTyping: false
                })}\n\n`)
              );
              controller.close();
            }
          } catch (error) {
            console.log("Failed to send completion event:", error.message);
          }
        } catch (error) {
          console.error("AI code generation error:", error);
          try {
            if (controller.desiredSize !== null) {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ 
                  type: 'error', 
                  error: error.message,
                  isTyping: false 
                })}\n\n`)
              );
              controller.close();
            }
          } catch (closeError) {
            console.log("Failed to send error event:", closeError.message);
          }
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type',
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
