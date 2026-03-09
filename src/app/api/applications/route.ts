import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { calculateFitScore } from "@/lib/fit-score";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const sort = searchParams.get("sort") || "dateApplied";
  const order = searchParams.get("order") || "desc";

  const where: Record<string, unknown> = { userId: session.user.id };
  if (status) where.status = status;

  const applications = await prisma.jobApplication.findMany({
    where,
    include: { notes: true, interviews: true },
    orderBy: { [sort]: order },
  });

  return NextResponse.json(applications);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = await req.json();

  const profile = await prisma.profile.findUnique({
    where: { userId: session.user.id },
  });

  let fitScore: number | null = null;
  if (profile) {
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
        techStack: data.techStack || [],
        jobDescription: data.jobDescription || null,
        salaryMin: data.salaryMin || null,
        salaryMax: data.salaryMax || null,
        remoteType: data.remoteType || null,
      }
    );
  }

  const application = await prisma.jobApplication.create({
    data: {
      userId: session.user.id,
      companyName: data.companyName,
      roleTitle: data.roleTitle,
      salaryMin: data.salaryMin || null,
      salaryMax: data.salaryMax || null,
      location: data.location || null,
      remoteType: data.remoteType || null,
      jobDescription: data.jobDescription || null,
      techStack: data.techStack || [],
      source: data.source || null,
      jobUrl: data.jobUrl || null,
      dateApplied: data.dateApplied ? new Date(data.dateApplied) : new Date(),
      status: data.status || "Applied",
      fitScore,
    },
  });

  return NextResponse.json(application);
}
