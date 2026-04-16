import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { retestATSFromText } from "@/lib/ai";
import { ExtractedFeatures } from "@/lib/types";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const jobId = parseInt(id);

  const body = await req.json();
  const cvText: string = body.cvText?.trim();

  if (!cvText) {
    return NextResponse.json({ error: "CV text is required" }, { status: 400 });
  }

  const job = await prisma.jobPosting.findUnique({ where: { id: jobId } });
  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  const features = JSON.parse(job.extractedFeatures) as ExtractedFeatures;

  const { atsScore, atsReport } = await retestATSFromText(cvText, features, job.jdText);

  return NextResponse.json({ atsScore, atsReport });
}
