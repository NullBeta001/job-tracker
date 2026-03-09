"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import StatusBadge from "@/components/StatusBadge";
import FitScoreBadge from "@/components/FitScoreBadge";
import { SectionHeader, Card, EmptyState, PageLoading } from "@/components/ui";
import { RankingsIcon } from "@/components/Icons";

interface Application {
  id: string;
  companyName: string;
  roleTitle: string;
  status: string;
  fitScore: number | null;
  salaryMin: number | null;
  salaryMax: number | null;
  remoteType: string | null;
  techStack: string[];
}

export default function RankingsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/applications")
      .then((r) => r.json())
      .then((apps: Application[]) => {
        const sorted = apps
          .filter((a) => a.fitScore !== null)
          .sort((a, b) => (b.fitScore || 0) - (a.fitScore || 0));
        setApplications(sorted);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoading />;

  const rankStyles = [
    "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 ring-1 ring-inset ring-yellow-500/20",
    "bg-gray-500/10 text-gray-600 dark:text-gray-400 ring-1 ring-inset ring-gray-500/20",
    "bg-amber-500/10 text-amber-700 dark:text-amber-400 ring-1 ring-inset ring-amber-500/20",
  ];

  return (
    <div className="space-y-6">
      <SectionHeader title="Job Rankings" subtitle="Top matches based on Fit Score" />

      {applications.length === 0 ? (
        <Card>
          <EmptyState
            icon={<RankingsIcon className="w-8 h-8" />}
            title="No ranked applications yet"
            description="Add applications with a profile configured to see rankings."
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {applications.map((app, i) => (
            <Link
              key={app.id}
              href={`/applications/${app.id}`}
              className="flex items-center gap-3 sm:gap-4 bg-card rounded-xl border border-border p-3 sm:p-4 hover:shadow-md hover:border-blue-500/30 transition-all animate-fade-in-up"
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${i < 3 ? rankStyles[i] : "bg-muted text-muted-foreground"}`}>
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <p className="font-semibold text-foreground text-sm sm:text-base">{app.companyName}</p>
                  <StatusBadge status={app.status} />
                </div>
                <p className="text-sm text-muted-foreground">{app.roleTitle}</p>
                {app.techStack.length > 0 && (
                  <div className="hidden sm:flex flex-wrap gap-1 mt-1.5">
                    {app.techStack.slice(0, 5).map((t) => (
                      <span key={t} className="text-xs bg-muted text-muted-foreground px-1.5 py-0.5 rounded-md">{t}</span>
                    ))}
                    {app.techStack.length > 5 && (
                      <span className="text-xs text-muted-foreground">+{app.techStack.length - 5}</span>
                    )}
                  </div>
                )}
              </div>
              <div className="text-right flex-shrink-0">
                <FitScoreBadge score={app.fitScore} />
                {app.salaryMin && (
                  <p className="text-xs text-muted-foreground mt-1">
                    ${(app.salaryMin / 1000).toFixed(0)}k
                    {app.salaryMax ? ` - $${(app.salaryMax / 1000).toFixed(0)}k` : ""}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
