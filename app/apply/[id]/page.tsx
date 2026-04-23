"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { GenerationResult, ExtractedFeatures } from "@/lib/types";

interface JobData {
  id: number;
  company: string;
  role: string;
  extractedFeatures: ExtractedFeatures;
}

type Tab = "cv" | "ats" | "coverLetter" | "hrEmail" | "linkedin";

// ─── CV HTML builder (for print/PDF download) ────────────────────────────────

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function buildCVHtml(pack: GenerationResult): string {
  const expRows = pack.cvExperiences.map((exp) => `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:5pt;border-collapse:collapse;">
      <tr>
        <td style="font-weight:bold;font-size:10.5pt;width:38%;vertical-align:bottom;font-family:Calibri,Arial,sans-serif;">${esc(exp.role)}</td>
        <td style="font-weight:bold;font-size:10.5pt;text-align:center;width:37%;vertical-align:bottom;font-family:Calibri,Arial,sans-serif;">${esc(exp.company)}</td>
        <td style="font-weight:bold;font-size:10.5pt;text-align:right;width:25%;vertical-align:bottom;white-space:nowrap;font-family:Calibri,Arial,sans-serif;">${esc(exp.startDate)} &#8211; ${esc(exp.endDate)}</td>
      </tr>
    </table>
    <ul style="margin:2pt 0 3pt 16pt;padding:0;">
      ${exp.bullets.map((b) => `<li style="font-size:10.5pt;margin-bottom:1.5pt;line-height:1.3;font-family:Calibri,Arial,sans-serif;">${esc(b)}</li>`).join("\n")}
    </ul>
  `).join("");

  const skillRows = pack.cvSkills.map((s) => `
    <p style="margin:0 0 5pt 0;font-size:10.5pt;line-height:1.35;font-family:Calibri,Arial,sans-serif;">
      <strong style="font-family:Calibri,Arial,sans-serif;">${esc(s.category)}:</strong> ${esc(s.items.join(", "))}
    </p>
  `).join("");

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Chhedup Lama - CV</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Calibri, Arial, sans-serif; font-size: 10.5pt; line-height: 1.3; color: #000; }
  @page { size: A4; margin: 1.2cm 1.5cm; }
  @media print {
    @page { margin: 1.2cm 1.5cm; }
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    tr, li { page-break-inside: avoid; }
  }
</style>
</head>
<body>

<!-- Header -->
<table width="100%" cellpadding="0" cellspacing="0"
  style="border:1.5pt solid #000;margin-bottom:5pt;border-collapse:collapse;">
  <tr>
    <td style="width:33%;vertical-align:middle;padding:5pt 8pt;">
      <div style="font-size:12pt;font-weight:bold;font-family:Calibri,Arial,sans-serif;">Chhedup Lama</div>
      <div style="font-size:10.5pt;font-weight:bold;font-family:Calibri,Arial,sans-serif;">Dublin, Ireland (Stamp 4)</div>
    </td>
    <td style="width:34%;text-align:center;vertical-align:middle;padding:5pt 8pt;">
      <a href="https://www.linkedin.com/in/chhedup-lama"
        style="display:inline-block;width:20pt;height:20pt;background:#0A66C2;border-radius:3pt;
               color:white;text-align:center;line-height:20pt;font-weight:bold;
               font-size:9pt;margin:0 2pt;text-decoration:none;font-family:Arial,sans-serif;">in</a>
    </td>
    <td style="width:33%;text-align:right;vertical-align:middle;padding:5pt 8pt;">
      <div style="font-size:10.5pt;font-family:Calibri,Arial,sans-serif;">+353 899678861</div>
      <div style="font-size:10.5pt;font-family:Calibri,Arial,sans-serif;">chhedup.lama@gmail.com</div>
    </td>
  </tr>
</table>

<!-- Tagline -->
<p style="font-style:italic;text-align:center;font-size:11pt;font-family:Calibri,Arial,sans-serif;margin-bottom:4pt;">${esc(pack.cvTitle)}</p>

<!-- Experience entries -->
${expRows}

<!-- Bottom 2-col: Education | Skills -->
<table width="100%" cellpadding="0" cellspacing="0"
  style="margin-top:8pt;border-top:1.5pt solid #000;border-collapse:collapse;">
  <tr>
    <td style="width:36%;vertical-align:top;padding-top:6pt;padding-right:14pt;">
      <div style="font-size:13pt;font-weight:bold;font-family:Calibri,Arial,sans-serif;margin-bottom:5pt;">&#9400; EDUCATION</div>
      <div style="font-size:11pt;font-weight:bold;font-family:Calibri,Arial,sans-serif;">B. Tech, Computer Engineering</div>
      <div style="font-size:10.5pt;font-weight:bold;color:#555;font-family:Calibri,Arial,sans-serif;">Delhi College of Engineering</div>
      <div style="font-size:10.5pt;font-family:Calibri,Arial,sans-serif;margin-bottom:8pt;">2007, Delhi</div>
      <div style="font-size:11pt;font-weight:bold;font-family:Calibri,Arial,sans-serif;">MBA</div>
      <div style="font-size:10.5pt;font-weight:bold;color:#555;font-family:Calibri,Arial,sans-serif;">Indian Institute of Management</div>
      <div style="font-size:10.5pt;font-family:Calibri,Arial,sans-serif;">2013, Bangalore</div>
    </td>
    <td style="width:64%;vertical-align:top;padding-top:6pt;">
      <div style="font-size:13pt;font-weight:bold;font-family:Calibri,Arial,sans-serif;margin-bottom:5pt;">&#128736; Skills &amp;Tools</div>
      ${skillRows}
    </td>
  </tr>
</table>

</body>
</html>`;
}

function downloadCVAsPDF(pack: GenerationResult) {
  const html = buildCVHtml(pack);
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const iframe = document.createElement("iframe");
  iframe.style.cssText = "position:fixed;width:0;height:0;opacity:0;pointer-events:none;";
  iframe.src = url;
  document.body.appendChild(iframe);
  iframe.onload = () => {
    iframe.contentWindow?.print();
    setTimeout(() => {
      document.body.removeChild(iframe);
      URL.revokeObjectURL(url);
    }, 2000);
  };
}

// ─── Buttons ──────────────────────────────────────────────────────────────────

function DownloadCVButton({ pack }: { pack: GenerationResult }) {
  return (
    <button
      onClick={() => downloadCVAsPDF(pack)}
      className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all bg-white border-slate-200 text-slate-600 hover:border-blue-300 hover:text-blue-600"
      title="Opens print dialog — choose Save as PDF"
    >
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
      </svg>
      Download CV
    </button>
  );
}

function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }
  return (
    <button
      onClick={copy}
      className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all ${
        copied
          ? "bg-emerald-50 border-emerald-200 text-emerald-600"
          : "bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-900"
      }`}
    >
      {copied ? (
        <>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          Copied!
        </>
      ) : (
        <>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          {label}
        </>
      )}
    </button>
  );
}

