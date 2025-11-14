"use client";

import { useState, useEffect } from "react";
// Tambahkan .jsx pada impor CodeEditor
import CodeEditor from "./CodeEditor.jsx";

export default function BattleArena({ mode, userLevel, userId, userName }) {
  const [battleState, setBattleState] = useState("idle");
  const [question, setQuestion] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
  const [aiProgress, setAiProgress] = useState(0);
  const [aiCode, setAiCode] = useState("");
  const [aiTyping, setAiTyping] = useState(false);
  const [matchId, setMatchId] = useState(null);
  const [typingSpeed, setTypingSpeed] = useState(50); // milliseconds per character
  const [aiTypingStats, setAiTypingStats] = useState({ currentLength: 0, totalLength: 0 });
  const [aiProvider, setAiProvider] = useState('openai');

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
      setMatchId(data.matchId);
      setBattleState("fighting");
      setTimeLeft(300);
      setAiProgress(0);
      setAiCode("");
      setAiTyping(false);

      // Start AI coding if in AI battle mode
      if (mode === "ai_battle") {
        startAICoding(data.question);
      }
    } catch (error) {
      console.error("Failed to start battle:", error);
      setBattleState("idle");
    }
  };

  // Start AI coding with real-time streaming
  const startAICoding = async (questionData) => {
    try {
      setAiTyping(true);
      setAiCode("");
      setAiProgress(0);
      setAiTypingStats({ currentLength: 0, totalLength: 0 });
      const apiUrl = aiProvider === 'gemini'
        ? "/api/battle/gemini-code"  // Route baru kita
        : "/api/battle/ai-code";      // Route lama (OpenAI)

      console.log(`Starting AI coding with: ${aiProvider} via ${apiUrl}`)

      console.log("Starting AI coding with:", {
        prompt: questionData.prompt,
        difficulty: questionData.difficulty,
        typingSpeed: typingSpeed
      });

      // const response = await fetch("/api/battle/ai-code", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({
      //     prompt: questionData.prompt,
      //     starterCode: questionData.starterCode,
      //     difficulty: questionData.difficulty,
      //     matchId: matchId,
      //     typingSpeed: typingSpeed
      //   }),
      // });

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: questionData.prompt,
          starterCode: questionData.starterCode,
          difficulty: questionData.difficulty,
          matchId: matchId,
          typingSpeed: typingSpeed
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to start AI coding: ${response.status} ${errorText}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let aiCodeBuffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        console.log("[AI Streaming Chunk]", chunk);

        // src/components/BattleArena.jsx - BENAR

        // KEDUA provider (OpenAI dan Gemini) mengirimkan format JSON
        // Jadi kita tidak perlu membedakan mereka di sini.

        const lines = chunk.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));

              
              if (data.type === 'start') {
                setAiTyping(true);
                setAiProgress(0);
              } else if (data.type === 'typing') {
                setAiCode(data.code);
                setAiProgress(data.progress);
                setAiTypingStats({
                  currentLength: data.currentLength,
                  totalLength: data.totalLength
                });
              } else if (data.type === 'complete') {
                setAiCode(data.code);
                setAiProgress(100);
                setAiTyping(false);
                setAiTypingStats({
                  currentLength: data.code.length,
                  totalLength: data.code.length
                });
                if (data.code.includes('// AI analyzing') || data.code.includes('// AI thinking') || data.code.includes('// AI calculating')) {
                  console.info("Using mock AI code - add OPENAI_API_KEY to .env for real AI");
                }
              } else if (data.type === 'error') {
                console.error("AI coding error:", data.error);
                setAiTyping(false);
              }
            } catch (e) {
              console.warn(`[${aiProvider} Data Parse Error]`, line, e);
            }
          }
        }
      }
    } catch (error) {
      console.error("AI coding stream error:", error);
      setAiTyping(false);
      setAiCode(`// Error: ${error.message}\n // Please try again later.`);
    }
  };

  // PERBAIKAN: Terima 'code' dari CodeEditor
  const submitSolution = async (code) => {
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
    setAiCode("");
    setAiTyping(false);
    setMatchId(null);
    setAiTypingStats({ currentLength: 0, totalLength: 0 });
  };


  const formatTime = (seconds) => {
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

        {/* AI Typing Speed Settings */}
        {mode === "ai_battle" && (
          <div className="mb-6 max-w-md mx-auto">
            <label htmlFor="aiProvider" className="block text-sm font-medium text-gray-300 mb-2">
              Choose your Opponent
            </label>
            
            <select
              id="aiProvider"
              value={aiProvider}
              onChange={(e) => setAiProvider(e.target.value)}
              className="w-full px-3 py-2 border border-gray-700 bg-gray-900 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="openai">Kudoku Master</option>
              <option value="gemini">Ratio Gen</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              {aiProvider === 'openai' ? 'Menggunakan ai.dinoiki.com' : 'Menggunakan Google Gemini API'}
            </p>
          </div>
        )}
        {/* AI Typing Speed Settings */}
        {mode === "ai_battle" && (
          <div className="mb-8 max-w-md mx-auto">
            <label className="block text-sm font-medium text-gray-300 mb-3">
              AI Typing Speed: {typingSpeed}ms per character
            </label>
            <div className="flex items-center gap-4">
              <span className="text-xs text-gray-400">Fast</span>
              <input
                type="range"
                min="20"
                max="150"
                value={typingSpeed}
                onChange={(e) => setTypingSpeed(Number(e.target.value))}
                className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                style={{
                  background: `linear-gradient(to right, #00E0C0 0%, #C00090 ${((typingSpeed - 20) / 130) * 100}%, #374151 ${((typingSpeed - 20) / 130) * 100}%, #374151 100%)`
                }}
              />
              <span className="text-xs text-gray-400">Slow</span>
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-2">
              <span>Blazing (20ms)</span>
              <span>Human-like (80ms)</span>
              <span>Thoughtful (150ms)</span>
            </div>
          </div>
        )}
        
        <button
          onClick={startBattle}
          className="px-8 py-4 bg-[linear-gradient(to_right,#00E0C0,#C00090)] hover:scale-105 text-white text-lg font-bold rounded-xl transition-all hover:shadow-[0_0_10px_#00E0C099]"
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

        {/* Battle Coding Area */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* User Code Editor */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold text-purple-400">Your Code</h3>
              <span className="text-sm text-gray-400">You</span>
            </div>
            <CodeEditor
              initialCode={question.starterCode || ""}
              onRun={submitSolution}
              loading={loading}
            />
          </div>

          {/* AI Code Display */}
          {mode === "ai_battle" && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-bold text-pink-400">AI Code</h3>
                <div className="flex items-center gap-2">
                  {aiTyping && (
                    <div className="flex items-center gap-2 text-sm text-pink-400">
                      <div className="w-2 h-2 bg-pink-400 rounded-full animate-pulse"></div>
                      <span>AI is typing...</span>
                      <span className="text-xs text-gray-400">
                        ({aiTypingStats.currentLength}/{aiTypingStats.totalLength} chars)
                      </span>
                    </div>
                  )}
                  <span className="text-sm text-gray-400">AI Bot</span>
                  {aiCode && (aiCode.includes('// AI analyzing') || aiCode.includes('// AI thinking') || aiCode.includes('// AI calculating')) && (
                    <span className="text-xs text-yellow-400 bg-yellow-900/20 px-2 py-1 rounded">
                      Demo Mode
                    </span>
                  )}
                </div>
              </div>
              <div className="rounded-xl overflow-hidden bg-[linear-gradient(135deg,rgba(255,0,184,0.07),rgba(192,0,144,0.04))] border border-pink-400/20 shadow-[0_0_10px_#FF00B899]">
                <div className="bg-gray-800 px-4 py-2 border-b border-pink-400/20 flex items-center justify-between">
                  <span className="text-gray-400 text-sm font-mono">ai-solution.js</span>
                  <div className="flex items-center gap-2">
                    <div className="text-xs text-pink-400">
                      {Math.round(aiProgress)}% complete
                      {aiTypingStats.totalLength > 0 && (
                        <span className="ml-1 text-gray-500">
                          ({aiTypingStats.currentLength}/{aiTypingStats.totalLength})
                        </span>
                      )}
                    </div>
                    <div className="w-20 bg-gray-700 rounded-full h-1">
                      <div
                        className="bg-gradient-to-r from-pink-500 to-red-500 h-1 rounded-full transition-all duration-100"
                        style={{ width: `${aiProgress}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
                <div className="relative">
                  <pre className="w-full h-96 bg-gray-900 text-white font-mono text-sm p-4 overflow-auto whitespace-pre-wrap">
                    {aiCode || (aiTyping ? "// AI is analyzing the problem and starting to code..." : "// Waiting for AI to start...")}
                  </pre>
                  {aiTyping && (
                    <div className="absolute bottom-4 right-4">
                      <div className="w-1 h-4 bg-pink-400 animate-pulse"></div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
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