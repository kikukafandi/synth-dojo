"use client";

import { useState } from "react";
import CodeEditor from "@/components/CodeEditor";

interface Question {
  id: string;
  title: string;
  prompt: string;
  starterCode: string | null;
  testCases: string;
  difficulty: number;
  points: number;
}

interface LessonContentProps {
  lesson: {
    id: string;
    title: string;
    content: string;
    codeExample: string | null;
  };
  questions: Question[];
}

interface TestResult {
  correct: boolean;
  runtimeMs: number;
  styleScore: number;
  testResults?: {
    passed: number;
    total: number;
    details: Array<{
      input: any[];
      expected: any;
      actual: any;
      passed: boolean;
    }>;
  };
  error?: string;
}

export default function LessonContent({ lesson, questions }: LessonContentProps) {
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleRunCode = async (code: string) => {
    if (!selectedQuestion) return;

    setLoading(true);
    setTestResult(null);

    try {
      const response = await fetch("/api/practice/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
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
      {/* Lesson Content */}
      <div className="bg-gray-800 border border-purple-500/30 rounded-xl p-8">
        <div
          className="prose prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: lesson.content.replace(/\n/g, "<br/>") }}
        />
        
        {lesson.codeExample && (
          <div className="mt-6">
            <h3 className="text-lg font-bold text-white mb-3">Example:</h3>
            <pre className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
              <code className="text-sm text-gray-300">{lesson.codeExample}</code>
            </pre>
          </div>
        )}
      </div>

      {/* Practice Questions */}
      {questions.length > 0 && (
        <div className="bg-gray-800 border border-purple-500/30 rounded-xl p-8">
          <h2 className="text-2xl font-bold text-white mb-6">Practice</h2>
          
          {!selectedQuestion ? (
            <div className="space-y-3">
              {questions.map((question) => (
                <button
                  key={question.id}
                  onClick={() => setSelectedQuestion(question)}
                  className="w-full text-left bg-gray-900 hover:bg-gray-700 border border-purple-500/30 rounded-lg p-4 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-white mb-1">
                        {question.title}
                      </h3>
                      <p className="text-gray-400 text-sm">
                        {question.prompt.substring(0, 100)}...
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 bg-purple-600 rounded text-xs text-white">
                        Level {question.difficulty}
                      </span>
                      <span className="text-yellow-400 font-bold">
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
                  className="text-gray-400 hover:text-white"
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
