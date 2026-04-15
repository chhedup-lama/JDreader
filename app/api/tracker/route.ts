import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const items = await prisma.interviewTracker.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(items);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { company, jobTitle, location, employmentType, salaryMin, salaryMax, currency, status, notes } = body;

    if (!company?.trim() || !jobTitle?.trim()) {
      return NextResponse.json({ error: "Company and job title are required" }, { status: 400 });
    }

    const item = await prisma.interviewTracker.create({
      data: {
        company: company.trim(),
        jobTitle: jobTitle.trim(),
        location: location?.trim() ?? "",
        employmentType: employmentType ?? "full-time",
        salaryMin: salaryMin ? parseInt(salaryMin) : null,
        salaryMax: salaryMax ? parseInt(salaryMax) : null,
        currency: currency ?? "GBP",
        status: status ?? "applied",
        notes: notes?.trim() ?? "",
      },
    });

    return NextResponse.json(item);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
