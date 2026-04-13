"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ExtractedFeatures } from "@/lib/types";

function Tag({ label, variant = "blue" }: { label: string; variant?: "blue" | "purple" | "slate" }) {
  const styles = {
    blue: "bg-blue-50 text-blue-700 border border-blue-100",
    purple: "bg-violet-50 text-violet-700 border border-violet-100",
    slate: "bg-slate-100 text-slate-600 border border-slate-200",
  };
  return (
    <span className={`inline-flex text-xs font-medium px-2.5 py-1 rounded-lg ${styles[variant]}`}>
      {label}
    </span>
  );
}

export default function ApplyPage() {
  const router = useRouter();
  const [jdText, setJdText] = useState("");
  const [jdLink, setJdLink] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [jobId, setJobId] = useState<number | null>(null);
  const [features, setFeatures] = useState<ExtractedFeatures | null>(null);
  const [error, setError] = useState("");
  const [options, setOptions] = useState({
    coverLetter: true,
    hrEmail: false,
    linkedinMessage: false,
  });

  async function handleAnalyze() {
    if (!jdText.trim()) return;
    setAnalyzing(true);
    setError("");
    setFeatures(null);
    setJobId(null);
    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jdText, jdLink }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Analysis failed");
      setJobId(data.jobId);
      setFeatures(data.features);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setAnalyzing(false);
    }
  }

  async function handleGenerate() {
    if (!jobId) return;
    setGenerating(true);
    setError("");
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId, options }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed");
      router.push(`/apply/${jobId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setGenerating(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">New Application</h1>
        <p className="text-sm text-slate-500 mt-1">
          Paste the job description and let AI do the heavy lifting.
        </p>
      </div>

      {/* ── Step 1: JD Input ── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-5">
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${features ? "bg-emerald-500 text-white" : "bg-blue-600 text-white"}`}>
            {features ? (
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            ) : "1"}
          </div>
          <h2 className="font-semibold text-slate-900">Paste Job Description</h2>
        </div>

        <div className="space-y-3">
          <textarea
            rows={10}
            placeholder="Paste the full job description here — include responsibilities, requirements, and company context for best results..."
            value={jdText}
            onChange={(e) => setJdText(e.target.value)}
            disabled={!!features}
            className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all bg-white resize-none disabled:bg-slate-50 disabled:text-slate-500"
          />

          <input
            type="url"
            placeholder="Job posting URL (optional)"
            value={jdLink}
            onChange={(e) => setJdLink(e.target.value)}
            disabled={!!features}
            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all bg-white disabled:bg-slate-50 disabled:text-slate-500"
          />

          {!features ? (
            <button
              onClick={handleAnalyze}
              disabled={analyzing || !jdText.trim()}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm shadow-sm"
            >
              {analyzing ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Analyzing JD...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Analyze JD
                </>
              )}
            </button>
          ) : (
            <button
              onClick={() => { setFeatures(null); setJobId(null); }}
              className="text-sm text-slate-500 hover:text-slate-700 font-medium flex items-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Edit JD
            </button>
          )}
        </div>
      </div>

      {/* ── Step 2: Analysis Results ── */}
      {features && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="font-semibold text-slate-900">JD Analysis</h2>
          </div>

          {/* Role + Company row */}
          <div className="grid grid-cols-2 gap-4">
            {[
              ["Role", features.role || "—"],
              ["Company", features.company || "Not specified"],
              ["Experience Required", features.yearsOfExperience],
              ["Domain", features.domainContext],
            ].map(([label, value]) => (
              <div key={label} className="bg-slate-50 rounded-xl p-3.5">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">{label}</div>
                <div className="text-sm font-medium text-slate-800">{value}</div>
              </div>
            ))}
          </div>

          {/* Required Skills */}
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5">
              Required Skills
            </div>
            <div className="flex flex-wrap gap-2">
              {features.requiredSkills.map((s) => (
                <Tag key={s} label={s} variant="blue" />
              ))}
            </div>
          </div>

          {features.preferredSkills.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5">
                Preferred Skills
              </div>
              <div className="flex flex-wrap gap-2">
                {features.preferredSkills.map((s) => (
                  <Tag key={s} label={s} variant="slate" />
                ))}
              </div>
            </div>
          )}

          {/* ATS Keywords */}
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5">
              ATS Keywords
            </div>
            <div className="flex flex-wrap gap-2">
              {features.atsKeywords.map((k) => (
                <Tag key={k} label={k} variant="purple" />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Step 3: Generate Options ── */}
      {features && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
              2
            </div>
            <h2 className="font-semibold text-slate-900">Choose Outputs to Generate</h2>
          </div>

          <div className="space-y-3 mb-6">
            {/* Always-on items */}
            {[
              ["CV", "Tailored to this specific role — dynamically assembled from your profile"],
              ["ATS Report", "Match score, keyword gaps, and actionable improvement suggestions"],
            ].map(([label, desc]) => (
              <div key={label} className="flex items-start gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <div className="w-4 h-4 rounded bg-emerald-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-800">{label}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{desc}</div>
                </div>
                <span className="ml-auto text-xs text-emerald-600 font-medium flex-shrink-0">Always on</span>
              </div>
            ))}

            {/* Optional items */}
            {(
              [
                ["coverLetter", "Cover Letter", "Personalized using your cover letter instructions"],
                ["hrEmail", "HR Outreach Email", "Concise cold email to the hiring manager"],
                ["linkedinMessage", "LinkedIn Message", "Short connection request under 300 chars"],
              ] as const
            ).map(([key, label, desc]) => (
              <label
                key={key}
                className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                  options[key]
                    ? "bg-blue-50 border-blue-200"
                    : "bg-white border-slate-200 hover:border-slate-300"
                }`}
              >
                <input
                  type="checkbox"
                  checked={options[key]}
                  onChange={(e) => setOptions((o) => ({ ...o, [key]: e.target.checked }))}
                  className="w-4 h-4 accent-blue-600 mt-0.5 flex-shrink-0"
                />
                <div>
                  <div className={`text-sm font-semibold ${options[key] ? "text-blue-900" : "text-slate-800"}`}>
                    {label}
                  </div>
                  <div className={`text-xs mt-0.5 ${options[key] ? "text-blue-600" : "text-slate-500"}`}>
                    {desc}
                  </div>
                </div>
              </label>
            ))}
          </div>

          <button
            onClick={handleGenerate}
            disabled={generating}
            className="w-full flex items-center justify-center gap-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold py-3.5 rounded-xl transition-colors shadow-sm"
          >
            {generating ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Generating your application pack...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Generate Application Pack
              </>
            )}
          </button>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
          <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}
    </div>
  );
}
