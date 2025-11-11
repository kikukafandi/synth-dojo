// Unit Tests for Code Evaluator
// Tests correctness evaluation, runtime measurement, and style scoring

import { describe, it, expect } from 'vitest';
import { evaluateCode, generateAIScore } from '../evaluator';

describe('Code Evaluator', () => {
  describe('evaluateCode', () => {
    it('should evaluate correct code successfully', async () => {
      const code = `
        function sum(a, b) {
          return a + b;
        }
      `;
      
      const testCases = [
        { input: [2, 3], expected: 5 },
        { input: [10, 20], expected: 30 },
        { input: [-5, 5], expected: 0 },
      ];

      const result = await evaluateCode(code, testCases);

      expect(result.correct).toBe(true);
      expect(result.runtimeMs).toBeGreaterThanOrEqual(0);
      expect(result.styleScore).toBeGreaterThan(0);
      expect(result.testResults?.passed).toBe(3);
      expect(result.testResults?.total).toBe(3);
    });

    it('should detect incorrect code', async () => {
      const code = `
        function sum(a, b) {
          return a - b; // Wrong operation
        }
      `;
      
      const testCases = [
        { input: [2, 3], expected: 5 },
        { input: [10, 20], expected: 30 },
      ];

      const result = await evaluateCode(code, testCases);

      expect(result.correct).toBe(false);
      expect(result.testResults?.passed).toBe(0);
      expect(result.hintTokens.length).toBeGreaterThan(0);
    });

    it('should handle syntax errors', async () => {
      const code = `
        function sum(a, b {
          return a + b; // Missing closing parenthesis
        }
      `;
      
      const testCases = [
        { input: [2, 3], expected: 5 },
      ];

      const result = await evaluateCode(code, testCases);

      expect(result.correct).toBe(false);
      // Syntax errors may be caught by eval and returned as different error types
      expect(result.hintTokens.length).toBeGreaterThan(0);
    });

    it('should detect missing function', async () => {
      const code = `
        const x = 10; // No function defined
      `;
      
      const testCases = [
        { input: [2, 3], expected: 5 },
      ];

      const result = await evaluateCode(code, testCases);

      expect(result.correct).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error).not.toBeNull();
    });

    it('should evaluate partial success correctly', async () => {
      const code = `
        function sum(a, b) {
          if (a === 2 && b === 3) return 5;
          return 0; // Fails other test cases
        }
      `;
      
      const testCases = [
        { input: [2, 3], expected: 5 },
        { input: [10, 20], expected: 30 },
        { input: [-5, 5], expected: 0 },
      ];

      const result = await evaluateCode(code, testCases);

      expect(result.correct).toBe(false);
      expect(result.testResults?.passed).toBeLessThan(result.testResults?.total!);
      expect(result.hintTokens.length).toBeGreaterThan(0);
    });

    it('should calculate style score based on code quality', async () => {
      const goodCode = `
        function sum(firstNumber, secondNumber) {
          // Add two numbers together
          const result = firstNumber + secondNumber;
          return result;
        }
      `;
      
      const poorCode = `function sum(x,y){return x+y;}`;
      
      const testCases = [{ input: [2, 3], expected: 5 }];

      const goodResult = await evaluateCode(goodCode, testCases);
      const poorResult = await evaluateCode(poorCode, testCases);

      // Good code should have proper indentation and meaningful names
      expect(goodResult.styleScore).toBeGreaterThanOrEqual(90);
      // Poor code should be penalized for lack of indentation and single-letter vars
      expect(poorResult.styleScore).toBeLessThanOrEqual(goodResult.styleScore);
    });

    it('should measure runtime correctly', async () => {
      const code = `
        function sum(a, b) {
          return a + b;
        }
      `;
      
      const testCases = [
        { input: [2, 3], expected: 5 },
      ];

      const result = await evaluateCode(code, testCases);

      expect(result.runtimeMs).toBeGreaterThanOrEqual(0);
      expect(result.runtimeMs).toBeLessThan(1000); // Should be fast
    });
  });

  describe('generateAIScore', () => {
    it('should generate AI score based on difficulty', () => {
      const easyAI = generateAIScore(1);
      const hardAI = generateAIScore(5);

      expect(easyAI.runtimeMs).toBeGreaterThan(0);
      expect(easyAI.styleScore).toBeGreaterThanOrEqual(60);
      expect(easyAI.styleScore).toBeLessThanOrEqual(90);

      // Higher difficulty should have different characteristics
      expect(hardAI.runtimeMs).toBeGreaterThan(0);
    });

    it('should have varying correctness based on difficulty', () => {
      // Run multiple times to test randomness
      const results = Array.from({ length: 20 }, () => generateAIScore(1));
      const correctCount = results.filter(r => r.correct).length;

      // At difficulty 1, AI should succeed some of the time
      expect(correctCount).toBeGreaterThan(0);
      expect(correctCount).toBeLessThan(20);
    });

    it('should return valid score structure', () => {
      const score = generateAIScore(3);

      expect(score).toHaveProperty('correct');
      expect(score).toHaveProperty('runtimeMs');
      expect(score).toHaveProperty('styleScore');
      expect(typeof score.correct).toBe('boolean');
      expect(typeof score.runtimeMs).toBe('number');
      expect(typeof score.styleScore).toBe('number');
    });
  });
});
