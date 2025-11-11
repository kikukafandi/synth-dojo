// Admin Panel Homepage
// Dashboard for managing content and users

import { auth } from "@/../../auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Navbar from "@/components/Navbar";
import Link from "next/link";

export default async function AdminPage() {
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

  // Get statistics
  const stats = {
    totalUsers: await prisma.user.count(),
    totalModules: await prisma.module.count(),
    totalLessons: await prisma.lesson.count(),
    totalQuestions: await prisma.question.count(),
    totalMatches: await prisma.match.count({ where: { status: "completed" } }),
    activeMatches: await prisma.match.count({ where: { status: "in_progress" } }),
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      <Navbar user={session.user} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">⚙️ Admin Panel</h1>
          <p className="text-gray-400">
            Manage content, users, and monitor platform activity
          </p>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-800 border border-purple-500/30 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Users</p>
                <p className="text-3xl font-bold text-white">{stats.totalUsers}</p>
              </div>
              <div className="text-4xl">👥</div>
            </div>
          </div>

          <div className="bg-gray-800 border border-purple-500/30 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Modules</p>
                <p className="text-3xl font-bold text-white">{stats.totalModules}</p>
              </div>
              <div className="text-4xl">📚</div>
            </div>
          </div>

          <div className="bg-gray-800 border border-purple-500/30 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Lessons</p>
                <p className="text-3xl font-bold text-white">{stats.totalLessons}</p>
              </div>
              <div className="text-4xl">📖</div>
            </div>
          </div>

          <div className="bg-gray-800 border border-purple-500/30 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Questions</p>
                <p className="text-3xl font-bold text-white">{stats.totalQuestions}</p>
              </div>
              <div className="text-4xl">❓</div>
            </div>
          </div>

          <div className="bg-gray-800 border border-purple-500/30 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Matches</p>
                <p className="text-3xl font-bold text-white">{stats.totalMatches}</p>
              </div>
              <div className="text-4xl">⚔️</div>
            </div>
          </div>

          <div className="bg-gray-800 border border-purple-500/30 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Active Matches</p>
                <p className="text-3xl font-bold text-green-400">{stats.activeMatches}</p>
              </div>
              <div className="text-4xl">🎮</div>
            </div>
          </div>
        </div>

        {/* Admin Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link
            href="/admin/modules"
            className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl p-6 hover:scale-105 transition-transform"
          >
            <div className="text-4xl mb-3">📚</div>
            <h3 className="text-xl font-bold text-white mb-2">Manage Modules</h3>
            <p className="text-blue-200">Create and edit learning modules</p>
          </Link>

          <Link
            href="/admin/questions"
            className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-xl p-6 hover:scale-105 transition-transform"
          >
            <div className="text-4xl mb-3">❓</div>
            <h3 className="text-xl font-bold text-white mb-2">Manage Questions</h3>
            <p className="text-purple-200">Add and edit practice questions</p>
          </Link>

          <Link
            href="/admin/users"
            className="bg-gradient-to-br from-pink-600 to-pink-800 rounded-xl p-6 hover:scale-105 transition-transform"
          >
            <div className="text-4xl mb-3">👥</div>
            <h3 className="text-xl font-bold text-white mb-2">Manage Users</h3>
            <p className="text-pink-200">View and manage user accounts</p>
          </Link>

          <Link
            href="/admin/achievements"
            className="bg-gradient-to-br from-yellow-600 to-yellow-800 rounded-xl p-6 hover:scale-105 transition-transform"
          >
            <div className="text-4xl mb-3">🏆</div>
            <h3 className="text-xl font-bold text-white mb-2">Achievements</h3>
            <p className="text-yellow-200">Manage achievements and rewards</p>
          </Link>

          <Link
            href="/admin/matches"
            className="bg-gradient-to-br from-green-600 to-green-800 rounded-xl p-6 hover:scale-105 transition-transform"
          >
            <div className="text-4xl mb-3">⚔️</div>
            <h3 className="text-xl font-bold text-white mb-2">Match History</h3>
            <p className="text-green-200">View all completed matches</p>
          </Link>

          <Link
            href="/admin/analytics"
            className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-xl p-6 hover:scale-105 transition-transform"
          >
            <div className="text-4xl mb-3">📊</div>
            <h3 className="text-xl font-bold text-white mb-2">Analytics</h3>
            <p className="text-indigo-200">Platform metrics and insights</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
