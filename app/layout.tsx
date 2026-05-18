import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "EDGE OS Trading School",
  description: "Learn to trade before you risk a dollar. Beginner-first trading education.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <body className="min-h-full" style={{ background: "#0a0b0d", color: "#e8eaf0" }}>
        {children}
      </body>
    </html>
  );
}
