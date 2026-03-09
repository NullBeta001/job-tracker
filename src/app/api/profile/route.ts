import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await prisma.profile.findUnique({
    where: { userId: session.user.id },
  });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { openaiApiKey: true },
  });

  return NextResponse.json({ ...profile, openaiApiKey: user?.openaiApiKey || null });
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = await req.json();
  const { openaiApiKey, ...profileData } = data;

  const profile = await prisma.profile.upsert({
    where: { userId: session.user.id },
    update: profileData,
    create: { userId: session.user.id, ...profileData },
  });

  if (openaiApiKey !== undefined) {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { openaiApiKey },
    });
  }

  return NextResponse.json({ ...profile, openaiApiKey: openaiApiKey ?? null });
}
