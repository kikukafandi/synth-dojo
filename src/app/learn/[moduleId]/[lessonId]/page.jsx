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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      <Navbar user={session.user} />
      
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-2 mb-6 text-sm">
          <Link href="/learn" className="text-purple-400 hover:text-purple-300">
            Learn
          </Link>
          <span className="text-gray-500">/</span>
          <Link href={`/learn/${params.moduleId}`} className="text-purple-400 hover:text-purple-300">
            {lesson.module.title}
          </Link>
          <span className="text-gray-500">/</span>
          <span className="text-white">{lesson.title}</span>
        </div>

        <h1 className="text-4xl font-bold text-white mb-8">{lesson.title}</h1>

        <LessonContent lesson={lesson} questions={lesson.questions} />
      </div>
    </div>
  );
}
