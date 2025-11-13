
const API_KEY = process.env.OPENAI_API_KEY;
const BASE_URL = process.env.OPENAI_BASE_URL || 'https://ai.dinoiki.com/v1';
const MODEL = process.env.OPENAI_MODEL || 'gpt-5-mini';


/**
 * Generate AI code solution for a given problem
 * @param {string} prompt - The coding problem prompt
 * @param {string} starterCode - Initial code template
 * @param {number} difficulty - Problem difficulty (1-5)
 * @returns {Promise<string>} Generated code solution
 */
export async function generateAICode(prompt, starterCode = "", difficulty = 1) {
  try {

    if (!API_KEY) {
      throw new Error("OPENAI_API_KEY not found in environment variables");
    }

    const difficultyPrompts = {
      1: "Write a simple, basic solution. Use straightforward logic.",
      2: "Write a clean solution with good variable names.",
      3: "Write an efficient solution with proper error handling.",
      4: "Write an optimized solution with advanced techniques.",
      5: "Write a highly optimized, elegant solution with best practices."
    };

    const systemPrompt = `You are an AI coding opponent in a programming battle. 
${difficultyPrompts[difficulty] || difficultyPrompts[3]}

Rules:
- Only return the JavaScript function code, no explanations
- Use the exact function name from the starter code if provided
- Write clean, readable code
- Ensure the solution works for all test cases
- Keep it concise but correct`;

    const userPrompt = `Problem: ${prompt}

${starterCode ? `Starter code:\n${starterCode}` : ''}

Write a JavaScript function to solve this problem.`;

    const requestBody = {
      model: MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      max_completion_tokens: 500,
      temperature: 1
    };

    const response = await fetch(`${BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API request failed: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    const generatedCode = data.choices?.[0]?.message?.content || "";
    
    if (!generatedCode) {
      throw new Error("Empty response from AI API");
    }

    return generatedCode;
  } catch (error) {
    console.error("AI API error:", error);
    throw new Error(`Failed to generate AI code: ${error.message}`);
  }
}

