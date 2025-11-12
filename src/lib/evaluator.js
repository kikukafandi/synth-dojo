// Synth-Dojo Code Evaluator
// Evaluates user code submissions against test cases
// Returns: correctness, runtime, style score, and hint tokens

/**
 * Evaluates code against test cases
 * @param code - User submitted code
 * @param testCases - Array of test cases
 * @param language - Programming language (default: javascript)
 * @returns Evaluation result with correctness, runtime, and style metrics
 */
export async function evaluateCode(
  code,
  testCases,
  language = 'javascript'
) { // <-- Perbaikan: Mengganti ';' dengan '{'
  const startTime = Date.now();
  const hintTokens = [];
  
  try {
    // Parse test cases
    const parsedTestCases = typeof testCases === 'string' 
      ? JSON.parse(testCases) 
      : testCases;

    // Extract function name from code
    const funcMatch = code.match(/function\s+(\w+)/);
    if (!funcMatch) {
      return {
        correct: false,
        runtimeMs: 0,
        styleScore: 0,
        hintTokens: ['missing_function'],
        error: 'No function found in code',
      };
    }

    const functionName = funcMatch[1];
    const testResults = {
      passed: 0,
      total: parsedTestCases.length,
      details: [], // <-- Menghapus 'as any[]'
    };

    // Run each test case
    for (const testCase of parsedTestCases) {
      try {
        // Create safe execution context
        const evalCode = `
          ${code}
          ${functionName}(${testCase.input.map((i) => JSON.stringify(i)).join(', ')})
        `; // <-- Menghapus ': any'
        
        const result = eval(evalCode);
        const passed = JSON.stringify(result) === JSON.stringify(testCase.expected);
        
        if (passed) {
          testResults.passed++;
        }

        testResults.details.push({
          input: testCase.input,
          expected: testCase.expected,
          actual: result,
          passed,
        });
      } catch (err) {
        testResults.details.push({
          input: testCase.input,
          expected: testCase.expected,
          actual: null,
          passed: false,
        });
      }
    }

    const runtimeMs = Date.now() - startTime;
    const correct = testResults.passed === testResults.total;
    
    // Calculate style score based on code quality heuristics
    const styleScore = calculateStyleScore(code);
    
    // Generate hint tokens based on results
    if (!correct) {
      if (testResults.passed === 0) {
        hintTokens.push('check_logic');
      } else if (testResults.passed < testResults.total / 2) {
        hintTokens.push('edge_cases');
      } else {
        hintTokens.push('minor_issues');
      }
    }

    return {
      correct,
      runtimeMs,
      styleScore,
      hintTokens,
      testResults,
    };
  } catch (error) {
    return {
      correct: false,
      runtimeMs: Date.now() - startTime,
      styleScore: 0,
      hintTokens: ['syntax_error'],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Calculates style score based on code quality heuristics
 * @param code - Code to analyze
 * @returns Score from 0-100
 */
function calculateStyleScore(code) { // <-- Menghapus ': string' dan ': number'
  let score = 100;
  
  // Check for proper indentation
  const lines = code.split('\n');
  const hasProperIndentation = lines.some(line => line.startsWith('  ') || line.startsWith('\t'));
  if (!hasProperIndentation) score -= 10;
  
  // Check for comments (bonus points)
  if (code.includes('//') || code.includes('/*')) {
    score = Math.min(100, score + 5);
  }
  
  // Penalize very long lines
  const hasLongLines = lines.some(line => line.length > 120);
  if (hasLongLines) score -= 5;
  
  // Check for meaningful variable names (not single letters)
  const varMatches = code.match(/(?:let|const|var)\s+([a-zA-Z_]\w*)/g);
  if (varMatches) {
    const singleLetterVars = varMatches.filter(v => 
      v.split(/\s+/)[1]?.length === 1
    );
    if (singleLetterVars.length > 2) score -= 10;
  }
  
  // Penalize excessive complexity (nested blocks)
  const nestedBlocks = (code.match(/\{/g) || []).length;
  if (nestedBlocks > 5) score -= 10;
  
  return Math.max(0, Math.min(100, score));
}

/**
 * Simulates AI opponent evaluation for battle mode
 * Returns a score based on difficulty level
 */
export function generateAIScore(difficulty) { // <-- Menghapus ': number' dan tipe return
  // AI performance based on difficulty
  const baseRuntime = 100;
  const variance = 50;
  
  return {
    correct: Math.random() > (0.3 / difficulty), // Higher difficulty = higher AI success rate
    runtimeMs: baseRuntime + Math.random() * variance * difficulty,
    styleScore: 60 + Math.random() * 30, // AI code style is decent
  };
}