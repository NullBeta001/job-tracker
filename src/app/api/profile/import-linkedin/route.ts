import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { extractText } from "unpdf";

const LINKEDIN_MARKERS = [
  "linkedin.com",
  "experiência",
  "experience",
  "formação acadêmica",
  "education",
  "page 1 of",
  "principais competências",
  "top skills",
];

function isLinkedInPdf(text: string): boolean {
  const lower = text.toLowerCase();
  return LINKEDIN_MARKERS.filter((m) => lower.includes(m)).length >= 2;
}

interface ParsedLinkedIn {
  name: string | null;
  bio: string | null;
  currentRole: string | null;
  currentCompany: string | null;
  location: string | null;
  phone: string | null;
  linkedinUrl: string | null;
  portfolioUrl: string | null;
  yearsOfExperience: number | null;
  primaryStack: string[];
  certifications: string[];
  education: string[];
}

function findSectionStart(lower: string, markers: string[]): number {
  for (const m of markers) {
    const idx = lower.indexOf(m);
    if (idx !== -1) return idx;
  }
  return -1;
}

function textBetween(text: string, startMarkers: string[], endMarkers: string[]): string {
  const lower = text.toLowerCase();

  let startIdx = -1;
  for (const m of startMarkers) {
    const idx = lower.indexOf(m);
    if (idx !== -1) {
      startIdx = idx + m.length;
      break;
    }
  }
  if (startIdx === -1) return "";

  let endIdx = text.length;
  for (const m of endMarkers) {
    const idx = lower.indexOf(m, startIdx);
    if (idx !== -1 && idx < endIdx) endIdx = idx;
  }

  return text.substring(startIdx, endIdx).trim();
}

function cleanLines(text: string): string[] {
  return text.split("\n").map((l) => l.trim()).filter((l) => l && !l.match(/^Page \d+ of \d+$/i));
}

function parseYears(experienceText: string): number | null {
  const months: Record<string, number> = {
    janeiro: 1, january: 1, fevereiro: 2, february: 2, "março": 3, march: 3,
    abril: 4, april: 4, maio: 5, may: 5, junho: 6, june: 6,
    julho: 7, july: 7, agosto: 8, august: 8, setembro: 9, september: 9,
    outubro: 10, october: 10, novembro: 11, november: 11, dezembro: 12, december: 12,
  };

  const datePattern = /(janeiro|fevereiro|março|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro|january|february|march|april|may|june|july|august|september|october|november|december)\s+de\s+(\d{4})/gi;
  let earliest: Date | null = null;
  let match;

  while ((match = datePattern.exec(experienceText)) !== null) {
    const month = months[match[1].toLowerCase()] || 1;
    const year = parseInt(match[2]);
    const date = new Date(year, month - 1);
    if (!earliest || date < earliest) earliest = date;
  }

  if (earliest) {
    return Math.round((Date.now() - earliest.getTime()) / (1000 * 60 * 60 * 24 * 365));
  }

  const yearsMatch = experienceText.match(/(\d+)\+?\s*(?:anos|years?)\s+(?:of\s+)?experience/i);
  if (yearsMatch) return parseInt(yearsMatch[1]);

  return null;
}

