interface ProfileData {
  primaryStack: string[];
  secondaryStack: string[];
  yearsOfExperience: number | null;
  preferredSalaryMin: number | null;
  preferredSalaryMax: number | null;
  remotePreference: string | null;
  englishLevel: string | null;
}

interface JobData {
  techStack: string[];
  jobDescription: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  remoteType: string | null;
}

function normalizeSkill(skill: string): string {
  return skill.toLowerCase().trim().replace(/[.\-_]/g, "");
}

function stackMatchScore(profile: ProfileData, job: JobData): number {
  const jobSkills = [
    ...job.techStack.map(normalizeSkill),
    ...extractSkillsFromDescription(job.jobDescription || ""),
  ];
  if (jobSkills.length === 0) return 50;

  const primaryNorm = profile.primaryStack.map(normalizeSkill);
  const secondaryNorm = profile.secondaryStack.map(normalizeSkill);

  let matches = 0;
  let total = jobSkills.length;

  for (const skill of jobSkills) {
    if (primaryNorm.some((p) => skill.includes(p) || p.includes(skill))) {
      matches += 1;
    } else if (
      secondaryNorm.some((s) => skill.includes(s) || s.includes(skill))
    ) {
      matches += 0.6;
    }
  }

  return Math.min(100, (matches / total) * 100);
}

function extractSkillsFromDescription(description: string): string[] {
  const commonSkills = [
    "javascript", "typescript", "python", "java", "go", "rust", "ruby", "php",
    "react", "nextjs", "next.js", "vue", "angular", "svelte", "node", "nodejs",
    "express", "fastify", "django", "flask", "spring", "rails",
    "postgresql", "postgres", "mysql", "mongodb", "redis", "elasticsearch",
    "docker", "kubernetes", "aws", "gcp", "azure", "terraform",
    "graphql", "rest", "grpc", "kafka", "rabbitmq",
    "git", "ci/cd", "jenkins", "github actions",
    "tailwind", "css", "html", "sass",
    "prisma", "typeorm", "sequelize", "drizzle",
  ];

  const descLower = description.toLowerCase();
  return commonSkills.filter((skill) => descLower.includes(skill));
}

function experienceScore(profile: ProfileData, job: JobData): number {
  if (!profile.yearsOfExperience) return 50;
  const desc = (job.jobDescription || "").toLowerCase();

  let requiredYears = 0;
  const match = desc.match(/(\d+)\+?\s*years?\s*(of\s+)?experience/);
  if (match) requiredYears = parseInt(match[1]);

  if (requiredYears === 0) return 70;

  const diff = profile.yearsOfExperience - requiredYears;
  if (diff >= 0 && diff <= 3) return 100;
  if (diff > 3) return 80;
  if (diff >= -1) return 70;
  if (diff >= -3) return 40;
  return 20;
}

function salaryScore(profile: ProfileData, job: JobData): number {
  if (!profile.preferredSalaryMin || !job.salaryMin) return 50;

  const profileMid =
    ((profile.preferredSalaryMin || 0) + (profile.preferredSalaryMax || profile.preferredSalaryMin || 0)) / 2;
  const jobMid = ((job.salaryMin || 0) + (job.salaryMax || job.salaryMin || 0)) / 2;

  if (jobMid === 0) return 50;

  const ratio = jobMid / profileMid;
  if (ratio >= 1) return 100;
  if (ratio >= 0.9) return 80;
  if (ratio >= 0.75) return 60;
  if (ratio >= 0.5) return 30;
  return 10;
}

function remoteScore(profile: ProfileData, job: JobData): number {
  if (!profile.remotePreference || !job.remoteType) return 50;
  const pref = profile.remotePreference.toLowerCase();
  const jobType = job.remoteType.toLowerCase();

  if (pref === jobType) return 100;
  if (pref === "remote" && jobType === "hybrid") return 50;
  if (pref === "remote" && jobType === "onsite") return 10;
  if (pref === "hybrid" && jobType === "remote") return 80;
  if (pref === "hybrid" && jobType === "onsite") return 40;
  if (pref === "onsite") return 70;
  return 50;
}

function englishScore(profile: ProfileData, job: JobData): number {
  if (!profile.englishLevel) return 50;
  const levels: Record<string, number> = {
    native: 100,
    fluent: 90,
    advanced: 80,
    intermediate: 60,
    basic: 30,
  };
  return levels[profile.englishLevel.toLowerCase()] || 50;
}

export function calculateFitScore(
  profile: ProfileData,
  job: JobData
): number {
  const stack = stackMatchScore(profile, job) * 0.4;
  const exp = experienceScore(profile, job) * 0.25;
  const salary = salaryScore(profile, job) * 0.15;
  const remote = remoteScore(profile, job) * 0.1;
  const english = englishScore(profile, job) * 0.1;

  return Math.round(stack + exp + salary + remote + english);
}
