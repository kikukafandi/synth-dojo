// Dashboard Navigation Component
// Shared navigation bar for authenticated pages

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { handleSignOut } from "@/app/actions/auth";

// TERIMA PROPS 'user' DI SINI
export default function Navbar({ user }) {
  const pathname = usePathname();

  const navLinks = [
    {
      href: "/dashboard", label: "Dashboard", icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00FFF0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="9" className="stroke-cyan-400" /><rect x="14" y="3" width="7" height="5" className="stroke-cyan-400" /><rect x="14" y="12" width="7" height="9" className="stroke-cyan-400" /><rect x="3" y="16" width="7" height="5" className="stroke-cyan-400" /></svg>
      )
    },
    {
      href: "/learn", label: "Learn", icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00FFF0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="16" rx="2" className="stroke-cyan-400" /><path d="M7 8h10M7 12h10M7 16h6" className="stroke-cyan-400" /></svg>
      )
    },
    {
      href: "/battle", label: "AI Battle", icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FF00B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10h-7l-2 2v7" className="stroke-pink-400" /><circle cx="7" cy="17" r="2" className="stroke-pink-400" /><path d="M17 3l4 4-4 4" className="stroke-pink-400" /></svg>
      )
    },
    {
      href: "/pvp", label: "PvP", icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C00090" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="2" className="stroke-fuchsia-400" /><path d="M8 21h8" className="stroke-fuchsia-400" /><circle cx="12" cy="12" r="3" className="stroke-fuchsia-400" /></svg>
      )
    },
    {
      href: "/leaderboard", label: "Leaderboard", icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFD600" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="5" className="stroke-yellow-400" /><path d="M8 21v-4a4 4 0 018 0v4" className="stroke-pink-400" /></svg>
      )
    },
  ];

  // Sekarang 'user' (dari props) sudah terdefinisi
  if (user?.role === "admin") {
    navLinks.push({
      href: "/admin", label: "Admin", icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C00090" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="2" className="stroke-fuchsia-400" /><path d="M8 21h8" className="stroke-fuchsia-400" /><circle cx="12" cy="12" r="3" className="stroke-fuchsia-400" /></svg>
      )
    });
  }

  // PERBAIKAN: Fungsi 'isActive' perlu parameter 'href'
  const isActive = (href) => pathname === href;

  return (
    <nav className="sticky top-0 z-50 bg-[linear-gradient(120deg,rgba(0,255,240,0.08),rgba(255,0,184,0.07))] border-b-2 border-cyan-400/20 shadow-[0_2px_16px_#00FFF033] backdrop-blur-lg">
      <div className="max-w-7xl mx-auto px-24 sm:px-20 lg:px-24">
        <div className="flex items-center justify-between h-16 relative">
          <div className="flex items-center flex-shrink-0">
            <Link href="/dashboard" className="flex items-center">
              <img src="/synth-dojo.png" alt="Users vs AI logo" width={80} height={80} className="rounded" />
            </Link>
            <div className="hidden sm:flex sm:space-x-4 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors relative
                  ${isActive(link.href)
                      ? "text-cyan-300 border-b-2 border-cyan-400"
                      : "text-gray-300 hover:text-cyan-500 text-shadow-[0_2px_8px_#00FFF099]"}
`}
                >
                  <span className="mr-2">{link.icon}</span>
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-gray-300 text-sm hidden sm:block">
              {/* Sekarang 'user' (dari props) sudah terdefinisi */}
              {user?.name || user?.email}
            </span>
            <button
              onClick={handleSignOut}
              className="px-4 py-2 text-sm font-medium text-white rounded-lg bg-[linear-gradient(to_right,#00E0C0,#C00090)] hover:shadow-[0_0_15px_#C00090] hover:scale-105 "
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
            className={`block px-3 py-2 text-base font-medium rounded-lg relative
            ${isActive(link.href)
                ? "text-cyan-300 border-b-2 border-cyan-400"
                : "text-gray-300 hover:text-cyan-200 hover:border-b-2 hover:border-cyan-400/70"}
`           }
          >
            <span className="mr-2">{link.icon}</span>
            {link.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}