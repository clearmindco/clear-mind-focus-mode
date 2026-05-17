"use client";

import Link from "next/link";

export default function Navbar() {
  return (
    <header
      className="sticky top-0 z-50 border-b"
      style={{ background: "rgba(10,11,13,0.95)", borderColor: "#1e2433", backdropFilter: "blur(12px)" }}
    >
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div
            className="w-7 h-7 rounded flex items-center justify-center text-xs font-bold"
            style={{ background: "rgba(0,212,255,0.15)", color: "#00d4ff", border: "1px solid rgba(0,212,255,0.3)" }}
          >
            E
          </div>
          <span className="font-bold text-sm tracking-wide" style={{ color: "#e8eaf0" }}>
            EDGE<span style={{ color: "#00d4ff" }}>OS</span>
          </span>
          <span className="text-xs hidden sm:inline" style={{ color: "#5a6075" }}>Trading School</span>
        </Link>

        <nav className="flex items-center gap-1">
          <Link
            href="/"
            className="text-xs px-3 py-1.5 rounded-lg transition-colors"
            style={{ color: "#9aa0b4" }}
          >
            Dashboard
          </Link>
          <Link
            href="/paper-lab"
            className="text-xs px-3 py-1.5 rounded-lg transition-colors"
            style={{ color: "#9aa0b4" }}
          >
            Paper Lab
          </Link>
          <Link
            href="/final-test"
            className="text-xs px-3 py-1.5 rounded-lg transition-colors"
            style={{ color: "#9aa0b4" }}
          >
            Final Test
          </Link>
        </nav>
      </div>
    </header>
  );
}
