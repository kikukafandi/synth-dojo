import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950/20 to-slate-950">
      <div className="absolute left-1/2 top-[-10%] h-[50rem] w-[50rem] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,_rgba(0,255,240,0.25),_transparent_60%)] blur-3xl" />
      <div className="absolute left-[70%] top-[40%] h-[36rem] w-[36rem] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,_rgba(255,0,184,0.22),_transparent_60%)] blur-3xl" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <img src="/synth-dojo.png" alt="Users vs AI logo" width={100} height={100} className="rounded" />
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">

            <Link
              href="/login"
              className="px-4 py-2 bg-gray-900 text-white text-md font-bold rounded-xl border border-[#00E0C0]/40 hover:border-transparent hover:shadow-[0_0_20px_#00E0C0] hover:scale-105"
            >
              Sign In
            </Link>
          </div>
        </header>
        {/* Hero Section */}
        <section className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-6 pt-12 pb-24 md:grid-cols-2 md:pt-16 md:pb-28">
          <div className="text-left mb-16">
            <h1 className="text-6xl md:text-7xl font-bold text-transparent bg-clip-text bg-[linear-gradient(to_right,#00FFF0,#FF00B8)] mb-6">
              SYNTH-DOJO
            </h1>
            <p className="text-2xl md:text-3xl text-gray-300 mb-4">
              Level up your coding skills through battles
            </p>
            <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
              Practice coding, battle AI opponents, compete with players worldwide,
              and climb the leaderboard in this gamified learning platform.
            </p>
            <Link
              href="/register"
              className="px-8 py-4 bg-[linear-gradient(to_right,#00E0C0,#C00090)] text-white text-lg font-bold rounded-xl hover:shadow-[0_0_25px_#00E0C0,0_0_45px_#C00090] hover:scale-105">
              Start Learning
            </Link>
          </div>
          <div className="relative h-80 w-full rounded-2xl border border-[--accent-cyan]/20 bg-black/20 p-3 shadow-[0_0_60px_rgba(0,255,240,0.15)]">
            <div className="flex h-full w-full items-center justify-center rounded-xl border-2 border-dashed border-white/10">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-10 text-white/20"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
            </div>
          </div>
        </section>


        {/* Features */}
        <section className="mx-auto grid max-w-6xl px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {[
              {
                icon: (
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#00FFF0" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="mx-auto">
                    <rect x="3" y="4" width="18" height="16" rx="2" className="stroke-cyan-400" />
                    <path d="M7 8h10M7 12h10M7 16h6" className="stroke-cyan-400" />
                  </svg>
                ), title: "Learn", desc: "Structured lessons and practice problems to build your skills", color: "from-cyan-400 to-blue-700"
              },
              {
                icon: (
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#FF00B8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="mx-auto">
                    <path d="M21 10h-7l-2 2v7" className="stroke-pink-400" />
                    <circle cx="7" cy="17" r="2" className="stroke-pink-400" />
                    <path d="M17 3l4 4-4 4" className="stroke-pink-400" />
                  </svg>
                ), title: "AI Battles", desc: "Challenge AI opponents matched to your skill level", color: "from-pink-500 to-purple-700"
              },
              {
                icon: (
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#00E0C0" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="mx-auto">
                    <rect x="3" y="5" width="18" height="14" rx="2" className="stroke-fuchsia-400" />
                    <path d="M8 21h8" className="stroke-fuchsia-400" />
                    <circle cx="12" cy="12" r="3" className="stroke-fuchsia-400" />
                  </svg>
                ), title: "PvP", desc: "Battle real players in real-time coding matches", color: "from-fuchsia-500 to-cyan-400"
              },
              {
                icon: (
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#FFD600" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="mx-auto">
                    <circle cx="12" cy="8" r="4" className="stroke-yellow-400" />
                    <path d="M6 22v-2a4 4 0 014-4h4a4 4 0 014 4v2" className="stroke-pink-400" />
                  </svg>
                ), title: "Leaderboard", desc: "Compete globally and climb the rankings", color: "from-yellow-400 to-pink-600"
              },
            ].map((f, i) => (
              <div
                key={i}
                className={`relative rounded-xl p-6 bg-[linear-gradient(135deg,rgba(0,224,192,0.04),rgba(192,0,144,0.04))] border border-cyan-400/10 hover:border-cyan-300/40 shadow-[0_0_10px_#00E0C099] transition-all overflow-hidden`}
              >
                <div className="absolute -z-10 left-1/2 top-1/2 h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full blur-xl opacity-30" style={{ background: `radial-gradient(circle at 50% 50%, var(--tw-gradient-from), transparent 70%)` }} />
                <div className="text-4xl mb-4 drop-shadow-[0_0_12px_#00E0C0]">{f.icon}</div>
                <h3 className={`text-xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r ${f.color}`}>{f.title}</h3>
                <p className="text-cyan-100/80">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>
        {/* Gamification Features */}
        <section className="mx-auto grid max-w-6xl px-6">
          <div className="relative bg-[linear-gradient(120deg,rgba(0,255,240,0.03),rgba(255,0,184,0.03))] border border-cyan-400/10 rounded-xl p-8 mb-16 shadow-[0_0_10px_#00FFF099] overflow-hidden">
            <div className="absolute -z-10 left-1/2 top-0 h-52 w-52 -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,_rgba(0,255,240,0.10),_transparent_70%)] blur-xl" />
            <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-pink-400 to-cyan-300 mb-6 text-center">
              Gamified Learning Experience
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="mb-3 flex justify-center">
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#00FFF0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-[0_0_4px_#00E0C099]">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" className="stroke-cyan-400" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400 mb-2">Levels & XP</h3>
                <p className="text-cyan-100/80">
                  Earn experience points and level up as you complete challenges
                </p>
              </div>
              <div className="text-center">
                <div className="mb-3 flex justify-center">
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#FF0080" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-[0_0_4px_#FF008099]">
                    <path d="M12 21s-6-4.35-8-7.09C2 11.13 2 8.5 4.07 6.43a5.5 5.5 0 017.78 0 5.5 5.5 0 017.78 0C22 8.5 22 11.13 20 13.91 18 16.65 12 21 12 21z" className="stroke-pink-400" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-pink-500 mb-2">HP System</h3>
                <p className="text-cyan-100/80">
                  Manage your health points wisely - win to gain, lose to deplete
                </p>
              </div>
              <div className="text-center">
                <div className="mb-3 flex justify-center">
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#FFD600" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-[0_0_4px_#FFD60099]">
                    <circle cx="12" cy="8" r="5" className="stroke-yellow-400" />
                    <path d="M8 21v-4a4 4 0 018 0v4" className="stroke-pink-400" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-pink-400 mb-2">Achievements</h3>
                <p className="text-cyan-100/80">
                  Unlock badges and achievements as you progress
                </p>
              </div>
            </div>
          </div>
        </section>
        {/* CTA */}
        <section className="mx-auto grid max-w-6xl px-6">
          <div className="text-center mt-12">
            <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-pink-300 to-cyan-300 mb-4">
              Ready to become a coding warrior?
            </h2>
            <Link
              href="/register"
              className="inline-block px-12 py-5 bg-[linear-gradient(to_right,#00E0C0,#C00090)] text-white text-xl font-bold rounded-xl border border-cyan-400/20 hover:shadow-[0_0_16px_#00E0C099,0_0_24px_#C0009099] hover:scale-105 transition-all"
            >
              Join Synth-Dojo
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
