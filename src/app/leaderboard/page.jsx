// Leaderboard Page
// Shows global rankings

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Navbar from "@/components/Navbar";

export default async function LeaderboardPage() {
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

  // Get top players
  const leaderboard = await prisma.leaderboardEntry.findMany({
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
    orderBy: [
      { points: "desc" },
      { level: "desc" },
    ],
    take: 100,
  });

  // Update ranks
  await Promise.all(
    leaderboard.map((entry, index) =>
      prisma.leaderboardEntry.update({
        where: { id: entry.id },
        data: { rank: index + 1 },
      })
    )
  );

  // Find user rank
  const userEntry = leaderboard.find((entry) => entry.userId === user.id);
  const userRank = userEntry ? leaderboard.indexOf(userEntry) + 1 : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950/20 to-slate-950">
      <Navbar user={session.user} />
      <main className="max-w-6xl mx-auto px-4 sm:px-8 py-10 relative z-10 flex flex-col gap-y-10">
        <section className="mb-6 relative border border-cyan-400/20 rounded-xl p-4 bg-[linear-gradient(135deg,rgba(0,224,192,0.04),rgba(192,0,144,0.04))]">
          <div className="mb-6 text-left relative z-10">
            <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-[linear-gradient(to_right,#00E0C0,#C00090)] mb-2 leading-tight pb-2 flex items-center gap-3">
              <span className="text-5xl">🏆</span> Leaderboard
            </h1>
            <p className="text-cyan-100/90 text-lg">
              Compete with players around the world
            </p>
          </div>
        </section>

        {/* User's Current Rank */}
        {userEntry && (
          <div className="bg-cyan-900/10 border border-cyan-400/20 rounded-xl p-6 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="text-4xl font-bold text-white">
                  #{userRank}
                </div>
                <div>
                  <p className="text-white font-bold text-lg">Your Rank</p>
                  <p className="text-purple-200 text-sm">
                    {userEntry.points} points · Level {userEntry.level}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-purple-200 text-sm">Win Rate</p>
                <p className="text-white font-bold text-lg">
                  {userEntry.wins + userEntry.losses > 0
                    ? Math.round((userEntry.wins / (userEntry.wins + userEntry.losses)) * 100)
                    : 0}
                  %
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Top 3 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {leaderboard.slice(0, 3).map((entry, index) => {
            const medals = ["🥇", "🥈", "🥉"];
            const colors = [
  '', '', ''
];

            return (
              <div
                key={entry.id}
                className={`border ${index===0 ? 'border-yellow-400/40' : index===1 ? 'border-cyan-400/40' : 'border-pink-400/40'} bg-transparent rounded-xl p-6 text-center transform hover:scale-105 transition-transform`}
              >
                <div className="text-6xl mb-4">{medals[index]}</div>
                <div className="text-2xl font-bold text-white mb-2">
                  {entry.user.name || entry.user.email.split("@")[0]}
                </div>
                <div className="text-4xl font-bold text-white mb-2">
                  {entry.points}
                </div>
                <p className="text-white/80 text-sm">points</p>
                <div className="mt-4 pt-4 border-t border-white/20">
                  <div className="flex justify-around text-sm">
                    <div>
                      <p className="text-white/60">Level</p>
                      <p className="text-white font-bold">{entry.level}</p>
                    </div>
                    <div>
                      <p className="text-white/60">Wins</p>
                      <p className="text-white font-bold">{entry.wins}</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Full Leaderboard */}
        <div className="rounded-xl overflow-hidden bg-[linear-gradient(135deg,rgba(0,224,192,0.07),rgba(192,0,144,0.04))] border border-cyan-400/20 shadow-[0_0_2px_#00FFF033]">
          <div className="overflow-x-auto">
            <table className="w-full text-cyan-100">
              <thead>
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-bold text-cyan-100 drop-shadow-[0_0_2px_#00E0C055]">Rank</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-cyan-100 drop-shadow-[0_0_2px_#00E0C055]">Player</th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-cyan-100 drop-shadow-[0_0_2px_#00E0C055]">Level</th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-yellow-300 drop-shadow-[0_0_2px_#FFD60066]">Points</th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-pink-200 drop-shadow-[0_0_2px_#FF00B866]">Wins</th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-red-300 drop-shadow-[0_0_2px_#FF008066]">Losses</th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-cyan-100 drop-shadow-[0_0_2px_#00E0C055]">Win Rate</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((entry, index) => {
                  const isCurrentUser = entry.userId === user.id;
                  const winRate =
                    entry.wins + entry.losses > 0
                      ? Math.round((entry.wins / (entry.wins + entry.losses)) * 100)
                      : 0;
                  const rowBg = isCurrentUser
                    ? "bg-cyan-900/10 drop-shadow-[0_0_4px_#00E0C055]"
                    : index < 3
                      ? "bg-pink-900/10 drop-shadow-[0_0_4px_#FF00B855]"
                      : "hover:bg-cyan-400/10 hover:border-cyan-300/40";
                  return (
                    <tr
                      key={entry.id}
                      className={`${rowBg} border-b border-cyan-400/10 transition-all`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-cyan-100 font-bold text-lg drop-shadow-[0_0_2px_#00E0C055]">
                            #{index + 1}
                          </span>
                          {index < 3 && (
                            <span className="text-2xl drop-shadow-[0_0_2px_#FFD60066]">
                              {['🥇','🥈','🥉'][index]}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-pink-400 flex items-center justify-center text-white font-bold drop-shadow-[0_0_2px_#00E0C055]">
                            {(entry.user.name || entry.user.email)[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="text-cyan-100 font-medium">
                              {entry.user.name || entry.user.email.split("@")[0]}
                            </p>
                            {isCurrentUser && (
                              <span className="text-pink-400 text-xs">You</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="px-3 py-1 bg-[#00E0C0] rounded-full text-white text-sm font-bold shadow-[0_0_4px_#00E0C055]">
                          {entry.level}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="px-3 py-1 bg-yellow-400/20 text-yellow-300 rounded-full font-bold text-lg shadow-[0_0_6px_#FFD600]">
                          {entry.points}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="px-3 py-1 bg-pink-400/20 text-pink-200 rounded-full font-bold shadow-[0_0_6px_#FF00B8]">
                          {entry.wins}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="px-3 py-1 bg-red-400/20 text-red-300 rounded-full font-bold shadow-[0_0_6px_#FF0080]">
                          {entry.losses}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-cyan-100 font-bold">
                          {winRate}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
    </main>
    </div>
  );
}
