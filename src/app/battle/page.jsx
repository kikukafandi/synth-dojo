// AI Battle Page
// Challenge AI opponents in coding battles

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Navbar from "@/components/Navbar";
import BattleArena from "@/components/BattleArena";

export default async function BattlePage(props) {
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

  // Get random question for battle
  const questions = await prisma.question.findMany({
    where: {
      isPublished: true,
    },
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950/20 to-slate-950">
      <Navbar user={session.user} />
      
      <main className="max-w-6xl mx-auto px-6 sm:px-8 py-10 relative z-10 flex flex-col gap-y-10">
        <section className="mb-6 relative border border-cyan-400/20 rounded-xl p-4 bg-[linear-gradient(135deg,rgba(0,224,192,0.04),rgba(192,0,144,0.04))]">
          <div className="mb-6 text-left relative z-10">
            <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-[linear-gradient(to_right,#00E0C0,#C00090)] mb-2 leading-tight pb-2 flex items-center gap-3">
              <span className="text-5xl">⚔️</span> AI Battle
            </h1>
            <p className="text-cyan-100/90 text-lg ">
              Challenge AI opponents and prove your coding skills
            </p>
          </div>
        </section>
        

        <BattleArena 
          userId={user.id} 
          userName={user.name || "Player"}
          userLevel={user.level}
          mode="ai_battle"
        />
      </main>
    </div>
  );
}
