"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { GenerationResult, ExtractedFeatures } from "@/lib/types";
import type {
  Table as DocxTable, Paragraph as DocxParagraph,
  TextRun as DocxTextRun, ExternalHyperlink as DocxEH,
} from "docx";

interface JobData {
  id: number;
  company: string;
  role: string;
  extractedFeatures: ExtractedFeatures;
}

type Tab = "cv" | "ats" | "coverLetter" | "hrEmail" | "linkedin";

// ─── CV helpers ───────────────────────────────────────────────────────────────

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Trim a bullet to ≤ 2 lines (~90 chars/line at Calibri 10.5pt on A4 with indent)
function trim2Lines(text: string, charsPerLine = 90): string {
  const max = charsPerLine * 2;
  if (text.length <= max) return text;
  const zone = text.slice(0, max + 15);
  const breakAt = Math.max(
    zone.lastIndexOf(", ", max),
    zone.lastIndexOf("; ", max),
    zone.lastIndexOf(" and ", max),
    zone.lastIndexOf(" with ", max),
  );
  if (breakAt > max * 0.65) return text.slice(0, breakAt).trimEnd();
  const sp = text.lastIndexOf(" ", max);
  return sp > max * 0.7 ? text.slice(0, sp) : text.slice(0, max);
}

// Cap skills to avoid overflowing the bottom section
function fitSkills(skills: { category: string; items: string[] }[], maxCats = 4, maxItems = 10) {
  return skills.slice(0, maxCats).map((s) => ({ ...s, items: s.items.slice(0, maxItems) }));
}

// ─── CV HTML builder (for PDF download) ──────────────────────────────────────

