import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "EDGE OS — Trading Education + Market Intelligence",
  description: "The complete trading development platform. Learn, analyze smart money, paper trade, and build discipline before risking real capital.",
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
