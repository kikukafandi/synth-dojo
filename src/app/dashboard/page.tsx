// User Dashboard
// Shows progress, stats, recent matches, and quick actions

import { auth } from "@/../../auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Navbar from "@/components/Navbar";
import { calculateLevel, pointsForNextLevel, formatRelativeTime } from "@/lib/utils";

export default async function DashboardPage() {
  const session = await auth();
  
  if (!session?.user?.email) {
    redirect("/login");
  }

  // Fetch user data with relations
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      profile: true,
      achievements: {
        include: {
          achievement: true,
        },
        orderBy: {
          unlockedAt: "desc",
        },
        take: 3,
      },
      matches: {
        where: {
          status: "completed",
        },
        orderBy: {
          completedAt: "desc",
        },
        take: 5,
      },
      progress: {
        include: {
          module: true,
        },
      },
    },
  });

  if (!user) {
    redirect("/login");
  }

  const nextLevelPoints = pointsForNextLevel(user.level);
  const progressPercent = (user.points / nextLevelPoints) * 100;
  
  // Calculate win rate
  const totalMatches = await prisma.match.count({
    where: {
      participants: {
        some: {
          userId: user.id,
        },
      },
      status: "completed",
    },
  });

  const wins = await prisma.match.count({
    where: {
      winnerId: user.id,
      status: "completed",
    },
  });

  const winRate = totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      <Navbar user={session.user} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Welcome back, {user.name}! 👋
          </h1>
          <p className="text-gray-400">
            Ready to continue your coding journey?
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800 border border-purple-500/30 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Level</p>
                <p className="text-3xl font-bold text-purple-400">{user.level}</p>
              </div>
              <div className="text-4xl">⚡</div>
            </div>
            <div className="mt-4">
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>{user.points} XP</span>
                <span>{nextLevelPoints} XP</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full"
                  style={{ width: `${Math.min(progressPercent, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 border border-purple-500/30 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Points</p>
                <p className="text-3xl font-bold text-yellow-400">{user.points}</p>
              </div>
              <div className="text-4xl">💎</div>
            </div>
          </div>

          <div className="bg-gray-800 border border-purple-500/30 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">HP</p>
                <p className="text-3xl font-bold text-red-400">{user.hp}/5</p>
              </div>
              <div className="text-4xl">❤️</div>
            </div>
            <div className="mt-2 flex gap-1">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className={`w-4 h-4 rounded-full ${
                    i < user.hp ? "bg-red-500" : "bg-gray-700"
                  }`}
                ></div>
              ))}
            </div>
          </div>

          <div className="bg-gray-800 border border-purple-500/30 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Win Rate</p>
                <p className="text-3xl font-bold text-green-400">{winRate}%</p>
              </div>
              <div className="text-4xl">🏆</div>
            </div>
            <p className="text-gray-400 text-sm mt-2">
              {wins} wins / {totalMatches} matches
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <a
            href="/learn"
            className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl p-6 hover:scale-105 transition-transform cursor-pointer"
          >
            <div className="text-4xl mb-2">📚</div>
            <h3 className="text-xl font-bold text-white mb-2">Learn</h3>
            <p className="text-blue-200">Practice with structured lessons</p>
          </a>

          <a
            href="/battle"
            className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-xl p-6 hover:scale-105 transition-transform cursor-pointer"
          >
            <div className="text-4xl mb-2">⚔️</div>
            <h3 className="text-xl font-bold text-white mb-2">AI Battle</h3>
            <p className="text-purple-200">Challenge AI opponents</p>
          </a>

          <a
            href="/pvp"
            className="bg-gradient-to-br from-pink-600 to-pink-800 rounded-xl p-6 hover:scale-105 transition-transform cursor-pointer"
          >
            <div className="text-4xl mb-2">🎮</div>
            <h3 className="text-xl font-bold text-white mb-2">PvP Match</h3>
            <p className="text-pink-200">Battle real players</p>
          </a>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Matches */}
          <div className="bg-gray-800 border border-purple-500/30 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">Recent Matches</h2>
            {user.matches.length > 0 ? (
              <div className="space-y-3">
                {user.matches.map((match) => (
                  <div
                    key={match.id}
                    className="bg-gray-900 rounded-lg p-4 flex items-center justify-between"
                  >
                    <div>
                      <p className="text-white font-medium">
                        {match.mode === "ai_battle" ? "AI Battle" : 
                         match.mode === "pvp" ? "PvP Match" : "Practice"}
                      </p>
                      <p className="text-gray-400 text-sm">
                        {match.completedAt ? formatRelativeTime(match.completedAt) : "N/A"}
                      </p>
                    </div>
                    <div>
                      {match.winnerId === user.id ? (
                        <span className="px-3 py-1 bg-green-600 text-white text-sm rounded-full">
                          Won
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-red-600 text-white text-sm rounded-full">
                          Lost
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400">No matches yet. Start your first battle!</p>
            )}
          </div>

          {/* Recent Achievements */}
          <div className="bg-gray-800 border border-purple-500/30 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">Recent Achievements</h2>
            {user.achievements.length > 0 ? (
              <div className="space-y-3">
                {user.achievements.map((ua) => (
                  <div
                    key={ua.id}
                    className="bg-gray-900 rounded-lg p-4 flex items-center gap-4"
                  >
                    <div className="text-3xl">{ua.achievement.icon}</div>
                    <div className="flex-1">
                      <p className="text-white font-medium">{ua.achievement.name}</p>
                      <p className="text-gray-400 text-sm">
                        {ua.achievement.description}
                      </p>
                    </div>
                    <div className="text-yellow-400 font-bold">
                      +{ua.achievement.points}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400">No achievements yet. Keep learning!</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
