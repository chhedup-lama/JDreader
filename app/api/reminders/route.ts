import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const reminders = await prisma.submissionReminder.findMany({
    orderBy: { submissionDate: "asc" },
  });
  return NextResponse.json(reminders);
}

export async function POST(req: NextRequest) {
  const { company, submissionDate } = await req.json();
  if (!company?.trim() || !submissionDate?.trim()) {
    return NextResponse.json({ error: "Company and date are required" }, { status: 400 });
  }
  const reminder = await prisma.submissionReminder.create({
    data: { company: company.trim(), submissionDate: submissionDate.trim() },
  });
  return NextResponse.json(reminder);
}
