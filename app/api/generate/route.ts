import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ensureProfile } from "@/lib/db";
import { generateApplicationPack } from "@/lib/ai";
import { GenerationOptions, MasterProfileData } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
  const { jobId, options }: { jobId: number; options: GenerationOptions } =
    await req.json();

  // Load job
  const job = await prisma.jobPosting.findUnique({ where: { id: jobId } });
  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  // Load master profile
  const profileRaw = await ensureProfile();
  const profile: MasterProfileData = {
    shortTitle: profileRaw.shortTitle,
    coverLetterInstructions: profileRaw.coverLetterInstructions,
    workExperiences: profileRaw.workExperiences.map((exp) => ({
      id: exp.id,
      company: exp.company,
      role: exp.role,
      startDate: exp.startDate,
      endDate: exp.endDate,
      bullets: JSON.parse(exp.bullets),
      tags: JSON.parse(exp.tags),
      order: exp.order,
    })),
    skills: profileRaw.skills.map((s) => ({
      id: s.id,
      category: s.category,
      items: JSON.parse(s.items),
    })),
    leadershipStories: profileRaw.leadershipStories.map((l) => ({
      id: l.id,
      title: l.title,
      situation: l.situation,
      action: l.action,
      result: l.result,
      tags: JSON.parse(l.tags),
    })),
  };

  const features = JSON.parse(job.extractedFeatures);

  // Generate via Claude
  const result = await generateApplicationPack(
    profile,
    features,
    job.jdText,
    options
  );

  // Enforce options — regardless of what Claude returned, blank out anything not requested
  if (!options.coverLetter) result.coverLetter = "";
  if (!options.hrEmail) result.hrEmail = "";
  if (!options.linkedinMessage) result.linkedinMessage = "";

  // Upsert application pack
  const pack = await prisma.applicationPack.upsert({
    where: { jobId },
    update: {
      cvTitle: result.cvTitle,
      cvExperiences: JSON.stringify(result.cvExperiences),
      cvSkills: JSON.stringify(result.cvSkills),
      coverLetter: result.coverLetter,
      atsScore: result.atsScore,
      atsReport: JSON.stringify(result.atsReport),
      hrEmail: result.hrEmail,
      linkedinMessage: result.linkedinMessage,
    },
    create: {
      jobId,
      cvTitle: result.cvTitle,
      cvExperiences: JSON.stringify(result.cvExperiences),
      cvSkills: JSON.stringify(result.cvSkills),
      coverLetter: result.coverLetter,
      atsScore: result.atsScore,
      atsReport: JSON.stringify(result.atsReport),
      hrEmail: result.hrEmail,
      linkedinMessage: result.linkedinMessage,
    },
  });

  return NextResponse.json({ packId: pack.id, result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[/api/generate]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
