import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const applications = await prisma.jobApplication.findMany({
    where: { userId: session.user.id },
    include: { interviews: true },
    orderBy: { dateApplied: "desc" },
  });

  const total = applications.length;
  const statusCounts: Record<string, number> = {};
  const sourceCounts: Record<string, number> = {};
  const monthlyCounts: Record<string, number> = {};
  let totalSalaryMin = 0;
  let totalSalaryMax = 0;
  let salaryCount = 0;

  const statusOrder = [
    "Applied", "Recruiter Screen", "Technical Interview",
    "System Design", "Final Interview", "Offer", "Rejected", "Ghosted",
  ];

  for (const app of applications) {
    statusCounts[app.status] = (statusCounts[app.status] || 0) + 1;
    if (app.source) {
      sourceCounts[app.source] = (sourceCounts[app.source] || 0) + 1;
    }
    const monthKey = app.dateApplied.toISOString().slice(0, 7);
    monthlyCounts[monthKey] = (monthlyCounts[monthKey] || 0) + 1;

    if (app.salaryMin) {
      totalSalaryMin += app.salaryMin;
      totalSalaryMax += app.salaryMax || app.salaryMin;
      salaryCount++;
    }
  }

  const interviewStages = ["Recruiter Screen", "Technical Interview", "System Design", "Final Interview", "Offer"];
  const withInterviews = applications.filter((a) =>
    interviewStages.includes(a.status) || a.status === "Offer"
  ).length;
  const finalRounds = applications.filter((a) =>
    a.status === "Final Interview" || a.status === "Offer"
  ).length;
  const offers = statusCounts["Offer"] || 0;
  const rejected = statusCounts["Rejected"] || 0;
  const ghosted = statusCounts["Ghosted"] || 0;

  const conversionRates = {
    applicationToInterview: total ? ((withInterviews / total) * 100).toFixed(1) : "0",
    interviewToFinal: withInterviews ? ((finalRounds / withInterviews) * 100).toFixed(1) : "0",
    finalToOffer: finalRounds ? ((offers / finalRounds) * 100).toFixed(1) : "0",
  };

  const responseTimes: number[] = [];
  for (const app of applications) {
    if (app.interviews && app.interviews.length > 0) {
      const firstInterview = app.interviews.sort(
        (a, b) => a.interviewDate.getTime() - b.interviewDate.getTime()
      )[0];
      const days = Math.round(
        (firstInterview.interviewDate.getTime() - app.dateApplied.getTime()) /
          (1000 * 60 * 60 * 24)
      );
      if (days >= 0) responseTimes.push(days);
    }
  }

  const avgResponseTime = responseTimes.length
    ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
    : null;

  const funnel = statusOrder.map((status) => ({
    stage: status,
    count: statusCounts[status] || 0,
  }));

  const timeline = Object.entries(monthlyCounts)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, count]) => ({ month, count }));

  const sources = Object.entries(sourceCounts).map(([source, count]) => ({
    source,
    count,
  }));

  const upcomingInterviews = await prisma.interview.findMany({
    where: {
      application: { userId: session.user.id },
      interviewDate: { gte: new Date() },
    },
    include: { application: { select: { companyName: true, roleTitle: true } } },
    orderBy: { interviewDate: "asc" },
    take: 10,
  });

  return NextResponse.json({
    total,
    withInterviews,
    finalRounds,
    offers,
    rejected,
    ghosted,
    conversionRates,
    avgResponseTime,
    avgSalary: salaryCount
      ? {
          min: Math.round(totalSalaryMin / salaryCount),
          max: Math.round(totalSalaryMax / salaryCount),
        }
      : null,
    funnel,
    timeline,
    sources,
    upcomingInterviews,
  });
}
