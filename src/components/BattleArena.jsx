"use client";

import { useState, useEffect, useRef } from "react";
// Tambahkan .jsx pada impor CodeEditor
import CodeEditor from "./CodeEditor.jsx";
import { fetchHint } from "@/lib/hintService.js";
import { startBattle as startBattleAPI, submitBattle as submitBattleAPI, startAiCodeStream } from "@/lib/battleService.js";

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
  const aiTypingRef = useRef(false);
  const [submittedCode, setSubmittedCode] = useState("");
  const [userCode, setUserCode] = useState("");
  const [hint, setHint] = useState(null);
  const [hintLoading, setHintLoading] = useState(false);
  const [aiThought, setAiThought] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const thoughtCancelRef = useRef(false);
  const [showHintModal, setShowHintModal] = useState(false);


  useEffect(() => {
    aiTypingRef.current = aiTyping;
  }, [aiTyping]);

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
      const data = await startBattleAPI({ mode, userLevel });
      setQuestion(data.question);
      setMatchId(data.matchId);
      setBattleState("fighting");
      setTimeLeft(300);
      setAiProgress(0);
      setAiCode("");
      setAiTyping(false);
      setUserCode(data.question?.starterCode || "");
      setHint(null);
      setAiThought("");
      setIsThinking(false);
      // Prefetch hint in background so the button opens instantly later
      (async () => {
        try {
          const j = await fetchHint({
            prompt: data.question?.prompt,
            userCode: data.question?.starterCode || '',
            aiCode: '',
            difficulty: data.question?.difficulty,
          });
          if (j) setHint(j);
        } catch (e) {
          console.warn('Prefetch hint error:', e);
        }
      })();

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
      thoughtCancelRef.current = false;
      try {
        setIsThinking(true);
        setAiThought("");
        // Use prefetched hint if available; otherwise fetch once
        let thinkingText = hint?.innerMonologue ? String(hint.innerMonologue) : (hint?.thinking ? String(hint.thinking) : null);
        if (!thinkingText) {
          try {
            const jh = await fetchHint({
              prompt: questionData.prompt,
              userCode: userCode || '',
              aiCode: '',
              difficulty: questionData.difficulty,
            });
            if (jh) setHint(jh);
            thinkingText = (jh?.innerMonologue || jh?.thinking || "Hmm... saya perlu memahami pola input-outputnya dulu.").toString();
          } catch {
            thinkingText = "Hmm... saya perlu memahami pola input-outputnya dulu.";
          }
        }
        // Sanitize to avoid list-like or step-like outputs
        thinkingText = thinkingText
          .replace(/(^|\n)\s*([\-\*\u2022\d]+[\.)]?\s+)/g, ' ') // bullets / numbers
          .replace(/\n+/g, ' ') // collapse newlines
          .replace(/\s{2,}/g, ' ') // extra spaces
          .trim()
          .slice(0, 400); // keep concise
        // Type entire thinking text before starting code
        for (const ch of thinkingText) {
          setAiThought(prev => prev + ch);
          let d = 90; // slower base human-like delay
          if (ch === '.' || ch === ',' || ch === '\n') d += 180;
          else if (ch === ' ') d += 30;
          d += Math.random() * 70 - 35; // jitter
          await new Promise(r => setTimeout(r, Math.max(30, d)));
        }
      } finally {
        setIsThinking(false);
      }
      const apiUrl = aiProvider === 'gemini'
        ? "/api/battle/gemini-code"  // Route baru kita
        : "/api/battle/ai-code";      // Route lama (OpenAI)

      console.log(`Starting AI coding with: ${aiProvider} via ${apiUrl}`)

      console.log("Starting AI coding with:", {
        prompt: questionData.prompt,
        difficulty: questionData.difficulty,
        typingSpeed: typingSpeed
      });

      const response = await startAiCodeStream({
        provider: aiProvider,
        prompt: questionData.prompt,
        starterCode: questionData.starterCode,
        difficulty: questionData.difficulty,
        matchId: matchId,
        questionId: questionData.id,
        typingSpeed: typingSpeed,
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

              // console.log(data);
              if (data.type === 'start') {
                setAiTyping(true);
                setAiProgress(0);
              } else if (data.type === 'typing') {
                if (!thoughtCancelRef.current) {
                  thoughtCancelRef.current = true; // stop thought typing when code arrives
                  setIsThinking(false);
                }
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
      setSubmittedCode(code);
      // Tunggu AI selesai mengetik (jika masih berlangsung)
      if (aiTypingRef.current) {
        await new Promise((resolve) => {
          const check = () => {
            if (!aiTypingRef.current) resolve();
            else setTimeout(check, 250);
          };
          check();
        });
      }

      const data = await submitBattleAPI({
        code,
        questionId: question.id,
        mode,
        timeSpent: 300 - timeLeft,
        aiCode,
      });
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
    setSubmittedCode("");
    setUserCode("");
    setHint(null);
    setHintLoading(false);
    setAiThought("");
    setIsThinking(false);
    thoughtCancelRef.current = false;
    setShowHintModal(false);
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

        {mode === "ai_battle" && (
          <div className="mb-6 max-w-md mx-auto">
            <label htmlFor="aiProvider" className="block text-sm font-medium text-gray-300 mb-2">
              Choose your Opponent
            </label>
            
            <div className="relative rounded-lg bg-[linear-gradient(to_right,#00E0C0,#C00090)] p-[1px]">
              <select
                id="aiProvider"
                value={aiProvider}
                onChange={(e) => setAiProvider(e.target.value)}
                className="w-full appearance-none px-3 py-2 bg-gray-900 text-white rounded-[7px] focus:outline-none focus:ring-2 focus:ring-purple-500/60"
              >
                <option value="openai">Kudoku Master</option>
                <option value="gemini">Ratio Gen</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                <svg className="h-4 w-4 text-gray-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 011.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.25 8.29a.75.75 0 01-.02-1.08z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {aiProvider === 'openai' ? 'Menggunakan OpenAI API' : 'Menggunakan Google Gemini API'}
            </p>
          </div>
        )}

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
        </div>

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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold text-purple-400">Your Code</h3>
              <span className="text-sm text-gray-400">You</span>
            </div>
            <CodeEditor
              initialCode={question.starterCode || ""}
              onRun={submitSolution}
              onChangeCode={(v) => setUserCode(v)}
              loading={loading}
              onGetHint={async () => {
                if (!question) return;
                if (hint) { setShowHintModal(true); return; }
                try {
                  setHintLoading(true);
                  const h = await fetchHint({
                    prompt: question.prompt,
                    userCode: userCode || '',
                    aiCode: aiCode || '',
                    difficulty: question.difficulty,
                  });
                  setHint(h || null);
                  if (h) setShowHintModal(true);
                } catch (e) {
                  console.error('Get hint error:', e);
                } finally {
                  setHintLoading(false);
                }
              }}
              hintLoading={hintLoading}
            />
          </div>

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
                  <span className="text-gray-400 text-sm font-mono">{aiProvider === 'gemini' ? 'Ratio Gen' : 'Kudoku Master'}</span>
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
                    {aiCode || (aiThought ? aiThought : (aiTyping ? "// AI is thinking..." : "// Waiting for AI to start..."))}
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
        {showHintModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowHintModal(false)} />
            <div className="relative z-10 w-full max-w-xl mx-auto rounded-2xl border border-purple-500/30 bg-[linear-gradient(135deg,rgba(128,0,255,0.12),rgba(192,0,144,0.08))] shadow-[0_0_20px_#8B5CF699]">
              <div className="px-5 py-4 border-b border-purple-500/20 flex items-center justify-between">
                <h4 className="text-white font-semibold">Hints</h4>
                <button onClick={() => setShowHintModal(false)} className="text-gray-300 hover:text-white text-sm">Close</button>
              </div>
              <div className="p-5 space-y-4 text-sm text-gray-200">
                {hint?.thinking && (
                  <div className="p-3 rounded-lg bg-gray-900/60 border border-purple-500/20">
                    <div className="text-purple-300 font-semibold mb-1">Thinking</div>
                    <p>{hint.thinking}</p>
                  </div>
                )}
                {Array.isArray(hint?.steps) && hint.steps.length > 0 && (
                  <div className="p-3 rounded-lg bg-gray-900/60 border border-cyan-400/20">
                    <div className="text-cyan-300 font-semibold mb-2">Steps</div>
                    <ul className="list-disc list-inside space-y-1">
                      {hint.steps.map((s, i) => (
                        <li key={`hms-${i}`}>{s}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {Array.isArray(hint?.pitfalls) && hint.pitfalls.length > 0 && (
                  <div className="p-3 rounded-lg bg-gray-900/60 border border-yellow-400/20">
                    <div className="text-yellow-300 font-semibold mb-2">Pitfalls</div>
                    <ul className="list-disc list-inside space-y-1">
                      {hint.pitfalls.map((p, i) => (
                        <li key={`hmp-${i}`}>{p}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {hint?.fairness && (
                  <div className="p-3 rounded-lg bg-gray-900/60 border border-pink-400/20 text-xs text-gray-300">
                    {hint.fairness}
                  </div>
                )}
              </div>
              <div className="px-5 py-4 border-t border-purple-500/20 flex justify-end">
                <button onClick={() => setShowHintModal(false)} className="px-4 py-2 bg-[linear-gradient(to_right,#00E0C0,#C00090)] text-white rounded-lg text-sm font-medium">OK</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (battleState === "finished" && result) {
    const userWon = result.winner === "user";
    const userCorrect = !!result.userResult?.correct;
    const aiCorrect = !!result.aiResult?.correct;
    const faster = (a, b) => (typeof a === 'number' && typeof b === 'number') ? (a < b ? 'user' : (a > b ? 'ai' : 'tie')) : 'tie';
    const better = (a, b) => (typeof a === 'number' && typeof b === 'number') ? (a > b ? 'user' : (a < b ? 'ai' : 'tie')) : 'tie';
    const runtimeWinner = faster(result.userResult?.runtimeMs, result.aiResult?.runtimeMs);
    const styleWinner = better(result.userResult?.styleScore, result.aiResult?.styleScore);

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

        {result.review && (
          <div className="mb-8 p-6 rounded-xl border border-purple-500/30 bg-[linear-gradient(135deg,rgba(128,0,255,0.07),rgba(192,0,144,0.04))]">
            <h3 className="text-xl font-bold text-white mb-3">Review</h3>
            {result.review.summary && (
              <p className="text-gray-300 mb-4">{result.review.summary}</p>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              {result.review.user && (
                <div>
                  <h4 className="font-semibold text-purple-300 mb-2">Your Code</h4>
                  {result.review.user.strengths && result.review.user.strengths.length > 0 && (
                    <ul className="list-disc list-inside text-gray-300 bg-gray-800/40 p-3 rounded-lg border border-purple-500/10">
                      {result.review.user.strengths.map((s, i) => (
                        <li key={`us-${i}`}>{s}</li>
                      ))}
                    </ul>
                  )}
                  {result.review.user.weaknesses && result.review.user.weaknesses.length > 0 && (
                    <ul className="list-disc list-inside text-gray-400 mt-2 bg-gray-800/30 p-3 rounded-lg border border-purple-500/10">
                      {result.review.user.weaknesses.map((w, i) => (
                        <li key={`uw-${i}`}>{w}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
              {result.review.ai && (
                <div>
                  <h4 className="font-semibold text-pink-300 mb-2">AI Code</h4>
                  {result.review.ai.strengths && result.review.ai.strengths.length > 0 && (
                    <ul className="list-disc list-inside text-gray-300 bg-gray-800/40 p-3 rounded-lg border border-pink-500/10">
                      {result.review.ai.strengths.map((s, i) => (
                        <li key={`as-${i}`}>{s}</li>
                      ))}
                    </ul>
                  )}
                  {result.review.ai.weaknesses && result.review.ai.weaknesses.length > 0 && (
                    <ul className="list-disc list-inside text-gray-400 mt-2 bg-gray-800/30 p-3 rounded-lg border border-pink-500/10">
                      {result.review.ai.weaknesses.map((w, i) => (
                        <li key={`aw-${i}`}>{w}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
            {result.review.scores && (
              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3 rounded-lg bg-gray-800/50 border border-purple-500/10 text-gray-300">Algorithm: {result.review.scores.algorithm}/100</div>
                <div className="p-3 rounded-lg bg-gray-800/50 border border-purple-500/10 text-gray-300">Correctness: {result.review.scores.correctness}/100</div>
                <div className="p-3 rounded-lg bg-gray-800/50 border border-purple-500/10 text-gray-300">Readability: {result.review.scores.readability}/100</div>
                <div className="p-3 rounded-lg bg-gray-800/50 border border-purple-500/10 text-gray-300">Efficiency: {result.review.scores.efficiency}/100</div>
              </div>
            )}
          </div>
        )}

        {(submittedCode || aiCode) && (
          <div className="mb-8 p-6 rounded-xl border border-cyan-400/30 bg-gray-900/50">
            <div className="mb-4">
              <h3 className="text-xl font-bold text-white">Code Comparison</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-lg overflow-hidden border border-cyan-400/20">
                <div className="px-3 py-2 bg-gray-800 border-b border-cyan-400/20 text-purple-300 text-sm font-semibold">Your Code</div>
                <pre className="h-96 bg-gray-900 text-white font-mono text-xs p-3 overflow-auto whitespace-pre-wrap">
                  {(() => {
                    const u = (submittedCode || '').split('\n');
                    const a = (aiCode || '').split('\n');
                    const L = Math.max(u.length, a.length);
                    return Array.from({ length: L }).map((_, i) => {
                      const ul = u[i] ?? '';
                      const al = a[i] ?? '';
                      const diff = ul.trim() !== al.trim();
                      const cls = diff ? 'bg-yellow-900/30' : '';
                      return (
                        <div key={`uc-${i}`} className={cls}>
                          <span className="text-gray-500 select-none mr-2">{String(i+1).padStart(3,' ')}</span>{ul}
                        </div>
                      );
                    });
                  })()}
                </pre>
              </div>
              <div className="rounded-lg overflow-hidden border border-pink-400/20">
                <div className="px-3 py-2 bg-gray-800 border-b border-pink-400/20 text-pink-300 text-sm font-semibold">AI Code</div>
                <pre className="h-96 bg-gray-900 text-white font-mono text-xs p-3 overflow-auto whitespace-pre-wrap">
                  {(() => {
                    const u = (submittedCode || '').split('\n');
                    const a = (aiCode || '').split('\n');
                    const L = Math.max(u.length, a.length);
                    return Array.from({ length: L }).map((_, i) => {
                      const ul = u[i] ?? '';
                      const al = a[i] ?? '';
                      const diff = ul.trim() !== al.trim();
                      const cls = diff ? 'bg-yellow-900/30' : '';
                      return (
                        <div key={`ac-${i}`} className={cls}>
                          <span className="text-gray-500 select-none mr-2">{String(i+1).padStart(3,' ')}</span>{al}
                        </div>
                      );
                    });
                  })()}
                </pre>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
              <div className="p-3 rounded-lg border border-purple-500/20 bg-gray-800/50">
                <div className="text-gray-400">Correctness</div>
                <div className="text-white font-semibold">{userCorrect && !aiCorrect ? 'User' : (!userCorrect && aiCorrect ? 'AI' : 'Tie')}</div>
              </div>
              <div className="p-3 rounded-lg border border-purple-500/20 bg-gray-800/50">
                <div className="text-gray-400">Runtime</div>
                <div className="text-white font-semibold">{runtimeWinner === 'user' ? 'User' : (runtimeWinner === 'ai' ? 'AI' : 'Tie')}</div>
              </div>
              <div className="p-3 rounded-lg border border-purple-500/20 bg-gray-800/50">
                <div className="text-gray-400">Style</div>
                <div className="text-white font-semibold">{styleWinner === 'user' ? 'User' : (styleWinner === 'ai' ? 'AI' : 'Tie')}</div>
              </div>
            </div>
          </div>
        )}

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