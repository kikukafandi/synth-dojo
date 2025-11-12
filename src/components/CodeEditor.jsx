// Code Editor Component
// Simple code editor for practicing code

"use client";

import { useState } from "react";


export default function CodeEditor() {
  const [code, setCode] = useState(initialCode);

  const handleRun = () => {
    if (onRun) {
      onRun(code);
    }
  };

  return (
    <div className="border border-purple-500/30 rounded-xl overflow-hidden">
      <div className="bg-gray-800 px-4 py-2 border-b border-purple-500/30 flex items-center justify-between">
        <span className="text-gray-400 text-sm font-mono">editor.js</span>
        <button
          onClick={handleRun}
          disabled={loading}
          className="px-4 py-1 bg-linear-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {loading ? "Running..." : "▶ Run Code"}
        </button>
      </div>
      <textarea
        value={code}
        onChange={(e) => setCode(e.target.value)}
        className="w-full h-96 bg-gray-900 text-white font-mono text-sm p-4 focus:outline-none resize-none"
        placeholder="// Write your code here..."
        spellCheck={false}
      />
    </div>
  );
}