function buildCVHtml(pack: GenerationResult): string {
  const skills = fitSkills(pack.cvSkills);

  const expRows = pack.cvExperiences.map((exp) => `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:4pt;border-collapse:collapse;">
      <tr>
        <td style="font-weight:bold;font-size:10.5pt;width:38%;vertical-align:bottom;font-family:Calibri,Arial,sans-serif;">${esc(exp.role)}</td>
        <td style="font-weight:bold;font-size:10.5pt;text-align:center;width:37%;vertical-align:bottom;font-family:Calibri,Arial,sans-serif;">${esc(exp.company)}</td>
        <td style="font-weight:bold;font-size:10.5pt;text-align:right;width:25%;vertical-align:bottom;white-space:nowrap;font-family:Calibri,Arial,sans-serif;">${esc(exp.startDate)} &#8211; ${esc(exp.endDate)}</td>
      </tr>
    </table>
    <ul style="margin:2pt 0 2pt 16pt;padding:0;">
      ${exp.bullets.map((b) => `<li style="font-size:10.5pt;margin-bottom:1pt;line-height:1.25;text-align:justify;font-family:Calibri,Arial,sans-serif;">${esc(trim2Lines(b))}</li>`).join("\n")}
    </ul>
  `).join("");

  const skillRows = skills.map((s) => `
    <p style="margin:0 0 4pt 0;font-size:10.5pt;line-height:1.3;font-family:Calibri,Arial,sans-serif;">
      <strong style="font-family:Calibri,Arial,sans-serif;">${esc(s.category)}:</strong> ${esc(s.items.join(", "))}
    </p>
  `).join("");

  const LI_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="#0A66C2" style="vertical-align:middle;"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>`;
  const GH_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="#24292e" style="vertical-align:middle;"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>`;
  const WEB_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#555" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`;

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Chhedup Lama - CV</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Calibri, Arial, sans-serif; font-size: 10.5pt; line-height: 1.25; color: #000; }
  @page { size: A4; margin: 1.2cm 1.5cm; }
  @media print {
    @page { margin: 1.2cm 1.5cm; }
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    tr, li, p { page-break-inside: avoid; }
  }
</style>
</head>
<body>

<!-- Header (no border) -->
<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:4pt;border-collapse:collapse;">
  <tr>
    <td style="width:33%;vertical-align:middle;padding:4pt 0;">
      <div style="font-size:12pt;font-weight:bold;font-family:Calibri,Arial,sans-serif;">Chhedup Lama</div>
      <div style="font-size:10.5pt;font-weight:bold;font-family:Calibri,Arial,sans-serif;">Dublin, Ireland (Stamp 4)</div>
    </td>
    <td style="width:34%;text-align:center;vertical-align:middle;padding:4pt 0;">
      <a href="https://www.linkedin.com/in/chhedup-lama" style="margin:0 4pt;text-decoration:none;">${LI_SVG}</a>
      <a href="https://github.com/chheduplama" style="margin:0 4pt;text-decoration:none;">${GH_SVG}</a>
      <a href="https://chheduplama.com" style="margin:0 4pt;text-decoration:none;">${WEB_SVG}</a>
    </td>
    <td style="width:33%;text-align:right;vertical-align:middle;padding:4pt 0;">
      <div style="font-size:10.5pt;font-family:Calibri,Arial,sans-serif;">+353 899678861</div>
      <div style="font-size:10.5pt;font-family:Calibri,Arial,sans-serif;">chhedup.lama@gmail.com</div>
    </td>
  </tr>
</table>

<!-- Tagline -->
<p style="font-style:italic;text-align:center;font-size:11pt;font-family:Calibri,Arial,sans-serif;margin-bottom:3pt;">${esc(pack.cvTitle)}</p>

<!-- Experience entries -->
${expRows}

<!-- Bottom 2-col: Education | Skills -->
<table width="100%" cellpadding="0" cellspacing="0" style="margin-top:6pt;border-top:1.5pt solid #000;border-collapse:collapse;">
  <tr>
    <td style="width:36%;vertical-align:top;padding-top:5pt;padding-right:12pt;">
      <div style="font-size:13pt;font-weight:bold;font-family:Calibri,Arial,sans-serif;margin-bottom:4pt;">&#9400; EDUCATION</div>
      <div style="font-size:11pt;font-weight:bold;font-family:Calibri,Arial,sans-serif;">B. Tech, Computer Engineering</div>
      <div style="font-size:10.5pt;font-weight:bold;color:#555;font-family:Calibri,Arial,sans-serif;">Delhi College of Engineering</div>
      <div style="font-size:10.5pt;font-family:Calibri,Arial,sans-serif;margin-bottom:7pt;">2007, Delhi</div>
      <div style="font-size:11pt;font-weight:bold;font-family:Calibri,Arial,sans-serif;">MBA</div>
      <div style="font-size:10.5pt;font-weight:bold;color:#555;font-family:Calibri,Arial,sans-serif;">Indian Institute of Management</div>
      <div style="font-size:10.5pt;font-family:Calibri,Arial,sans-serif;">2013, Bangalore</div>
    </td>
    <td style="width:64%;vertical-align:top;padding-top:5pt;">
      <div style="font-size:13pt;font-weight:bold;font-family:Calibri,Arial,sans-serif;margin-bottom:4pt;">&#128736; Skills &amp;Tools</div>
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

// ─── Word (.docx) builder ─────────────────────────────────────────────────────

async function downloadCVAsDocx(pack: GenerationResult) {
  const {
    Document, Paragraph, TextRun, Table, TableRow, TableCell,
    Packer, AlignmentType, BorderStyle, WidthType, VerticalAlign,
    ExternalHyperlink,
  } = await import("docx");

  const NIL  = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" } as const;
  const NO_B = { top: NIL, bottom: NIL, left: NIL, right: NIL };

  function r(text: string, opts: { bold?: boolean; italic?: boolean; size?: number; color?: string } = {}) {
    return new TextRun({ text, font: "Calibri", bold: opts.bold, italics: opts.italic, size: opts.size ?? 21, color: opts.color });
  }
  function mkP(
    runs: (DocxTextRun | DocxEH)[],
    opts: { align?: (typeof AlignmentType)[keyof typeof AlignmentType]; before?: number; after?: number } = {}
  ) {
    return new Paragraph({ children: runs, alignment: opts.align, spacing: { before: opts.before ?? 0, after: opts.after ?? 30 } });
  }
  function link(text: string, url: string, size = 18) {
    return new ExternalHyperlink({
      link: url,
      children: [new TextRun({ text, font: "Calibri", bold: true, size, color: "0A66C2" })],
    });
  }

  const skills = fitSkills(pack.cvSkills);

  // ── Header (no border) ───────────────────────────────────────────────────
  const headerTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: { top: NIL, bottom: NIL, left: NIL, right: NIL, insideHorizontal: NIL, insideVertical: NIL },
    rows: [new TableRow({ children: [
      new TableCell({
        width: { size: 33, type: WidthType.PERCENTAGE }, borders: NO_B,
        margins: { top: 60, bottom: 60, left: 0, right: 60 },
        children: [
          mkP([r("Chhedup Lama", { bold: true, size: 24 })], { after: 20 }),
          mkP([r("Dublin, Ireland (Stamp 4)", { bold: true })], { after: 0 }),
        ],
      }),
      new TableCell({
        width: { size: 34, type: WidthType.PERCENTAGE }, borders: NO_B,
        verticalAlign: VerticalAlign.CENTER,
        children: [mkP([
          link("in", "https://www.linkedin.com/in/chhedup-lama"),
          r("  "),
          link("GH", "https://github.com/chheduplama", 18),
          r("  "),
          link("www", "https://chheduplama.com", 18),
        ], { align: AlignmentType.CENTER })],
      }),
      new TableCell({
        width: { size: 33, type: WidthType.PERCENTAGE }, borders: NO_B,
        margins: { top: 60, bottom: 60, left: 60, right: 0 },
        verticalAlign: VerticalAlign.CENTER,
        children: [
          mkP([r("+353 899678861")], { align: AlignmentType.RIGHT, after: 20 }),
          mkP([r("chhedup.lama@gmail.com")], { align: AlignmentType.RIGHT, after: 0 }),
        ],
      }),
    ]})],
  });

  // ── Tagline ──────────────────────────────────────────────────────────────
  const tagline = mkP([r(pack.cvTitle, { italic: true, size: 22 })], {
    align: AlignmentType.CENTER, before: 50, after: 50,
  });

  // ── Experience blocks ────────────────────────────────────────────────────
  const expBlocks: (DocxTable | DocxParagraph)[] = [];
  for (const exp of pack.cvExperiences) {
    expBlocks.push(new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: { top: NIL, bottom: NIL, left: NIL, right: NIL, insideHorizontal: NIL, insideVertical: NIL },
      rows: [new TableRow({ children: [
        new TableCell({
          width: { size: 38, type: WidthType.PERCENTAGE }, borders: NO_B,
          children: [mkP([r(exp.role, { bold: true })], { before: 70, after: 0 })],
        }),
        new TableCell({
          width: { size: 37, type: WidthType.PERCENTAGE }, borders: NO_B,
          children: [mkP([r(exp.company, { bold: true })], { align: AlignmentType.CENTER, before: 70, after: 0 })],
        }),
        new TableCell({
          width: { size: 25, type: WidthType.PERCENTAGE }, borders: NO_B,
          children: [mkP([r(`${exp.startDate} – ${exp.endDate}`, { bold: true })], { align: AlignmentType.RIGHT, before: 70, after: 0 })],
        }),
      ]})],
    }));
    for (const bullet of exp.bullets) {
      expBlocks.push(new Paragraph({
        children: [r(trim2Lines(bullet))],
        bullet: { level: 0 },
        alignment: AlignmentType.JUSTIFIED,
        spacing: { before: 15, after: 15 },
      }));
    }
  }

  // ── Divider + bottom 2-col (Education | Skills) ──────────────────────────
  const divider = new Paragraph({
    children: [],
    border: { top: { color: "000000", space: 4, style: BorderStyle.SINGLE, size: 8 } },
    spacing: { before: 100, after: 0 },
  });

  const eduChildren = [
    mkP([r("EDUCATION", { bold: true, size: 26 })], { before: 60, after: 60 }),
    mkP([r("B. Tech, Computer Engineering", { bold: true, size: 22 })], { after: 15 }),
    mkP([r("Delhi College of Engineering", { bold: true })], { after: 15 }),
    mkP([r("2007, Delhi")], { after: 100 }),
    mkP([r("MBA", { bold: true, size: 22 })], { after: 15 }),
    mkP([r("Indian Institute of Management", { bold: true })], { after: 15 }),
    mkP([r("2013, Bangalore")], { after: 0 }),
  ];

  const skillChildren = [
    mkP([r("Skills & Tools", { bold: true, size: 26 })], { before: 60, after: 60 }),
    ...skills.map((s) =>
      new Paragraph({
        children: [r(`${s.category}: `, { bold: true }), r(s.items.join(", "))],
        spacing: { before: 0, after: 60 },
      })
    ),
  ];

  const bottomTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: { top: NIL, bottom: NIL, left: NIL, right: NIL, insideHorizontal: NIL, insideVertical: NIL },
    rows: [new TableRow({ children: [
      new TableCell({ width: { size: 36, type: WidthType.PERCENTAGE }, borders: NO_B, children: eduChildren }),
      new TableCell({ width: { size: 64, type: WidthType.PERCENTAGE }, borders: NO_B, margins: { left: 180 }, children: skillChildren }),
    ]})],
  });

  // ── Assemble ─────────────────────────────────────────────────────────────
  const doc = new Document({
    styles: { default: { document: { run: { font: "Calibri", size: 21 } } } },
    sections: [{
      properties: { page: { margin: { top: 680, bottom: 680, left: 851, right: 851 } } },
      children: [headerTable, tagline, ...expBlocks, divider, bottomTable],
    }],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "Chhedup_Lama_CV.docx";
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ─── Buttons ──────────────────────────────────────────────────────────────────

function DownloadWordButton({ pack }: { pack: GenerationResult }) {
  const [busy, setBusy] = useState(false);
  return (
    <button
      onClick={async () => { setBusy(true); try { await downloadCVAsDocx(pack); } finally { setBusy(false); } }}
      disabled={busy}
      className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all bg-white border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
      title="Download as Word document (.docx)"
    >
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      {busy ? "Preparing…" : "Word"}
    </button>
  );
}

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
                  <DownloadWordButton pack={pack} />
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
