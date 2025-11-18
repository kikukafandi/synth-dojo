// User Dashboard
// Shows progress, stats, recent matches, and quick actions

import { auth } from "@/lib/auth";
import { redirect } from 'next/navigation';
import { prisma } from "@/lib/prisma";
import Navbar from "@/components/Navbar";
import { calculateLevel, pointsForNextLevel, formatRelativeTime } from "@/lib/utils";

export default async function DashboardPage(props) {
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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950/20 to-slate-950">
      <Navbar user={session.user} />

      <div className="absolute left-[30%] top-[-10%] h-[50rem] w-[50rem] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,_rgba(0,255,240,0.18),_transparent_60%)] blur-3xl pointer-events-none" />
      <div className="absolute left-[70%] top-[40%] h-[36rem] w-[36rem] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,_rgba(255,0,184,0.15),_transparent_60%)] blur-3xl pointer-events-none" />
      <main className="max-w-6xl mx-auto px-4 sm:px-8 py-10 relative z-10 flex flex-col gap-y-12">
        {/* Welcome Section */}
        <section className="relative border rounded-xl p-6 bg-[linear-gradient(135deg,rgba(0,224,192,0.04),rgba(192,0,144,0.04))] border-cyan-400/20">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center">
                <span className="text-xl font-bold text-white">⚔️</span>
              </div>
              <div>
                <h1 className="text-4xl md:text-5xl font-black tracking-tight text-balance">
                  Welcome back, <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">Sample User</span>
                </h1>
                <p className="text-sm md:text-base text-slate-400 mt-1">Ready to continue your coding journey?</p>
              </div>
            </div>
          </div>
        </section>
        
       {/* Stats Section (Updated Layout) */}
        <section className="flex flex-col gap-y-4">
          <h2 className="text-lg font-bold text-cyan-300 mb-2 tracking-wide uppercase drop-shadow-[0_0_8px_#00FFF099]">
            Your Stats
          </h2>

          {/* Game Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
            {/* Level Card */}
            <div className="relative rounded-lg lg:rounded-xl p-4 lg:p-6 bg-gradient-to-br from-cyan-500/10 via-slate-800/50 to-cyan-500/5 border border-cyan-400/20 hover:border-cyan-300/50 shadow-[0_0_20px_rgba(0,224,192,0.1)] hover:shadow-[0_0_30px_rgba(0,224,192,0.2)] transition-all duration-300 overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-b from-cyan-400/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-cyan-200/80 text-xs lg:text-sm font-semibold tracking-wide">LEVEL</p>
                    <p className="text-4xl lg:text-5xl font-black text-cyan-300 mt-1 tabular-nums">{user.level}</p>
                  </div>
                  <div className="group/icon animate-pulse">
                    <svg
                      width="40"
                      height="40"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      className="text-cyan-400 drop-shadow-[0_0_10px_#00E0C0]"
                    >
                      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                    </svg>
                  </div>
                </div>

                {/* XP Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-cyan-300/60">
                    <span>{user.points} XP</span>
                    <span>{pointsForNextLevel(user.level)} XP</span>
                  </div>
                  <div className="w-full h-2 bg-slate-700/60 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 via-cyan-400 to-purple-500 rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(168,85,247,0.6)]"
                      style={{ width: `${Math.min((user.points / pointsForNextLevel(user.level)) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Total Points Card */}
            <div className="relative rounded-lg lg:rounded-xl p-4 lg:p-6 bg-gradient-to-br from-amber-500/10 via-slate-800/50 to-amber-500/5 border border-amber-400/20 hover:border-amber-300/50 shadow-[0_0_20px_rgba(255,193,7,0.1)] hover:shadow-[0_0_30px_rgba(255,193,7,0.2)] transition-all duration-300 overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-b from-amber-400/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative z-10">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-amber-200/80 text-xs lg:text-sm font-semibold tracking-wide">TOTAL POINTS</p>
                    <p className="text-4xl lg:text-5xl font-black text-amber-300 mt-1 tabular-nums">{user.points}</p>
                  </div>
                  <div className="animate-bounce">
                    <svg
                      width="40"
                      height="40"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      className="text-amber-400 drop-shadow-[0_0_10px_#FFD600]"
                    >
                      <circle cx="12" cy="12" r="9" />
                      <path d="M12 8v8M8 12h8" strokeLinecap="round" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* HP Card */}
            <div className="relative rounded-lg lg:rounded-xl p-4 lg:p-6 bg-gradient-to-br from-rose-500/10 via-slate-800/50 to-rose-500/5 border border-rose-400/20 hover:border-rose-300/50 shadow-[0_0_20px_rgba(244,63,94,0.1)] hover:shadow-[0_0_30px_rgba(244,63,94,0.2)] transition-all duration-300 overflow-hidden group cursor-pointer">
              <div className="absolute inset-0 bg-gradient-to-b from-rose-400/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-rose-200/80 text-xs lg:text-sm font-semibold tracking-wide">HP</p>
                    <p className="text-4xl lg:text-5xl font-black text-rose-400 mt-1 tabular-nums">{user.hp}/5</p>
                  </div>
                  <div>
                    <svg
                      width="40"
                      height="40"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="text-rose-400 drop-shadow-[0_0_10px_#FF0080]"
                    >
                      <path d="M12 21s-6-4.35-8-7.09C2 11.13 2 8.5 4.07 6.43a5.5 5.5 0 017.78 0 5.5 5.5 0 017.78 0C22 8.5 22 11.13 20 13.91 18 16.65 12 21 12 21z" />
                    </svg>
                  </div>
                </div>

                {/* HP Orbs */}
                <div className="flex gap-1.5">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className={`w-3 h-3 rounded-full transition-all duration-200 ${
                        i < user.hp
                          ? 'bg-gradient-to-br from-rose-400 to-rose-600 shadow-[0_0_8px_rgba(244,63,94,0.6)]'
                          : 'bg-slate-700/80'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Win Rate Card */}
            <div className="relative rounded-lg lg:col-span-3 lg:rounded-xl p-4 lg:p-6 bg-gradient-to-br from-emerald-500/10 via-slate-800/50 to-emerald-500/5 border border-emerald-400/20 hover:border-emerald-300/50 shadow-[0_0_20px_rgba(16,185,129,0.1)] hover:shadow-[0_0_30px_rgba(16,185,129,0.2)] transition-all duration-300 overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-b from-emerald-400/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-emerald-200/80 text-xs lg:text-sm font-semibold tracking-wide">WIN RATE</p>
                    <p className="text-4xl lg:text-5xl font-black text-emerald-400 mt-1 tabular-nums">{winRate}%</p>
                  </div>
                  <div className="animate-bounce" style={{ animationDelay: '0.2s' }}>
                    <svg
                      width="40"
                      height="40"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      className="text-emerald-400 drop-shadow-[0_0_10px_#10B981]"
                    >
                      <path d="M13 10V3L4 14h7v7l9-11h-7z" fill="currentColor" />
                    </svg>
                  </div>
                </div>
                <p className="text-emerald-300/70 text-xs lg:text-sm">{wins} wins / {totalMatches} matches</p>
              </div>
            </div>
          </div>
        </section>


        {/* Quick Actions */}
        <section className="flex flex-col gap-y-4">
          <h2 className="text-lg font-bold text-pink-300 mb-2 tracking-wide uppercase drop-shadow-[0_0_8px_#FF00B899]">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <a
              href="/learn"
              className="relative rounded-xl p-6 bg-[linear-gradient(135deg,rgba(0,224,192,0.07),rgba(0,0,255,0.04))] border border-cyan-400/10 hover:border-cyan-300/40 shadow-[0_0_10px_#00E0C099] hover:scale-105 transition-all cursor-pointer overflow-hidden"
            >
              <div className="mb-2 drop-shadow-[0_0_8px_#00E0C0]">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#00FFF0" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="16" rx="2" className="stroke-cyan-400" /><path d="M7 8h10M7 12h10M7 16h6" className="stroke-cyan-400" /></svg>
              </div>
              <h3 className="text-xl font-bold text-cyan-100 mb-2">Learn</h3>
              <p className="text-cyan-200">Practice with structured lessons</p>
            </a>

            <a
              href="/battle"
              className="relative rounded-xl p-6 bg-[linear-gradient(135deg,rgba(255,0,184,0.07),rgba(0,224,192,0.04))] border border-pink-400/10 hover:border-pink-300/40 shadow-[0_0_10px_#FF00B899] hover:scale-105 transition-all cursor-pointer overflow-hidden"
            >
              <div className="mb-2 drop-shadow-[0_0_8px_#FF00B8]">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#FF00B8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10h-7l-2 2v7" className="stroke-pink-400" /><circle cx="7" cy="17" r="2" className="stroke-pink-400" /><path d="M17 3l4 4-4 4" className="stroke-pink-400" /></svg>
              </div>
              <h3 className="text-xl font-bold text-pink-100 mb-2">AI Battle</h3>
              <p className="text-pink-200">Challenge AI opponents</p>
            </a>

            <a
              href="/pvp"
              className="relative rounded-xl p-6 bg-[linear-gradient(135deg,rgba(192,0,144,0.07),rgba(0,255,240,0.04))] border border-fuchsia-400/10 hover:border-fuchsia-300/40 shadow-[0_0_10px_#C0009099] hover:scale-105 transition-all cursor-pointer overflow-hidden"
            >
              <div className="mb-2 drop-shadow-[0_0_8px_#C00090]">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#C00090" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="2" className="stroke-fuchsia-400" /><path d="M8 21h8" className="stroke-fuchsia-400" /><circle cx="12" cy="12" r="3" className="stroke-fuchsia-400" /></svg>
              </div>
              <h3 className="text-xl font-bold text-fuchsia-100 mb-2">PvP Match</h3>
              <p className="text-fuchsia-200">Battle real players</p>
            </a>
          </div>
        </section>

        {/* Recent Activity */}
        <section className="flex flex-col gap-y-4">
          <h2 className="text-lg font-bold text-fuchsia-300 mb-2 tracking-wide uppercase drop-shadow-[0_0_8px_#C0009099]">Recent Activity</h2>
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
        </section>
      </main>
    </div>
  );
}
