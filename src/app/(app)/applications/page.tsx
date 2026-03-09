"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import StatusBadge from "@/components/StatusBadge";
import FitScoreBadge from "@/components/FitScoreBadge";
import { SectionHeader, Card, CardTitle, Button, EmptyState, PageLoading } from "@/components/ui";
import { PlusIcon, SparklesIcon } from "@/components/Icons";

interface Application {
  id: string;
  companyName: string;
  roleTitle: string;
  salaryMin: number | null;
  salaryMax: number | null;
  location: string | null;
  remoteType: string | null;
  source: string | null;
  dateApplied: string;
  status: string;
  fitScore: number | null;
  techStack: string[];
}

interface ParsedJob {
  companyName: string | null;
  roleTitle: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  location: string | null;
  remoteType: string | null;
  techStack: string[];
  source: string | null;
  jobUrl: string | null;
  summary: string | null;
  howToApply: string | null;
  importantNotes: string[];
}

const STATUSES = [
  "Applied", "Recruiter Screen", "Technical Interview",
  "System Design", "Final Interview", "Offer", "Rejected", "Ghosted",
];

const SOURCES = ["LinkedIn", "Wellfound", "Recruiter", "Company Website", "Referral", "Other"];

const inputClass = "w-full bg-input-bg border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";
const labelClass = "block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide";

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [importMode, setImportMode] = useState<"manual" | "url" | "ai-import">("manual");
  const [form, setForm] = useState({
    companyName: "",
    roleTitle: "",
    salaryMin: "",
    salaryMax: "",
    location: "",
    remoteType: "",
    jobDescription: "",
    techStack: "",
    source: "",
    jobUrl: "",
    dateApplied: new Date().toISOString().split("T")[0],
  });
  const [submitting, setSubmitting] = useState(false);
  const [filterStatus, setFilterStatus] = useState("");
  const [pastedUrl, setPastedUrl] = useState("");

  const [aiDescription, setAiDescription] = useState("");
  const [aiParsing, setAiParsing] = useState(false);
  const [aiError, setAiError] = useState("");
  const [aiResult, setAiResult] = useState<ParsedJob | null>(null);

  const fetchApplications = () => {
    const params = new URLSearchParams();
    if (filterStatus) params.set("status", filterStatus);
    fetch(`/api/applications?${params}`)
      .then((r) => r.json())
      .then(setApplications)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchApplications(); }, [filterStatus]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    const payload = {
      companyName: form.companyName,
      roleTitle: form.roleTitle,
      salaryMin: form.salaryMin ? parseInt(form.salaryMin) : null,
      salaryMax: form.salaryMax ? parseInt(form.salaryMax) : null,
      location: form.location || null,
      remoteType: form.remoteType || null,
      jobDescription: form.jobDescription || null,
      techStack: form.techStack ? form.techStack.split(",").map((s) => s.trim()).filter(Boolean) : [],
      source: form.source || null,
      jobUrl: form.jobUrl || null,
      dateApplied: form.dateApplied,
    };

    await fetch("/api/applications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setForm({
      companyName: "", roleTitle: "", salaryMin: "", salaryMax: "",
      location: "", remoteType: "", jobDescription: "", techStack: "",
      source: "", jobUrl: "", dateApplied: new Date().toISOString().split("T")[0],
    });
    setShowForm(false);
    setSubmitting(false);
    setAiResult(null);
    setAiDescription("");
    fetchApplications();
  }

  async function handleUrlImport() {
    if (!pastedUrl) return;
    setForm((f) => ({ ...f, jobUrl: pastedUrl }));
    setImportMode("manual");
    setPastedUrl("");
  }

  async function handleAiParse() {
    if (!aiDescription.trim()) return;
    setAiParsing(true);
    setAiError("");
    setAiResult(null);

    try {
      const res = await fetch("/api/ai/parse-job", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: aiDescription }),
      });

      if (!res.ok) {
        const data = await res.json();
        setAiError(data.error || "Failed to parse job description");
        setAiParsing(false);
        return;
      }

      const parsed: ParsedJob = await res.json();
      setAiResult(parsed);

      const descWithNotes = [
        aiDescription,
        parsed.howToApply ? `\n\nHow to apply: ${parsed.howToApply}` : "",
        parsed.importantNotes?.length ? `\n\nImportant: ${parsed.importantNotes.join(". ")}` : "",
      ].join("");

      setForm((f) => ({
        ...f,
        companyName: parsed.companyName || f.companyName,
        roleTitle: parsed.roleTitle || f.roleTitle,
        salaryMin: parsed.salaryMin?.toString() || f.salaryMin,
        salaryMax: parsed.salaryMax?.toString() || f.salaryMax,
        location: parsed.location || f.location,
        remoteType: parsed.remoteType || f.remoteType,
        techStack: parsed.techStack?.length ? parsed.techStack.join(", ") : f.techStack,
        source: parsed.source || f.source,
        jobUrl: parsed.jobUrl || f.jobUrl,
        jobDescription: descWithNotes,
      }));
    } catch {
      setAiError("Network error. Please try again.");
    }

    setAiParsing(false);
  }

  function applyAiAndSwitchToForm() {
    setImportMode("manual");
  }

  if (loading) return <PageLoading />;

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Applications"
        subtitle={`${applications.length} total applications`}
        action={
          <Button onClick={() => { setShowForm(!showForm); setAiResult(null); setAiDescription(""); setAiError(""); }} variant={showForm ? "secondary" : "primary"}>
            {showForm ? "Cancel" : <><PlusIcon className="w-4 h-4 mr-1.5" /> Add Application</>}
          </Button>
        }
      />

      {showForm && (
        <Card className="animate-fade-in-up">
          <div className="flex gap-2 mb-6 flex-wrap">
            {([
              { key: "manual" as const, label: "Manual Entry" },
              { key: "url" as const, label: "Paste URL" },
              { key: "ai-import" as const, label: "Smart Import" },
            ]).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setImportMode(key)}
                className={`cursor-pointer px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
                  importMode === key ? "bg-blue-600 text-white" : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                {key === "ai-import" && <SparklesIcon className="w-3.5 h-3.5" />}
                {label}
              </button>
            ))}
          </div>

          {importMode === "url" && (
            <div className="mb-6">
              <input type="url" placeholder="Paste job URL..." value={pastedUrl} onChange={(e) => setPastedUrl(e.target.value)} className={inputClass + " mb-2"} />
              <button onClick={handleUrlImport} className="cursor-pointer text-sm text-blue-600 dark:text-blue-400 hover:underline">Import and fill form &rarr;</button>
            </div>
          )}

          {importMode === "ai-import" && (
            <div className="mb-6 space-y-4">
              <div>
                <label className={labelClass}>Paste the full job description</label>
                <textarea
                  placeholder="Paste the entire job posting here — the AI will extract company name, role, salary, tech stack, and more..."
                  value={aiDescription}
                  onChange={(e) => setAiDescription(e.target.value)}
                  className={inputClass + " h-40 resize-none"}
                />
              </div>

              <div className="flex items-center gap-3">
                <Button onClick={handleAiParse} disabled={aiParsing || aiDescription.trim().length < 20} variant="primary">
                  <SparklesIcon className="w-4 h-4 mr-1.5" />
                  {aiParsing ? "Analyzing..." : "Extract Job Details"}
                </Button>
                {aiParsing && <span className="text-xs text-muted-foreground">AI is reading the job description...</span>}
              </div>

              {aiError && (
                <div className="bg-red-500/10 text-red-600 dark:text-red-400 text-sm p-3 rounded-lg ring-1 ring-inset ring-red-500/20">
                  {aiError}
                </div>
              )}

              {aiResult && (
                <div className="animate-fade-in-up space-y-4">
                  <Card className="bg-emerald-500/5! border-emerald-500/20!">
                    <CardTitle>
                      <span className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                        <SparklesIcon className="w-4 h-4" /> Extracted Details
                      </span>
                    </CardTitle>

                    <div className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wide">Company</p>
                          <p className="font-medium text-foreground">{aiResult.companyName || "—"}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wide">Role</p>
                          <p className="font-medium text-foreground">{aiResult.roleTitle || "—"}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wide">Salary</p>
                          <p className="font-medium text-foreground">
                            {aiResult.salaryMin
                              ? `$${(aiResult.salaryMin / 1000).toFixed(0)}k${aiResult.salaryMax ? ` – $${(aiResult.salaryMax / 1000).toFixed(0)}k` : "+"}`
                              : "Not mentioned"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wide">Location</p>
                          <p className="font-medium text-foreground">
                            {aiResult.location || "—"}
                            {aiResult.remoteType && <span className="ml-2 text-xs bg-muted text-muted-foreground px-1.5 py-0.5 rounded">{aiResult.remoteType}</span>}
                          </p>
                        </div>
                      </div>

                      {aiResult.techStack?.length > 0 && (
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1.5">Tech Stack</p>
                          <div className="flex flex-wrap gap-1.5">
                            {aiResult.techStack.map((t) => (
                              <span key={t} className="bg-blue-500/10 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded-md text-xs font-medium ring-1 ring-inset ring-blue-500/20">{t}</span>
                            ))}
                          </div>
                        </div>
                      )}

                      {aiResult.summary && (
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Summary</p>
                          <p className="text-sm text-foreground leading-relaxed">{aiResult.summary}</p>
                        </div>
                      )}

                      {aiResult.howToApply && (
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">How to Apply</p>
                          <p className="text-sm text-foreground">{aiResult.howToApply}</p>
                        </div>
                      )}

                      {aiResult.importantNotes?.length > 0 && (
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Important Notes</p>
                          <ul className="space-y-1">
                            {aiResult.importantNotes.map((note, i) => (
                              <li key={i} className="text-sm text-foreground flex items-start gap-2">
                                <span className="text-amber-500 mt-0.5">•</span>
                                {note}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 pt-4 border-t border-emerald-500/20">
                      <Button onClick={applyAiAndSwitchToForm} variant="primary">
                        Use these details &rarr;
                      </Button>
                    </div>
                  </Card>
                </div>
              )}
            </div>
          )}

          {importMode === "manual" && (
            <form onSubmit={handleSubmit}>
              <fieldset className="mb-6">
                <legend className="text-sm font-semibold text-foreground mb-3">Job Info</legend>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Company Name *</label>
                    <input required value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Role Title *</label>
                    <input required value={form.roleTitle} onChange={(e) => setForm({ ...form, roleTitle: e.target.value })} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Location</label>
                    <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Remote Type</label>
                    <select value={form.remoteType} onChange={(e) => setForm({ ...form, remoteType: e.target.value })} className={inputClass}>
                      <option value="">Select...</option>
                      <option value="remote">Remote</option>
                      <option value="hybrid">Hybrid</option>
                      <option value="onsite">Onsite</option>
                    </select>
                  </div>
                </div>
              </fieldset>

              <fieldset className="mb-6">
                <legend className="text-sm font-semibold text-foreground mb-3">Salary & Source</legend>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Salary Min</label>
                    <input type="number" value={form.salaryMin} onChange={(e) => setForm({ ...form, salaryMin: e.target.value })} className={inputClass} placeholder="e.g. 120000" />
                  </div>
                  <div>
                    <label className={labelClass}>Salary Max</label>
                    <input type="number" value={form.salaryMax} onChange={(e) => setForm({ ...form, salaryMax: e.target.value })} className={inputClass} placeholder="e.g. 180000" />
                  </div>
                  <div>
                    <label className={labelClass}>Source</label>
                    <select value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} className={inputClass}>
                      <option value="">Select...</option>
                      {SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Date Applied</label>
                    <input type="date" value={form.dateApplied} onChange={(e) => setForm({ ...form, dateApplied: e.target.value })} className={inputClass} />
                  </div>
                </div>
              </fieldset>

              <fieldset className="mb-6">
                <legend className="text-sm font-semibold text-foreground mb-3">Details</legend>
                <div className="space-y-4">
                  <div>
                    <label className={labelClass}>Tech Stack (comma separated)</label>
                    <input value={form.techStack} onChange={(e) => setForm({ ...form, techStack: e.target.value })} className={inputClass} placeholder="React, TypeScript, Node.js" />
                  </div>
                  <div>
                    <label className={labelClass}>Job URL</label>
                    <input type="url" value={form.jobUrl} onChange={(e) => setForm({ ...form, jobUrl: e.target.value })} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Job Description</label>
                    <textarea value={form.jobDescription} onChange={(e) => setForm({ ...form, jobDescription: e.target.value })} className={inputClass + " h-24 resize-none"} />
                  </div>
                </div>
              </fieldset>

              <Button type="submit" disabled={submitting} variant="primary" size="lg">
                {submitting ? "Adding..." : "Add Application"}
              </Button>
            </form>
          )}
        </Card>
      )}

      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setFilterStatus("")}
          className={`cursor-pointer px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
            !filterStatus ? "bg-blue-600 text-white" : "bg-muted text-muted-foreground hover:text-foreground"
          }`}
        >
          All
        </button>
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`cursor-pointer px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              filterStatus === s ? "bg-blue-600 text-white" : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {applications.length === 0 ? (
        <Card>
          <EmptyState title="No applications yet" description="Add your first one to get started!" />
        </Card>
      ) : (
        <Card padding="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wide px-6 py-3">Company</th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wide px-6 py-3">Role</th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wide px-6 py-3">Status</th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wide px-6 py-3">Fit</th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wide px-6 py-3">Salary</th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wide px-6 py-3">Source</th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wide px-6 py-3">Applied</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((app) => (
                  <tr key={app.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4">
                      <Link href={`/applications/${app.id}`} className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline">
                        {app.companyName}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-sm text-foreground">{app.roleTitle}</td>
                    <td className="px-6 py-4"><StatusBadge status={app.status} /></td>
                    <td className="px-6 py-4"><FitScoreBadge score={app.fitScore} /></td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {app.salaryMin
                        ? `$${(app.salaryMin / 1000).toFixed(0)}k${app.salaryMax ? ` - $${(app.salaryMax / 1000).toFixed(0)}k` : ""}`
                        : "\u2014"}
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{app.source || "\u2014"}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {format(new Date(app.dateApplied), "MMM d, yyyy")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
