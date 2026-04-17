"use client";

import { useEffect, useState } from "react";

interface UsageData {
  available: boolean;
  costUsd?: string;
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  periodDays?: number;
  error?: string;
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4">
      <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">{label}</div>
      <div className="text-2xl font-bold text-slate-900">{value}</div>
      {sub && <div className="text-xs text-slate-500 mt-1">{sub}</div>}
    </div>
  );
}

function ExternalLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl hover:border-slate-300 hover:bg-slate-50 transition-all group"
    >
      <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">{children}</span>
      <svg className="w-4 h-4 text-slate-400 group-hover:text-slate-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
      </svg>
    </a>
  );
}

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}

export default function SettingsPage() {
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loadingUsage, setLoadingUsage] = useState(true);

  useEffect(() => {
    fetch("/api/settings/usage")
      .then((r) => r.json())
      .then((d) => setUsage(d))
      .finally(() => setLoadingUsage(false));
  }, []);

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-sm text-slate-500 mt-1">Manage your account and Anthropic platform usage.</p>
      </div>

      {/* ── Anthropic Platform ── */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-full bg-slate-800 text-white flex items-center justify-center flex-shrink-0">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h2 className="font-semibold text-slate-900">Anthropic Platform</h2>
        </div>

        {/* Balance notice */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-3">
          <svg className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-xs text-amber-700">
            Anthropic does not expose a credit balance API. To check your remaining balance, visit the Console directly.
          </p>
        </div>

        {/* Console links */}
        <div className="space-y-2">
          <ExternalLink href="https://console.anthropic.com/settings/billing">
            View Credit Balance — Anthropic Console
          </ExternalLink>
          <ExternalLink href="https://console.anthropic.com/usage">
            View Usage Dashboard — Anthropic Console
          </ExternalLink>
        </div>
      </div>

      {/* ── Usage Stats (admin key) ── */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center flex-shrink-0">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h2 className="font-semibold text-slate-900">Claude API Usage — Last 30 Days</h2>
        </div>

        {loadingUsage ? (
          <div className="flex items-center gap-3 text-sm text-slate-400 py-4">
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Loading usage data...
          </div>
        ) : usage?.available ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <StatCard
              label="Spent"
              value={`$${usage.costUsd}`}
              sub={`Last ${usage.periodDays} days`}
            />
            <StatCard
              label="Total Tokens"
              value={formatTokens(usage.totalTokens!)}
              sub="Input + output"
            />
            <StatCard
              label="Output Tokens"
              value={formatTokens(usage.outputTokens!)}
              sub="Generated"
            />
          </div>
        ) : (
          <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-5 space-y-2">
            <p className="text-sm text-slate-600 font-medium">Live usage stats not configured</p>
            <p className="text-xs text-slate-400 leading-relaxed">
              To see real-time spending and token counts here, add{" "}
              <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-xs">ANTHROPIC_ADMIN_API_KEY</code>{" "}
              to your <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-xs">.env</code> file.
              Admin keys start with <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-xs">sk-ant-admin...</code>{" "}
              and are available in Console → Settings → Admin Keys (org accounts only).
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
