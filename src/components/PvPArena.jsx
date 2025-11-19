"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { io } from "socket.io-client";
import CodeEditor from "./CodeEditor.jsx";

export default function PvPArena({ userId, userName, userLevel }) {
  const [matchState, setMatchState] = useState("idle"); // idle, searching, matched, fighting, finished
  const [socket, setSocket] = useState(null);
  const [matchId, setMatchId] = useState(null);
  const [question, setQuestion] = useState(null);
  const [opponent, setOpponent] = useState(null);
  const [opponentProgress, setOpponentProgress] = useState(0);
  const [timeLeft, setTimeLeft] = useState(300);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const codeRef = useRef("");

  // Initialize socket connection
  useEffect(() => {
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001";
    const newSocket = io(socketUrl, {
      autoConnect: false,
    });

    newSocket.on("connect", () => {
      console.log("Connected to socket server");
    });

    newSocket.on("connect_error", (err) => {
      console.error("Socket connection error:", err);
      setError("Failed to connect to matchmaking server");
    });

    newSocket.on("waiting_for_opponent", () => {
      console.log("Waiting for opponent...");
      setMatchState("searching");
    });

    newSocket.on("match_found", (data) => {
      console.log("Match found!", data);
      setMatchId(data.matchId);
      setQuestion(data.question);
      
      // Identify opponent
      const opponentData = data.players.find(p => p.userId !== userId);
      setOpponent(opponentData);
      
      setMatchState("matched");
      
      // Start the match after a short delay
      setTimeout(() => {
        setMatchState("fighting");
        setTimeLeft(data.question.timeLimit || 300);
      }, 3000);
    });

    newSocket.on("opponent_progress", (data) => {
      setOpponentProgress(data.progress);
    });

    newSocket.on("submission_received", () => {
      console.log("Your submission received, waiting for opponent...");
      setLoading(false);
      setMatchState("waiting_result");
    });

    newSocket.on("match_finished", (data) => {
      console.log("Match finished!", data);
      setResult(data);
      setMatchState("finished");
      setLoading(false);
    });

    newSocket.on("match_error", (errorMsg) => {
      console.error("Match error:", errorMsg);
      setError(errorMsg);
      setMatchState("idle");
      setLoading(false);
    });

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSocket(newSocket);

    return () => {
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, [userId]);

  const handleSubmit = useCallback(async (code) => {
    if (!question || !socket || !matchId) return;

    setLoading(true);
    
    socket.emit("submit_code", {
      matchId,
      questionId: question.id,
      code,
    });
  }, [question, socket, matchId]);

  // Timer countdown
  useEffect(() => {
    if (matchState === "fighting" && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => Math.max(0, prev - 1));
      }, 1000);
      return () => clearInterval(timer);
    } else if (matchState === "fighting" && timeLeft === 0) {
      // Auto-submit when time runs out
      handleSubmit(codeRef.current);
    }
  }, [matchState, timeLeft, handleSubmit]);

  const findMatch = () => {
    if (!socket) return;
    
    setError(null);
    setMatchState("searching");
    
    socket.connect();
    socket.emit("find_match", {
      userId,
      userName,
      level: userLevel,
    });
  };

  const cancelSearch = () => {
    if (socket) {
      socket.emit("cancel_match");
      socket.disconnect();
    }
    setMatchState("idle");
  };

  const handleCodeChange = (code) => {
    codeRef.current = code;
    
    // Send typing progress to opponent
    if (socket && matchId && matchState === "fighting") {
      const progress = Math.min(100, (code.length / 200) * 100);
      socket.emit("typing_progress", { matchId, progress });
    }
  };

  const resetMatch = () => {
    setMatchState("idle");
    setMatchId(null);
    setQuestion(null);
    setOpponent(null);
    setOpponentProgress(0);
    setTimeLeft(300);
    setResult(null);
    setError(null);
    codeRef.current = "";
    
    if (socket) {
      socket.disconnect();
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Idle state - Ready to find match
  if (matchState === "idle") {
    return (
      <div className="bg-gray-800 border border-purple-500/30 rounded-xl p-12 text-center">
        <div className="text-6xl mb-6">⚔️</div>
        <h2 className="text-3xl font-bold text-white mb-4">Ready for PvP Battle?</h2>
        <p className="text-gray-400 mb-8">
          Challenge a real player in a live coding match. First to submit the best solution wins!
        </p>
        
        {error && (
          <div className="mb-6 p-4 bg-red-900/30 border border-red-500 rounded-lg text-red-200">
            {error}
          </div>
        )}

        <div className="mb-8 p-6 bg-gray-900/50 rounded-lg max-w-md mx-auto">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400">Your Level:</span>
            <span className="text-white font-bold">Level {userLevel}</span>
          </div>
          <div className="text-sm text-gray-500">
            You&apos;ll be matched with players within ±2 levels
          </div>
        </div>
        
        <button
          onClick={findMatch}
          className="px-8 py-4 bg-[linear-gradient(to_right,#00E0C0,#C00090)] hover:scale-105 text-white text-lg font-bold rounded-xl transition-all shadow-[0_0_10px_#00E0C099]"
        >
          Find Match
        </button>
      </div>
    );
  }

  // Searching state
  if (matchState === "searching") {
    return (
      <div className="bg-gray-800 border border-purple-500/30 rounded-xl p-12 text-center">
        <div className="text-6xl mb-6 animate-pulse">🔍</div>
        <h2 className="text-2xl font-bold text-white mb-4">Searching for opponent...</h2>
        <p className="text-gray-400 mb-8">
          Looking for a player at your skill level
        </p>
        <div className="w-full bg-gray-700 rounded-full h-2 max-w-md mx-auto mb-8">
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full animate-pulse w-2/3"></div>
        </div>
        <button
          onClick={cancelSearch}
          className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-xl transition-all"
        >
          Cancel Search
        </button>
      </div>
    );
  }

  // Matched state - Brief display before fighting
  if (matchState === "matched" && opponent) {
    return (
      <div className="bg-gray-800 border border-purple-500/30 rounded-xl p-12 text-center">
        <div className="text-6xl mb-6">⚔️</div>
        <h2 className="text-3xl font-bold text-white mb-4">Match Found!</h2>
        <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto mb-8">
          <div className="p-6 bg-purple-900/30 rounded-lg">
            <div className="text-2xl mb-2">👤</div>
            <div className="font-bold text-white">{userName}</div>
            <div className="text-sm text-gray-400">Level {userLevel}</div>
          </div>
          <div className="flex items-center justify-center">
            <div className="text-4xl">⚔️</div>
          </div>
          <div className="p-6 bg-pink-900/30 rounded-lg">
            <div className="text-2xl mb-2">👤</div>
            <div className="font-bold text-white">{opponent.userName}</div>
            <div className="text-sm text-gray-400">Level {opponent.level}</div>
          </div>
        </div>
        <p className="text-gray-400 animate-pulse">Starting in 3 seconds...</p>
      </div>
    );
  }

  // Fighting state
  if (matchState === "fighting" && question) {
    return (
      <div className="space-y-6">
        {/* Battle Header */}
        <div className="bg-gray-800 border border-purple-500/30 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1">
              <h3 className="text-lg font-bold text-white mb-2">You</h3>
              <p className="text-purple-400">{userName}</p>
            </div>
            <div className="text-center px-6">
              <div className={`text-3xl font-bold mb-1 ${timeLeft < 60 ? 'text-red-400' : 'text-white'}`}>
                {formatTime(timeLeft)}
              </div>
              <p className="text-gray-400 text-sm">Time Left</p>
            </div>
            <div className="flex-1 text-right">
              <h3 className="text-lg font-bold text-white mb-2">Opponent</h3>
              <p className="text-pink-400">{opponent?.userName}</p>
            </div>
          </div>

          {/* Opponent progress bar */}
          <div>
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>Opponent Progress</span>
              <span>{Math.round(opponentProgress)}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-pink-500 to-red-500 h-2 rounded-full transition-all"
                style={{ width: `${opponentProgress}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Question */}
        <div className="bg-gray-800 border border-purple-500/30 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-white">{question.title}</h2>
            <div className="flex gap-2">
              <span className="px-3 py-1 bg-purple-600 rounded text-sm text-white">
                Level {question.difficulty}
              </span>
              <span className="px-3 py-1 bg-yellow-600 rounded text-sm text-white">
                +{question.points} pts
              </span>
            </div>
          </div>
          <p className="text-gray-300 whitespace-pre-wrap">{question.prompt}</p>
        </div>

        {/* Code Editor */}
        <div>
          <h3 className="text-lg font-bold text-purple-400 mb-3">Your Code</h3>
          <CodeEditor
            initialCode={question.starterCode || ""}
            onRun={handleSubmit}
            onChange={handleCodeChange}
            loading={loading}
          />
        </div>
      </div>
    );
  }

  // Waiting for result
  if (matchState === "waiting_result") {
    return (
      <div className="bg-gray-800 border border-purple-500/30 rounded-xl p-12 text-center">
        <div className="text-6xl mb-6 animate-pulse">⏳</div>
        <h2 className="text-2xl font-bold text-white mb-4">Code Submitted!</h2>
        <p className="text-gray-400">
          Waiting for opponent to finish...
        </p>
      </div>
    );
  }

  // Finished state
  if (matchState === "finished" && result) {
    const userResult = result.results.find(r => r.userId === userId);
    const opponentResult = result.results.find(r => r.userId !== userId);
    const userWon = result.winnerId === userId;
    const isDraw = result.winnerId === null;

    return (
      <div className="bg-gray-800 border border-purple-500/30 rounded-xl p-12">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">
            {userWon ? "🏆" : isDraw ? "🤝" : "💀"}
          </div>
          <h2 className="text-4xl font-bold text-white mb-2">
            {userWon ? "Victory!" : isDraw ? "Draw!" : "Defeat"}
          </h2>
          <p className="text-gray-400">
            {userWon
              ? "Congratulations! You defeated your opponent!"
              : isDraw
              ? "Both players performed equally well!"
              : "Better luck next time!"}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className={`p-6 rounded-xl ${userWon ? "bg-green-900/30 border border-green-500" : "bg-gray-700"}`}>
            <h3 className="text-lg font-bold text-white mb-4">Your Score</h3>
            <div className="text-3xl font-bold text-white mb-4">{userResult?.score || 0}</div>
            {userResult?.result && (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Correct:</span>
                  <span className="text-white">{userResult.result.correct ? "✓ Yes" : "✗ No"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Runtime:</span>
                  <span className="text-white">{userResult.result.runtimeMs}ms</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Style:</span>
                  <span className="text-white">{userResult.result.styleScore}/100</span>
                </div>
              </div>
            )}
          </div>

          <div className={`p-6 rounded-xl ${!userWon && !isDraw ? "bg-red-900/30 border border-red-500" : "bg-gray-700"}`}>
            <h3 className="text-lg font-bold text-white mb-4">Opponent Score</h3>
            <div className="text-3xl font-bold text-white mb-4">{opponentResult?.score || 0}</div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Player:</span>
                <span className="text-white">{opponent?.userName}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center">
          <button
            onClick={resetMatch}
            className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold rounded-xl transition-all"
          >
            Find New Match
          </button>
        </div>
      </div>
    );
  }

  return null;
}
