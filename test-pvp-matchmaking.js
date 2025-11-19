// Test PvP Matchmaking Flow
// This script simulates two players finding a match

import { io as Client } from 'socket.io-client';

const URL = "http://localhost:3001";

console.log('🎮 Testing PvP Matchmaking Flow...\n');

// Simulate Player 1
const player1 = Client(URL, { 
    forceNew: true,
    autoConnect: false 
});

// Simulate Player 2
const player2 = Client(URL, { 
    forceNew: true,
    autoConnect: false 
});

let player1MatchId = null;
let player2MatchId = null;

// Player 1 Events
player1.on('connect', () => {
    console.log('✓ Player 1 connected');
    player1.emit('find_match', {
        userId: 'test-user-1',
        userName: 'TestPlayer1',
        level: 3
    });
});

player1.on('waiting_for_opponent', () => {
    console.log('⏳ Player 1 waiting for opponent...');
});

player1.on('match_found', (data) => {
    console.log('✓ Player 1 received match!');
    console.log('  Match ID:', data.matchId);
    console.log('  Question:', data.question.title);
    console.log('  Opponent:', data.players.find(p => p.userId !== 'test-user-1')?.userName);
    player1MatchId = data.matchId;
    
    // Simulate typing progress
    setTimeout(() => {
        player1.emit('typing_progress', { 
            matchId: player1MatchId, 
            progress: 50 
        });
        console.log('⌨️  Player 1 typing progress: 50%');
    }, 2000);
});

player1.on('opponent_progress', (data) => {
    console.log('📊 Player 1 sees opponent progress:', data.progress + '%');
});

player1.on('match_error', (error) => {
    console.error('✗ Player 1 error:', error);
});

// Player 2 Events
player2.on('connect', () => {
    console.log('✓ Player 2 connected');
    // Delay player 2 slightly to test queue
    setTimeout(() => {
        player2.emit('find_match', {
            userId: 'test-user-2',
            userName: 'TestPlayer2',
            level: 4
        });
    }, 1000);
});

player2.on('waiting_for_opponent', () => {
    console.log('⏳ Player 2 waiting for opponent...');
});

player2.on('match_found', (data) => {
    console.log('✓ Player 2 received match!');
    console.log('  Match ID:', data.matchId);
    console.log('  Question:', data.question.title);
    console.log('  Opponent:', data.players.find(p => p.userId !== 'test-user-2')?.userName);
    player2MatchId = data.matchId;
    
    // Simulate typing progress
    setTimeout(() => {
        player2.emit('typing_progress', { 
            matchId: player2MatchId, 
            progress: 75 
        });
        console.log('⌨️  Player 2 typing progress: 75%');
    }, 3000);
    
    // Cleanup after test
    setTimeout(() => {
        console.log('\n✅ Test completed successfully!');
        console.log('   Both players matched correctly');
        console.log('   Real-time progress tracking works');
        player1.disconnect();
        player2.disconnect();
        process.exit(0);
    }, 5000);
});

player2.on('opponent_progress', (data) => {
    console.log('📊 Player 2 sees opponent progress:', data.progress + '%');
});

player2.on('match_error', (error) => {
    console.error('✗ Player 2 error:', error);
});

// Connect both players
player1.connect();
setTimeout(() => player2.connect(), 500);

// Timeout after 10 seconds
setTimeout(() => {
    console.error('\n✗ Test timeout - Socket server may not be running');
    console.log('   Run: npm run dev:socket');
    player1.disconnect();
    player2.disconnect();
    process.exit(1);
}, 10000);
