// Module Details Page - Shows lessons in a module

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Navbar from "@/components/Navbar";
import Link from "next/link";

export default async function ModulePage({ params }: { params: { moduleId: string } }) {
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
        where: {
          isPublished: true,
        },
        orderBy: {
          order: "asc",
        },
      },
    },
  });

  if (!module) {
    redirect("/learn");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      <Navbar user={session.user} />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link href="/learn" className="text-purple-400 hover:text-purple-300 mb-4 inline-block">
          ← Back to Modules
        </Link>

        <div className="bg-gray-800 border border-purple-500/30 rounded-xl p-8 mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">{module.title}</h1>
          <p className="text-gray-400 text-lg mb-4">{module.description}</p>
          <div className="flex gap-3">
            <div className="px-3 py-1 bg-purple-600 rounded text-sm text-white">
              Level {module.difficulty}
            </div>
            <div className="px-3 py-1 bg-gray-700 rounded text-sm text-white">
              {module.lessons.length} Lessons
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {module.lessons.map((lesson, index) => (
            <Link
              key={lesson.id}
              href={`/learn/${module.id}/${lesson.id}`}
              className="block bg-gray-800 border border-purple-500/30 rounded-xl p-6 hover:border-purple-500 transition-all hover:scale-[1.02]"
            >
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-1">
                    {lesson.title}
                  </h3>
                  <p className="text-gray-400 text-sm">
                    Click to start lesson
                  </p>
                </div>
                <div className="text-gray-400">
                  →
                </div>
              </div>
            </Link>
          ))}
        </div>

        {module.lessons.length === 0 && (
          <div className="text-center py-12 bg-gray-800 rounded-xl">
            <p className="text-gray-400">No lessons in this module yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
