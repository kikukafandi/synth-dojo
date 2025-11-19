// Direct test for winner logic
import { evaluateCode } from './src/lib/evaluator.js';
import { calculateMatchScore } from './src/lib/utils.js';

// Test cases from seed data
const testCases = [
    { input: [2, 3], expected: 5 },
    { input: [10, 20], expected: 30 },
    { input: [-5, 5], expected: 0 }
];

const KODE_BENAR = `function sum(a, b) { return a + b; }`;
const KODE_SALAH = `function sum(a, b) { return a * b; }`;

async function testWinnerLogic() {
    console.log('Testing winner logic...');
    
    // Test user 1 (correct code)
    const result1 = await evaluateCode(KODE_BENAR, testCases);
    const score1 = calculateMatchScore(result1.correct, result1.runtimeMs, result1.styleScore, 10);
    
    console.log('User 1 (Correct code):');
    console.log('- Correct:', result1.correct);
    console.log('- Runtime:', result1.runtimeMs);
    console.log('- Style Score:', result1.styleScore);
    console.log('- Final Score:', score1);
    console.log('- Test Results:', JSON.stringify(result1.testResults, null, 2));
    
    // Test user 2 (wrong code)
    const result2 = await evaluateCode(KODE_SALAH, testCases);
    const score2 = calculateMatchScore(result2.correct, result2.runtimeMs, result2.styleScore, 10);
    
    console.log('\nUser 2 (Wrong code):');
    console.log('- Correct:', result2.correct);
    console.log('- Runtime:', result2.runtimeMs);
    console.log('- Style Score:', result2.styleScore);
    console.log('- Final Score:', score2);
    console.log('- Test Results:', JSON.stringify(result2.testResults, null, 2));
    
    // Winner logic
    let winnerId = null;
    const userId1 = "user1";
    const userId2 = "user2";
    
    if (score1 > score2) {
        winnerId = userId1;
    } else if (score2 > score1) {
        winnerId = userId2;
    }
    
    console.log('\nWinner determination:');
    console.log(`Score1: ${score1}, Score2: ${score2}`);
    console.log(`Winner: ${winnerId}`);
    console.log(`Expected Winner: ${userId1}`);
    console.log(`Test Pass: ${winnerId === userId1}`);
}

testWinnerLogic().catch(console.error);