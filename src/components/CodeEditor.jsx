// Code Editor Component
// Simple code editor for practicing code

"use client";

import { useState } from "react";


export default function CodeEditor({ initialCode = "", onRun, loading = false }) {
  const [code, setCode] = useState(initialCode);

  const handleRun = () => {
    if (onRun) {
      onRun(code);
    }
  };

  return (
    <div className="rounded-xl overflow-hidden bg-[linear-gradient(135deg,rgba(0,224,192,0.07),rgba(192,0,144,0.04))] border border-cyan-400/20 shadow-[0_0_10px_#00E0C099]">
      <div className="bg-gray-800 px-4 py-2 border-b border-cyan-400/20 flex items-center justify-between">
        <span className="text-gray-400 text-sm font-mono">editor.js</span>
        <button
          onClick={handleRun}
          disabled={loading}
          className="px-4 py-1 bg-[linear-gradient(to_right,#00E0C0,#C00090)] hover:scale-105 text-white rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[0_0_6px_#00E0C099]"
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
