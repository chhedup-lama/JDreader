"use client";

import { useEffect, useState } from "react";
import {
  MasterProfileData,
  WorkExperienceData,
  SkillData,
  LeadershipStoryData,
} from "@/lib/types";

const emptyExp = (): WorkExperienceData => ({
  company: "",
  role: "",
  startDate: "",
  endDate: "Present",
  bullets: [""],
  tags: [],
});

const emptySkill = (): SkillData => ({ category: "", items: [] });

const emptyStory = (): LeadershipStoryData => ({
  title: "",
  situation: "",
  action: "",
  result: "",
  tags: [],
});

function SectionHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between mb-5">
      <div>
        <h2 className="text-base font-semibold text-slate-900">{title}</h2>
        {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

function AddButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
      </svg>
      {label}
    </button>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white border border-slate-200 rounded-2xl p-6 shadow-sm ${className}`}>
      {children}
    </div>
  );
}

function Input({
  placeholder,
  value,
  onChange,
  disabled,
  className = "",
}: {
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <input
      type="text"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className={`w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all bg-white disabled:bg-slate-50 disabled:text-slate-400 ${className}`}
    />
  );
}

function Textarea({
  placeholder,
  value,
  onChange,
  rows = 3,
}: {
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
}) {
  return (
    <textarea
      rows={rows}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all bg-white resize-none"
    />
  );
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<MasterProfileData>({
    shortTitle: "",
    coverLetterInstructions: "",
    workExperiences: [],
    skills: [],
    leadershipStories: [],
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((data) => { setProfile(data); setLoading(false); });
  }, []);

  async function handleSave() {
    setSaving(true);
    await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profile),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  function updateExp(i: number, field: keyof WorkExperienceData, value: unknown) {
    setProfile((p) => {
      const exps = [...p.workExperiences];
      exps[i] = { ...exps[i], [field]: value };
      return { ...p, workExperiences: exps };
    });
  }

  function updateBullet(expIdx: number, bIdx: number, value: string) {
    setProfile((p) => {
      const exps = [...p.workExperiences];
      const bullets = [...exps[expIdx].bullets];
      bullets[bIdx] = value;
      exps[expIdx] = { ...exps[expIdx], bullets };
      return { ...p, workExperiences: exps };
    });
  }

  function addBullet(expIdx: number) {
    setProfile((p) => {
      const exps = [...p.workExperiences];
      exps[expIdx] = { ...exps[expIdx], bullets: [...exps[expIdx].bullets, ""] };
      return { ...p, workExperiences: exps };
    });
  }

  function removeBullet(expIdx: number, bIdx: number) {
    setProfile((p) => {
      const exps = [...p.workExperiences];
      const bullets = exps[expIdx].bullets.filter((_, i) => i !== bIdx);
      exps[expIdx] = { ...exps[expIdx], bullets };
      return { ...p, workExperiences: exps };
    });
  }

  function updateSkill(i: number, field: keyof SkillData, value: unknown) {
    setProfile((p) => {
      const skills = [...p.skills];
      skills[i] = { ...skills[i], [field]: value };
      return { ...p, skills };
    });
  }

  function updateStory(i: number, field: keyof LeadershipStoryData, value: unknown) {
    setProfile((p) => {
      const stories = [...p.leadershipStories];
      stories[i] = { ...stories[i], [field]: value };
      return { ...p, leadershipStories: stories };
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3 text-slate-400">
          <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="text-sm">Loading profile...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Profile</h1>
          <p className="text-sm text-slate-500 mt-1">
            Fill this in once — every application pulls from it automatically.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className={`flex items-center gap-2 font-semibold px-5 py-2.5 rounded-xl transition-all text-sm shadow-sm ${
            saved
              ? "bg-emerald-500 text-white"
              : "bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-60"
          }`}
        >
          {saved ? (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Saved
            </>
          ) : saving ? (
            "Saving..."
          ) : (
            "Save Profile"
          )}
        </button>
      </div>

      {/* ── Professional Headline ── */}
      <Card>
        <SectionHeader
          title="Professional Headline"
          subtitle="A short, punchy title that captures your identity. Used at the top of every CV."
        />
        <Input
          placeholder="e.g. Senior Product Leader · B2B SaaS · 0→1 & Scale"
          value={profile.shortTitle}
          onChange={(v) => setProfile((p) => ({ ...p, shortTitle: v }))}
        />
      </Card>

      {/* ── Work Experiences ── */}
      <Card>
        <SectionHeader
          title="Work Experiences"
          subtitle="Add each role as modular blocks. AI selects and reorders them per JD."
          action={
            <AddButton
              label="Add Experience"
              onClick={() =>
                setProfile((p) => ({
                  ...p,
                  workExperiences: [...p.workExperiences, emptyExp()],
                }))
              }
            />
          }
        />

        {profile.workExperiences.length === 0 && (
          <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-xl">
            <div className="text-slate-400 text-sm">No experiences yet — add your first role above.</div>
          </div>
        )}

        <div className="space-y-4">
          {profile.workExperiences.map((exp, i) => (
            <div
              key={i}
              className="border border-slate-200 rounded-xl p-5 space-y-4 bg-slate-50/50"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Experience {i + 1}
                </span>
                <button
                  onClick={() =>
                    setProfile((p) => ({
                      ...p,
                      workExperiences: p.workExperiences.filter((_, idx) => idx !== i),
                    }))
                  }
                  className="text-xs text-slate-400 hover:text-red-500 transition-colors font-medium"
                >
                  Remove
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  placeholder="Company"
                  value={exp.company}
                  onChange={(v) => updateExp(i, "company", v)}
                />
                <Input
                  placeholder="Job Title"
                  value={exp.role}
                  onChange={(v) => updateExp(i, "role", v)}
                />
                <Input
                  placeholder="Start (e.g. Jan 2020)"
                  value={exp.startDate}
                  onChange={(v) => updateExp(i, "startDate", v)}
                />
                <Input
                  placeholder="End (e.g. Dec 2023 or Present)"
                  value={exp.endDate}
                  onChange={(v) => updateExp(i, "endDate", v)}
                />
              </div>

              {/* Bullets */}
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Achievement Bullets
                  </label>
                  <button
                    onClick={() => addBullet(i)}
                    className="text-xs font-medium text-blue-600 hover:text-blue-700"
                  >
                    + Add bullet
                  </button>
                </div>
                <div className="space-y-2">
                  {exp.bullets.map((bullet, bIdx) => (
                    <div key={bIdx} className="flex gap-2 items-start">
                      <div className="mt-3 w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
                      <textarea
                        rows={2}
                        placeholder="e.g. Led 0→1 launch of X, driving 23% increase in user retention across 50K accounts"
                        value={bullet}
                        onChange={(e) => updateBullet(i, bIdx, e.target.value)}
                        className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all bg-white resize-none"
                      />
                      {exp.bullets.length > 1 && (
                        <button
                          onClick={() => removeBullet(i, bIdx)}
                          className="mt-2.5 text-slate-300 hover:text-red-400 transition-colors flex-shrink-0"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">
                  Tags
                </label>
                <Input
                  placeholder="Comma-separated: B2B, SaaS, Growth, Analytics, Platform"
                  value={exp.tags.join(", ")}
                  onChange={(v) =>
                    updateExp(i, "tags", v.split(",").map((t) => t.trim()).filter(Boolean))
                  }
                />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* ── Skills ── */}
      <Card>
        <SectionHeader
          title="Skills"
          subtitle="Grouped by category. AI filters and reorders these per role."
          action={
            <AddButton
              label="Add Category"
              onClick={() =>
                setProfile((p) => ({ ...p, skills: [...p.skills, emptySkill()] }))
              }
            />
          }
        />

        {profile.skills.length === 0 && (
          <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-xl">
            <div className="text-slate-400 text-sm">No skill categories yet.</div>
          </div>
        )}

        <div className="space-y-3">
          {profile.skills.map((skill, i) => (
            <div
              key={i}
              className="border border-slate-200 rounded-xl p-4 space-y-3 bg-slate-50/50"
            >
              <div className="flex gap-3 items-center">
                <Input
                  placeholder="Category (e.g. Technical, Leadership, Domain Expertise)"
                  value={skill.category}
                  onChange={(v) => updateSkill(i, "category", v)}
                  className="flex-1"
                />
                <button
                  onClick={() =>
                    setProfile((p) => ({ ...p, skills: p.skills.filter((_, idx) => idx !== i) }))
                  }
                  className="text-xs text-slate-400 hover:text-red-500 transition-colors font-medium flex-shrink-0"
                >
                  Remove
                </button>
              </div>
              <Input
                placeholder="Skills, comma-separated (e.g. Product Strategy, Roadmapping, SQL, Figma)"
                value={skill.items.join(", ")}
                onChange={(v) =>
                  updateSkill(i, "items", v.split(",").map((t) => t.trim()).filter(Boolean))
                }
              />
            </div>
          ))}
        </div>
      </Card>

      {/* ── Leadership Stories ── */}
      <Card>
        <SectionHeader
          title="Leadership Stories"
          subtitle="STAR-format stories used to inform cover letters and HR outreach."
          action={
            <AddButton
              label="Add Story"
              onClick={() =>
                setProfile((p) => ({
                  ...p,
                  leadershipStories: [...p.leadershipStories, emptyStory()],
                }))
              }
            />
          }
        />

        {profile.leadershipStories.length === 0 && (
          <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-xl">
            <div className="text-slate-400 text-sm">No stories yet.</div>
          </div>
        )}

        <div className="space-y-4">
          {profile.leadershipStories.map((story, i) => (
            <div
              key={i}
              className="border border-slate-200 rounded-xl p-5 space-y-3 bg-slate-50/50"
            >
              <div className="flex items-center justify-between">
                <Input
                  placeholder="Story title (e.g. Led cross-functional reorg of 40-person team)"
                  value={story.title}
                  onChange={(v) => updateStory(i, "title", v)}
                  className="flex-1 mr-3 font-medium"
                />
                <button
                  onClick={() =>
                    setProfile((p) => ({
                      ...p,
                      leadershipStories: p.leadershipStories.filter((_, idx) => idx !== i),
                    }))
                  }
                  className="text-xs text-slate-400 hover:text-red-500 transition-colors font-medium flex-shrink-0"
                >
                  Remove
                </button>
              </div>

              {(
                [
                  ["situation", "Situation", "What was the context or challenge?"],
                  ["action", "Action", "What did you specifically do?"],
                  ["result", "Result", "What was the measurable outcome?"],
                ] as const
              ).map(([field, label, hint]) => (
                <div key={field}>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
                    {label}
                  </label>
                  <Textarea
                    placeholder={hint}
                    value={story[field]}
                    onChange={(v) => updateStory(i, field, v)}
                  />
                </div>
              ))}

              <Input
                placeholder="Tags: comma-separated (e.g. Leadership, Strategy, Cross-functional)"
                value={story.tags.join(", ")}
                onChange={(v) =>
                  updateStory(i, "tags", v.split(",").map((t) => t.trim()).filter(Boolean))
                }
              />
            </div>
          ))}
        </div>
      </Card>

      {/* ── Cover Letter Instructions ── */}
      <Card>
        <SectionHeader
          title="Cover Letter Instructions"
          subtitle="Tell AI how you want your cover letters to sound. Applied to every generation."
        />
        <Textarea
          rows={5}
          placeholder="e.g. Keep to 3 focused paragraphs. Lead with the most relevant achievement. Use a confident but human tone — avoid corporate jargon. Always tie back to business impact. Never mention salary. End with a specific ask."
          value={profile.coverLetterInstructions}
          onChange={(v) => setProfile((p) => ({ ...p, coverLetterInstructions: v }))}
        />
      </Card>

      {/* Save footer */}
      <div className="flex justify-end pt-2 pb-10">
        <button
          onClick={handleSave}
          disabled={saving}
          className={`flex items-center gap-2 font-semibold px-6 py-3 rounded-xl transition-all text-sm shadow-sm ${
            saved
              ? "bg-emerald-500 text-white"
              : "bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-60"
          }`}
        >
          {saved ? (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Profile Saved
            </>
          ) : saving ? (
            "Saving..."
          ) : (
            "Save Profile"
          )}
        </button>
      </div>
    </div>
  );
}
