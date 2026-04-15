import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Chhedup's Applications",
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
            <Link href="/" className="flex items-center gap-2.5">
              <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Background rounded square */}
                <rect width="36" height="36" rx="9" fill="#2563EB"/>
                {/* Briefcase body */}
                <rect x="7" y="15" width="22" height="14" rx="2.5" fill="white" fillOpacity="0.15" stroke="white" strokeWidth="1.6"/>
                {/* Briefcase handle */}
                <path d="M13 15v-2.5a2.5 2.5 0 0 1 2.5-2.5h5A2.5 2.5 0 0 1 23 12.5V15" stroke="white" strokeWidth="1.6" strokeLinecap="round"/>
                {/* Center divider line */}
                <line x1="7" y1="21" x2="29" y2="21" stroke="white" strokeWidth="1.4" strokeOpacity="0.5"/>
                {/* Clasp */}
                <rect x="15.5" y="19.5" width="5" height="3" rx="1.5" fill="white"/>
              </svg>
              <span className="font-semibold text-slate-900 text-lg tracking-tight">
                Chhedup's <span className="text-blue-600">Applications</span>
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
