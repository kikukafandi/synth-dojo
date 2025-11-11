// AI Battle Page
// Challenge AI opponents in coding battles

import { auth } from "@/../../auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Navbar from "@/components/Navbar";
import BattleArena from "@/components/BattleArena";

export default async function BattlePage() {
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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      <Navbar user={session.user} />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">⚔️ AI Battle</h1>
          <p className="text-gray-400">
            Challenge AI opponents and prove your coding skills
          </p>
        </div>

        <BattleArena 
          userId={user.id} 
          userName={user.name || "Player"}
          userLevel={user.level}
          mode="ai_battle"
        />
      </div>
    </div>
  );
}
