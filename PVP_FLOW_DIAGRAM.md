# PvP Match Flow Diagram

## Visual Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         PvP CODING BATTLE FLOW                           │
└─────────────────────────────────────────────────────────────────────────┘

PLAYER A                        SERVER                          PLAYER B
────────                        ──────                          ────────

Click "Find Match"  ──────►  Add to Queue
                              waitingPlayers[]
                                   │
                                   │ Waiting for opponent...
                                   │
                                   │                   Click "Find Match"
                                   │  ◄────────────────
                                   │
                              Check Level Match
                              (|LevelA - LevelB| ≤ 2)
                                   │
                                   ├─► Create Match in DB
                                   │
                                   ├─► Select Question
                                   │   (based on levels)
                                   │
  ◄──── match_found ───────────────┼─────────────── match_found ──►
        {matchId, question,        │              {matchId, question,
         players}                  │               players}
                                   │
  Display Matched Screen           │           Display Matched Screen
         │                         │                    │
         │  3 second countdown     │    3 second countdown
         │                         │                    │
  ──────▼─────────────────────────────────────────────▼───────
  
  Battle Begins!                   │              Battle Begins!
  Code Editor Active               │              Code Editor Active
         │                         │                    │
         │                         │                    │
  User types code                  │              User types code
         │                         │                    │
  typing_progress ──────►  Forward ─────► opponent_progress
         │    {progress: 50%}      │       {progress: 50%}
         │                         │                    │
         │                         │                    │
  submit_code ──────────►  Evaluate Code ◄───────── submit_code
  {matchId, code}          evaluateCode()        {matchId, code}
         │                 calculateScore()            │
         │                      │                      │
  submission_received ◄──       │      ──► submission_received
         │                      │                      │
  "Waiting for opponent"        │       "Waiting for opponent"
         │                      │                      │
         │                      │                      │
         │              Both Submitted!                │
         │              Determine Winner               │
         │              (Compare Scores)               │
         │                      │                      │
         │              Update Database                │
         │              - Match status                 │
         │              - User points/HP               │
         │              - Leaderboard                  │
         │                      │                      │
  ◄───── match_finished ────────┼─────── match_finished ──►
         {winnerId, results}    │       {winnerId, results}
         │                      │                      │
  Display Winner/Loser          │         Display Winner/Loser
  Show Detailed Scores          │         Show Detailed Scores
         │                      │                      │
  Click "Find New Match" ───►   │   ◄─── Click "Find New Match"
         │                      │                      │
         └──────────────────► Repeat ◄─────────────────┘
```

## Event Flow Details

### 1. Matchmaking Phase
```
Client                                    Server
  │                                         │
  ├─► find_match {userId, level}           │
  │                                         ├─► waitingPlayers.push(socket)
  │                                         ├─► Find compatible opponent
  │                                         │   (level difference ≤ 2)
  │                                         │
  │   If no opponent found:                │
  │   ◄── waiting_for_opponent             │
  │                                         │
  │   If opponent found:                   │
  │   ◄── match_found                      │
  │       {matchId, question, players}     │
```

### 2. Battle Phase
```
Player A                    Server                    Player B
   │                          │                          │
   ├─► typing_progress        │                          │
   │   {matchId, progress}    │                          │
   │                          ├─► opponent_progress ──►  │
   │                          │    {progress: 50%}       │
   │                          │                          │
   │                          │   ◄── typing_progress ───┤
   │                          │       {matchId, progress}│
   │  ◄── opponent_progress   │                          │
   │      {progress: 75%}     │                          │
