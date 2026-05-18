"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { label: "Academy", href: "/academy", match: ["/academy", "/module", "/final-test"] },
  { label: "Terminal", href: "/terminal", match: ["/terminal"] },
  { label: "Research Lab", href: "/research", match: ["/research"] },
  { label: "Whale Tracker", href: "/whale-tracker", match: ["/whale-tracker"] },
  { label: "Paper Lab", href: "/paper-lab", match: ["/paper-lab"] },
  { label: "API Setup", href: "/api-setup", match: ["/api-setup"], icon: "⚙️" },
];

export default function Navbar() {
  const pathname = usePathname();

  const isActive = (item: (typeof NAV)[0]) =>
    item.match.some(m => pathname === m || pathname.startsWith(m + "/"));

  return (
    <header
      className="sticky top-0 z-50 border-b"
      style={{ background: "rgba(10,11,13,0.97)", borderColor: "#1e2433", backdropFilter: "blur(12px)" }}
    >
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 flex-shrink-0">
          <div
            className="w-7 h-7 rounded flex items-center justify-center text-xs font-bold"
            style={{ background: "rgba(0,212,255,0.15)", color: "#00d4ff", border: "1px solid rgba(0,212,255,0.3)" }}
          >
            E
          </div>
          <span className="font-bold text-sm tracking-wide" style={{ color: "#e8eaf0" }}>
            EDGE<span style={{ color: "#00d4ff" }}>OS</span>
          </span>
        </Link>

        <nav className="flex items-center gap-0.5">
          {NAV.map(item => {
            const active = isActive(item);
            return (
              <Link
                key={item.href}
                href={item.href}
                className="text-xs px-3 py-1.5 rounded-lg transition-all duration-150 font-medium"
                style={{
                  color: active ? "#00d4ff" : "#9aa0b4",
                  background: active ? "rgba(0,212,255,0.08)" : "transparent",
                  border: active ? "1px solid rgba(0,212,255,0.15)" : "1px solid transparent",
                }}
              >
                {"icon" in item && item.icon ? `${item.icon} ` : ""}{item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
