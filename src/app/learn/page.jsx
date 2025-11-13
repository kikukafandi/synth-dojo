// Learn Page - List all learning modules
// Shows available modules and user progress

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Navbar  from "@/components/Navbar";
import Link from "next/link";

export default async function LearnPage() {
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

  // Fetch all published modules with progress
  const modules = await prisma.module.findMany({
    where: {
      isPublished: true,
    },
    include: {
      lessons: {
        where: {
          isPublished: true,
        },
        orderBy: {
          order: "asc",
        },
      },
      progress: {
        where: {
          userId: user.id,
        },
      },
    },
    orderBy: {
      order: "asc",
    },
  });
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950/20 to-slate-950">
      <Navbar user={session.user} />
      <main className="max-w-6xl mx-auto px-4 sm:px-8 py-10 relative z-10 flex flex-col gap-y-10">
        <section className="relative border rounded-xl p-6 bg-[linear-gradient(135deg,rgba(0,224,192,0.04),rgba(192,0,144,0.04))] border-cyan-400/20">
          <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-[linear-gradient(to_right,#00E0C0,#C00090)] mb-2">
            Learning Modules
          </h1>
          <p className="text-lg text-cyan-100/90 mb-6">Choose a module to start learning and track your progress!</p>
         
            </section>
            <section className="flex flex-col gap-y-4">
               <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
            {modules.map((module) => {
              const progress = module.progress?.[0];
              const percent = progress ? progress.percent || 0 : 0;
              return (
                <Link
                  key={module.id}
                  href={`/learn/${module.id}`}
                  className="relative rounded-xl p-6 bg-[linear-gradient(135deg,rgba(0,224,192,0.07),rgba(192,0,144,0.04))] border border-cyan-400/10 hover:border-cyan-300/40 shadow-[0_0_10px_#00E0C099] hover:scale-105 transition-all block overflow-hidden"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#00FFF0" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="16" rx="2" className="stroke-cyan-400"/><path d="M7 8h10M7 12h10M7 16h6" className="stroke-cyan-400"/></svg>
                    <h2 className="text-xl font-bold text-cyan-100 mb-0">{module.title}</h2>
                  </div>
                  <p className="text-cyan-200 mb-4 min-h-[48px]">{module.description}</p>
                  {progress && (
                    <div className="mt-2">
                      <div className="flex justify-between text-xs text-cyan-300 mb-1">
                        <span>Progress</span>
                        <span>{percent}%</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full"
                          style={{ width: `${percent}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        </section>
      </main>
      {modules.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-400 text-lg">
            No modules available yet. Check back soon!
          </p>
        </div>
      )}
    </div>
  );
}
