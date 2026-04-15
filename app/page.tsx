"use client";

import { useEffect, useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type EmploymentType = "full-time" | "contract";
type Currency = "GBP" | "USD" | "EUR" | "AUD" | "CAD";

interface TrackerItem {
  id: number;
  company: string;
  jobTitle: string;
  location: string;
  employmentType: EmploymentType;
  salaryMin: number | null;
  salaryMax: number | null;
  currency: Currency;
  totalRounds: number;
  currentStage: string; // "screening" | "round_1" | "round_2" | ... | "offer" | "rejected"
  iconUrl: string;
  notes: string;
  createdAt: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CURRENCIES: Currency[] = ["GBP", "USD", "EUR", "AUD", "CAD"];
const CURRENCY_SYMBOL: Record<Currency, string> = { GBP: "£", USD: "$", EUR: "€", AUD: "A$", CAD: "C$" };

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Build the ordered stage keys for a given totalRounds */
function buildStages(totalRounds: number): { key: string; label: string }[] {
  const stages: { key: string; label: string }[] = [
    { key: "screening", label: "Screening" },
  ];
  for (let i = 1; i <= totalRounds; i++) {
    stages.push({ key: `round_${i}`, label: `Round ${i}` });
  }
  stages.push({ key: "offer", label: "Offer" });
  return stages;
}

function companyDomain(name: string) {
  return name.toLowerCase().replace(/\s+/g, "").replace(/[^a-z0-9]/g, "") + ".com";
}

function formatSalary(min: number | null, max: number | null, currency: Currency) {
  if (!min && !max) return null;
  const sym = CURRENCY_SYMBOL[currency];
  const fmt = (n: number) => n >= 1000 ? `${sym}${(n / 1000).toFixed(0)}k` : `${sym}${n}`;
  if (min && max) return `${fmt(min)} – ${fmt(max)}`;
  if (min) return `${fmt(min)}+`;
  return `up to ${fmt(max!)}`;
}

function stageColor(key: string) {
  if (key === "screening") return { dot: "bg-blue-500", text: "text-blue-700", bg: "bg-blue-50 border-blue-200" };
  if (key === "offer")     return { dot: "bg-emerald-500", text: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" };
  if (key === "rejected")  return { dot: "bg-red-400", text: "text-red-600", bg: "bg-red-50 border-red-200" };
  // round_N
  return { dot: "bg-violet-500", text: "text-violet-700", bg: "bg-violet-50 border-violet-200" };
}

function stageLabel(key: string, totalRounds: number) {
  return buildStages(totalRounds).find((s) => s.key === key)?.label ?? key;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Extract a bare hostname from any URL or domain string the user pastes */
function extractDomain(raw: string): string {
  const s = raw.trim();
  try {
    const url = new URL(s.startsWith("http") ? s : `https://${s}`);
    return url.hostname.replace(/^www\./, "");
  } catch {
    return s.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0];
  }
}

/** Resolve the best logo src from a user-supplied URL or domain */
function resolveLogoSrc(iconUrl: string | undefined, company: string): string {
  const raw = iconUrl?.trim();
  if (raw) {
    const domain = extractDomain(raw);
    return `https://logo.clearbit.com/${domain}`;
  }
  return `https://logo.clearbit.com/${companyDomain(company)}`;
}

function CompanyLogo({ company, iconUrl }: { company: string; iconUrl?: string }) {
  const initial = company.charAt(0).toUpperCase();
  const palettes = [
    "from-blue-500 to-blue-600",
    "from-violet-500 to-violet-600",
    "from-emerald-500 to-emerald-600",
    "from-amber-500 to-amber-600",
    "from-rose-500 to-rose-600",
    "from-indigo-500 to-indigo-600",
    "from-teal-500 to-teal-600",
    "from-cyan-500 to-cyan-600",
  ];
  const gradient = palettes[company.charCodeAt(0) % palettes.length];

  const domain = iconUrl?.trim()
    ? extractDomain(iconUrl)
    : companyDomain(company);

  const sources = [
    `https://logo.clearbit.com/${domain}`,
    `https://www.google.com/s2/favicons?domain=${domain}&sz=128`,
  ];

  const [idx, setIdx] = useState(0);

  useEffect(() => { setIdx(0); }, [domain]);

  if (idx >= sources.length) {
    return (
      <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center flex-shrink-0 shadow-sm`}>
        <span className="text-white font-bold text-lg">{initial}</span>
      </div>
    );
  }
  return (
    <div className="w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center flex-shrink-0 shadow-sm overflow-hidden">
      <img
        key={sources[idx]}
        src={sources[idx]}
        alt={company}
        className="w-9 h-9 object-contain"
        onError={() => setIdx((i) => i + 1)}
      />
    </div>
  );
}

function StatusPipeline({
  item,
  onChange,
}: {
  item: TrackerItem;
  onChange: (stage: string) => void;
}) {
  const { currentStage, totalRounds } = item;

  if (currentStage === "rejected") {
    return (
      <div className="flex items-center gap-2 mt-4">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-red-50 text-red-600 border border-red-200">
          <span className="w-1.5 h-1.5 rounded-full bg-red-400 inline-block" />
          Rejected
        </span>
        <button
          onClick={() => onChange("screening")}
          className="text-xs text-slate-400 hover:text-slate-600 underline underline-offset-2 transition-colors"
        >
          Reopen
        </button>
      </div>
    );
  }

  const stages = buildStages(totalRounds);
  const currentIdx = stages.findIndex((s) => s.key === currentStage);

  return (
    <div className="mt-4">
      <div className="flex items-center">
        {stages.map((stage, i) => {
          const isPast = i < currentIdx;
          const isActive = i === currentIdx;
          const isFuture = i > currentIdx;
          return (
            <div key={stage.key} className="flex items-center flex-1 last:flex-none">
              <button
                onClick={() => onChange(stage.key)}
                title={`Move to ${stage.label}`}
                className={`group flex flex-col items-center gap-1 transition-all ${isFuture ? "opacity-35 hover:opacity-70" : ""}`}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all
                  ${isActive ? "border-blue-600 bg-blue-600 scale-110 shadow-md shadow-blue-200" : ""}
                  ${isPast  ? "border-emerald-500 bg-emerald-500" : ""}
                  ${isFuture ? "border-slate-200 bg-white group-hover:border-slate-400" : ""}
                `}>
                  {isPast && (
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                  {isActive && <span className="w-2 h-2 rounded-full bg-white block" />}
                </div>
                <span className={`text-[10px] font-medium whitespace-nowrap leading-none
                  ${isActive ? "text-blue-700 font-semibold" : ""}
                  ${isPast  ? "text-emerald-600" : ""}
                  ${isFuture ? "text-slate-400" : ""}
                `}>
                  {stage.label}
                </span>
              </button>
              {i < stages.length - 1 && (
                <div className={`h-0.5 flex-1 mx-1 rounded-full transition-all ${i < currentIdx ? "bg-emerald-400" : "bg-slate-150"}`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Summary bar ──────────────────────────────────────────────────────────────

function SummaryBar({ items }: { items: TrackerItem[] }) {
  const [open, setOpen] = useState(false);

  const active  = items.filter(i => i.currentStage !== "offer" && i.currentStage !== "rejected").length;
  const inRound = items.filter(i => i.currentStage.startsWith("round_")).length;
  const offers  = items.filter(i => i.currentStage === "offer").length;

  const stats = [
    { label: "Active",    value: active,       color: "text-blue-600" },
    { label: "In Rounds", value: inRound,      color: "text-violet-600" },
    { label: "Offers",    value: offers,       color: "text-emerald-600" },
    { label: "Total",     value: items.length, color: "text-slate-600" },
  ];

  return (
    <div>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-slate-600 transition-colors mb-2"
      >
        <svg
          className={`w-3.5 h-3.5 transition-transform duration-200 ${open ? "rotate-90" : ""}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
        Stats
      </button>
      {open && (
        <div className="grid grid-cols-4 gap-3">
          {stats.map((s) => (
            <div key={s.label} className="bg-white border border-slate-200 rounded-2xl px-4 py-3.5 shadow-sm text-center">
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-slate-500 font-medium mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Tracker Card ─────────────────────────────────────────────────────────────

function TrackerCard({
  item,
  onStageChange,
  onDelete,
  onEdit,
}: {
  item: TrackerItem;
  onStageChange: (id: number, stage: string) => void;
  onDelete: (id: number) => void;
  onEdit: (item: TrackerItem) => void;
}) {
  const { dot, text, bg } = stageColor(item.currentStage);
  const salary = formatSalary(item.salaryMin, item.salaryMax, item.currency);
  const label  = stageLabel(item.currentStage, item.totalRounds);

  return (
    <div className="group bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-lg hover:border-slate-300 transition-all duration-200">
      {/* Top row */}
      <div className="flex items-start gap-3">
        <CompanyLogo company={item.company} iconUrl={item.iconUrl} />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="font-bold text-slate-900 text-sm leading-tight truncate">{item.jobTitle}</h3>
              <p className="text-sm text-slate-500 font-medium mt-0.5 truncate">{item.company}</p>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <button
                onClick={() => onEdit(item)}
                className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-500 flex items-center justify-center transition-all text-slate-400"
                title="Edit"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button
                onClick={() => onDelete(item.id)}
                className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded-lg bg-slate-100 hover:bg-red-50 hover:text-red-500 flex items-center justify-center transition-all text-slate-400"
                title="Delete"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>

          {/* Meta chips */}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {item.location && (
              <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
                <svg className="w-3 h-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {item.location}
              </span>
            )}
            <span className={`inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
              item.employmentType === "contract"
                ? "bg-purple-50 text-purple-700 border-purple-200"
                : "bg-sky-50 text-sky-700 border-sky-200"
            }`}>
              {item.employmentType === "full-time" ? "Full-time" : "Contract"}
            </span>
            {salary && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {salary}
              </span>
            )}
            <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {item.totalRounds} round{item.totalRounds !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </div>

      {/* Pipeline */}
      <StatusPipeline item={item} onChange={(stage) => onStageChange(item.id, stage)} />

      {/* Reject button */}
      {item.currentStage !== "rejected" && item.currentStage !== "offer" && (
        <div className="mt-3 flex justify-end">
          <button
            onClick={() => onStageChange(item.id, "rejected")}
            className="text-[11px] text-slate-300 hover:text-red-400 transition-colors"
          >
            Mark as rejected
          </button>
        </div>
      )}

      {/* Notes */}
      {item.notes && (
        <p className="mt-3 text-xs text-slate-500 bg-slate-50 rounded-xl px-3 py-2 leading-relaxed border border-slate-100">
          {item.notes}
        </p>
      )}
    </div>
  );
}

// ─── Add Form Modal ───────────────────────────────────────────────────────────

interface FormState {
  company: string;
  jobTitle: string;
  location: string;
  employmentType: EmploymentType;
  salaryMin: string;
  salaryMax: string;
  currency: Currency;
  totalRounds: number;
  iconUrl: string;
  notes: string;
}

const EMPTY_FORM: FormState = {
  company: "",
  jobTitle: "",
  location: "",
  employmentType: "full-time",
  salaryMin: "",
  salaryMax: "",
  currency: "GBP",
  totalRounds: 3,
  iconUrl: "",
  notes: "",
};

function AddModal({ onClose, onSave }: { onClose: () => void; onSave: (item: TrackerItem) => void }) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = <K extends keyof FormState>(key: K, val: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: val }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/tracker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          salaryMin: form.salaryMin ? parseInt(form.salaryMin) : null,
          salaryMax: form.salaryMax ? parseInt(form.salaryMax) : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed to save"); return; }
      onSave(data);
    } catch {
      setError("Failed to save");
    } finally {
      setSaving(false);
    }
  }

  const previewStages = buildStages(form.totalRounds);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
          <div>
            <h2 className="text-base font-bold text-slate-900">Track a new role</h2>
            <p className="text-xs text-slate-400 mt-0.5">Add a role you&apos;ve had a screening call for</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
          >
            <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* Company + Job Title */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Company *</label>
              <input
                value={form.company}
                onChange={(e) => set("company", e.target.value)}
                placeholder="e.g. Google"
                required
                className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-slate-300"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Job Title *</label>
              <input
                value={form.jobTitle}
                onChange={(e) => set("jobTitle", e.target.value)}
                placeholder="e.g. Senior Engineer"
                required
                className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-slate-300"
              />
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Location</label>
            <div className="relative">
              <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <input
                value={form.location}
                onChange={(e) => set("location", e.target.value)}
                placeholder="e.g. London, UK or Remote"
                className="w-full border border-slate-200 rounded-xl pl-9 pr-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-slate-300"
              />
            </div>
          </div>

          {/* Icon URL */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              Company Website <span className="font-normal text-slate-400">(optional — paste the company&apos;s URL, e.g. cityswift.com)</span>
            </label>
            <div className="flex gap-2 items-center">
              <div className="relative flex-1">
                <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <input
                  value={form.iconUrl}
                  onChange={(e) => set("iconUrl", e.target.value)}
                  placeholder="https://example.com/logo.png"
                  className="w-full border border-slate-200 rounded-xl pl-9 pr-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-slate-300"
                />
              </div>
              {form.iconUrl && (
                <div className="w-10 h-10 rounded-xl border border-slate-200 bg-white overflow-hidden flex items-center justify-center flex-shrink-0 shadow-sm">
                  <img src={resolveLogoSrc(form.iconUrl, form.company)} alt="preview" className="w-8 h-8 object-contain" onError={(e) => (e.currentTarget.style.display = "none")} />
                </div>
              )}
            </div>
          </div>

          {/* Employment Type */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Employment Type</label>
            <div className="flex gap-2">
              {(["full-time", "contract"] as EmploymentType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => set("employmentType", t)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                    form.employmentType === t
                      ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                      : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                  }`}
                >
                  {t === "full-time" ? "Full-time" : "Contract"}
                </button>
              ))}
            </div>
          </div>

          {/* Salary Range */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Expected Salary Range</label>
            <div className="flex gap-2 items-center">
              <select
                value={form.currency}
                onChange={(e) => set("currency", e.target.value as Currency)}
                className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-slate-700 font-medium"
              >
                {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <input
                type="number"
                value={form.salaryMin}
                onChange={(e) => set("salaryMin", e.target.value)}
                placeholder="Min"
                min={0}
                className="flex-1 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-slate-300"
              />
              <span className="text-slate-300 font-light">–</span>
              <input
                type="number"
                value={form.salaryMax}
                onChange={(e) => set("salaryMax", e.target.value)}
                placeholder="Max"
                min={0}
                className="flex-1 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-slate-300"
              />
            </div>
          </div>

          {/* Interview Rounds */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              Number of Interview Rounds
              <span className="font-normal text-slate-400 ml-1">— how many rounds does this process have?</span>
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => set("totalRounds", n)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-bold border transition-all ${
                    form.totalRounds === n
                      ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                      : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
            {/* Live pipeline preview */}
            <div className="mt-3 bg-slate-50 rounded-xl px-4 py-3 border border-slate-100">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Pipeline preview</p>
              <div className="flex items-center gap-1">
                {previewStages.map((s, i) => (
                  <div key={s.key} className="flex items-center gap-1 flex-1 last:flex-none">
                    <div className="flex flex-col items-center gap-0.5">
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        i === 0 ? "border-blue-600 bg-blue-600" : "border-slate-200 bg-white"
                      }`}>
                        {i === 0 && <span className="w-1.5 h-1.5 rounded-full bg-white block" />}
                      </div>
                      <span className="text-[9px] text-slate-500 whitespace-nowrap">{s.label}</span>
                    </div>
                    {i < previewStages.length - 1 && (
                      <div className="h-0.5 flex-1 bg-slate-200 rounded-full mb-3" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              Notes <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              placeholder="Recruiter name, next interview date, anything relevant..."
              rows={3}
              className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-slate-300 resize-none"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3.5 py-2.5">{error}</p>
          )}

          <div className="flex gap-2 pt-1 pb-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl text-sm font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-3 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-sm disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Saving...
                </>
              ) : "Track Role"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Edit Modal ───────────────────────────────────────────────────────────────

function EditModal({
  item,
  onClose,
  onSave,
}: {
  item: TrackerItem;
  onClose: () => void;
  onSave: (updated: TrackerItem) => void;
}) {
  const [form, setForm] = useState<FormState>({
    company: item.company,
    jobTitle: item.jobTitle,
    location: item.location,
    employmentType: item.employmentType,
    salaryMin: item.salaryMin != null ? String(item.salaryMin) : "",
    salaryMax: item.salaryMax != null ? String(item.salaryMax) : "",
    currency: item.currency,
    totalRounds: item.totalRounds,
    iconUrl: item.iconUrl ?? "",
    notes: item.notes,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = <K extends keyof FormState>(key: K, val: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: val }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/tracker/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company: form.company.trim(),
          jobTitle: form.jobTitle.trim(),
          location: form.location.trim(),
          employmentType: form.employmentType,
          salaryMin: form.salaryMin ? parseInt(form.salaryMin) : null,
          salaryMax: form.salaryMax ? parseInt(form.salaryMax) : null,
          currency: form.currency,
          totalRounds: form.totalRounds,
          iconUrl: form.iconUrl.trim(),
          notes: form.notes.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed to save"); return; }
      onSave(data);
    } catch {
      setError("Failed to save");
    } finally {
      setSaving(false);
    }
  }

  const previewStages = buildStages(form.totalRounds);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
          <div className="flex items-center gap-3">
            <CompanyLogo company={form.company || item.company} iconUrl={form.iconUrl} />
            <div>
              <h2 className="text-base font-bold text-slate-900">Edit role</h2>
              <p className="text-xs text-slate-400 mt-0.5">{item.company} · {item.jobTitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
          >
            <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* Company + Job Title */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Company *</label>
              <input
                value={form.company}
                onChange={(e) => set("company", e.target.value)}
                required
                className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Job Title *</label>
              <input
                value={form.jobTitle}
                onChange={(e) => set("jobTitle", e.target.value)}
                required
                className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Location</label>
            <div className="relative">
              <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <input
                value={form.location}
                onChange={(e) => set("location", e.target.value)}
                placeholder="e.g. London, UK or Remote"
                className="w-full border border-slate-200 rounded-xl pl-9 pr-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-slate-300"
              />
            </div>
          </div>

          {/* Icon URL */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              Icon / Logo URL <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <div className="flex gap-2 items-center">
              <div className="relative flex-1">
                <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <input
                  value={form.iconUrl}
                  onChange={(e) => set("iconUrl", e.target.value)}
                  placeholder="https://example.com/logo.png"
                  className="w-full border border-slate-200 rounded-xl pl-9 pr-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-slate-300"
                />
              </div>
              {form.iconUrl && (
                <div className="w-10 h-10 rounded-xl border border-slate-200 bg-white overflow-hidden flex items-center justify-center flex-shrink-0 shadow-sm">
                  <img src={resolveLogoSrc(form.iconUrl, form.company)} alt="preview" className="w-8 h-8 object-contain" onError={(e) => (e.currentTarget.style.display = "none")} />
                </div>
              )}
            </div>
          </div>

          {/* Employment Type */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Employment Type</label>
            <div className="flex gap-2">
              {(["full-time", "contract"] as EmploymentType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => set("employmentType", t)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                    form.employmentType === t
                      ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                      : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                  }`}
                >
                  {t === "full-time" ? "Full-time" : "Contract"}
                </button>
              ))}
            </div>
          </div>

          {/* Salary Range */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Expected Salary Range</label>
            <div className="flex gap-2 items-center">
              <select
                value={form.currency}
                onChange={(e) => set("currency", e.target.value as Currency)}
                className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-slate-700 font-medium"
              >
                {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <input
                type="number"
                value={form.salaryMin}
                onChange={(e) => set("salaryMin", e.target.value)}
                placeholder="Min"
                min={0}
                className="flex-1 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-slate-300"
              />
              <span className="text-slate-300 font-light">–</span>
              <input
                type="number"
                value={form.salaryMax}
                onChange={(e) => set("salaryMax", e.target.value)}
                placeholder="Max"
                min={0}
                className="flex-1 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-slate-300"
              />
            </div>
          </div>

          {/* Interview Rounds */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Number of Interview Rounds</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => set("totalRounds", n)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-bold border transition-all ${
                    form.totalRounds === n
                      ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                      : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
            <div className="mt-3 bg-slate-50 rounded-xl px-4 py-3 border border-slate-100">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Pipeline preview</p>
              <div className="flex items-center gap-1">
                {previewStages.map((s, i) => (
                  <div key={s.key} className="flex items-center gap-1 flex-1 last:flex-none">
                    <div className="flex flex-col items-center gap-0.5">
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        i === 0 ? "border-blue-600 bg-blue-600" : "border-slate-200 bg-white"
                      }`}>
                        {i === 0 && <span className="w-1.5 h-1.5 rounded-full bg-white block" />}
                      </div>
                      <span className="text-[9px] text-slate-500 whitespace-nowrap">{s.label}</span>
                    </div>
                    {i < previewStages.length - 1 && (
                      <div className="h-0.5 flex-1 bg-slate-200 rounded-full mb-3" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              Notes <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              placeholder="Recruiter name, next interview date, anything relevant..."
              rows={3}
              className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-slate-300 resize-none"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3.5 py-2.5">{error}</p>
          )}

          <div className="flex gap-2 pt-1 pb-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl text-sm font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-3 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-sm disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Saving...
                </>
              ) : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type FilterKey = "all" | "screening" | "interviewing" | "offer" | "rejected";

export default function Home() {
  const [items, setItems] = useState<TrackerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<TrackerItem | null>(null);
  const [filter, setFilter] = useState<FilterKey>("all");

  useEffect(() => {
    fetch("/api/tracker")
      .then((r) => r.json())
      .then((data) => { setItems(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  async function handleStageChange(id: number, stage: string) {
    setItems((prev) => prev.map((i) => i.id === id ? { ...i, currentStage: stage } : i));
    await fetch(`/api/tracker/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentStage: stage }),
    });
  }

  async function handleDelete(id: number) {
    if (!confirm("Remove this role from your tracker?")) return;
    setItems((prev) => prev.filter((i) => i.id !== id));
    await fetch(`/api/tracker/${id}`, { method: "DELETE" });
  }

  const filterFns: Record<FilterKey, (i: TrackerItem) => boolean> = {
    all:         () => true,
    screening:   (i) => i.currentStage === "screening",
    interviewing:(i) => i.currentStage.startsWith("round_"),
    offer:       (i) => i.currentStage === "offer",
    rejected:    (i) => i.currentStage === "rejected",
  };

  const filtered = items.filter(filterFns[filter]);

  const filterTabs: { key: FilterKey; label: string; count: number }[] = [
    { key: "all",          label: "All",          count: items.length },
    { key: "screening",    label: "Screening",    count: items.filter(filterFns.screening).length },
    { key: "interviewing", label: "Interviewing", count: items.filter(filterFns.interviewing).length },
    { key: "offer",        label: "Offers",       count: items.filter(filterFns.offer).length },
    { key: "rejected",     label: "Rejected",     count: items.filter(filterFns.rejected).length },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <span className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </span>
            Interview Pipeline
          </h1>
          <p className="text-sm text-slate-500 mt-1">Track every role from screening to offer.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Track New Role
        </button>
      </div>

      {/* Stats */}
      {items.length > 0 && <SummaryBar items={items} />}

      {/* Filter tabs */}
      {items.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {filterTabs.map(({ key, label, count }) => {
            if (key !== "all" && count === 0) return null;
            return (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`flex-shrink-0 text-xs font-semibold px-3.5 py-1.5 rounded-full border transition-all ${
                  filter === key
                    ? "bg-slate-900 text-white border-slate-900"
                    : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
                }`}
              >
                {label} ({count})
              </button>
            );
          })}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="flex items-center gap-3 text-slate-400">
            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span className="text-sm">Loading pipeline...</span>
          </div>
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-16 text-center">
          <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <svg className="w-7 h-7 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <div className="text-slate-800 font-bold text-lg mb-2">No roles in your pipeline</div>
          <div className="text-sm text-slate-400 mb-7 max-w-xs mx-auto">
            Add a role once you&apos;ve had your screening call and track it through every round.
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-5 py-3 rounded-xl transition-colors shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Track your first role
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-slate-400 text-sm">No roles match this filter.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((item) => (
            <TrackerCard
              key={item.id}
              item={item}
              onStageChange={handleStageChange}
              onDelete={handleDelete}
              onEdit={setEditItem}
            />
          ))}
        </div>
      )}

      {showModal && (
        <AddModal
          onClose={() => setShowModal(false)}
          onSave={(item) => { setItems((prev) => [item, ...prev]); setShowModal(false); }}
        />
      )}

      {editItem && (
        <EditModal
          item={editItem}
          onClose={() => setEditItem(null)}
          onSave={(updated) => {
            setItems((prev) => prev.map((i) => i.id === updated.id ? updated : i));
            setEditItem(null);
          }}
        />
      )}
    </div>
  );
}
