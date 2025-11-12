"use client";

import { useState, useEffect } from "react";
import CodeEditor from "./CodeEditor";


export default function BattleArena() {
  const [battleState, setBattleState] = useState<"idle" | "loading" | "fighting" | "finished">("idle");
  const [question, setQuestion] = useState<Question | null>(null);
  const [result, setResult] = useState<BattleResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
  const [aiProgress, setAiProgress] = useState(0);

  useEffect(() => {
    if (battleState === "fighting" && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => Math.max(0, prev - 1));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [battleState, timeLeft]);

  // Simulate AI progress
  useEffect(() => {
    if (battleState === "fighting") {
      const interval = setInterval(() => {
        setAiProgress((prev) => {
          const increment = Math.random() * 5;
          return Math.min(100, prev + increment);
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [battleState]);

  const startBattle = async () => {
    setBattleState("loading");
    try {
      const response = await fetch("/api/battle/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, userLevel }),
      });

      const data = await response.json();
      setQuestion(data.question);
      setBattleState("fighting");
      setTimeLeft(300);
      setAiProgress(0);
    } catch (error) {
      console.error("Failed to start battle:", error);
      setBattleState("idle");
    }
  };

  const submitSolution = async () => {
    if (!question) return;

    setLoading(true);
    try {
      const response = await fetch("/api/battle/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          questionId: question.id,
          mode,
          timeSpent: 300 - timeLeft,
        }),
      });

      const data = await response.json();
      setResult(data);
      setBattleState("finished");
    } catch (error) {
      console.error("Failed to submit solution:", error);
    } finally {
      setLoading(false);
    }
  };

  const resetBattle = () => {
    setBattleState("idle");
    setQuestion(null);
    setResult(null);
    setTimeLeft(300);
    setAiProgress(0);
  };

  const formatTime = () => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (battleState === "idle") {
    return (
      <div className="bg-gray-800 border border-purple-500/30 rounded-xl p-12 text-center">
        <div className="text-6xl mb-6">⚔️</div>
        <h2 className="text-3xl font-bold text-white mb-4">Ready for Battle?</h2>
        <p className="text-gray-400 mb-8">
          {mode === "ai_battle" 
            ? "Challenge an AI opponent matched to your level" 
            : "Face off against a real player in real-time"}
        </p>
        <button
          onClick={startBattle}
          className="px-8 py-4 bg-linier-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-lg font-bold rounded-xl transition-all transform hover:scale-105"
        >
          Start Battle
        </button>
      </div>
    );
  }

  if (battleState === "loading") {
    return (
      <div className="bg-gray-800 border border-purple-500/30 rounded-xl p-12 text-center">
        <div className="text-6xl mb-6 animate-pulse">⚔️</div>
        <h2 className="text-2xl font-bold text-white mb-4">Finding opponent...</h2>
        <div className="w-full bg-gray-700 rounded-full h-2 max-w-md mx-auto">
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full animate-pulse w-1/2"></div>
        </div>
      </div>
    );
  }

  if (battleState === "fighting" && question) {
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
              <div className="text-3xl font-bold text-white mb-1">{formatTime(timeLeft)}</div>
              <p className="text-gray-400 text-sm">Time Left</p>
            </div>
            <div className="flex-1 text-right">
              <h3 className="text-lg font-bold text-white mb-2">Opponent</h3>
              <p className="text-pink-400">{mode === "ai_battle" ? "AI Bot" : "Player 2"}</p>
            </div>
          </div>

          {mode === "ai_battle" && (
            <div>
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>AI Progress</span>
                <span>{Math.round(aiProgress)}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-pink-500 to-red-500 h-2 rounded-full transition-all"
                  style={{ width: `${aiProgress}%` }}
                ></div>
              </div>
            </div>
          )}
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
          <p className="text-gray-300">{question.prompt}</p>
        </div>

        {/* Code Editor */}
        <CodeEditor
          initialCode={question.starterCode || ""}
          onRun={submitSolution}
          loading={loading}
        />
      </div>
    );
  }

  if (battleState === "finished" && result) {
    const userWon = result.winner === "user";
    
    return (
      <div className="bg-gray-800 border border-purple-500/30 rounded-xl p-12">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">
            {userWon ? "🏆" : "💀"}
          </div>
          <h2 className="text-4xl font-bold text-white mb-2">
            {userWon ? "Victory!" : "Defeat"}
          </h2>
          <p className="text-gray-400">
            {userWon 
              ? "Congratulations! You defeated your opponent!" 
              : "Better luck next time!"}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className={`p-6 rounded-xl ${userWon ? "bg-green-900/30 border border-green-500" : "bg-gray-700"}`}>
            <h3 className="text-lg font-bold text-white mb-4">Your Score</h3>
            <div className="text-3xl font-bold text-white mb-4">{result.userScore}</div>
            {result.userResult && (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Correct:</span>
                  <span className="text-white">{result.userResult.correct ? "Yes" : "No"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Runtime:</span>
                  <span className="text-white">{result.userResult.runtimeMs}ms</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Style:</span>
                  <span className="text-white">{result.userResult.styleScore}/100</span>
                </div>
              </div>
            )}
          </div>

          <div className={`p-6 rounded-xl ${!userWon ? "bg-red-900/30 border border-red-500" : "bg-gray-700"}`}>
            <h3 className="text-lg font-bold text-white mb-4">Opponent Score</h3>
            <div className="text-3xl font-bold text-white mb-4">{result.opponentScore}</div>
            {result.aiResult && (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Correct:</span>
                  <span className="text-white">{result.aiResult.correct ? "Yes" : "No"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Runtime:</span>
                  <span className="text-white">{result.aiResult.runtimeMs}ms</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Style:</span>
                  <span className="text-white">{result.aiResult.styleScore}/100</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="text-center">
          <button
            onClick={resetBattle}
            className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold rounded-xl transition-all"
          >
            Battle Again
          </button>
        </div>
      </div>
    );
  }

  return null;
}
