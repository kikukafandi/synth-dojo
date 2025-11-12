import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-6xl md:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 mb-6">
            Synth-Dojo
          </h1>
          <p className="text-2xl md:text-3xl text-gray-300 mb-4">
            Level up your coding skills through battles
          </p>
          <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
            Practice coding, battle AI opponents, compete with players worldwide, 
            and climb the leaderboard in this gamified learning platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-lg font-bold rounded-xl transition-all transform hover:scale-105"
            >
              Start Learning
            </Link>
            <Link
              href="/login"
              className="px-8 py-4 bg-gray-800 hover:bg-gray-700 border border-purple-500/30 text-white text-lg font-bold rounded-xl transition-all"
            >
              Sign In
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <div className="bg-gray-800 border border-purple-500/30 rounded-xl p-6 hover:border-purple-500 transition-all">
            <div className="text-4xl mb-4">📚</div>
            <h3 className="text-xl font-bold text-white mb-2">Learn</h3>
            <p className="text-gray-400">
              Structured lessons and practice problems to build your skills
            </p>
          </div>

          <div className="bg-gray-800 border border-purple-500/30 rounded-xl p-6 hover:border-purple-500 transition-all">
            <div className="text-4xl mb-4">⚔️</div>
            <h3 className="text-xl font-bold text-white mb-2">AI Battles</h3>
            <p className="text-gray-400">
              Challenge AI opponents matched to your skill level
            </p>
          </div>

          <div className="bg-gray-800 border border-purple-500/30 rounded-xl p-6 hover:border-purple-500 transition-all">
            <div className="text-4xl mb-4">🎮</div>
            <h3 className="text-xl font-bold text-white mb-2">PvP</h3>
            <p className="text-gray-400">
              Battle real players in real-time coding matches
            </p>
          </div>

          <div className="bg-gray-800 border border-purple-500/30 rounded-xl p-6 hover:border-purple-500 transition-all">
            <div className="text-4xl mb-4">🏆</div>
            <h3 className="text-xl font-bold text-white mb-2">Leaderboard</h3>
            <p className="text-gray-400">
              Compete globally and climb the rankings
            </p>
          </div>
        </div>

        {/* Gamification Features */}
        <div className="bg-gray-800 border border-purple-500/30 rounded-xl p-8 mb-16">
          <h2 className="text-3xl font-bold text-white mb-6 text-center">
            Gamified Learning Experience
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-5xl mb-3">⚡</div>
              <h3 className="text-xl font-bold text-purple-400 mb-2">Levels & XP</h3>
              <p className="text-gray-400">
                Earn experience points and level up as you complete challenges
              </p>
            </div>
            <div className="text-center">
              <div className="text-5xl mb-3">❤️</div>
              <h3 className="text-xl font-bold text-red-400 mb-2">HP System</h3>
              <p className="text-gray-400">
                Manage your health points wisely - win to gain, lose to deplete
              </p>
            </div>
            <div className="text-center">
              <div className="text-5xl mb-3">🏅</div>
              <h3 className="text-xl font-bold text-yellow-400 mb-2">Achievements</h3>
              <p className="text-gray-400">
                Unlock badges and achievements as you progress
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to become a coding warrior?
          </h2>
          <Link
            href="/register"
            className="inline-block px-10 py-5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-xl font-bold rounded-xl transition-all transform hover:scale-105"
          >
            Join Synth-Dojo
          </Link>
        </div>
      </div>
    </div>
  );
}
