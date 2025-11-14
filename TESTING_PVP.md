# Testing PvP Feature

This guide explains how to test the PvP (Player vs Player) coding battle feature.

## Prerequisites

1. Install dependencies:
```bash
npm install
```

2. Set up database (if not already done):
```bash
npm run db:generate
npm run db:push
npm run db:seed
```

## Option 1: Automated Test (No Database Required)

Test the matchmaking flow without a database:

```bash
# Terminal 1: Start the WebSocket server
npm run dev:socket

# Terminal 2: Run the test script
node test-pvp-matchmaking.js
```

This simulates two players finding a match and tracking progress.

## Option 2: Manual Testing (Full Experience)

Test the complete PvP experience through the UI:

### Step 1: Start Both Servers

```bash
# Run both Next.js and WebSocket servers
npm run all

# Or in separate terminals:
# Terminal 1:
npm run dev:next

# Terminal 2:
npm run dev:socket
```

### Step 2: Open Two Browser Windows

1. Open two browser windows (or use incognito mode for the second)
2. Navigate to http://localhost:3000 in both
3. Log in with different accounts in each window:

**Window 1:**
- Email: admin@synthdojo.com
- Password: admin123

**Window 2:**
- Email: user@synthdojo.com
- Password: user123

### Step 3: Start PvP Match

1. In both windows, navigate to the PvP Arena (/pvp)
2. Click "Find Match" in the first window
3. Click "Find Match" in the second window
4. Both players should be matched and receive the same coding problem

### Step 4: Battle!

1. Start coding in both windows
2. Notice the opponent progress bar updating in real-time
3. Submit your solution when ready
4. See the results comparing both submissions

## What to Verify

- ✓ Matchmaking queue works correctly
- ✓ Players at similar levels get matched (±2 levels)
- ✓ Both players receive the same question
- ✓ Real-time progress tracking shows opponent typing
- ✓ Code submission and evaluation works
- ✓ Winner is determined correctly based on:
  - Correctness (passing all tests)
  - Runtime (execution speed)
  - Style score (code quality)
- ✓ Match results are saved to database
- ✓ Player stats (points, HP, level) update correctly

## Troubleshooting

### "Failed to connect to matchmaking server"

**Problem:** WebSocket server is not running

**Solution:**
```bash
npm run dev:socket
```

### Players don't get matched

**Problem:** Level difference is too large

**Solution:** Make sure test accounts have similar levels (within ±2)

### Match doesn't start after both players are found

**Problem:** Database connection issue

**Solution:** Check DATABASE_URL in .env and verify database is accessible

## Unit Tests

Run the existing unit tests:

```bash
npm test
```

Note: PvP database tests will be skipped without DATABASE_URL configured.

## Socket Events Reference

The PvP system uses these Socket.IO events:

**Client → Server:**
- `find_match` - Enter matchmaking queue
- `cancel_match` - Leave matchmaking queue
- `typing_progress` - Send coding progress
- `submit_code` - Submit solution for evaluation

**Server → Client:**
- `waiting_for_opponent` - Waiting in queue
- `match_found` - Match created, start battle
- `opponent_progress` - Opponent typing progress
- `submission_received` - Code received, waiting for opponent
- `match_finished` - Battle complete with results
- `match_error` - Error occurred

## Performance Testing

To test with multiple concurrent matches:

1. Start the servers
2. Run multiple instances of the test script:

```bash
# Terminal 1: Socket server
npm run dev:socket

# Terminal 2-5: Test instances
node test-pvp-matchmaking.js
# Wait for completion, then run again
```

This simulates high load on the matchmaking system.
