// Module Details Page - Shows lessons in a module

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Navbar from "@/components/Navbar";
import Link from "next/link";

export default async function ModulePage(props) {
  const params = await props.params;
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

  const module = await prisma.module.findUnique({
    where: { id: params.moduleId },
    include: {
      lessons: {
        where: { isPublished: true },
        orderBy: { order: "asc" },
      }
    },
  });

  if (!module) {
    redirect("/learn");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950/20 to-slate-950">
      <Navbar user={session.user} />
      <div className="absolute left-[30%] top-[-10%] h-[40rem] w-[40rem] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,_rgba(0,255,240,0.12),_transparent_60%)] blur-3xl pointer-events-none" />
      <div className="absolute left-[70%] top-[40%] h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,_rgba(255,0,184,0.11),_transparent_60%)] blur-3xl pointer-events-none" />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative z-10 flex flex-col gap-y-8">
        <nav className="flex items-center gap-2 mb-6 text-sm">
          <Link href="/learn" className="text-cyan-300 hover:text-cyan-100 font-medium">Learn</Link>
          <span className="text-cyan-700">/</span>
          <span className="text-pink-300 font-semibold">{module.title}</span>
        </nav>
        <section className="rounded-xl p-8 bg-[linear-gradient(135deg,rgba(0,224,192,0.04),rgba(192,0,144,0.04))] border border-cyan-400/20 shadow-[0_0_10px_#00E0C099] mb-8">
          <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-[linear-gradient(to_right,#00E0C0,#C00090)] mb-4 leading-tight pb-2">
            {module.title}
          </h1>
          <p className="text-cyan-100/90 text-lg mb-4">{module.description}</p>
          <div className="flex gap-3">
            <div className="px-3 py-1 bg-[#C00090] rounded text-sm text-white">
              Level {module.difficulty}
            </div>
            <div className="px-3 py-1 bg-cyan-400/20 rounded text-sm text-cyan-100">
              {module.lessons.length} Lessons
            </div>
          </div>
        </section>
        <section className="flex flex-col gap-y-4">
          {module.lessons.map((lesson, index) => (
            <Link
              key={lesson.id}
              href={`/learn/${module.id}/${lesson.id}`}
              className="block rounded-xl p-6 bg-[linear-gradient(135deg,rgba(0,224,192,0.07),rgba(192,0,144,0.04))] border border-cyan-400/10 hover:border-cyan-300/40 shadow-[0_0_px_#00E0C099] hover:scale-[1.02] transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-[linear-gradient(to_right,#00E0C0,#C00090)] rounded-full flex items-center justify-center text-white font-bold text-xl">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-cyan-100 mb-1">
                    {lesson.title}
                  </h3>
                  <p className="text-cyan-200 text-sm">
                    Click to start lesson
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </section>
        {module.lessons.length === 0 && (
          <div className="text-center py-12 bg-[linear-gradient(135deg,rgba(0,224,192,0.07),rgba(192,0,144,0.04))] rounded-xl">
            <p className="text-cyan-200">No lessons in this module yet.</p>
          </div>
        )}
      </main>
    </div>
  );
}
