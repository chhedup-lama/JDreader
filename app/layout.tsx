import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";

export const metadata: Metadata = {
  title: "ApplyAI – Job Application Copilot",
  description: "Personal AI-powered job application assistant",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 min-h-screen">
        {/* Nav */}
        <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M3 4h10M3 8h7M3 12h5" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
                </svg>
              </div>
              <span className="font-semibold text-slate-900 text-lg tracking-tight">
                Apply<span className="text-blue-600">AI</span>
              </span>
            </Link>

            {/* Nav links */}
            <nav className="flex items-center gap-1">
              <Link
                href="/"
                className="text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 px-3 py-2 rounded-lg transition-all"
              >
                Pipeline
              </Link>
              <Link
                href="/history"
                className="text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 px-3 py-2 rounded-lg transition-all"
              >
                History
              </Link>
              <Link
                href="/profile"
                className="text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 px-3 py-2 rounded-lg transition-all"
              >
                My Profile
              </Link>
              <Link
                href="/apply"
                className="ml-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors shadow-sm"
              >
                + New
              </Link>
            </nav>
          </div>
        </header>

        <main className="max-w-6xl mx-auto px-6 py-10">{children}</main>
      </body>
    </html>
  );
}