function ATSScoreRing({ score }: { score: number }) {
  const color = score >= 75 ? "#10B981" : score >= 50 ? "#F59E0B" : "#EF4444";
  const bg = score >= 75 ? "#D1FAE5" : score >= 50 ? "#FEF3C7" : "#FEE2E2";
  const label = score >= 75 ? "Strong match" : score >= 50 ? "Moderate match" : "Weak match";

  return (
    <div className="flex items-center gap-4">
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ background: bg }}
      >
        <span className="text-xl font-bold" style={{ color }}>{score}</span>
      </div>
      <div>
        <div className="font-semibold text-slate-900" style={{ color }}>{label}</div>
        <div className="text-sm text-slate-500 mt-0.5">ATS match score out of 100</div>
      </div>
    </div>
  );
}

function ATSReport({ score, report }: { score: number; report: GenerationResult["atsReport"] }) {
  const matched = report?.matchedKeywords ?? [];
  const missing = report?.missingKeywords ?? [];
  const weak = report?.weakSections ?? [];
  const suggestions = report?.suggestions ?? [];

  return (
    <div className="space-y-4">
      <ATSScoreRing score={score} />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
          <div className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-3">
            Matched Keywords ({matched.length})
          </div>
          <div className="flex flex-wrap gap-1.5">
            {matched.map((k) => (
              <span key={k} className="bg-white text-emerald-700 text-xs font-medium px-2.5 py-1 rounded-lg border border-emerald-200">
                {k}
              </span>
            ))}
          </div>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="text-xs font-semibold text-red-600 uppercase tracking-wider mb-3">
            Missing Keywords ({missing.length})
          </div>
          <div className="flex flex-wrap gap-1.5">
            {missing.map((k) => (
              <span key={k} className="bg-white text-red-700 text-xs font-medium px-2.5 py-1 rounded-lg border border-red-200">
                {k}
              </span>
            ))}
          </div>
        </div>
      </div>

      {weak.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="text-xs font-semibold text-amber-600 uppercase tracking-wider mb-3">Weak Sections</div>
          <ul className="space-y-2">
            {weak.map((s) => (
              <li key={s} className="text-sm text-amber-800 flex gap-2 items-start">
                <span className="mt-0.5">⚠</span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {suggestions.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-3">Suggestions</div>
          <ul className="space-y-2">
            {suggestions.map((s) => (
              <li key={s} className="text-sm text-blue-800 flex gap-2 items-start">
                <span className="text-blue-400 mt-0.5 font-bold">→</span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default function ResultsPage() {
  const { id } = useParams<{ id: string }>();
  const [job, setJob] = useState<JobData | null>(null);
  const [pack, setPack] = useState<GenerationResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("ats");
  const [error, setError] = useState("");

  // ATS retest state
  const [retestCv, setRetestCv] = useState("");
  const [retestScore, setRetestScore] = useState<number | null>(null);
  const [retestReport, setRetestReport] = useState<GenerationResult["atsReport"] | null>(null);
  const [retesting, setRetesting] = useState(false);
  const [retestError, setRetestError] = useState("");

  async function handleRetest() {
    if (!retestCv.trim()) return;
    setRetesting(true);
    setRetestError("");
    setRetestScore(null);
    setRetestReport(null);
    try {
      const res = await fetch(`/api/apply/${id}/retest-ats`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cvText: retestCv }),
      });
      const data = await res.json();
      if (data.error) setRetestError(data.error);
      else { setRetestScore(data.atsScore); setRetestReport(data.atsReport); }
    } catch {
      setRetestError("Something went wrong. Please try again.");
    } finally {
      setRetesting(false);
    }
  }

  useEffect(() => {
    fetch(`/api/apply/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else { setJob(data.job); setPack(data.pack); }
        setLoading(false);
      });
  }, [id]);

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3 text-slate-400">
          <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="text-sm">Loading results...</span>
        </div>
      </div>
    );

  if (error)
    return <div className="text-red-500 text-center mt-20 text-sm">{error}</div>;

  if (!pack)
    return (
      <div className="text-slate-400 text-center mt-20 text-sm">
        No results yet for this application.
      </div>
    );

  const availableTabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    {
      key: "ats", label: "ATS Report",
      icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>,
    },
    {
      key: "cv", label: "CV",
      icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>,
    },
    ...(pack.coverLetter ? [{
      key: "coverLetter" as Tab, label: "Cover Letter",
      icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>,
    }] : []),
    ...(pack.hrEmail ? [{
      key: "hrEmail" as Tab, label: "HR Email",
      icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"/></svg>,
    }] : []),
    ...(pack.linkedinMessage ? [{
      key: "linkedin" as Tab, label: "LinkedIn",
      icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/></svg>,
    }] : []),
  ];

  const cvText = [
    pack.cvTitle, "",
    ...pack.cvExperiences.flatMap((exp) => [
      `${exp.role} | ${exp.company} | ${exp.startDate} – ${exp.endDate}`,
      ...exp.bullets.map((b) => `• ${b}`), "",
    ]),
    "SKILLS",
    ...pack.cvSkills.map((s) => `${s.category}: ${s.items.join(", ")}`),
  ].join("\n");

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-2 font-medium">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Application Pack
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            {job?.role || "Role"}
            {job?.company && (
              <span className="text-slate-400 font-normal"> · {job.company}</span>
            )}
          </h1>
        </div>
        <div className="flex-shrink-0 sm:ml-4 flex flex-col items-end gap-2">
          <ATSScoreRing score={pack.afterAtsScore > 0 ? pack.afterAtsScore : pack.atsScore} />
          {pack.afterAtsScore > 0 && pack.afterAtsScore !== pack.atsScore && (
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
              pack.afterAtsScore > pack.atsScore
                ? "text-emerald-600 bg-emerald-50 border-emerald-200"
                : "text-red-500 bg-red-50 border-red-200"
            }`}>
              {pack.afterAtsScore > pack.atsScore ? "+" : ""}{pack.afterAtsScore - pack.atsScore} pts after tailoring
            </span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {/* Tab bar */}
        <div className="border-b border-slate-200 px-2 pt-2 flex gap-1 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {availableTabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-all whitespace-nowrap border-b-2 -mb-px ${
                activeTab === t.key
                  ? "border-blue-600 text-blue-600 bg-blue-50/50"
                  : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50"
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="p-6">

          {/* ── CV ── */}
          {activeTab === "cv" && (
            <div className="space-y-6">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">{pack.cvTitle}</h2>
                  <p className="text-xs text-slate-400 mt-1">Tailored headline for this role</p>
                </div>
                <div className="flex items-center gap-2">
                  <CopyButton text={cvText} label="Copy All" />
                  <DownloadCVButton pack={pack} />
                </div>
              </div>

              <div className="space-y-5">
                {pack.cvExperiences.map((exp, i) => (
                  <div key={i} className="border-l-2 border-blue-200 pl-4">
                    <div className="font-semibold text-slate-900">{exp.role}</div>
                    <div className="text-sm text-slate-500 mb-2.5">
                      {exp.company} · {exp.startDate} – {exp.endDate}
                    </div>
                    <ul className="space-y-1.5">
                      {exp.bullets.map((bullet, bi) => (
                        <li key={bi} className="text-sm text-slate-700 flex gap-2 leading-relaxed">
                          <span className="text-blue-400 font-bold mt-0.5 flex-shrink-0">•</span>
                          <span>{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Skills</div>
                <div className="space-y-1.5">
                  {pack.cvSkills.map((s, i) => (
                    <div key={i} className="text-sm">
                      <span className="font-medium text-slate-700">{s.category}: </span>
                      <span className="text-slate-600">{s.items.join(", ")}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── ATS Report ── */}
          {activeTab === "ats" && (
            <div className="space-y-6">

              {pack.afterAtsScore > 0 ? (
                <>
                  {/* Before / After comparison */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                      <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Before Generation</div>
                      <ATSScoreRing score={pack.atsScore} />
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">After Generation</span>
                        {pack.afterAtsScore !== pack.atsScore && (
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
                            pack.afterAtsScore > pack.atsScore
                              ? "text-emerald-600 bg-emerald-50 border-emerald-200"
                              : "text-red-500 bg-red-50 border-red-200"
                          }`}>
                            {pack.afterAtsScore > pack.atsScore ? "+" : ""}{pack.afterAtsScore - pack.atsScore} pts
                          </span>
                        )}
                      </div>
                      <ATSScoreRing score={pack.afterAtsScore} />
                    </div>
                  </div>

                  {/* Full after-generation report */}
                  <div className="space-y-5">
                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">After Generation — Full Report</h3>
                    <ATSReport score={pack.afterAtsScore} report={pack.afterAtsReport} />
                  </div>
                </>
              ) : (
                /* Old packs — just show the original report */
                <div className="space-y-5">
                  <ATSReport score={pack.atsScore} report={pack.atsReport} />
                </div>
              )}

              {/* Divider */}
              <div className="border-t border-slate-200" />

              {/* Retest section */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Re-test with reworked CV</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Paste your updated CV below to see how your new score compares.</p>
                </div>
                <textarea
                  value={retestCv}
                  onChange={(e) => setRetestCv(e.target.value)}
                  placeholder="Paste your reworked CV here..."
                  rows={8}
                  className="w-full text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 resize-y focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-slate-300"
                />
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleRetest}
                    disabled={retesting || !retestCv.trim()}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    {retesting ? (
                      <>
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Analysing...
                      </>
                    ) : "Run ATS Test"}
                  </button>
                  {retestError && <p className="text-xs text-red-500">{retestError}</p>}
                </div>

                {retestScore !== null && retestReport && (
                  <div className="space-y-5 pt-2">
                    <div className="flex items-center gap-3">
                      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">New Score</h3>
                      {(() => {
                        const base = pack.afterAtsScore ?? pack.atsScore;
                        return retestScore > base ? (
                          <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                            +{retestScore - base} pts
                          </span>
                        ) : retestScore < base ? (
                          <span className="text-xs font-semibold text-red-500 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                            {retestScore - base} pts
                          </span>
                        ) : (
                          <span className="text-xs font-semibold text-slate-400 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
                            No change
                          </span>
                        );
                      })()}
                    </div>
                    <ATSReport score={retestScore} report={retestReport} />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Cover Letter ── */}
          {activeTab === "coverLetter" && pack.coverLetter && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-slate-900">Cover Letter</h2>
                <CopyButton text={pack.coverLetter} />
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                {pack.coverLetter}
              </div>
            </div>
          )}

          {/* ── HR Email ── */}
          {activeTab === "hrEmail" && pack.hrEmail && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-slate-900">HR Outreach Email</h2>
                <CopyButton text={pack.hrEmail} />
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                {pack.hrEmail}
              </div>
            </div>
          )}

          {/* ── LinkedIn ── */}
          {activeTab === "linkedin" && pack.linkedinMessage && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-slate-900">LinkedIn Message</h2>
                <CopyButton text={pack.linkedinMessage} />
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                {pack.linkedinMessage}
              </div>
              <div className="flex justify-end">
                <span className={`text-xs font-medium ${pack.linkedinMessage.length > 280 ? "text-red-500" : "text-slate-400"}`}>
                  {pack.linkedinMessage.length} / 300 characters
                </span>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
