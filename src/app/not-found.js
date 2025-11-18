import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950/20 to-slate-950">
      {/* Background blur effects matching the main page */}
      <div className="absolute left-1/2 top-[-10%] h-[50rem] w-[50rem] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,_rgba(0,255,240,0.25),_transparent_60%)] blur-3xl" />
      <div className="absolute left-[70%] top-[40%] h-[36rem] w-[36rem] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,_rgba(255,0,184,0.22),_transparent_60%)] blur-3xl" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Header */}
        <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <img src="/synth-dojo.png" alt="Synth-Dojo logo" width={100} height={100} className="rounded" />
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

        {/* 404 Section */}
        <section className="mx-auto flex max-w-6xl flex-col items-center justify-center px-6 pt-24 pb-32 text-center">
          <div className="relative mb-12">
            {/* Glowing 404 */}
            <div className="text-9xl md:text-[12rem] font-bold text-transparent bg-clip-text bg-[linear-gradient(to_right,#00FFF0,#FF00B8)] mb-6 drop-shadow-[0_0_30px_#00E0C0]">
              404
            </div>
            <div className="absolute -z-10 left-1/2 top-1/2 h-40 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,_rgba(0,255,240,0.20),_transparent_70%)] blur-2xl" />
          </div>

          <div className="relative bg-[linear-gradient(120deg,rgba(0,255,240,0.05),rgba(255,0,184,0.05))] border border-cyan-400/20 rounded-xl p-8 mb-12 shadow-[0_0_20px_#00FFF033] overflow-hidden max-w-2xl">
            <div className="absolute -z-10 left-1/2 top-0 h-32 w-32 -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,_rgba(0,255,240,0.15),_transparent_70%)] blur-xl" />
            
            <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-[linear-gradient(to_right,#00FFF0,#FF00B8)] mb-6">
              Page Not Found
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-300 mb-4">
              The dojo you're looking for has vanished into the void
            </p>
            
            <p className="text-lg text-gray-400 mb-8">
              Don't worry, even the best coders encounter bugs. Let's get you back to training!
            </p>

            {/* Error code display */}
            <div className="bg-gray-900/50 border border-cyan-400/20 rounded-lg p-4 mb-8 font-mono text-left">
              <div className="text-red-400 text-sm mb-2">// Error: Route not found</div>
              <div className="text-gray-300">
                <span className="text-cyan-400">if</span> (page === <span className="text-green-400">'not-found'</span>) {'{'}
              </div>
              <div className="text-gray-300 ml-4">
                <span className="text-cyan-400">return</span> <span className="text-yellow-400">redirect</span>(<span className="text-green-400">'/dashboard'</span>);
              </div>
              <div className="text-gray-300">{'}'}</div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/"
                className="px-8 py-4 bg-[linear-gradient(to_right,#00E0C0,#C00090)] text-white text-lg font-bold rounded-xl hover:shadow-[0_0_25px_#00E0C0,0_0_45px_#C00090] hover:scale-105 transition-all"
              >
                Back to Home
              </Link>
              
              <Link
                href="/dashboard"
                className="px-8 py-4 bg-gray-900 text-white text-lg font-bold rounded-xl border border-[#00E0C0]/40 hover:border-transparent hover:shadow-[0_0_20px_#00E0C0] hover:scale-105 transition-all"
              >
                Go to Dashboard
              </Link>
            </div>
          </div>

          {/* Fun stats/features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl">
            <div className="relative rounded-xl p-6 bg-[linear-gradient(135deg,rgba(0,224,192,0.04),rgba(192,0,144,0.04))] border border-cyan-400/10 hover:border-cyan-300/40 shadow-[0_0_10px_#00E0C099] transition-all">
              <div className="text-4xl mb-4 text-center">🎯</div>
              <h3 className="text-xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-700 text-center">Practice Mode</h3>
              <p className="text-cyan-100/80 text-center">Sharpen your skills with coding challenges</p>
            </div>

            <div className="relative rounded-xl p-6 bg-[linear-gradient(135deg,rgba(0,224,192,0.04),rgba(192,0,144,0.04))] border border-cyan-400/10 hover:border-cyan-300/40 shadow-[0_0_10px_#00E0C099] transition-all">
              <div className="text-4xl mb-4 text-center">🤖</div>
              <h3 className="text-xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-700 text-center">AI Battles</h3>
              <p className="text-cyan-100/80 text-center">Challenge AI opponents in coding duels</p>
            </div>

            <div className="relative rounded-xl p-6 bg-[linear-gradient(135deg,rgba(0,224,192,0.04),rgba(192,0,144,0.04))] border border-cyan-400/10 hover:border-cyan-300/40 shadow-[0_0_10px_#00E0C099] transition-all">
              <div className="text-4xl mb-4 text-center">⚔️</div>
              <h3 className="text-xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-500 to-cyan-400 text-center">PvP Arena</h3>
              <p className="text-cyan-100/80 text-center">Battle other players in real-time</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}