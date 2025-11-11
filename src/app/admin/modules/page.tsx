// Admin Modules Management
// CRUD interface for learning modules

import { auth } from "@/../../auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Navbar from "@/components/Navbar";
import Link from "next/link";

export default async function AdminModulesPage() {
  const session = await auth();
  
  if (!session?.user?.email) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user || user.role !== "admin") {
    redirect("/dashboard");
  }

  const modules = await prisma.module.findMany({
    include: {
      lessons: true,
      _count: {
        select: {
          lessons: true,
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
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link href="/admin" className="text-purple-400 hover:text-purple-300 text-sm mb-2 inline-block">
              ← Back to Admin
            </Link>
            <h1 className="text-4xl font-bold text-white">Manage Modules</h1>
          </div>
          <button className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold rounded-lg transition-all">
            + New Module
          </button>
        </div>

        <div className="bg-gray-800 border border-purple-500/30 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-900">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-bold text-purple-400">Title</th>
                <th className="px-6 py-4 text-center text-sm font-bold text-purple-400">Order</th>
                <th className="px-6 py-4 text-center text-sm font-bold text-purple-400">Difficulty</th>
                <th className="px-6 py-4 text-center text-sm font-bold text-purple-400">Lessons</th>
                <th className="px-6 py-4 text-center text-sm font-bold text-purple-400">Published</th>
                <th className="px-6 py-4 text-right text-sm font-bold text-purple-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {modules.map((module) => (
                <tr key={module.id} className="hover:bg-gray-700/50">
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-white font-medium">{module.title}</p>
                      <p className="text-gray-400 text-sm">{module.description}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-white">{module.order}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="px-3 py-1 bg-purple-600 rounded-full text-white text-sm">
                      Level {module.difficulty}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-white">{module._count.lessons}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {module.isPublished ? (
                      <span className="px-3 py-1 bg-green-600 rounded-full text-white text-xs">
                        Published
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-gray-600 rounded-full text-white text-xs">
                        Draft
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors">
                        Edit
                      </button>
                      <button className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition-colors">
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {modules.length === 0 && (
          <div className="bg-gray-800 border border-purple-500/30 rounded-xl p-12 text-center">
            <p className="text-gray-400">No modules yet. Create your first module!</p>
          </div>
        )}
      </div>
    </div>
  );
}
