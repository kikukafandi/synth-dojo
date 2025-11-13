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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950/20 to-slate-950">
      <Navbar user={session.user} />
      <main className="max-w-6xl mx-auto px-4 sm:px-8 py-10 relative z-10 flex flex-col gap-y-10">
        <section className="mb-6 relative border border-cyan-400/20 rounded-xl p-4 bg-[linear-gradient(135deg,rgba(0,224,192,0.04),rgba(192,0,144,0.04))]">
          <div className="mb-6 text-left relative z-10">
            <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-[linear-gradient(to_right,#00E0C0,#C00090)] mb-2 leading-tight pb-2 flex items-center gap-3">
              <span className="text-5xl">🎮</span> PvP Arena
            </h1>
            <p className="text-cyan-100/90 text-lg">
              Battle against real players in real-time coding matches
            </p>
          </div>
        </section>
        <section>
          <div className="rounded-xl p-12 bg-[linear-gradient(135deg,rgba(0,224,192,0.04),rgba(192,0,144,0.04))] border border-pink-400/20 shadow-[0_0_16px_#FF00B899] text-center">
            <div className="text-6xl mb-6">🎮</div>
            <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-cyan-400 to-pink-400 mb-4 leading-tight">
              PvP Mode
            </h2>
            <p className="text-cyan-200 mb-8 max-w-2xl mx-auto">
              Real-time PvP matchmaking is currently in development. This feature will allow you to compete against other players 
              in live coding battles with WebSocket support for real-time synchronization.
            </p>
            <div className="bg-pink-900/30 border border-pink-400/50 rounded-lg p-6 max-w-2xl mx-auto">
              <h3 className="text-lg font-bold text-pink-200 mb-3">Coming Soon:</h3>
              <ul className="text-left text-cyan-100 space-y-2">
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
                className="inline-block px-8 py-4 bg-[linear-gradient(to_right,#00E0C0,#C00090)] hover:scale-105 text-white text-lg font-bold rounded-xl transition-all shadow-[0_0_10px_#00E0C099]"
              >
                Try AI Battle Instead
              </a>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
