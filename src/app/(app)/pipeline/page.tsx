"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import FitScoreBadge from "@/components/FitScoreBadge";
import { SectionHeader, PageLoading } from "@/components/ui";

interface Application {
  id: string;
  companyName: string;
  roleTitle: string;
  status: string;
  fitScore: number | null;
  remoteType: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
}

const STAGES = [
  "Applied", "Recruiter Screen", "Technical Interview",
  "System Design", "Final Interview", "Offer", "Rejected", "Ghosted",
];

const STAGE_COLORS: Record<string, string> = {
  Applied: "bg-blue-500",
  "Recruiter Screen": "bg-purple-500",
  "Technical Interview": "bg-indigo-500",
  "System Design": "bg-cyan-500",
  "Final Interview": "bg-amber-500",
  Offer: "bg-emerald-500",
  Rejected: "bg-red-500",
  Ghosted: "bg-gray-400",
};

export default function PipelinePage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [dragging, setDragging] = useState<string | null>(null);

  const fetchApplications = () => {
    fetch("/api/applications")
      .then((r) => r.json())
      .then(setApplications)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchApplications(); }, []);

  async function moveToStage(appId: string, newStatus: string) {
    await fetch(`/api/applications/${appId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    fetchApplications();
  }

  function handleDragStart(appId: string) {
    setDragging(appId);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
  }

  function handleDrop(e: React.DragEvent, stage: string) {
    e.preventDefault();
    if (dragging) {
      moveToStage(dragging, stage);
      setDragging(null);
    }
  }

  if (loading) return <PageLoading />;

  const grouped = STAGES.reduce((acc, stage) => {
    acc[stage] = applications.filter((a) => a.status === stage);
    return acc;
  }, {} as Record<string, Application[]>);

  return (
    <div className="space-y-6">
      <SectionHeader title="Pipeline" subtitle="Drag applications between stages" />

      <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
        {STAGES.map((stage) => (
          <div
            key={stage}
            className="flex-shrink-0 w-56 sm:w-64 bg-muted rounded-xl overflow-hidden"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, stage)}
          >
            <div className="p-3 border-b border-border">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${STAGE_COLORS[stage]}`} />
                <h3 className="text-sm font-semibold text-foreground flex-1">{stage}</h3>
                <span className="text-xs text-muted-foreground bg-card px-2 py-0.5 rounded-full">
                  {grouped[stage].length}
                </span>
              </div>
            </div>
            <div className="p-2 space-y-2 min-h-[100px]">
              {grouped[stage].map((app) => (
                <div
                  key={app.id}
                  draggable
                  onDragStart={() => handleDragStart(app.id)}
                  className="bg-card rounded-lg p-3 shadow-sm border border-border cursor-grab active:cursor-grabbing hover:shadow-md hover:border-blue-500/30 transition-all"
                >
                  <Link href={`/applications/${app.id}`}>
                    <p className="text-sm font-medium text-foreground">{app.companyName}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{app.roleTitle}</p>
                    <div className="flex items-center justify-between mt-2">
                      <FitScoreBadge score={app.fitScore} />
                      {app.salaryMin ? (
                        <span className="text-xs text-muted-foreground">
                          ${(app.salaryMin / 1000).toFixed(0)}k{app.salaryMax ? `-${(app.salaryMax / 1000).toFixed(0)}k` : ""}
                        </span>
                      ) : app.remoteType ? (
                        <span className="text-xs text-muted-foreground">{app.remoteType}</span>
                      ) : null}
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
