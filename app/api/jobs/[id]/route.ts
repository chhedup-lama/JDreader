import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: idStr } = await params;
  const id = parseInt(idStr, 10);
  if (isNaN(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  try {
    await prisma.$transaction([
      prisma.applicationPack.deleteMany({ where: { jobId: id } }),
      prisma.jobPosting.delete({ where: { id } }),
    ]);
    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[DELETE /api/jobs/:id]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