```

### 3. Submission Phase
```
Player A                         Server                        Player B
   │                               │                               │
   ├─► submit_code                 │                               │
   │   {matchId, questionId, code} │                               │
   │                               ├─► evaluateCode(codeA)         │
   │                               ├─► Save to DB                  │
   │                               ├─► Check if opponent submitted │
   │                               │                               │
   │  ◄── submission_received      │                               │
   │                               │                               │
   │                               │          ◄── submit_code ─────┤
   │                               │              {matchId, code}  │
   │                               ├─► evaluateCode(codeB)         │
   │                               ├─► Save to DB                  │
   │                               │                               │
   │                               ├─► calculateScore(resultA)     │
   │                               ├─► calculateScore(resultB)     │
   │                               ├─► determineWinner()           │
   │                               ├─► Update Match.winnerId       │
   │                               ├─► Update User points/HP       │
   │                               ├─► Update Leaderboard          │
   │                               │                               │
   │  ◄── match_finished           │       ──► match_finished      │
   │      {winnerId, results}      │           {winnerId, results} │
```

## Database Operations

```
Match Creation:
┌──────────────────────────────────────┐
│ Match                                │
│  - mode: "pvp"                       │
│  - status: "in_progress"             │
│  - startedAt: now()                  │
├──────────────────────────────────────┤
│ MatchParticipant (x2)                │
│  - userId: player1.id                │
│  - isAI: false                       │
│  - isReady: true                     │
├──────────────────────────────────────┤
│ MatchQuestion                        │
│  - questionId: selected.id           │
│  - order: 1                          │
└──────────────────────────────────────┘

Match Completion:
┌──────────────────────────────────────┐
│ Match (Updated)                      │
│  - status: "completed"               │
│  - winnerId: winner.id               │
│  - completedAt: now()                │
├──────────────────────────────────────┤
│ MatchSubmission (x2)                 │
│  - code, isCorrect, score            │
│  - runtimeMs, styleScore             │
├──────────────────────────────────────┤
│ User (Winner Updated)                │
│  - points: +score                    │
│  - hp: +1 (max 5)                    │
├──────────────────────────────────────┤
│ User (Loser Updated)                 │
│  - points: +30% of score             │
│  - hp: -1 (min 0)                    │
├──────────────────────────────────────┤
│ LeaderboardEntry (Both Updated)      │
│  - points, wins/losses               │
└──────────────────────────────────────┘
```

## Winner Determination Algorithm

```
calculateMatchScore(correct, runtimeMs, styleScore, basePoints):
  │
  ├─► If NOT correct:
  │     return 0
  │
  ├─► speedBonus = max(0, 1 - runtimeMs/5000) * 0.5
  │                 (faster execution = up to +50%)
  │
  ├─► styleBonus = (styleScore/100) * 0.3
  │                 (cleaner code = up to +30%)
  │
  └─► totalScore = basePoints * (1 + speedBonus + styleBonus)


Winner Determination:
  │
  ├─► scoreA > scoreB  → Winner: Player A
  ├─► scoreB > scoreA  → Winner: Player B
  └─► scoreA = scoreB  → Draw (winnerId = null)
```

## State Management

```
Match States:
┌──────────────────────────────────────┐
│ idle        → Initial state           │
│ searching   → In matchmaking queue    │
│ matched     → Opponent found          │
│ fighting    → Battle in progress      │
│ waiting     → Submitted, waiting      │
│ finished    → Battle complete         │
└──────────────────────────────────────┘

State Transitions:
idle ──► searching ──► matched ──► fighting ──► waiting ──► finished
  ▲         │                                                  │
  │         │ Cancel                                           │
  └─────────┴──────────────────────────────────────────────────┘
              Find New Match
```

## Error Handling

```
Errors:
┌────────────────────────────────────────┐
│ match_error                            │
│  - "Failed to create match room"       │
│  - "Failed to connect to server"       │
│  - "Authentication error"              │
│  - "Failed to process submission"      │
└────────────────────────────────────────┘

Disconnect Handling: 
Player Disconnects During Queue:
  └─► Remove from waitingPlayers[]

Player Disconnects During Match:
  └─► Match continues (not implemented yet)
      Future: Auto-forfeit or time out
```
