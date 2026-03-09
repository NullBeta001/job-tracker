import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const app = await prisma.jobApplication.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!app) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const data = await req.json();
  const interview = await prisma.interview.create({
    data: {
      applicationId: id,
      interviewDate: new Date(data.interviewDate),
      stage: data.stage,
      meetingLink: data.meetingLink || null,
      notes: data.notes || null,
    },
  });

  return NextResponse.json(interview);
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const interviewId = searchParams.get("interviewId");
  if (!interviewId) {
    return NextResponse.json({ error: "interviewId required" }, { status: 400 });
  }

  await prisma.interview.delete({ where: { id: interviewId } });
  return NextResponse.json({ success: true });
}
