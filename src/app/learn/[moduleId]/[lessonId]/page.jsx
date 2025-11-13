// Lesson Detail Page

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Navbar from "@/components/Navbar";
import LessonContent from "@/components/LessonContent";
import Link from "next/link";

export default async function LessonPage(props) {
  const params = await props.params;
  console.log("Params:", params);
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

  const lesson = await prisma.lesson.findUnique({
    where: { id: params.lessonId },
    include: {
      module: true,
      questions: {
        where: {
          isPublished: true,
        },
        orderBy: {
          difficulty: "asc",
        },
      },
    },
  });
console.log(lesson);
  if (!lesson || lesson.moduleId !== params.moduleId) {
    redirect("/learn");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950/20 to-slate-950">
      <Navbar user={session.user} />
      <div className="absolute left-[30%] top-[-10%] h-[40rem] w-[40rem] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,_rgba(0,255,240,0.12),_transparent_60%)] blur-3xl pointer-events-none" />
      <div className="absolute left-[70%] top-[40%] h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,_rgba(255,0,184,0.11),_transparent_60%)] blur-3xl pointer-events-none" />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative z-10 flex flex-col gap-y-8">
        <nav className="flex items-center gap-2 mb-6 text-sm">
          <Link href="/learn" className="text-cyan-300 hover:text-cyan-100 font-medium">
            Learn
          </Link>
          <span className="text-cyan-700">/</span>
          <Link href={`/learn/${params.moduleId}`} className="text-pink-300 hover:text-pink-100 font-medium">
            {lesson.module.title}
          </Link>
          <span className="text-cyan-700">/</span>
          <span className="text-white font-semibold">{lesson.title}</span>
        </nav>
        <section className="rounded-xl p-8 bg-[linear-gradient(135deg,rgba(0,224,192,0.04),rgba(192,0,144,0.04))] border border-cyan-400/20 shadow-[0_0_24px_#00E0C099]">
          <h1 className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-[linear-gradient(to_right,#00E0C0,#C00090)] mb-6">
            {lesson.title}
          </h1>
          <LessonContent lesson={lesson} questions={lesson.questions} />
        </section>
      </main>
    </div>
  );
}
