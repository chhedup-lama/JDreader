import Anthropic from "@anthropic-ai/sdk";
import {
  ExtractedFeatures,
  MasterProfileData,
  GenerationResult,
  GenerationOptions,
} from "./types";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Strip markdown code fences if Claude wraps the JSON in ```json ... ```
function extractJSON(raw: string): string {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) return fenced[1].trim();
  return raw.trim();
}

// Replace em dashes and other LLM typography tells with plain alternatives
function cleanText(text: string): string {
  return text
    .replace(/\u2014/g, ",")   // em dash → comma
    .replace(/\u2013/g, "-")   // en dash → hyphen
    .replace(/\u2018|\u2019/g, "'")  // smart single quotes → straight
    .replace(/\u201C|\u201D/g, '"'); // smart double quotes → straight
}

// Recursively clean all string values in a parsed JSON object
function cleanResult(obj: unknown): unknown {
  if (typeof obj === "string") return cleanText(obj);
  if (Array.isArray(obj)) return obj.map(cleanResult);
  if (obj && typeof obj === "object") {
    return Object.fromEntries(
      Object.entries(obj as Record<string, unknown>).map(([k, v]) => [k, cleanResult(v)])
    );
  }
  return obj;
}

// ─── Call 1: Parse and extract structured info from JD ───────────────────────
export async function analyzeJD(jdText: string): Promise<ExtractedFeatures> {
  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1500,
    messages: [
      {
        role: "user",
        content: `Analyze this job description and extract structured information. Return ONLY valid JSON — no markdown fences, no explanation, no extra text.

Required schema:
{
  "company": "company name, or empty string if not found",
  "role": "job title",
  "requiredSkills": ["required skills/qualifications"],
  "preferredSkills": ["preferred/nice-to-have skills"],
  "yearsOfExperience": "e.g. '5+ years' or 'not specified'",
  "domainContext": "industry/domain e.g. 'B2B SaaS', 'fintech'",
  "atsKeywords": ["important ATS keywords"],
  "responsibilities": ["key responsibilities"]
}

Job Description:
${jdText}`,
      },
    ],
  });

  const raw = message.content[0].type === "text" ? message.content[0].text : "";
  try {
    return JSON.parse(extractJSON(raw)) as ExtractedFeatures;
  } catch {
    throw new Error(`JD analysis returned invalid JSON. Raw response: ${raw.slice(0, 300)}`);
  }
}

// ─── Call 2a: ATS analysis — profile vs JD ───────────────────────────────────
async function analyzeATS(
  profile: MasterProfileData,
  features: ExtractedFeatures,
  jdText: string
): Promise<{ atsScore: number; atsReport: GenerationResult["atsReport"] }> {
  const profileSummary = `MASTER PROFILE:
Short Title: ${profile.shortTitle}

Work Experiences:
${profile.workExperiences
  .map(
    (exp) =>
      `- ${exp.role} at ${exp.company} (${exp.startDate} – ${exp.endDate})
  Achievements:
${exp.bullets.map((b) => `    • ${b}`).join("\n")}`
  )
  .join("\n\n")}

Skills:
${profile.skills.map((s) => `- ${s.category}: ${s.items.join(", ")}`).join("\n")}`;

  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: `You are an ATS expert. Analyse how well the candidate's raw profile matches the job description.

${profileSummary}

JOB DESCRIPTION:
${jdText}

EXTRACTED JD FEATURES:
Role: ${features.role}
Required Skills: ${features.requiredSkills.join(", ")}
ATS Keywords: ${features.atsKeywords.join(", ")}
Domain: ${features.domainContext}

Return ONLY a raw JSON object — no markdown, no explanation:
{
  "atsScore": <integer 0-100>,
  "atsReport": {
    "matchedKeywords": ["keywords from the JD already present in the profile"],
    "missingKeywords": ["important JD keywords absent from the profile"],
    "weakSections": ["areas where the profile is thin relative to JD requirements"],
    "suggestions": ["specific, actionable improvements to close the gap — reference exact missing keywords or weak areas"]
  }
}`,
      },
    ],
  });

  const raw = message.content[0].type === "text" ? message.content[0].text : "";
  try {
    const parsed = JSON.parse(extractJSON(raw));
    return cleanResult(parsed) as { atsScore: number; atsReport: GenerationResult["atsReport"] };
  } catch {
    throw new Error(`ATS analysis returned invalid JSON. Raw response: ${raw.slice(0, 300)}`);
  }
}

