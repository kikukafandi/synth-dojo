// PvP Match Page
// Real-time player vs player battles

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Navbar from "@/components/Navbar";

export default async function PvPPage() {
  const session = await auth();
  
  if (!session?.user?.email) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      <Navbar user={session.user} />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">🎮 PvP Arena</h1>
          <p className="text-gray-400">
            Battle against real players in real-time coding matches
          </p>
        </div>

        <div className="bg-gray-800 border border-purple-500/30 rounded-xl p-12 text-center">
          <div className="text-6xl mb-6">🎮</div>
          <h2 className="text-3xl font-bold text-white mb-4">PvP Mode</h2>
          <p className="text-gray-400 mb-8 max-w-2xl mx-auto">
            Real-time PvP matchmaking is currently in development. This feature will allow you to compete against other players 
            in live coding battles with WebSocket support for real-time synchronization.
          </p>
          <div className="bg-purple-900/30 border border-purple-500/50 rounded-lg p-6 max-w-2xl mx-auto">
            <h3 className="text-lg font-bold text-white mb-3">Coming Soon:</h3>
            <ul className="text-left text-gray-300 space-y-2">
              <li>✓ Real-time matchmaking by skill level</li>
              <li>✓ Live opponent progress tracking</li>
              <li>✓ WebSocket-powered synchronization</li>
              <li>✓ Ranked matches with ELO ratings</li>
              <li>✓ Tournament modes</li>
            </ul>
          </div>
          <div className="mt-8">
            <a
              href="/battle"
              className="inline-block px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-lg font-bold rounded-xl transition-all"
            >
              Try AI Battle Instead
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
