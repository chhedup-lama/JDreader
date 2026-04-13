import { NextRequest, NextResponse } from "next/server";
import { prisma, ensureProfile } from "@/lib/db";
import { MasterProfileData } from "@/lib/types";

export async function GET() {
  const profile = await ensureProfile();
  return NextResponse.json({
    shortTitle: profile.shortTitle,
    coverLetterInstructions: profile.coverLetterInstructions,
    workExperiences: profile.workExperiences.map((exp) => ({
      id: exp.id,
      company: exp.company,
      role: exp.role,
      startDate: exp.startDate,
      endDate: exp.endDate,
      bullets: JSON.parse(exp.bullets),
      tags: JSON.parse(exp.tags),
      order: exp.order,
    })),
    skills: profile.skills.map((s) => ({
      id: s.id,
      category: s.category,
      items: JSON.parse(s.items),
    })),
    leadershipStories: profile.leadershipStories.map((l) => ({
      id: l.id,
      title: l.title,
      situation: l.situation,
      action: l.action,
      result: l.result,
      tags: JSON.parse(l.tags),
    })),
  });
}

export async function POST(req: NextRequest) {
  const body: MasterProfileData = await req.json();

  // Update top-level fields
  await prisma.masterProfile.upsert({
    where: { id: 1 },
    update: {
      shortTitle: body.shortTitle,
      coverLetterInstructions: body.coverLetterInstructions,
    },
    create: {
      id: 1,
      shortTitle: body.shortTitle,
      coverLetterInstructions: body.coverLetterInstructions,
    },
  });

  // Replace work experiences
  await prisma.workExperience.deleteMany({ where: { profileId: 1 } });
  for (let i = 0; i < body.workExperiences.length; i++) {
    const exp = body.workExperiences[i];
    await prisma.workExperience.create({
      data: {
        profileId: 1,
        company: exp.company,
        role: exp.role,
        startDate: exp.startDate,
        endDate: exp.endDate,
        bullets: JSON.stringify(exp.bullets),
        tags: JSON.stringify(exp.tags),
        order: i,
      },
    });
  }

  // Replace skills
  await prisma.skill.deleteMany({ where: { profileId: 1 } });
  for (const skill of body.skills) {
    await prisma.skill.create({
      data: {
        profileId: 1,
        category: skill.category,
        items: JSON.stringify(skill.items),
      },
    });
  }

  // Replace leadership stories
  await prisma.leadershipStory.deleteMany({ where: { profileId: 1 } });
  for (const story of body.leadershipStories) {
    await prisma.leadershipStory.create({
      data: {
        profileId: 1,
        title: story.title,
        situation: story.situation,
        action: story.action,
        result: story.result,
        tags: JSON.stringify(story.tags),
      },
    });
  }

  return NextResponse.json({ success: true });
}
