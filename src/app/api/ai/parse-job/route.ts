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

  const { description } = await req.json();

  if (!description || typeof description !== "string" || description.trim().length < 20) {
    return NextResponse.json(
      { error: "Please provide a job description with at least 20 characters." },
      { status: 400 }
    );
  }

  const prompt = `Extract structured job information from the following job posting/description. Be as accurate as possible. If a field is not mentioned, use null.

Job posting:
"""
${description}
"""

Respond in JSON:
{
  "companyName": "string or null",
  "roleTitle": "string or null",
  "salaryMin": number_or_null (annual, in USD, e.g. 120000),
  "salaryMax": number_or_null (annual, in USD),
  "location": "string or null (city, state/country)",
  "remoteType": "remote" | "hybrid" | "onsite" | null,
  "techStack": ["array", "of", "technologies"] or [],
  "source": "LinkedIn" | "Wellfound" | "Recruiter" | "Company Website" | "Referral" | "Other" | null,
  "jobUrl": "string or null",
  "summary": "A 2-3 sentence summary of the role and key requirements",
  "howToApply": "string or null (application instructions if mentioned)",
  "importantNotes": ["array of important details like visa sponsorship, equity, benefits, deadlines, etc."] or []
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
      temperature: 0.1,
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    return NextResponse.json({ error: `OpenAI API error: ${error}` }, { status: 500 });
  }

  const result = await response.json();
  const parsed = JSON.parse(result.choices[0].message.content);

  return NextResponse.json(parsed);
}
