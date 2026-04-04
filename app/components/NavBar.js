// NavBar.js — Sticky navigation bar shown on every page.
// Highlights the current page link so users know where they are.

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Home" },
  { href: "/demo", label: "Live Demo" },
  { href: "/usecases", label: "Use Cases" },
  { href: "/how-it-works", label: "How It Works" },
  { href: "/about", label: "About" },
];

export default function NavBar() {
  const pathname = usePathname();

  return (
    <header className="border-b border-gray-200 bg-white sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <div className="w-9 h-9 rounded-xl bg-[#5C47FA] flex items-center justify-center font-black text-base text-white">
            X
          </div>
          <div className="hidden sm:block">
            <p className="text-base font-bold text-gray-900 leading-none">UniPay XRPL</p>
            <p className="text-xs text-gray-400">Unistellar Admissions Consulting</p>
          </div>
        </Link>

        {/* Nav links */}
        <nav className="flex items-center gap-1">
          {links.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  isActive
                    ? "bg-[#5C47FA] text-white"
                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Network badge */}
        <div className="hidden sm:flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs text-gray-500 font-medium">XRP Testnet</span>
        </div>
      </div>
    </header>
  );
}
