// Learn Page - List all learning modules
// Shows available modules and user progress

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Navbar from "@/components/Navbar";
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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      <Navbar user={session.user} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Learning Modules</h1>
          <p className="text-gray-400">
            Master coding through structured lessons and practice
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map((module: any) => {
            const userProgress = module.progress[0];
            const progressPercent = userProgress?.progress || 0;
            const isCompleted = userProgress?.isCompleted || false;

            return (
              <Link
                key={module.id}
                href={`/learn/${module.id}`}
                className="bg-gray-800 border border-purple-500/30 rounded-xl p-6 hover:border-purple-500 transition-all hover:scale-105"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">
                      {module.title}
                    </h3>
                    <p className="text-gray-400 text-sm mb-3">
                      {module.description}
                    </p>
                  </div>
                  {isCompleted && (
                    <div className="text-2xl">✅</div>
                  )}
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <div className="px-2 py-1 bg-purple-600 rounded text-xs text-white">
                    Level {module.difficulty}
                  </div>
                  <div className="text-gray-400 text-sm">
                    {module.lessons.length} lessons
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>Progress</span>
                    <span>{progressPercent}%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all"
                      style={{ width: `${progressPercent}%` }}
                    ></div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {modules.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">
              No modules available yet. Check back soon!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
