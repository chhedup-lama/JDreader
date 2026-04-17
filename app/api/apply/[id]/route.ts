import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
  const { id } = await params;
  const jobId = parseInt(id);

  const job = await prisma.jobPosting.findUnique({
    where: { id: jobId },
    include: { applicationPack: true },
  });

  if (!job) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const pack = job.applicationPack;

  return NextResponse.json({
    job: {
      id: job.id,
      company: job.company,
      role: job.role,
      jdText: job.jdText,
      jdLink: job.jdLink,
      extractedFeatures: JSON.parse(job.extractedFeatures),
      createdAt: job.createdAt,
    },
    pack: pack
      ? {
          cvTitle: pack.cvTitle,
          cvExperiences: JSON.parse(pack.cvExperiences),
          cvSkills: JSON.parse(pack.cvSkills),
          coverLetter: pack.coverLetter,
          atsScore: pack.atsScore,
          atsReport: JSON.parse(pack.atsReport),
          afterAtsScore: pack.afterAtsScore,
          afterAtsReport: JSON.parse(pack.afterAtsReport),
          hrEmail: pack.hrEmail,
          linkedinMessage: pack.linkedinMessage,
        }
      : null,
  });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[/api/apply/[id]]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
