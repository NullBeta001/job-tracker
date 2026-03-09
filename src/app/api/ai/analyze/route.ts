import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { openaiApiKey: true },
  });

  if (!user?.openaiApiKey) {
    return NextResponse.json(
      { error: "OpenAI API key not configured. Add it in Profile settings." },
      { status: 400 }
    );
  }

  const { jobDescription, profileSummary } = await req.json();

  const prompt = `Analyze this job description and provide:
1. Required tech stack (as a JSON array of strings)
2. Estimated seniority level
3. Job fit summary comparing against this profile: ${profileSummary}
4. 3-5 interview preparation suggestions

Job Description:
${jobDescription}

Respond in JSON format:
{
  "techStack": [...],
  "seniorityLevel": "...",
  "fitSummary": "...",
  "interviewTips": [...]
}`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${user.openaiApiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    return NextResponse.json({ error: `OpenAI API error: ${error}` }, { status: 500 });
  }

  const result = await response.json();
  const analysis = JSON.parse(result.choices[0].message.content);

  return NextResponse.json(analysis);
}
