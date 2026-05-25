"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import ModeToggle from "@/components/ModeToggle";

// Primary nav — always visible on desktop
const PRIMARY_NAV = [
  { label: "Dashboard", href: "/dashboard", match: ["/dashboard"], icon: "🏠" },
  { label: "Academy", href: "/academy", match: ["/academy", "/module", "/final-test"] },
  { label: "Trade Engine", href: "/trade-engine", match: ["/trade-engine"], icon: "⚡" },
  { label: "War Room", href: "/market-war-room", match: ["/market-war-room"], icon: "⚔️" },
  { label: "Scanner", href: "/scanner", match: ["/scanner", "/live-edge-scanner"], icon: "📡" },
  { label: "Box Method", href: "/box-method", match: ["/box-method"], icon: "📦" },
  { label: "News Desk", href: "/news-desk", match: ["/news-desk"], icon: "📰" },
  { label: "Risk Engine", href: "/risk-engine", match: ["/risk-engine"], icon: "🛡️" },
];

// Secondary nav — in "More" dropdown on desktop, full list on mobile
const MORE_NAV = [
  { label: "Structure", href: "/market-structure", match: ["/market-structure"], icon: "🔬" },
  { label: "Edge Scanner", href: "/live-edge-scanner", match: ["/live-edge-scanner"], icon: "🎯" },
  { label: "Command Center", href: "/market-command-center", match: ["/market-command-center"], icon: "📊" },
  { label: "Playbooks", href: "/playbooks", match: ["/playbooks"], icon: "📖" },
  { label: "IPO Radar", href: "/ipo-radar", match: ["/ipo-radar"], icon: "🚀" },
  { label: "Paper Lab", href: "/paper-lab", match: ["/paper-lab"], icon: "📋" },
  { label: "API Setup", href: "/api-setup", match: ["/api-setup"], icon: "⚙️" },
];

const ALL_NAV = [...PRIMARY_NAV, ...MORE_NAV];

export default function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  const isActive = (item: { match: string[] }) =>
    item.match.some(m => pathname === m || pathname.startsWith(m + "/"));

  const moreHasActive = MORE_NAV.some(item => isActive(item));

  // Close "More" dropdown on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreOpen(false);
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  return (
    <header
      className="sticky top-0 z-50 border-b"
      style={{ background: "rgba(10,11,13,0.97)", borderColor: "#1e2433", backdropFilter: "blur(12px)" }}
    >
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 flex-shrink-0"
          onClick={() => { setMobileOpen(false); setMoreOpen(false); }}
        >
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

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-0.5">
          {PRIMARY_NAV.map(item => {
            const active = isActive(item);
            return (
              <Link
                key={item.href}
                href={item.href}
                className="text-xs px-2.5 py-1.5 rounded-lg transition-all duration-150 font-medium"
                style={{
                  color: active ? "#00d4ff" : "#9aa0b4",
                  background: active ? "rgba(0,212,255,0.08)" : "transparent",
                  border: active ? "1px solid rgba(0,212,255,0.15)" : "1px solid transparent",
                }}
              >
                {item.icon ? `${item.icon} ` : ""}{item.label}
              </Link>
            );
          })}

          {/* More dropdown */}
          <div className="relative" ref={moreRef}>
            <button
              onClick={() => setMoreOpen(v => !v)}
              className="text-xs px-2.5 py-1.5 rounded-lg transition-all duration-150 font-medium flex items-center gap-1"
              style={{
                color: moreHasActive ? "#00d4ff" : "#9aa0b4",
                background: moreHasActive ? "rgba(0,212,255,0.08)" : moreOpen ? "rgba(255,255,255,0.04)" : "transparent",
                border: moreHasActive ? "1px solid rgba(0,212,255,0.15)" : "1px solid transparent",
              }}
            >
              More
              <span style={{ fontSize: "9px", opacity: 0.7 }}>{moreOpen ? "▲" : "▼"}</span>
            </button>

            {moreOpen && (
              <div
                className="absolute right-0 top-full mt-1 rounded-xl py-1 z-50 min-w-48"
                style={{ background: "#0f1117", border: "1px solid #1e2433", boxShadow: "0 8px 24px rgba(0,0,0,0.5)" }}
              >
                {MORE_NAV.map(item => {
                  const active = isActive(item);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMoreOpen(false)}
                      className="flex items-center gap-2 text-xs px-4 py-2.5 font-medium transition-all"
                      style={{
                        color: active ? "#00d4ff" : "#9aa0b4",
                        background: active ? "rgba(0,212,255,0.06)" : "transparent",
                      }}
                    >
                      <span>{item.icon}</span>
                      {item.label}
                      {active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-current opacity-80" />}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          <div className="ml-1">
            <ModeToggle />
          </div>
        </nav>

        {/* Mobile hamburger */}
        <div className="md:hidden flex items-center gap-2">
          <ModeToggle />
          <button
            className="flex flex-col items-center justify-center w-8 h-8 gap-1"
            onClick={() => setMobileOpen(v => !v)}
            aria-label="Toggle menu"
            style={{ color: "#9aa0b4" }}
          >
            {mobileOpen ? (
              <span className="text-lg leading-none" style={{ color: "#00d4ff" }}>✕</span>
            ) : (
              <>
                <span className="block w-5 h-0.5 rounded" style={{ background: "#9aa0b4" }} />
                <span className="block w-5 h-0.5 rounded" style={{ background: "#9aa0b4" }} />
                <span className="block w-5 h-0.5 rounded" style={{ background: "#9aa0b4" }} />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div
          className="md:hidden border-t"
          style={{ background: "rgba(10,11,13,0.98)", borderColor: "#1e2433" }}
        >
          <nav className="max-w-7xl mx-auto px-4 py-3 flex flex-col gap-1">
            {ALL_NAV.map(item => {
              const active = isActive(item);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className="text-sm px-4 py-3 rounded-xl font-medium transition-all flex items-center gap-2"
                  style={{
                    color: active ? "#00d4ff" : "#9aa0b4",
                    background: active ? "rgba(0,212,255,0.08)" : "transparent",
                    border: active ? "1px solid rgba(0,212,255,0.15)" : "1px solid transparent",
                  }}
                >
                  {item.icon && <span>{item.icon}</span>}
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </header>
  );
}
