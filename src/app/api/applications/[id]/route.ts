import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { calculateFitScore } from "@/lib/fit-score";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const application = await prisma.jobApplication.findFirst({
    where: { id, userId: session.user.id },
    include: { notes: { orderBy: { createdAt: "desc" } }, interviews: { orderBy: { interviewDate: "asc" } } },
  });

  if (!application) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(application);
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const data = await req.json();

  const existing = await prisma.jobApplication.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const profile = await prisma.profile.findUnique({
    where: { userId: session.user.id },
  });

  let fitScore = existing.fitScore;
  if (profile && (data.techStack || data.jobDescription || data.salaryMin || data.remoteType)) {
    fitScore = calculateFitScore(
      {
        primaryStack: profile.primaryStack,
        secondaryStack: profile.secondaryStack,
        yearsOfExperience: profile.yearsOfExperience,
        preferredSalaryMin: profile.preferredSalaryMin,
        preferredSalaryMax: profile.preferredSalaryMax,
        remotePreference: profile.remotePreference,
        englishLevel: profile.englishLevel,
      },
      {
        techStack: data.techStack ?? existing.techStack,
        jobDescription: data.jobDescription ?? existing.jobDescription,
        salaryMin: data.salaryMin ?? existing.salaryMin,
        salaryMax: data.salaryMax ?? existing.salaryMax,
        remoteType: data.remoteType ?? existing.remoteType,
      }
    );
  }

  const application = await prisma.jobApplication.update({
    where: { id },
    data: { ...data, fitScore, dateApplied: data.dateApplied ? new Date(data.dateApplied) : undefined },
  });

  return NextResponse.json(application);
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await prisma.jobApplication.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.jobApplication.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
