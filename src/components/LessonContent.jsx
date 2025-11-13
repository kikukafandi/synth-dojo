"use client";

import { useState } from "react";
// Tambahkan .jsx agar impornya jelas
import CodeEditor from "@/components/CodeEditor.jsx"; 
import { marked } from "marked";

// Terima props 'lesson' dan 'questions' di sini
export default function LessonContent({ lesson, questions }) {
  // Hapus semua tipe TypeScript (<...>)
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [testResult, setTestResult] = useState(null);
  const [loading, setLoading] = useState(false);

  // Terima 'code' sebagai parameter
  const handleRunCode = async (code) => {
    if (!selectedQuestion) return;

    setLoading(true);
    setTestResult(null);

    try {
      const response = await fetch("/api/practice/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code, // 'code' sekarang sudah terdefinisi
          questionId: selectedQuestion.id,
          testCases: selectedQuestion.testCases,
        }),
      });

      const result = await response.json();
      setTestResult(result);
    } catch (error) {
      console.error("Error running code:", error);
      setTestResult({
        correct: false,
        runtimeMs: 0,
        styleScore: 0,
        error: "Failed to run code",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Lesson Content (Variabel 'lesson' sekarang sudah terdefinisi) */}
      <div className="rounded-xl p-8 bg-[linear-gradient(135deg,rgba(0,224,192,0.04),rgba(192,0,144,0.04))] border border-cyan-400/20 shadow-[0_0_16px_#00E0C099]">
        <div
          className="prose prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html:marked(lesson.content) }}
        />
        {lesson.codeExample && (
          <div className="mt-6">
            <h3 className="text-lg font-bold text-cyan-200 mb-3">Example:</h3>
            <pre className="bg-gray-900 rounded-lg p-4 overflow-x-auto border border-cyan-400/10">
              <code className="text-sm text-cyan-100">{lesson.codeExample}</code>
            </pre>
          </div>
        )}
      </div>

      {/* Practice Questions (Variabel 'questions' sekarang sudah terdefinisi) */}
      {questions.length > 0 && (
        <div className="rounded-xl p-8 bg-[linear-gradient(135deg,rgba(0,224,192,0.04),rgba(192,0,144,0.04))] border border-pink-400/20 shadow-[0_0_10px_#FF00B899]">
          <h2 className="text-2xl md:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-cyan-400 to-pink-400  mb-6 leading-tight">
            Practice
          </h2>
          
          {!selectedQuestion ? (
            <div className="space-y-3">
              {questions.map((question) => (
                <button
                  key={question.id}
                  onClick={() => setSelectedQuestion(question)}
                  className="w-full text-left bg-[linear-gradient(135deg,rgba(0,224,192,0.07),rgba(192,0,144,0.04))] hover:bg-[linear-gradient(135deg,rgba(0,255,240,0.10),rgba(255,0,184,0.08))] border border-cyan-400/10 hover:border-cyan-300/40 rounded-lg p-4 transition-all shadow-[0_0_6px_#00FFF055]"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-cyan-100 mb-1">
                        {question.title}
                      </h3>
                      <p className="text-cyan-200 text-sm">
                        {question.prompt.substring(0, 100)}...
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 bg-[#C00090] rounded text-xs text-white">
                        Level {question.difficulty}
                      </span>
                      <span className="px-2 py-1 bg-cyan-400/20 rounded text-xs text-cyan-100 font-bold">
                        +{question.points}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-white">
                  {selectedQuestion.title}
                </h3>
                <button
                  onClick={() => {
                    setSelectedQuestion(null);
                    setTestResult(null);
                  }}
                  className="text-cyan-300 hover:text-pink-300 font-medium transition-colors"
                >
                  ← Back
                </button>
              </div>

              <div className="bg-gray-900 rounded-lg p-4">
                <p className="text-gray-300">{selectedQuestion.prompt}</p>
              </div>

              <CodeEditor
                initialCode={selectedQuestion.starterCode || ""}
                onRun={handleRunCode}
                loading={loading}
              />

              {testResult && (
                <div className={`rounded-lg p-6 ${
                  testResult.correct 
                    ? "bg-green-900/30 border border-green-500" 
                    : "bg-red-900/30 border border-red-500"
                }`}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="text-3xl">
                      {testResult.correct ? "✅" : "❌"}
                    </div>
                    <div>
                      <h4 className="text-xl font-bold text-white">
                        {testResult.correct ? "All Tests Passed!" : "Tests Failed"}
                      </h4>
                      <p className="text-gray-300 text-sm">
                        {testResult.testResults && 
                          `${testResult.testResults.passed}/${testResult.testResults.total} test cases passed`
                        }
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-gray-400 text-sm">Runtime</p>
                      <p className="text-white font-bold">{testResult.runtimeMs}ms</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Style Score</p>
                      <p className="text-white font-bold">{testResult.styleScore}/100</p>
                    </div>
                  </div>

                  {testResult.error && (
                    <div className="bg-black/30 rounded p-3">
                      <p className="text-red-400 text-sm font-mono">{testResult.error}</p>
                    </div>
                  )}

                  {testResult.testResults && (
                    <div className="space-y-2 mt-4">
                      <p className="text-white font-bold">Test Cases:</p>
                      {testResult.testResults.details.map((test, i) => (
                        <div
                          key={i}
                          className={`p-3 rounded text-sm ${
                            test.passed ? "bg-green-900/20" : "bg-red-900/20"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-gray-300">
                              Input: {JSON.stringify(test.input)}
                            </span>
                            <span>{test.passed ? "✓" : "✗"}</span>
                          </div>
                          <div className="text-gray-400 text-xs mt-1">
                            Expected: {JSON.stringify(test.expected)} | 
                            Got: {JSON.stringify(test.actual)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {testResult.correct && (
                    <div className="mt-4 text-center">
                      <p className="text-green-400 font-bold">
                        🎉 +{selectedQuestion.points} points earned!
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}