// ─── Call 2b: Generate CV + cover docs using ATS insights ─────────────────────
async function generateDocuments(
  profile: MasterProfileData,
  features: ExtractedFeatures,
  jdText: string,
  options: GenerationOptions,
  atsReport: GenerationResult["atsReport"]
): Promise<Omit<GenerationResult, "atsScore" | "atsReport">> {
  const systemPrompt = `You are an expert CV writer and career coach. Generate tailored job application materials that read as if written by the candidate themselves.

CONTENT RULES:
1. NEVER invent, fabricate, or hallucinate experience, metrics, achievements, or skills.
2. ONLY use information explicitly provided in the Master Profile.
3. You may reframe and rewrite existing content to highlight relevance — but never add facts that don't exist.
4. Every CV bullet must be traceable to an actual bullet in the Master Profile.
5. Incorporate JD keywords NATURALLY into existing content — never stuff artificially.
6. Return ONLY a raw JSON object. No markdown fences. No explanation. No text before or after the JSON.

WRITING STYLE — THIS IS CRITICAL:
- Write like a real human professional, not like an AI assistant.
- Use plain, direct language. Short sentences where possible.
- NEVER use em dashes (—). Use commas, full stops, or restructure the sentence instead.
- NEVER use: "leverage", "utilize", "spearhead", "foster", "robust", "seamlessly", "cutting-edge", "innovative", "passionate", "excited to", "delve", "Moreover", "Furthermore", "Additionally", "In conclusion", "It is worth noting", "I am thrilled", "dynamic", "synergy", "holistic", "proactive", "thought leader".
- Do not start cover letter sentences with "I" more than twice in a row.
- Cover letters should feel like they were written by the candidate in 20 focused minutes — confident, specific, human. Not polished to the point of feeling fake.
- CV bullets should be punchy and metric-led where the profile supports it. Action verb first, result second.
- HR emails should be direct and brief — two short paragraphs max. No fluff.
- LinkedIn messages should sound like a real person reaching out, not a template.`;

  const profileText = `MASTER PROFILE:
Short Title: ${profile.shortTitle}

Work Experiences:
${profile.workExperiences
  .map(
    (exp) =>
      `- ${exp.role} at ${exp.company} (${exp.startDate} – ${exp.endDate})
  Tags: ${exp.tags.join(", ")}
  Achievements:
${exp.bullets.map((b) => `    • ${b}`).join("\n")}`
  )
  .join("\n\n")}

Skills:
${profile.skills.map((s) => `- ${s.category}: ${s.items.join(", ")}`).join("\n")}

Leadership Stories:
${profile.leadershipStories
  .map(
    (l) =>
      `- ${l.title}
  Situation: ${l.situation}
  Action: ${l.action}
  Result: ${l.result}`
  )
  .join("\n\n")}

Cover Letter Instructions:
${profile.coverLetterInstructions || "Write a professional, concise cover letter in 3 paragraphs."}`;

  const atsContext = `ATS ANALYSIS (apply these insights to improve the CV and cover letter):
Missing Keywords to weave in naturally: ${atsReport.missingKeywords.join(", ") || "none"}
Weak Sections to strengthen: ${atsReport.weakSections.join("; ") || "none"}
Suggestions to action:
${atsReport.suggestions.map((s) => `- ${s}`).join("\n") || "- none"}`;

  const outputSpec = `Return a single JSON object with exactly these keys:
{
  "cvTitle": "tailored professional headline for this role",
  "cvExperiences": [{ "company": "", "role": "", "startDate": "", "endDate": "", "bullets": ["..."] }],
  "cvSkills": [{ "category": "", "items": ["..."] }],
  "coverLetter": ${options.coverLetter ? '"full personalized cover letter text"' : '""'},
  "hrEmail": ${options.hrEmail ? '"concise outreach email to hiring manager"' : '""'},
  "linkedinMessage": ${options.linkedinMessage ? '"short LinkedIn message under 300 chars"' : '""'}
}`;

  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 8000,
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content: `${profileText}

JOB DESCRIPTION:
${jdText}

EXTRACTED JD FEATURES:
Role: ${features.role}
Company: ${features.company}
Required Skills: ${features.requiredSkills.join(", ")}
ATS Keywords: ${features.atsKeywords.join(", ")}
Domain: ${features.domainContext}

${atsContext}

${outputSpec}`,
      },
    ],
  });

  const raw = message.content[0].type === "text" ? message.content[0].text : "";
  try {
    const parsed = JSON.parse(extractJSON(raw));
    return cleanResult(parsed) as Omit<GenerationResult, "atsScore" | "atsReport">;
  } catch {
    throw new Error(`Document generation returned invalid JSON. Raw response: ${raw.slice(0, 500)}`);
  }
}

// ─── Re-test ATS from raw CV text ─────────────────────────────────────────────
export async function retestATSFromText(
  cvText: string,
  features: ExtractedFeatures,
  jdText: string
): Promise<{ atsScore: number; atsReport: GenerationResult["atsReport"] }> {
  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: `You are an ATS expert. Analyse how well the candidate's reworked CV matches the job description.

REWORKED CV:
${cvText}

JOB DESCRIPTION:
${jdText}

EXTRACTED JD FEATURES:
Role: ${features.role}
Required Skills: ${features.requiredSkills.join(", ")}
ATS Keywords: ${features.atsKeywords.join(", ")}
Domain: ${features.domainContext}

Return ONLY a raw JSON object — no markdown, no explanation:
{
  "atsScore": <integer 0-100>,
  "atsReport": {
    "matchedKeywords": ["keywords from the JD already present in the CV"],
    "missingKeywords": ["important JD keywords still absent from the CV"],
    "weakSections": ["areas where the CV is still thin relative to JD requirements"],
    "suggestions": ["specific, actionable improvements still needed"]
  }
}`,
      },
    ],
  });

  const raw = message.content[0].type === "text" ? message.content[0].text : "";
  try {
    const parsed = JSON.parse(extractJSON(raw));
    return cleanResult(parsed) as { atsScore: number; atsReport: GenerationResult["atsReport"] };
  } catch {
    throw new Error(`ATS retest returned invalid JSON. Raw response: ${raw.slice(0, 300)}`);
  }
}

// ─── Call 2: Generate application pack — ATS first, then docs ────────────────
export async function generateApplicationPack(
  profile: MasterProfileData,
  features: ExtractedFeatures,
  jdText: string,
  options: GenerationOptions
): Promise<GenerationResult> {
  // Step 1: analyse profile vs JD to produce ATS insights
  const { atsScore, atsReport } = await analyzeATS(profile, features, jdText);

  // Step 2: generate CV and cover documents, informed by ATS findings
  const docs = await generateDocuments(profile, features, jdText, options, atsReport);

  return { ...docs, atsScore, atsReport };
}
