import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const jobs = await prisma.jobPosting.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        applicationPack: {
          select: {
            atsScore: true,
            coverLetter: true,
            hrEmail: true,
            linkedinMessage: true,
          },
        },
      },
    });

    const result = jobs.map((job) => ({
      id: job.id,
      company: job.company,
      role: job.role,
      jdLink: job.jdLink,
      createdAt: job.createdAt,
      pack: job.applicationPack
        ? {
            atsScore: job.applicationPack.atsScore,
            hasCoverLetter: !!job.applicationPack.coverLetter,
            hasHrEmail: !!job.applicationPack.hrEmail,
            hasLinkedin: !!job.applicationPack.linkedinMessage,
          }
        : null,
    }));

    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[/api/jobs/list]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
