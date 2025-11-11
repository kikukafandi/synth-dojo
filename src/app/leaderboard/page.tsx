// Leaderboard Page
// Shows global rankings

import { auth } from "@/../../auth";
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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      <Navbar user={session.user} />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">🏆 Leaderboard</h1>
          <p className="text-gray-400">
            Compete with players around the world
          </p>
        </div>

        {/* User's Current Rank */}
        {userEntry && (
          <div className="bg-gradient-to-r from-purple-900 to-pink-900 border border-purple-500 rounded-xl p-6 mb-6">
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
              "from-yellow-600 to-yellow-800",
              "from-gray-400 to-gray-600",
              "from-orange-600 to-orange-800",
            ];

            return (
              <div
                key={entry.id}
                className={`bg-gradient-to-br ${colors[index]} rounded-xl p-6 text-center transform hover:scale-105 transition-transform`}
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
        <div className="bg-gray-800 border border-purple-500/30 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-900">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-bold text-purple-400">Rank</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-purple-400">Player</th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-purple-400">Level</th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-purple-400">Points</th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-purple-400">Wins</th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-purple-400">Losses</th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-purple-400">Win Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {leaderboard.map((entry, index) => {
                  const isCurrentUser = entry.userId === user.id;
                  const winRate =
                    entry.wins + entry.losses > 0
                      ? Math.round((entry.wins / (entry.wins + entry.losses)) * 100)
                      : 0;

                  return (
                    <tr
                      key={entry.id}
                      className={`${
                        isCurrentUser ? "bg-purple-900/30" : "hover:bg-gray-700/50"
                      } transition-colors`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-white font-bold text-lg">
                            #{index + 1}
                          </span>
                          {index < 3 && (
                            <span className="text-2xl">
                              {["🥇", "🥈", "🥉"][index]}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                            {(entry.user.name || entry.user.email)[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="text-white font-medium">
                              {entry.user.name || entry.user.email.split("@")[0]}
                            </p>
                            {isCurrentUser && (
                              <span className="text-purple-400 text-xs">You</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="px-3 py-1 bg-purple-600 rounded-full text-white text-sm font-bold">
                          {entry.level}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-yellow-400 font-bold text-lg">
                          {entry.points}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-green-400 font-bold">
                          {entry.wins}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-red-400 font-bold">
                          {entry.losses}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-white font-bold">
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
      </div>
    </div>
  );
}
