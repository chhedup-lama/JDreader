import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { analyzeJD } from "@/lib/ai";

export async function POST(req: NextRequest) {
  try {
    const { jdText, jdLink } = await req.json();

    if (!jdText?.trim()) {
      return NextResponse.json({ error: "JD text is required" }, { status: 400 });
    }

    const features = await analyzeJD(jdText);

    const job = await prisma.jobPosting.create({
      data: {
        jdText,
        jdLink: jdLink || "",
        company: features.company,
        role: features.role,
        extractedFeatures: JSON.stringify(features),
      },
    });

    return NextResponse.json({ jobId: job.id, features });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[/api/jobs]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
