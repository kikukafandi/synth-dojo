"use client";

import { useState } from "react";
import BattleArena from "@/components/BattleArena.jsx";

export default function TestBattlePage() {
  const [battleStarted, setBattleStarted] = useState(false);

  // Mock user data for testing
  const mockUser = {
    id: "test-user-id",
    name: "Test User",
    level: 2
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950/20 to-slate-950">
      <div className="absolute left-1/2 top-[-10%] h-[50rem] w-[50rem] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,_rgba(0,255,240,0.25),_transparent_60%)] blur-3xl" />
      <div className="absolute left-[70%] top-[40%] h-[36rem] w-[36rem] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,_rgba(255,0,184,0.22),_transparent_60%)] blur-3xl" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-[linear-gradient(to_right,#00FFF0,#FF00B8)] mb-4">
            🧪 AI Battle Test
          </h1>
          <p className="text-gray-400 mb-6">
            Test AI battle feature without authentication
          </p>
          <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4 max-w-2xl mx-auto">
            <p className="text-yellow-400 text-sm">
              ⚠️ <strong>Development Mode:</strong> Authentication bypassed for testing. 
              Remove this in production!
            </p>
          </div>
        </div>

        {/* Mock User Info */}
        <div className="bg-gray-800 border border-purple-500/30 rounded-xl p-6 mb-8 max-w-md mx-auto">
          <h3 className="text-lg font-bold text-white mb-4">Mock User Info</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Name:</span>
              <span className="text-white">{mockUser.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Level:</span>
              <span className="text-white">{mockUser.level}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Mode:</span>
              <span className="text-purple-400">AI Battle</span>
            </div>
          </div>
        </div>

        {/* Battle Arena */}
        <BattleArena
          mode="ai_battle"
          userLevel={mockUser.level}
          userId={mockUser.id}
          userName={mockUser.name}
        />

        {/* Instructions */}
        <div className="mt-12 max-w-4xl mx-auto">
          <div className="bg-gray-800 border border-cyan-400/20 rounded-xl p-6">
            <h3 className="text-xl font-bold text-cyan-400 mb-4">🚀 How to Test</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              <div>
                <h4 className="text-white font-semibold mb-2">With Dinoiki AI:</h4>
                <ul className="text-gray-300 space-y-1">
                  <li>• Add your Dinoiki API key to .env</li>
                  <li>• Set OPENAI_BASE_URL="https://ai.dinoiki.com/v1"</li>
                  <li>• Choose model: OPENAI_MODEL="gpt-4o-mini"</li>
                  <li>• Real AI will generate code</li>
                </ul>
              </div>
              <div>
                <h4 className="text-white font-semibold mb-2">Without API Key:</h4>
                <ul className="text-gray-300 space-y-1">
                  <li>• Mock AI code will be used</li>
                  <li>• Still shows typing effect</li>
                  <li>• "Demo Mode" badge appears</li>
                  <li>• Perfect for testing UI</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
