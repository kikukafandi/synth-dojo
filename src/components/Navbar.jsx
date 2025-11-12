// Dashboard Navigation Component
// Shared navigation bar for authenticated pages

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";



export default function Navbar() {
  const pathname = usePathname();

  const navLinks = [
    { href: "/dashboard", label: "Dashboard", icon: "📊" },
    { href: "/learn", label: "Learn", icon: "📚" },
    { href: "/battle", label: "AI Battle", icon: "⚔️" },
    { href: "/pvp", label: "PvP", icon: "🎮" },
    { href: "/leaderboard", label: "Leaderboard", icon: "🏆" },
  ];

  if (user?.role === "admin") {
    navLinks.push({ href: "/admin", label: "Admin", icon: "⚙️" });
  }

  const isActive = () => pathname === href;

  return (
    <nav className="bg-gray-800 border-b border-purple-500/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link href="/dashboard" className="flex items-center">
              <span className="text-2xl font-bold text-transparent bg-clip-text bg-linear-to-r from-purple-400 to-pink-400">
                Synth-Dojo
              </span>
            </Link>
            <div className="hidden sm:ml-8 sm:flex sm:space-x-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    isActive(link.href)
                      ? "bg-purple-600 text-white"
                      : "text-gray-300 hover:bg-gray-700 hover:text-white"
                  }`}
                >
                  <span className="mr-2">{link.icon}</span>
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-gray-300 text-sm hidden sm:block">
              {user?.name || user?.email}
            </span>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      <div className="sm:hidden px-4 pb-3 space-y-1">
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`block px-3 py-2 text-base font-medium rounded-lg ${
              isActive(link.href)
                ? "bg-purple-600 text-white"
                : "text-gray-300 hover:bg-gray-700 hover:text-white"
            }`}
          >
            <span className="mr-2">{link.icon}</span>
            {link.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