function parseLinkedInPdf(text: string): ParsedLinkedIn {
  const lower = text.toLowerCase();

  // -- Contact section --
  const contactSection = textBetween(text,
    ["contato\n", "contact\n"],
    ["principais competências", "top skills", "certifications", "certificações"]
  );

  let phone: string | null = null;
  let linkedinUrl: string | null = null;
  let portfolioUrl: string | null = null;

  const phoneMatch = contactSection.match(/[\d()+ -]{8,}/);
  if (phoneMatch) phone = phoneMatch[0].trim();

  const linkedinMatch = text.match(/(?:www\.)?linkedin\.com\/in\/[^\s)]+/i);
  if (linkedinMatch) {
    let url = linkedinMatch[0].replace(/\n/g, "");
    if (!url.startsWith("http")) url = "https://" + url;
    linkedinUrl = url;
  }

  const contactLines = contactSection.split("\n");
  for (const line of contactLines) {
    const trimmed = line.trim();
    if (
      trimmed.match(/\.(com|dev|io|me|tech|net|org|xyz)\/?/i) &&
      !trimmed.includes("linkedin.com") &&
      !trimmed.includes("@")
    ) {
      const raw = trimmed.replace(/\s*\(.*\)\s*$/, "").trim();
      portfolioUrl = raw.startsWith("http") ? raw : "https://" + raw;
      break;
    }
  }

  // -- Skills section --
  const skillsSection = textBetween(text,
    ["principais competências\n", "top skills\n"],
    ["certifications", "certificações", "\n\n"]
  );
  const skills = cleanLines(skillsSection).filter((s) => s.length < 60);

  // -- Certifications section --
  // Certifications come BEFORE the name. They end where the name+headline starts.
  // The name is a line that comes after certs and before "Resumo"/"Summary".
  const certsStart = findSectionStart(lower, ["certifications\n", "certificações\n"]);
  const summaryStart = findSectionStart(lower, ["\nresumo\n", "\nsummary\n"]);

  let certifications: string[] = [];
  let name: string | null = null;
  let headline: string | null = null;
  let location: string | null = null;

  if (certsStart !== -1 && summaryStart !== -1) {
    // Everything between "Certifications" header and "Resumo" header
    const certHeaderEnd = text.indexOf("\n", certsStart) + 1;
    const betweenCertsAndSummary = text.substring(certHeaderEnd, summaryStart);
    const lines = cleanLines(betweenCertsAndSummary);

    // The name is typically the first line that looks like a proper name
    // (not a cert title). In LinkedIn PDFs, certs come first, then name,
    // headline, location. The name is usually 2-4 words, capitalized.
    // The headline contains "|" separators.

    let nameLineIdx = -1;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // A headline-like line with "|" separators indicates the previous line is the name
      if (line.includes("|") && i > 0) {
        nameLineIdx = i - 1;
        break;
      }
    }

    if (nameLineIdx === -1) {
      // Fallback: look for a line that is a short proper name (2-4 words, capitalized)
      for (let i = lines.length - 4; i < lines.length; i++) {
        if (i < 0) continue;
        const line = lines[i];
        const words = line.split(/\s+/);
        if (words.length >= 2 && words.length <= 5 && words.every((w) => /^[A-ZÀ-ÿ]/.test(w))) {
          nameLineIdx = i;
          break;
        }
      }
    }

    if (nameLineIdx !== -1) {
      name = lines[nameLineIdx];

      // Lines before name are certifications
      certifications = lines.slice(0, nameLineIdx).filter((l) => l.length > 2);

      // Line after name is headline
      if (nameLineIdx + 1 < lines.length) {
        // Headline might span multiple lines (joined by \n in PDF)
        const headlineParts: string[] = [];
        for (let i = nameLineIdx + 1; i < lines.length; i++) {
          const line = lines[i];
          // Stop at what looks like a location (short line, no "|")
          if (!line.includes("|") && headlineParts.length > 0 && line.length < 40) {
            location = line;
            break;
          }
          headlineParts.push(line);
        }
        headline = headlineParts.join(" ");
      }
    } else {
      // If we couldn't find the name, treat all lines as certs
      certifications = lines.filter((l) => l.length > 2);
    }
  }

  // -- Summary / Bio --
  const bio = textBetween(text,
    ["resumo\n", "summary\n"],
    ["experiência\n", "experience\n"]
  ).replace(/\n/g, " ").replace(/\s+/g, " ").trim() || null;

  // -- Experience --
  const experienceSection = textBetween(text,
    ["experiência\n", "experience\n"],
    ["formação acadêmica", "education"]
  );

  let currentCompany: string | null = null;
  let currentRole: string | null = null;

  if (experienceSection) {
    const expLines = cleanLines(experienceSection);
    // First line = company, second = role (in LinkedIn PDF format)
    if (expLines.length >= 2) {
      currentCompany = expLines[0];
      currentRole = expLines[1];
    }
  }

  const yearsOfExperience = parseYears(experienceSection) ?? parseYears(bio || "");

  // -- Education --
  const educationSection = textBetween(text,
    ["formação acadêmica\n", "education\n"],
    ["page "]
  );

  const education: string[] = [];
  if (educationSection) {
    const eduLines = cleanLines(educationSection);
    // Group lines: institution + degree line (contains " · ")
    let current = "";
    for (const line of eduLines) {
      if (line.includes("·") || line.includes("–")) {
        current += (current ? " — " : "") + line;
        education.push(current.trim());
        current = "";
      } else if (current) {
        current += " — " + line;
      } else {
        current = line;
      }
    }
    if (current) education.push(current.trim());
  }

  // Extract tech skills from headline if we got one
  const primaryStack = skills.length > 0
    ? skills
    : (headline || "")
        .split(/[|,]/)
        .map((s) => s.trim())
        .filter((s) => s.length > 1 && s.length < 40);

  return {
    name,
    bio,
    currentRole,
    currentCompany,
    location,
    phone,
    linkedinUrl,
    portfolioUrl,
    yearsOfExperience,
    primaryStack,
    certifications,
    education,
  };
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file");

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (file.type !== "application/pdf") {
    return NextResponse.json(
      { error: "Only PDF files are accepted. Please upload a PDF." },
      { status: 400 }
    );
  }

  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json(
      { error: "File too large. Maximum size is 5MB." },
      { status: 400 }
    );
  }

  try {
    const buffer = await file.arrayBuffer();
    const result = await extractText(new Uint8Array(buffer));
    const text = Array.isArray(result.text) ? result.text.join("\n") : result.text;

    if (!isLinkedInPdf(text)) {
      return NextResponse.json(
        {
          error:
            "This doesn't appear to be a LinkedIn profile PDF. Please export your profile from LinkedIn and try again.",
        },
        { status: 400 }
      );
    }

    const parsed = parseLinkedInPdf(text);

    return NextResponse.json(parsed);
  } catch (err) {
    console.error("LinkedIn PDF import error:", err);
    return NextResponse.json(
      { error: "Failed to read the PDF file. Make sure it's a valid PDF." },
      { status: 500 }
    );
  }
}
